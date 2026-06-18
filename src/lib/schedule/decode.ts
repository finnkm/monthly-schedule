import type {
  StaffMember,
  GenerationResult,
  ShiftType,
  ShiftAssignment,
  DailySchedule,
  ValidationViolation,
} from '@/types';
import type { Calendar } from './calendar';
import { xv } from './model';

const ALL_SHIFTS: ShiftType[] = ['A1', 'B2', 'Dur', 'Nur', 'OFF'];

function slackRule(kind: string, n: number): string {
  switch (kind) {
    case 'DurU': return `Dur ${n}명 부족`;
    case 'DurO': return `Dur ${n}명 초과`;
    case 'NurU': return `Nur ${n}명 부족`;
    case 'NurO': return `Nur ${n}명 초과`;
    case 'A1min': return `A1 최소인원 ${n}명 부족`;
    case 'A1req': return `A1_REQUIRED 그룹 A1 배정 불가`;
    case 'B2min': return `B2 최소인원 ${n}명 부족`;
    default: return `제약 위반 (${kind})`;
  }
}

export function decodeSolution(
  vars: Record<string, number>,
  staff: StaffMember[],
  cal: Calendar,
  approvedOffSet: Set<string>,
  year: number,
  month: number,
  publicHolidays: string[],
): GenerationResult {
  const holidayBonuses: Record<string, number> = {};
  // 보상휴일 표시용: 직원별 평일(주말·공휴일 아님) 비신청 OFF 배정 목록
  const bonusEligible = new Map<string, ShiftAssignment[]>();

  const days: DailySchedule[] = cal.days.map((ctx) => {
    const assignments: ShiftAssignment[] = staff.map((s) => {
      let shift: ShiftType = 'OFF';
      for (const k of ALL_SHIFTS) {
        if ((vars[xv(s.employeeNumber, ctx.date, k)] ?? 0) > 0.5) { shift = k; break; }
      }
      const isApproved = approvedOffSet.has(`${s.employeeNumber}-${ctx.date}`);
      if ((ctx.isWeekend || ctx.isHoliday) && (shift === 'Dur' || shift === 'Nur')) {
        holidayBonuses[s.employeeNumber] = (holidayBonuses[s.employeeNumber] ?? 0) + 1;
      }
      const a: ShiftAssignment = {
        date: ctx.date,
        employeeNumber: s.employeeNumber,
        shiftType: shift,
        isLeave: shift === 'OFF',
        isApprovedLeave: shift === 'OFF' && isApproved,
      };
      if (shift === 'OFF' && !isApproved && !ctx.isWeekend && !ctx.isHoliday) {
        const list = bonusEligible.get(s.employeeNumber) ?? [];
        list.push(a);
        bonusEligible.set(s.employeeNumber, list);
      }
      return a;
    });
    return {
      date: ctx.date,
      dayOfWeek: ctx.dayOfWeek,
      isWeekend: ctx.isWeekend,
      isPublicHoliday: ctx.isHoliday,
      isOutsideMonth: ctx.isOutsideMonth,
      assignments,
    };
  });

  // 보상휴일(주말·공휴일 Dur/Nur 근무로 얻은 평일 휴식)을 표시용으로 마킹.
  // 근무로 잃은 쉬는 날만큼 평일 비신청 OFF를 보상휴일로 표시한다.
  for (const [emp, count] of Object.entries(holidayBonuses)) {
    const elig = bonusEligible.get(emp) ?? [];
    for (let i = 0; i < Math.min(count, elig.length); i++) {
      elig[i].isBonusOff = true;
    }
  }

  const violations: ValidationViolation[] = [];
  for (const [name, val] of Object.entries(vars)) {
    if (!name.startsWith('s|') || val < 0.5) continue;
    const [, kind, date] = name.split('|');
    violations.push({ date, rule: slackRule(kind, Math.round(val)) });
  }

  return { schedule: { year, month, days, publicHolidays }, violations, holidayBonuses };
}
