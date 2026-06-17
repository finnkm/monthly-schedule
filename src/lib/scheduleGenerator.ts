import { getDaysInMonth, getDay, format, addDays } from 'date-fns';
import type {
  StaffMember,
  LeaveRequest,
  DailySchedule,
  ShiftAssignment,
  ShiftType,
  DayOfWeek,
  ScheduleConstraints,
  ValidationViolation,
  GenerationResult,
} from '@/types';
import { DEFAULT_CONSTRAINTS } from '@/types';

const DAY_NAMES: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── 스케줄 예외 정책 (하드코딩 상수) ────────────────────────────────
// 주말·공휴일 Dur 배정을 최대한 피해야 하는 직원 목록 (soft 페널티 +999)
const WEEKEND_HOLIDAY_DUR_EXEMPT = new Set<string>(['230010']);

// 일요일 Dur 배정을 최대한 피해야 하는 직원 목록 (hard 제외 — 대체 인원 있을 때 항상 제외)
const SUNDAY_DUR_EXEMPT = new Set<string>(['230010']);

// 화요일(평일)에 반드시 A1을 배정해야 하는 직원 목록
// 주간 한도 초과 여부와 무관하게 우선 배정
const TUESDAY_A1_FIXED = new Set<string>(['160432']);

function isWeekendDay(dayOfWeek: DayOfWeek): boolean {
  return dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
}

