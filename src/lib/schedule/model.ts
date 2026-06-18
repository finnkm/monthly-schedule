import type { LP } from 'glpk.js';
import type { StaffMember, ScheduleConstraints, ShiftType } from '@/types';
import type { GLPKInstance } from './solve';
import type { Calendar, DayCtx } from './calendar';
import { WEIGHTS, WEEKEND_HOLIDAY_DUR_EXEMPT, TUESDAY_A1_FIXED, isDurExemptHard } from './policy';

const ALL_SHIFTS: ShiftType[] = ['A1', 'B2', 'Dur', 'Nur', 'OFF'];

export const xv = (emp: string, date: string, k: ShiftType) => `x|${emp}|${date}|${k}`;

// 날짜 유형별 허용 시프트
function allowedForDay(ctx: DayCtx): ShiftType[] {
  if (ctx.isWeekdayWork) return ['A1', 'Dur', 'Nur', 'OFF'];
  if (ctx.isSaturday) return ['B2', 'Dur', 'Nur', 'OFF'];
  return ['Dur', 'Nur', 'OFF']; // 일요일/공휴일
}

// (직원, 날짜, 시프트) 구조적 허용 — 승인 OFF·화요일 고정은 미반영(아래에서 별도 처리)
function baseAllowed(s: StaffMember, ctx: DayCtx, k: ShiftType): boolean {
  if (!allowedForDay(ctx).includes(k)) return false;
  if (k !== 'OFF' && s.excludedShifts.includes(k)) return false;
  if (k === 'Dur' && isDurExemptHard(s.employeeNumber, ctx)) return false; // 일요일 hard 제외
  return true;
}

type Var = { name: string; coef: number };
type Bnd = { type: number; lb: number; ub: number };