function countConsecutiveBefore(
  assignmentMap: Map<string, ShiftType>,
  dateStr: string
): number {
  let count = 0;
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  while (true) {
    const key = format(d, 'yyyy-MM-dd');
    const shift = assignmentMap.get(key);
    if (!shift || shift === 'OFF') break;
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

// 이번 주(일요일~어제)에 근무한 날 수 (OFF 제외)
function countWeekWorkDays(
  empNum: string,
  dateStr: string,
  staffAssignments: Map<string, Map<string, ShiftType>>
): number {
  const map = staffAssignments.get(empNum)!;
  const date = new Date(dateStr);
  const dow = date.getDay();
  let count = 0;
  for (let i = 0; i < dow; i++) {
    const d = new Date(date);
    d.setDate(date.getDate() - dow + i);
    const ds = format(d, 'yyyy-MM-dd');
    const shift = map.get(ds);
    if (shift && shift !== 'OFF') count++;
  }
  return count;
}

// scoreFn 기준 오름차순으로 n명 선택
function pickBy(
  pool: StaffMember[],
  scoreFn: (s: StaffMember) => number,
  n: number
): StaffMember[] {
  return [...pool].sort((a, b) => scoreFn(a) - scoreFn(b)).slice(0, n);
}

// 고연차/저연차 번갈아 n명 선택 (연차 혼합 보장)
function pickByAlternating(
  pool: StaffMember[],
  scoreFn: (s: StaffMember) => number,
  n: number,
  isSenior: (s: StaffMember) => boolean
): StaffMember[] {
  const seniors = [...pool.filter(s => isSenior(s))].sort((a, b) => scoreFn(a) - scoreFn(b));
  const juniors = [...pool.filter(s => !isSenior(s))].sort((a, b) => scoreFn(a) - scoreFn(b));

  const result: StaffMember[] = [];
  let si = 0, ji = 0;
  let useSenior = true;

  while (result.length < n && (si < seniors.length || ji < juniors.length)) {
    if (useSenior && si < seniors.length) {
      result.push(seniors[si++]);
      useSenior = false;
    } else if (!useSenior && ji < juniors.length) {
      result.push(juniors[ji++]);
      useSenior = true;
    } else if (si < seniors.length) {
      result.push(seniors[si++]);
    } else {
      result.push(juniors[ji++]);
    }
  }
  return result;
}

// 시드 기반 결정론적 셔플 (Math.random 미사용)
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    seed = ((seed * 1664525 + 1013904223) >>> 0) % 0x7fffffff;
    const j = seed % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 실행 결과 점수: 위반 건수 × 10000 + Nur 불균형 지수 (낮을수록 좋음)
function scoreRun(
  violations: ValidationViolation[],
  nurPlanCount: Record<string, number>,
  nurEligibleNums: string[]
): number {
  const violScore = violations.length * 10000;
  const nurValues = nurEligibleNums.map(n => nurPlanCount[n] ?? 0);
  const mean = nurValues.reduce((a, b) => a + b, 0) / (nurValues.length || 1);
  const variance = nurValues.reduce((a, b) => a + (b - mean) ** 2, 0);
  return violScore + variance;
}

export function generateMonthlySchedule(
  staff: StaffMember[],
  year: number,
  month: number,
  approvedLeaves: LeaveRequest[],
  publicHolidays: string[],
  constraints: ScheduleConstraints = DEFAULT_CONSTRAINTS
): GenerationResult {
  // ── 불변 설정 (모든 시도에서 공유) ──────────────────────────────
  const baseActiveStaff = [...staff]
    .sort((a, b) => Number(a.employeeNumber) - Number(b.employeeNumber));

  const holidaySet = new Set(publicHolidays);

  // 완전한 주(월~일)를 포함하도록 범위 확장
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, getDaysInMonth(monthStart));

  const startDow = getDay(monthStart);
  const daysBack = startDow === 0 ? 6 : startDow - 1;
  const extendedStart = addDays(monthStart, -daysBack);

  const endDow = getDay(monthEnd);
  const daysForward = endDow === 0 ? 0 : 7 - endDow;
  const extendedEnd = addDays(monthEnd, daysForward);

  // 고연차 집합: 사번 낮은 순 상위 50% (셔플 무관하게 고정)
  const seniorCount = Math.ceil(baseActiveStaff.length / 2);
  const seniorEmpNums = new Set(
    baseActiveStaff.slice(0, seniorCount).map(s => s.employeeNumber)
  );
  const isSenior = (s: StaffMember) => seniorEmpNums.has(s.employeeNumber);

  const approvedOffSet = new Set(
    approvedLeaves
      .filter((r) => r.status === 'APPROVED')
      .map((r) => `${r.employeeNumber}-${r.date}`)
  );

  const maxWorkDaysPerWeek = 7 - constraints.rest.minDaysPerWeek;

  // Nur 공평성 점수 계산용: Nur 미제외 직원 사번 목록
  const nurEligibleNums = baseActiveStaff
    .filter(s => !s.excludedShifts.includes('Nur'))
    .map(s => s.employeeNumber);

  // ── 다중 시도: 제약조건 최소 위반 조합 탐색 ─────────────────────
  const ITERATIONS = 12;
  let bestResult: GenerationResult | null = null;
  let bestScore = Infinity;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const activeStaff = iter === 0
      ? baseActiveStaff
      : seededShuffle(baseActiveStaff, iter);

  const staffAssignments = new Map<string, Map<string, ShiftType>>();
  activeStaff.forEach((s) => staffAssignments.set(s.employeeNumber, new Map()));

  const violations: ValidationViolation[] = [];
  const days: DailySchedule[] = [];

  // ── Phase 1: Nur 블록 사전 계획 ──────────────────────────────────
  const nurPlan = new Map<string, string>();
  const nurPostOff = new Map<string, string>();
  const nurPlanCount: Record<string, number> = {};
  const empPostOffDays = new Map<string, Set<string>>();
  activeStaff.forEach((s) => {
    nurPlanCount[s.employeeNumber] = 0;
    empPostOffDays.set(s.employeeNumber, new Set());
  });

  // A1 커버리지 안전 검증: 후보를 Nur에 배정했을 때 해당 날짜에 다른 A1_REQUIRED가 남는지 확인
  // nurPlan 이미 배정된 사람도 "불가" 처리 (중복 배정 방지)
  const isNurSafe = (candidate: StaffMember, blockDates: string[]): boolean => {
    if (candidate.group !== 'A1_REQUIRED') return true;
    return !blockDates.some((dt) => {
      const dow = new Date(dt).getDay();
      if (dow === 0 || dow === 6) return false;
      const othersAvail = activeStaff.filter(
        (s) =>
          s.group === 'A1_REQUIRED' &&
          !s.excludedShifts.includes('A1') &&
          s.employeeNumber !== candidate.employeeNumber &&
          !approvedOffSet.has(`${s.employeeNumber}-${dt}`) &&
          !empPostOffDays.get(s.employeeNumber)!.has(dt) &&
          nurPlan.get(dt) !== s.employeeNumber
      );
      return othersAvail.length === 0;
    });
  };

  {
    let planDate = new Date(extendedStart);
    let useThreeDays = false;

    while (planDate <= extendedEnd) {
      const want = useThreeDays ? 3 : 2;
      useThreeDays = !useThreeDays;

      const blockDates: string[] = [];
      for (let i = 0; i < want; i++) {
        const d = addDays(planDate, i);
        if (d > extendedEnd) break;
        blockDates.push(format(d, 'yyyy-MM-dd'));
      }
      const blockLen = blockDates.length;

      // Nur 제외근무 및 OFF/post-OFF 겹침 체크
      // A1_REQUIRED 그룹도 제외근무에 없으면 동등하게 Nur 배정 대상
      // 화요일 A1 고정 직원은 화요일이 포함된 블록에서 제외 (화요일 A1 보장 우선)
      const pool = activeStaff.filter(
        (s) =>
          !s.excludedShifts.includes('Nur') &&
          !blockDates.some((dt) => approvedOffSet.has(`${s.employeeNumber}-${dt}`)) &&
          !blockDates.some((dt) => empPostOffDays.get(s.employeeNumber)!.has(dt)) &&
          !(TUESDAY_A1_FIXED.has(s.employeeNumber) &&
            blockDates.some((dt) => new Date(dt).getDay() === 2))
      );

      if (pool.length > 0) {
        // A1 커버리지 안전 검증 통과자 우선, 부득이하면 전체 pool
        const safePool = pool.filter((s) => isNurSafe(s, blockDates));
        const effectivePool = safePool.length > 0 ? safePool : pool;

        const pick = pickBy(effectivePool, (s) => nurPlanCount[s.employeeNumber], 1)[0];
        blockDates.forEach((dt) => nurPlan.set(dt, pick.employeeNumber));
        nurPlanCount[pick.employeeNumber] += blockLen;

        const postOffDate = addDays(planDate, blockLen);
        if (postOffDate <= extendedEnd) {
          const postOffDateStr = format(postOffDate, 'yyyy-MM-dd');
          nurPostOff.set(postOffDateStr, pick.employeeNumber);
          empPostOffDays.get(pick.employeeNumber)!.add(postOffDateStr);
        }
      } else {
        violations.push({
          date: blockDates[0],
          rule: `Nur 블록 (${blockDates[0]} ~ ${blockDates[blockDates.length - 1]}) 배정 가능 직원 없음`,
        });
      }

      planDate = addDays(planDate, blockLen);
    }
  }

  // ── Phase 1.5: Nur 균등 보정 ─────────────────────────────────────
  // Nur 미제외 직원 중 0회인 경우, 가장 많이 받은 사람의 블록을 재배정하여 최소 1회 보장
  {
    // nurPlan에서 연속 블록 추출 (같은 담당자 + 날짜 연속성 모두 충족해야 같은 블록)
    const sortedNurDates = [...nurPlan.keys()].sort();
    const nurBlocks: Array<{ dates: string[]; assignee: string }> = [];
    for (const dt of sortedNurDates) {
      const assignee = nurPlan.get(dt)!;
      const last = nurBlocks[nurBlocks.length - 1];
      const prevDt = last?.dates[last.dates.length - 1];
      const isConsecutive =
        prevDt !== undefined &&
        format(addDays(new Date(prevDt), 1), 'yyyy-MM-dd') === dt;
      if (last && last.assignee === assignee && isConsecutive) {
        last.dates.push(dt);
      } else {
        nurBlocks.push({ dates: [dt], assignee });
      }
    }

    const nurEligible = activeStaff.filter((s) => !s.excludedShifts.includes('Nur'));
    for (const target of nurEligible) {
      if (nurPlanCount[target.employeeNumber] > 0) continue;

      // Nur 많은 블록부터 시도 (재배정 후 불균형 최소화)
      const sorted = [...nurBlocks].sort(
        (a, b) => nurPlanCount[b.assignee] - nurPlanCount[a.assignee]
      );

      for (const block of sorted) {
        if (block.assignee === target.employeeNumber) continue;
        // 블록을 내어주면 기존 담당자도 0이 되는 경우는 제외
        if (nurPlanCount[block.assignee] <= block.dates.length) continue;

        const canWork =
          !block.dates.some(
            (dt) =>
              approvedOffSet.has(`${target.employeeNumber}-${dt}`) ||
              empPostOffDays.get(target.employeeNumber)!.has(dt) ||
              (TUESDAY_A1_FIXED.has(target.employeeNumber) && new Date(dt).getDay() === 2)
          ) && isNurSafe(target, block.dates);
        if (!canWork) continue;

        const prev = block.assignee;
        const blockLen = block.dates.length;
        block.dates.forEach((dt) => nurPlan.set(dt, target.employeeNumber));
        nurPlanCount[target.employeeNumber] += blockLen;
        nurPlanCount[prev] -= blockLen;
        block.assignee = target.employeeNumber;

        // post-OFF 갱신
        const postOffDt = format(addDays(new Date(block.dates[block.dates.length - 1]), 1), 'yyyy-MM-dd');
        if (nurPostOff.get(postOffDt) === prev) {
          nurPostOff.set(postOffDt, target.employeeNumber);
          empPostOffDays.get(prev)!.delete(postOffDt);
          empPostOffDays.get(target.employeeNumber)!.add(postOffDt);
        }
        break;
      }
    }
  }

  // ── Phase 2: 일별 스케줄 배정 ────────────────────────────────────
  const workCount: Record<string, number> = {};
  const durCount: Record<string, number> = {};
  const b2Count: Record<string, number> = {};
  activeStaff.forEach((s) => {
    workCount[s.employeeNumber] = 0;
    durCount[s.employeeNumber] = 0;
    b2Count[s.employeeNumber] = 0;
  });

  for (let cur = new Date(extendedStart); cur <= extendedEnd; cur = addDays(cur, 1)) {
    const dateStr = format(cur, 'yyyy-MM-dd');
    const isOutsideMonth = cur.getMonth() !== month - 1 || cur.getFullYear() !== year;
    const jsDay = getDay(cur);
    const dayOfWeek = DAY_NAMES[jsDay];
    const isHoliday = holidaySet.has(dateStr);
    const isWeekend = isWeekendDay(dayOfWeek);
    const isWeekdayWork = !isWeekend && !isHoliday;
    const isSaturday = dayOfWeek === 'Sat' && !isHoliday;

    const assignments: ShiftAssignment[] = [];
    const assignedNums = new Set<string>();

    const assign = (empNum: string, shift: ShiftType, isApprovedLeave = false) => {
      assignments.push({
        date: dateStr,
        employeeNumber: empNum,
        shiftType: shift,
        isLeave: shift === 'OFF',
        isApprovedLeave: shift === 'OFF' && isApprovedLeave,
      });
      staffAssignments.get(empNum)!.set(dateStr, shift);
      assignedNums.add(empNum);
      if (shift !== 'OFF') workCount[empNum]++;
    };

    const getPool = () => activeStaff.filter((s) => !assignedNums.has(s.employeeNumber));

    const hitWeeklyLimit = (empNum: string) =>
      countWeekWorkDays(empNum, dateStr, staffAssignments) >= maxWorkDaysPerWeek;

    // (0) 화요일 A1 고정 — 모든 배정보다 최우선 (승인 OFF 있는 경우만 예외)
    // 연속근무 초과·post-OFF·Nur 계획 등 어떤 조건도 이를 덮어쓸 수 없음
    if (isWeekdayWork && dayOfWeek === 'Tue') {
      activeStaff.forEach((s) => {
        if (
          TUESDAY_A1_FIXED.has(s.employeeNumber) &&
          !assignedNums.has(s.employeeNumber) &&
          !approvedOffSet.has(`${s.employeeNumber}-${dateStr}`)
        ) {
          assign(s.employeeNumber, 'A1');
        }
      });
    }

    // (1) Nur post-OFF 강제
    const postOffEmp = nurPostOff.get(dateStr);
    if (postOffEmp && !assignedNums.has(postOffEmp)) {
      assign(postOffEmp, 'OFF');
    }

    // (2) 승인 OFF (직원이 신청한 OFF → isApprovedLeave=true 마킹)
    activeStaff.forEach((s) => {
      if (!assignedNums.has(s.employeeNumber) && approvedOffSet.has(`${s.employeeNumber}-${dateStr}`)) {
        assign(s.employeeNumber, 'OFF', true);
      }
    });

    // (3) 연속근무 초과 → OFF (Nur 블록 대상자 제외)
    const plannedNurEmp = nurPlan.get(dateStr);
    activeStaff.forEach((s) => {
      if (assignedNums.has(s.employeeNumber)) return;
      if (s.employeeNumber === plannedNurEmp) return;
      if (countConsecutiveBefore(staffAssignments.get(s.employeeNumber)!, dateStr) >= constraints.consecutiveWork.maxDays) {
        assign(s.employeeNumber, 'OFF');
      }
    });

    // (4) Nur 사전 계획 적용
    if (plannedNurEmp && !assignedNums.has(plannedNurEmp)) {
      assign(plannedNurEmp, 'Nur');
    } else if (plannedNurEmp && assignedNums.has(plannedNurEmp)) {
      violations.push({ date: dateStr, employeeNumber: plannedNurEmp, rule: 'Nur 블록 중단: 해당 직원 배정 불가 (승인 OFF)' });
    }

    // Dur 배정: 제외근무 체크 + 연속 2일 초과 방지 + 주간 최대 2회 + 주간·전체 균등 배분
    const assignDur = (count: number) => {
      // 이번 주 월요일부터 오늘(제외)까지 각 직원의 Dur 횟수 계산
      const curDate = new Date(dateStr);
      const dow = curDate.getDay();
      const daysFromMon = dow === 0 ? 6 : dow - 1;
      const weeklyDurMap = new Map<string, number>();
      getPool().forEach((s) => {
        const emp = staffAssignments.get(s.employeeNumber)!;
        let cnt = 0;
        for (let i = 1; i <= daysFromMon; i++) {
          if (emp.get(format(addDays(curDate, -i), 'yyyy-MM-dd')) === 'Dur') cnt++;
        }
        weeklyDurMap.set(s.employeeNumber, cnt);
      });

      const yd = format(addDays(curDate, -1), 'yyyy-MM-dd');
      const dbd = format(addDays(curDate, -2), 'yyyy-MM-dd');

      // 점수: 주간 편중 방지 우선, 동점이면 누적 적은 순 / 주말·공휴일 exempt는 최후순위
      const durScoreFn = (s: StaffMember): number => {
        const weekly = weeklyDurMap.get(s.employeeNumber) ?? 0;
        let score = weekly * 100 + durCount[s.employeeNumber];
        if ((isWeekend || isHoliday) && WEEKEND_HOLIDAY_DUR_EXEMPT.has(s.employeeNumber)) {
          score += 9999;
        }
        return score;
      };

      // 단계적 완화: 부족하면 다음 단계로 채움
      // Lv1: 기본 (연속 Dur 2일 초과 방지 + 주간 최대 2회 + 일요일 exempt 제외)
      // Lv2: 주간 한도 해제 (주간 2회 초과 허용)
      // Lv3: 연속 한도도 해제
      // ※ 일요일 SUNDAY_DUR_EXEMPT(230010)는 어떤 단계에서도 배정 안 함 — 위반으로 처리
      const baseCandidates = getPool().filter(s => !s.excludedShifts.includes('Dur'));
      const isSundayExempt = (s: StaffMember) => dayOfWeek === 'Sun' && SUNDAY_DUR_EXEMPT.has(s.employeeNumber);

      const lv1 = baseCandidates.filter(s =>
        !isSundayExempt(s) &&
        !(staffAssignments.get(s.employeeNumber)!.get(yd) === 'Dur' && staffAssignments.get(s.employeeNumber)!.get(dbd) === 'Dur') &&
        (weeklyDurMap.get(s.employeeNumber) ?? 0) < 2
      );
      const lv2 = baseCandidates.filter(s =>
        !isSundayExempt(s) &&
        !(staffAssignments.get(s.employeeNumber)!.get(yd) === 'Dur' && staffAssignments.get(s.employeeNumber)!.get(dbd) === 'Dur')
      );
      const lv3 = baseCandidates.filter(s => !isSundayExempt(s));

      const picks: StaffMember[] = [];
      const pickedNums = new Set<string>();

      const fill = (pool: StaffMember[], needed: number) => {
        if (needed <= 0) return;
        const avail = pool.filter(s => !pickedNums.has(s.employeeNumber));
        let chosen: StaffMember[];

        if (needed === 2 && picks.length === 0 && avail.some(s => isSenior(s))) {
          // 고연차 최소 1명 보장 (최초 2명 선발 시에만)
          const seniorPick = pickBy(avail.filter(s => isSenior(s)), durScoreFn, 1);
          const restPick = pickBy(avail.filter(s => s.employeeNumber !== seniorPick[0]?.employeeNumber), durScoreFn, 1);
          chosen = seniorPick[0] ? [...seniorPick, ...restPick] : pickBy(avail, durScoreFn, needed);
        } else {
          chosen = pickBy(avail, durScoreFn, needed);
        }

        chosen.forEach(s => { picks.push(s); pickedNums.add(s.employeeNumber); });
      };

      fill(lv1, count);
      fill(lv2, count - picks.length);
      fill(lv3, count - picks.length);

      if (picks.length < count) {
        violations.push({ date: dateStr, rule: `Dur ${count}명 미충족 (${picks.length}명)` });
      }
      picks.forEach((s) => {
        assign(s.employeeNumber, 'Dur');
        durCount[s.employeeNumber]++;
      });
    };

    if (isWeekdayWork) {
      // (4.5) A1 커버리지 복구: A1_REQUIRED가 Nur에 묶였을 경우 다른 인원으로 교체
      {
        const getA1Avail = () =>
          getPool().filter((s) => s.group === 'A1_REQUIRED' && !s.excludedShifts.includes('A1'));

        if (getA1Avail().length === 0) {
          const nurEntry = assignments.find((a) => {
            if (a.shiftType !== 'Nur') return false;
            return activeStaff.find((s) => s.employeeNumber === a.employeeNumber)?.group === 'A1_REQUIRED';
          });

          if (nurEntry) {
            const victimNum = nurEntry.employeeNumber;
            // 대체 Nur 인원: 미배정, Nur 미제외, post-OFF 아님, 승인 OFF 아님
            const sub = getPool().find(
              (s) =>
                !s.excludedShifts.includes('Nur') &&
                !empPostOffDays.get(s.employeeNumber)!.has(dateStr) &&
                !approvedOffSet.has(`${s.employeeNumber}-${dateStr}`)
            );

            if (sub) {
              // victim Nur 취소
              const idx = assignments.findIndex((a) => a.employeeNumber === victimNum && a.shiftType === 'Nur');
              assignments.splice(idx, 1);
              assignedNums.delete(victimNum);
              staffAssignments.get(victimNum)!.delete(dateStr);
              workCount[victimNum]--;

              // 대체 인원 Nur 배정
              assign(sub.employeeNumber, 'Nur');

              // nurPlan: 오늘 + 나머지 블록 날짜 교체
              nurPlan.set(dateStr, sub.employeeNumber);
              let nd = addDays(cur, 1);
              while (nurPlan.get(format(nd, 'yyyy-MM-dd')) === victimNum) {
                nurPlan.set(format(nd, 'yyyy-MM-dd'), sub.employeeNumber);
                nd = addDays(nd, 1);
              }

              // nurPostOff 갱신
              const postDt = format(nd, 'yyyy-MM-dd');
              if (nurPostOff.get(postDt) === victimNum) {
                nurPostOff.set(postDt, sub.employeeNumber);
                empPostOffDays.get(victimNum)!.delete(postDt);
                empPostOffDays.get(sub.employeeNumber)!.add(postDt);
              }
            }
          }
        }
      }

      // (5) A1_REQUIRED 중 A1 가능한 사람 최소 1명 A1 배정
      // A1_REQUIRED 그룹이지만 Dur/B2/Nur도 가능 — 단 평일에 최소 1명은 A1 유지
      const a1RequiredAvail = getPool().filter(
        (s) => s.group === 'A1_REQUIRED' && !s.excludedShifts.includes('A1')
      );
      if (a1RequiredAvail.length > 0) {
        assign(pickBy(a1RequiredAvail, (s) => workCount[s.employeeNumber], 1)[0].employeeNumber, 'A1');
      } else {
        violations.push({ date: dateStr, rule: 'A1_REQUIRED 그룹 A1 배정 불가' });
      }

      // (6) Dur 2명 (고연차 최소 1명, A1_REQUIRED도 Dur 배정 가능)
      assignDur(constraints.dur.weekday);

      // (7) 주간 근무 한도 초과자 → OFF
      getPool().forEach((s) => {
        if (hitWeeklyLimit(s.employeeNumber)) assign(s.employeeNumber, 'OFF');
      });

      // (8) 나머지 → A1 (고연차/저연차 번갈아 배정, A1 제외근무 체크)
      const a1Pool = getPool().filter((s) => !s.excludedShifts.includes('A1'));
      pickByAlternating(a1Pool, (s) => workCount[s.employeeNumber], a1Pool.length, isSenior)
        .forEach((s) => assign(s.employeeNumber, 'A1'));
      // A1 제외근무 직원은 OFF
      getPool().forEach((s) => assign(s.employeeNumber, 'OFF'));

      const totalA1 = assignments.filter((a) => a.shiftType === 'A1').length;
      if (totalA1 < constraints.a1.weekdayMin) {
        violations.push({ date: dateStr, rule: `A1 최소 ${constraints.a1.weekdayMin}명 미충족 (${totalA1}명)` });
      }
    } else if (isSaturday) {
      // Dur 1명
      assignDur(1);

      // B2: 3~4명 — 고연차·중연차·신입 각 1명씩 우선 확보 후 나머지 채움
      // 신입(JUNIOR)은 최대 1명/토요일 (주간 분산)
      {
        const b2Pool = getPool().filter(s => !s.excludedShifts.includes('B2'));
        const seniorB2  = b2Pool.filter(s => s.group !== 'JUNIOR' && isSenior(s));
        const midB2     = b2Pool.filter(s => s.group !== 'JUNIOR' && !isSenior(s));
        const juniorB2  = b2Pool.filter(s => s.group === 'JUNIOR');

        const b2Picks: StaffMember[] = [];
        const b2Picked = new Set<string>();

        const b2Fill = (pool: StaffMember[], n: number) => {
          if (n <= 0) return;
          const avail = pool.filter(s => !b2Picked.has(s.employeeNumber));
          pickBy(avail, s => b2Count[s.employeeNumber], n)
            .forEach(s => { b2Picks.push(s); b2Picked.add(s.employeeNumber); });
        };

        // 1단계: 각 계층에서 1명씩 우선 선발
        b2Fill(seniorB2, 1);
        b2Fill(midB2, 1);
        b2Fill(juniorB2, 1);

        // 2단계: 남은 자리는 신입 제외하고 채움 (신입은 최대 1명 유지)
        b2Fill(b2Pool.filter(s => s.group !== 'JUNIOR'), constraints.b2.saturdayMax - b2Picks.length);

        // 3단계: 그래도 최소 인원 미충족 시 신입 추가 (fallback)
        b2Fill(b2Pool, constraints.b2.saturdayMin - b2Picks.length);

        if (b2Picks.length < constraints.b2.saturdayMin) {
          violations.push({ date: dateStr, rule: `B2 최소 ${constraints.b2.saturdayMin}명 미충족 (${b2Picks.length}명)` });
        }
        b2Picks.forEach(s => {
          assign(s.employeeNumber, 'B2');
          b2Count[s.employeeNumber]++;
        });
      }
      getPool().forEach((s) => assign(s.employeeNumber, 'OFF'));
    } else {
      // 일요일 / 공휴일: Dur 1, 나머지 OFF
      assignDur(1);
      getPool().forEach((s) => assign(s.employeeNumber, 'OFF'));
    }

    days.push({ date: dateStr, dayOfWeek, isWeekend, isPublicHoliday: isHoliday, isOutsideMonth, assignments });
  }

  // (post-loop 주간 A1→OFF 변환 제거: 지급해야 하는 OFF 외엔 지정하지 않음)

  // ── 주말·공휴일 Dur/Nur 보상 휴일 (연속 OFF 방지 greedy 선택) ──
  const holidayBonuses: Record<string, number> = {};
  activeStaff.forEach((s) => {
    const empMap = staffAssignments.get(s.employeeNumber)!;
    const earned = days
      .filter((d) => d.isWeekend || d.isPublicHoliday)
      .filter((d) =>
        d.assignments.some(
          (a) => a.employeeNumber === s.employeeNumber && (a.shiftType === 'Dur' || a.shiftType === 'Nur')
        )
      ).length;

    if (earned === 0) return;

    let remaining = earned;
    while (remaining > 0) {
      // 매 선택마다 재평가: 인접 OFF 적은 평일 A1 우선, 동점이면 A1 여유 많은 날
      const best = days
        .map((day) => {
          if (day.isWeekend || day.isPublicHoliday) return null;
          // TUESDAY_A1_FIXED 직원의 화요일은 보상 휴일 전환 불가
          if (TUESDAY_A1_FIXED.has(s.employeeNumber) && day.dayOfWeek === 'Tue') return null;
          const idx = day.assignments.findIndex(
            (a) => a.employeeNumber === s.employeeNumber && a.shiftType === 'A1'
          );
          if (idx === -1) return null;
          const dailyA1Count = day.assignments.filter((a) => a.shiftType === 'A1').length;
          if (dailyA1Count <= constraints.a1.weekdayMin) return null;
          const prevDt = format(addDays(new Date(day.date), -1), 'yyyy-MM-dd');
          const nextDt = format(addDays(new Date(day.date), 1), 'yyyy-MM-dd');
          const adjacentOff =
            ((empMap.get(prevDt) ?? 'OFF') === 'OFF' ? 1 : 0) +
            ((empMap.get(nextDt) ?? 'OFF') === 'OFF' ? 1 : 0);
          return { day, idx, dailyA1Count, adjacentOff };
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (a!.adjacentOff !== b!.adjacentOff) return a!.adjacentOff - b!.adjacentOff;
          return b!.dailyA1Count - a!.dailyA1Count;
        })[0];

      if (!best) break;
      best.day.assignments[best.idx].shiftType = 'OFF';
      best.day.assignments[best.idx].isLeave = true;
      // 보상 휴일은 isBonusOff로 마킹 — 신청 OFF(isApprovedLeave)와 구분, 스위프 보호 대상
      best.day.assignments[best.idx].isBonusOff = true;
      empMap.set(best.day.date, 'OFF');
      remaining--;
    }
    holidayBonuses[s.employeeNumber] = earned - remaining;
  });

  // ── 비신청 평일 OFF 상한 보정 ────────────────────────────────────
  // 규칙: 주간 총 OFF 쿼터 = 주말+공휴일 수. 신청 OFF가 쿼터를 소비하므로
  //       비신청 OFF 허용량 = 쿼터 - 신청 OFF 수. 초과분은 A1으로 환원.
  // 보호 대상 (환원 불가): 승인 OFF(isApprovedLeave=true), Nur post-OFF, 연속근무 초과 OFF
  activeStaff.forEach((s) => {
    const map = staffAssignments.get(s.employeeNumber)!;
    let weekStart = new Date(extendedStart);
    while (weekStart <= extendedEnd) {
      const weekDates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = addDays(weekStart, i);
        if (d <= extendedEnd) weekDates.push(format(d, 'yyyy-MM-dd'));
      }

      // 이 주의 공휴일+주말 수 = 주간 OFF 총 쿼터
      const weekendHolidayCount = weekDates.filter((dt) => {
        const d = days.find((x) => x.date === dt);
        return d && (d.isWeekend || d.isPublicHoliday);
      }).length;

      // 신청 OFF(isApprovedLeave=true)가 쿼터를 소비 → 비신청 OFF 허용량 차감
      const approvedOffCount = weekDates.filter((dt) => {
        const dayEntry = days.find((x) => x.date === dt);
        if (!dayEntry) return false;
        const a = dayEntry.assignments.find((x) => x.employeeNumber === s.employeeNumber);
        return a?.shiftType === 'OFF' && a.isApprovedLeave;
      }).length;

      const maxNonApprovedOff = Math.max(0, weekendHolidayCount - approvedOffCount);

      // 현재 비신청 OFF 목록 (승인 OFF·보상휴일 제외)
      const nonApprovedOffItems = weekDates
        .map((dt) => {
          const dayEntry = days.find((x) => x.date === dt);
          if (!dayEntry) return null;
          const a = dayEntry.assignments.find((x) => x.employeeNumber === s.employeeNumber);
          if (!a || a.shiftType !== 'OFF' || a.isApprovedLeave || a.isBonusOff) return null;
          return { dt, dayEntry, assignment: a };
        })
        .filter(Boolean);

      const excess = nonApprovedOffItems.length - maxNonApprovedOff;
      if (excess > 0) {
        // 환원 후보: Nur post-OFF 아님, 연속근무 초과 OFF 아님, 주말/공휴일 아님
        // 토요일은 B2일 (A1이 올 수 없는 날)이므로 반드시 제외
        const convertible = nonApprovedOffItems.filter((item) => {
          if (nurPostOff.get(item!.dt) === s.employeeNumber) return false;
          if (countConsecutiveBefore(map, item!.dt) >= constraints.consecutiveWork.maxDays) return false;
          const dayEntry = days.find(d => d.date === item!.dt);
          if (dayEntry?.isWeekend || dayEntry?.isPublicHoliday) return false;
          return true;
        });

        for (let i = 0; i < Math.min(excess, convertible.length); i++) {
          const c = convertible[i]!;
          c.assignment.shiftType = 'A1';
          c.assignment.isLeave = false;
          c.assignment.isApprovedLeave = undefined;
          map.set(c.dt, 'A1');
        }
      }

      weekStart = addDays(weekStart, 7);
    }
  });

    // ── 이번 시도 채점 및 최적 결과 갱신 ──────────────────────────
    const iterScore = scoreRun(violations, nurPlanCount, nurEligibleNums);
    if (iterScore < bestScore) {
      bestScore = iterScore;
      bestResult = {
        schedule: { year, month, days, publicHolidays },
        violations,
        holidayBonuses,
      };
      if (violations.length === 0) break; // 위반 없으면 즉시 종료
    }
  } // end for (iter)

  return bestResult!;
}