export function buildModel(
  glpk: GLPKInstance,
  staff: StaffMember[],
  cal: Calendar,
  approvedOffSet: Set<string>,
  c: ScheduleConstraints,
): LP {
  const days = cal.days;
  const binaries: string[] = [];
  const generals: string[] = [];
  const bounds: { name: string; type: number; ub: number; lb: number }[] = [];
  const subjectTo: { name: string; vars: Var[]; bnds: Bnd }[] = [];
  const obj: Var[] = [];

  let rid = 0;
  const row = (vars: Var[], type: number, lb: number, ub: number) => {
    if (vars.length === 0) return;
    subjectTo.push({ name: `r${rid++}`, vars, bnds: { type, lb, ub } });
  };
  // 비음 정수 slack 변수 등록 + 반환
  const slack = (name: string): string => {
    generals.push(name);
    bounds.push({ name, type: glpk.GLP_LO, lb: 0, ub: 0 });
    return name;
  };
  // 비음 연속 변수 등록 + 반환
  const cont = (name: string): string => {
    bounds.push({ name, type: glpk.GLP_LO, lb: 0, ub: 0 });
    return name;
  };

  const empExists = (emp: string) => staff.some((s) => s.employeeNumber === emp);

  // 최종 허용 시프트 계산. glpk.js는 binary 변수에 건 FX bound를 무시하므로,
  // 강제 배정은 "허용 시프트 자체를 제한"해 Σ=1 제약으로 강제한다.
  //  - 승인 OFF 날: ['OFF']만 허용 → 반드시 OFF
  //  - 화요일 A1 고정 직원의 화요일: ['A1']만 허용 → 반드시 A1
  const allowedMap = new Map<string, ShiftType[]>();
  for (const s of staff) {
    for (const ctx of days) {
      const approved = approvedOffSet.has(`${s.employeeNumber}-${ctx.date}`);
      let allowed: ShiftType[];
      if (approved) {
        allowed = ['OFF'];
      } else if (
        TUESDAY_A1_FIXED.has(s.employeeNumber) &&
        ctx.isWeekdayWork &&
        ctx.dayOfWeek === 'Tue' &&
        baseAllowed(s, ctx, 'A1')
      ) {
        allowed = ['A1'];
      } else {
        allowed = ALL_SHIFTS.filter((k) => baseAllowed(s, ctx, k));
      }
      allowedMap.set(`${s.employeeNumber}|${ctx.date}`, allowed);
    }
  }
  const shiftAllowed = (s: StaffMember, ctx: DayCtx, k: ShiftType): boolean =>
    allowedMap.get(`${s.employeeNumber}|${ctx.date}`)!.includes(k);

  // ── 1) 배정 변수 + 하루 한 시프트 ──
  for (const s of staff) {
    for (const ctx of days) {
      const vars: Var[] = allowedMap.get(`${s.employeeNumber}|${ctx.date}`)!.map((k) => {
        const name = xv(s.employeeNumber, ctx.date, k);
        binaries.push(name);
        return { name, coef: 1 };
      });
      row(vars, glpk.GLP_FX, 1, 1); // Σ_k x = 1
    }
  }

  // ── 2) 일별 커버리지 (slack으로 항상 feasible) ──
  for (const ctx of days) {
    const durTarget = ctx.isWeekdayWork ? c.dur.weekday : 1;
    // Dur = target (under/over slack)
    {
      const vars: Var[] = staff
        .filter((s) => shiftAllowed(s, ctx, 'Dur'))
        .map((s) => ({ name: xv(s.employeeNumber, ctx.date, 'Dur'), coef: 1 }));
      const u = slack(`s|DurU|${ctx.date}`);
      const o = slack(`s|DurO|${ctx.date}`);
      vars.push({ name: u, coef: 1 }, { name: o, coef: -1 });
      row(vars, glpk.GLP_FX, durTarget, durTarget);
      obj.push({ name: u, coef: WEIGHTS.cover }, { name: o, coef: WEIGHTS.cover });
    }
    // Nur = 1 (모든 날)
    {
      const vars: Var[] = staff
        .filter((s) => shiftAllowed(s, ctx, 'Nur'))
        .map((s) => ({ name: xv(s.employeeNumber, ctx.date, 'Nur'), coef: 1 }));
      const u = slack(`s|NurU|${ctx.date}`);
      const o = slack(`s|NurO|${ctx.date}`);
      vars.push({ name: u, coef: 1 }, { name: o, coef: -1 });
      row(vars, glpk.GLP_FX, c.nur.daily, c.nur.daily);
      obj.push({ name: u, coef: WEIGHTS.cover }, { name: o, coef: WEIGHTS.cover });
    }
    if (ctx.isWeekdayWork) {
      // A1 >= weekdayMin
      {
        const vars: Var[] = staff
          .filter((s) => shiftAllowed(s, ctx, 'A1'))
          .map((s) => ({ name: xv(s.employeeNumber, ctx.date, 'A1'), coef: 1 }));
        const u = slack(`s|A1min|${ctx.date}`);
        vars.push({ name: u, coef: 1 });
        row(vars, glpk.GLP_LO, c.a1.weekdayMin, 0);
        obj.push({ name: u, coef: WEIGHTS.cover });
      }
      // A1_REQUIRED 그룹 평일 >=1
      {
        const vars: Var[] = staff
          .filter((s) => s.group === 'A1_REQUIRED' && shiftAllowed(s, ctx, 'A1'))
          .map((s) => ({ name: xv(s.employeeNumber, ctx.date, 'A1'), coef: 1 }));
        const u = slack(`s|A1req|${ctx.date}`);
        vars.push({ name: u, coef: 1 });
        row(vars, glpk.GLP_LO, 1, 0);
        obj.push({ name: u, coef: WEIGHTS.a1req });
      }
    }
    if (ctx.isSaturday) {
      const b2: Var[] = staff
        .filter((s) => shiftAllowed(s, ctx, 'B2'))
        .map((s) => ({ name: xv(s.employeeNumber, ctx.date, 'B2'), coef: 1 }));
      // 하한: 비신입(1인분 가능) B2 ≥ saturdayMin. 신입은 정원에서 제외하므로
      //   신입이 1명 포함되면 총원은 자동으로 (saturdayMin + 1) = 4가 된다.
      const b2NonJunior: Var[] = staff
        .filter((s) => s.group !== 'JUNIOR' && shiftAllowed(s, ctx, 'B2'))
        .map((s) => ({ name: xv(s.employeeNumber, ctx.date, 'B2'), coef: 1 }));
      const u = slack(`s|B2min|${ctx.date}`);
      row([...b2NonJunior, { name: u, coef: 1 }], glpk.GLP_LO, c.b2.saturdayMin, 0);
      obj.push({ name: u, coef: WEIGHTS.cover });
      // 총 B2 ≤ saturdayMax (신입 포함, hard)
      row(b2, glpk.GLP_UP, 0, c.b2.saturdayMax);
      // 인원 여유 시 saturdayMax(4)까지 채우도록 유도 (신입 유무 무관). fill ≥ max − Σb2
      const fill = cont(`p|B2fill|${ctx.date}`);
      row([...b2, { name: fill, coef: 1 }], glpk.GLP_LO, c.b2.saturdayMax, 0);
      obj.push({ name: fill, coef: WEIGHTS.b2Fill });
      // 신입(JUNIOR)은 같은 토요일 B2 최대 1명 (동시 배정 금지)
      const juniorB2 = staff
        .filter((s) => s.group === 'JUNIOR' && shiftAllowed(s, ctx, 'B2'))
        .map((s) => ({ name: xv(s.employeeNumber, ctx.date, 'B2'), coef: 1 }));
      row(juniorB2, glpk.GLP_UP, 0, 1);
    }
  }

  // ── 3) 연속근무 ≤ maxDays: 길이(maxDays+1) 윈도우마다 OFF≥1 ──
  const winLen = c.consecutiveWork.maxDays + 1;
  for (const s of staff) {
    for (let i = 0; i + winLen <= days.length; i++) {
      const vars = days
        .slice(i, i + winLen)
        .filter((ctx) => shiftAllowed(s, ctx, 'OFF'))
        .map((ctx) => ({ name: xv(s.employeeNumber, ctx.date, 'OFF'), coef: 1 }));
      row(vars, glpk.GLP_LO, 1, 0);
    }
  }

  // 한 주의 "휴식 등가일" 변수 = OFF + 토요일 B2 (B2는 휴식 1일을 대체).
  const restEquivVars = (s: StaffMember, week: DayCtx[]): Var[] => {
    const vars: Var[] = [];
    for (const ctx of week) {
      if (shiftAllowed(s, ctx, 'OFF')) vars.push({ name: xv(s.employeeNumber, ctx.date, 'OFF'), coef: 1 });
      if (shiftAllowed(s, ctx, 'B2')) vars.push({ name: xv(s.employeeNumber, ctx.date, 'B2'), coef: 1 });
    }
    return vars;
  };

  // ── 4) 주간 휴식: (OFF + 토요일 B2) ≥ minDaysPerWeek ──
  for (const week of cal.weeks) {
    if (week.length < 7) continue;
    for (const s of staff) {
      row(restEquivVars(s, week), glpk.GLP_LO, c.rest.minDaysPerWeek, 0);
    }
  }

  // ── 4b) 주간 휴식 등가일 목표 = 쿼터(주말·공휴일 수) ──
  // 휴식 등가일 = OFF + 토요일 B2. 공휴일이 주말과 겹치면 하루로만 카운트.
  //  - 초과(over): 재량 OFF 과다 → 페널티(offExcess)
  //  - 부족(under): 주말·공휴일에 Dur/Nur 근무로 쉬는 날을 잃음 → 평일 보상휴일로 메움(offShort)
  //  ※ B2는 휴식 등가에 포함되므로 토요일 B2 근무는 보상휴일을 발생시키지 않음.
  //  ※ soft만 사용(feasible 영역 불변) + over/under는 연속 변수(정수 분기 부담 최소).
  for (const week of cal.weeks) {
    if (week.length < 7) continue;
    const quota = week.filter((d) => d.isWeekend || d.isHoliday).length;
    for (const s of staff) {
      const over = cont(`p|OffOver|${s.employeeNumber}|${week[0].date}`);
      const under = cont(`p|OffUnder|${s.employeeNumber}|${week[0].date}`);
      // Σ(OFF + B2) − over + under = quota
      row(
        [...restEquivVars(s, week), { name: over, coef: -1 }, { name: under, coef: 1 }],
        glpk.GLP_FX,
        quota,
        quota,
      );
      obj.push({ name: over, coef: WEIGHTS.offExcess }, { name: under, coef: WEIGHTS.offShort });
    }
  }

  // ── 5) Nur: post-OFF + 최대 2연속 (연속 과다 방지 — 단발 강제는 하지 않음) ──
  for (const s of staff) {
    if (s.excludedShifts.includes('Nur')) continue;
    const emp = s.employeeNumber;
    // post-OFF: Nur stint 종료 다음날은 OFF
    for (let i = 0; i + 1 < days.length; i++) {
      const d = days[i];
      const d2 = days[i + 1];
      const vars: Var[] = [];
      if (shiftAllowed(s, d2, 'OFF')) vars.push({ name: xv(emp, d2.date, 'OFF'), coef: 1 });
      if (shiftAllowed(s, d, 'Nur')) vars.push({ name: xv(emp, d.date, 'Nur'), coef: -1 });
      if (shiftAllowed(s, d2, 'Nur')) vars.push({ name: xv(emp, d2.date, 'Nur'), coef: 1 });
      row(vars, glpk.GLP_LO, 0, 0);
    }
    // 최대 2연속: 길이 3 윈도우마다 ΣNur ≤ 2
    for (let i = 0; i + 3 <= days.length; i++) {
      const vars = days
        .slice(i, i + 3)
        .filter((ctx) => shiftAllowed(s, ctx, 'Nur'))
        .map((ctx) => ({ name: xv(emp, ctx.date, 'Nur'), coef: 1 }));
      row(vars, glpk.GLP_UP, 0, 2);
    }
  }

  // ── 5b) Dur 최대 2연속 (연속 과다 방지) ──
  for (const s of staff) {
    if (s.excludedShifts.includes('Dur')) continue;
    const emp = s.employeeNumber;
    for (let i = 0; i + 3 <= days.length; i++) {
      const vars = days
        .slice(i, i + 3)
        .filter((ctx) => shiftAllowed(s, ctx, 'Dur'))
        .map((ctx) => ({ name: xv(emp, ctx.date, 'Dur'), coef: 1 }));
      row(vars, glpk.GLP_UP, 0, 2);
    }
  }

  // ── 6) 공평성: Nur/Dur/B2 부하 편차 최소화 (힘든 시프트 분배 — 0회 방지) ──
  // 근무일 수 균등화는 제거 — OFF 하향 평준화(과다 OFF)를 유발하므로.
  const nurMax = cont('nurMax'), nurMin = cont('nurMin');
  const durMax = cont('durMax'), durMin = cont('durMin');
  const b2Max = cont('b2Max'), b2Min = cont('b2Min');
  for (const s of staff) {
    const emp = s.employeeNumber;
    if (!s.excludedShifts.includes('Nur')) {
      const nur = days.filter((ctx) => shiftAllowed(s, ctx, 'Nur')).map((ctx) => ({ name: xv(emp, ctx.date, 'Nur'), coef: 1 }));
      row([{ name: nurMax, coef: 1 }, ...nur.map((v) => ({ ...v, coef: -1 }))], glpk.GLP_LO, 0, 0);
      row([...nur, { name: nurMin, coef: -1 }], glpk.GLP_LO, 0, 0);
    }
    if (!s.excludedShifts.includes('Dur')) {
      const dur = days.filter((ctx) => shiftAllowed(s, ctx, 'Dur')).map((ctx) => ({ name: xv(emp, ctx.date, 'Dur'), coef: 1 }));
      row([{ name: durMax, coef: 1 }, ...dur.map((v) => ({ ...v, coef: -1 }))], glpk.GLP_LO, 0, 0);
      row([...dur, { name: durMin, coef: -1 }], glpk.GLP_LO, 0, 0);
    }
    // B2(토요직): 토요일에만 가능. 0회인 사람이 없도록 편차 최소화.
    if (!s.excludedShifts.includes('B2')) {
      const b2 = days.filter((ctx) => shiftAllowed(s, ctx, 'B2')).map((ctx) => ({ name: xv(emp, ctx.date, 'B2'), coef: 1 }));
      if (b2.length > 0) {
        row([{ name: b2Max, coef: 1 }, ...b2.map((v) => ({ ...v, coef: -1 }))], glpk.GLP_LO, 0, 0);
        row([...b2, { name: b2Min, coef: -1 }], glpk.GLP_LO, 0, 0);
      }
    }
  }
  obj.push(
    { name: nurMax, coef: WEIGHTS.fair }, { name: nurMin, coef: -WEIGHTS.fair },
    { name: durMax, coef: WEIGHTS.fair }, { name: durMin, coef: -WEIGHTS.fair },
    // B2 균등은 0회 방지를 위해 다소 강하게
    { name: b2Max, coef: WEIGHTS.b2Fair }, { name: b2Min, coef: -WEIGHTS.b2Fair },
  );

  // ── 7) 주말·공휴일 Dur exempt soft 페널티 ──
  for (const ctx of days) {
    if (!(ctx.isWeekend || ctx.isHoliday)) continue;
    for (const emp of WEEKEND_HOLIDAY_DUR_EXEMPT) {
      if (!empExists(emp)) continue;
      const s = staff.find((x) => x.employeeNumber === emp)!;
      if (shiftAllowed(s, ctx, 'Dur')) obj.push({ name: xv(emp, ctx.date, 'Dur'), coef: WEIGHTS.exemptSoft });
    }
  }

  return {
    name: 'monthly-schedule',
    objective: { direction: glpk.GLP_MIN, name: 'cost', vars: obj },
    subjectTo,
    bounds,
    binaries,
    generals,
  };
}
