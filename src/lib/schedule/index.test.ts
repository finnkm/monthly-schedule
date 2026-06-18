import { describe, it, expect } from 'vitest';
import { generateMonthlySchedule } from './index';
import type { StaffMember, LeaveRequest } from '@/types';

function makeStaff(n: number): StaffMember[] {
  return Array.from({ length: n }, (_, i) => ({
    employeeNumber: String(100000 + i),
    name: `s${i}`,
    group: i < 3 ? 'A1_REQUIRED' : 'GENERAL',
    excludedShifts: [],
  }));
}

describe('generateMonthlySchedule (MILP)', () => {
  it('출력이 hard 규칙을 만족한다', async () => {
    const staff = makeStaff(12);
    const res = await generateMonthlySchedule(staff, 2026, 6, [], [], undefined);

    for (const day of res.schedule.days) {
      expect(day.assignments.length).toBe(staff.length);
      for (const a of day.assignments) {
        expect(['A1', 'B2', 'Dur', 'Nur', 'OFF']).toContain(a.shiftType);
      }
      if (!day.isWeekend && !day.isPublicHoliday) {
        const a1 = day.assignments.filter((a) => a.shiftType === 'A1').length;
        const dur = day.assignments.filter((a) => a.shiftType === 'Dur').length;
        expect(a1).toBeGreaterThanOrEqual(5);
        expect(dur).toBe(2);
      }
    }
  });

  it('승인 OFF를 반드시 반영한다', async () => {
    const staff = makeStaff(12);
    const leaves: LeaveRequest[] = [
      { id: '1', employeeNumber: '100005', date: '2026-06-03', status: 'APPROVED' },
    ];
    const res = await generateMonthlySchedule(staff, 2026, 6, leaves, [], undefined);
    const day = res.schedule.days.find((d) => d.date === '2026-06-03')!;
    const a = day.assignments.find((x) => x.employeeNumber === '100005')!;
    expect(a.shiftType).toBe('OFF');
    expect(a.isApprovedLeave).toBe(true);
  });

  it('OFF는 과다 배정되지 않는다 (휴식쿼터 + 평일신청 + Nur post-off 한도 내)', async () => {
    const staff = makeStaff(12);
    // 100007이 화요일(2026-06-09) 평일 신청 OFF
    const leaves: LeaveRequest[] = [
      { id: '1', employeeNumber: '100007', date: '2026-06-09', status: 'APPROVED' },
    ];
    const res = await generateMonthlySchedule(staff, 2026, 6, leaves, [], undefined);
    const days = res.schedule.days;
    // 월 전체 휴식 쿼터 = 주말·공휴일 일수. 각 Nur는 post-off 1일을 유발할 수 있고,
    // 평일 신청OFF는 별도 가산. B2는 휴식 등가라 추가 OFF를 만들지 않음.
    const quota = days.filter((d) => d.isWeekend || d.isPublicHoliday).length;
    for (const s of staff) {
      let off = 0;
      let nur = 0;
      let approvedWeekday = 0;
      for (const d of days) {
        const a = d.assignments.find((x) => x.employeeNumber === s.employeeNumber)!;
        if (a.shiftType === 'OFF') off++;
        if (a.shiftType === 'Nur') nur++;
        if (a.isApprovedLeave && !(d.isWeekend || d.isPublicHoliday)) approvedWeekday++;
      }
      expect(off).toBeLessThanOrEqual(quota + approvedWeekday + nur);
    }
  });

  it('Dur·Nur는 3일 연속 배정되지 않는다(최대 2연속)', async () => {
    const staff = makeStaff(12);
    const res = await generateMonthlySchedule(staff, 2026, 6, [], [], undefined);
    for (const s of staff) {
      let durRun = 0;
      let nurRun = 0;
      for (const day of res.schedule.days) {
        const a = day.assignments.find((x) => x.employeeNumber === s.employeeNumber)!;
        durRun = a.shiftType === 'Dur' ? durRun + 1 : 0;
        nurRun = a.shiftType === 'Nur' ? nurRun + 1 : 0;
        expect(durRun).toBeLessThanOrEqual(2);
        expect(nurRun).toBeLessThanOrEqual(2);
      }
    }
  });

  it('주말·공휴일 Dur/Nur 근무자는 보상휴일(holidayBonuses)을 받고 보상 OFF로 표시된다', async () => {
    const staff = makeStaff(12);
    const res = await generateMonthlySchedule(staff, 2026, 6, [], [], undefined);
    // 주말/공휴일 Dur·Nur는 매일 존재하므로 누군가는 보상휴일이 집계되어야 함
    const total = Object.values(res.holidayBonuses).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0);
    // 보상휴일이 있는 직원은 isBonusOff로 표시된 OFF가 존재해야 한다
    for (const [emp, count] of Object.entries(res.holidayBonuses)) {
      if (count <= 0) continue;
      const marked = res.schedule.days.reduce(
        (acc, d) =>
          acc + d.assignments.filter((a) => a.employeeNumber === emp && a.isBonusOff).length,
        0,
      );
      expect(marked).toBeGreaterThan(0);
    }
  });

  it('토요일 B2는 공평하게 분배되어 0회인 직원이 없다', async () => {
    const staff = makeStaff(12); // 전원 B2 가능
    const res = await generateMonthlySchedule(staff, 2026, 6, [], [], undefined);
    for (const s of staff) {
      const b2 = res.schedule.days.reduce(
        (acc, d) =>
          acc +
          d.assignments.filter(
            (a) => a.employeeNumber === s.employeeNumber && a.shiftType === 'B2',
          ).length,
        0,
      );
      expect(b2).toBeGreaterThanOrEqual(1);
    }
  });

  it('인원 여유가 있으면 토요일 B2는 4명까지 채운다(신입 없어도)', async () => {
    const staff = makeStaff(12); // 신입 없음, 전원 B2 가능
    const res = await generateMonthlySchedule(staff, 2026, 6, [], [], undefined);
    const counts = res.schedule.days
      .filter((d) => d.dayOfWeek === 'Sat' && !d.isPublicHoliday)
      .map((d) => d.assignments.filter((a) => a.shiftType === 'B2').length);
    expect(counts.every((c) => c >= 3)).toBe(true); // 최소 3명
    expect(counts.some((c) => c === 4)).toBe(true); // 신입 없어도 4명이 가능/발생
  });

  it('신입 B2 규칙: 토요일당 신입 ≤1, 신입 포함 시 총 4명·비신입 ≥3', async () => {
    const staff: StaffMember[] = [
      ...makeStaff(9),
      { employeeNumber: '200001', name: 'j1', group: 'JUNIOR', excludedShifts: [] },
      { employeeNumber: '200002', name: 'j2', group: 'JUNIOR', excludedShifts: [] },
      { employeeNumber: '200003', name: 'j3', group: 'JUNIOR', excludedShifts: [] },
    ];
    const res = await generateMonthlySchedule(staff, 2026, 6, [], [], undefined);
    const juniors = new Set(['200001', '200002', '200003']);
    for (const day of res.schedule.days.filter((d) => d.dayOfWeek === 'Sat' && !d.isPublicHoliday)) {
      const b2 = day.assignments.filter((a) => a.shiftType === 'B2');
      const juniorB2 = b2.filter((a) => juniors.has(a.employeeNumber)).length;
      const nonJuniorB2 = b2.length - juniorB2;
      expect(juniorB2).toBeLessThanOrEqual(1); // 신입 동시 배정 금지
      expect(nonJuniorB2).toBeGreaterThanOrEqual(3); // 비신입(1인분) 최소 3명
      if (juniorB2 > 0) expect(b2.length).toBe(4); // 신입 포함 시 총 4명
    }
  });

  it('화요일 A1 고정 직원(160432)은 화요일에 반드시 A1', async () => {
    const staff: StaffMember[] = [
      ...makeStaff(11),
      { employeeNumber: '160432', name: 'fix', group: 'A1_REQUIRED', excludedShifts: [] },
    ];
    const res = await generateMonthlySchedule(staff, 2026, 6, [], [], undefined);
    const tuesdays = res.schedule.days.filter((d) => d.dayOfWeek === 'Tue' && !d.isPublicHoliday);
    for (const day of tuesdays) {
      const a = day.assignments.find((x) => x.employeeNumber === '160432')!;
      expect(a.shiftType).toBe('A1');
    }
  });

  it('연속근무는 maxDays(6)를 넘지 않는다', async () => {
    const staff = makeStaff(12);
    const res = await generateMonthlySchedule(staff, 2026, 6, [], [], undefined);
    for (const s of staff) {
      let run = 0;
      for (const day of res.schedule.days) {
        const a = day.assignments.find((x) => x.employeeNumber === s.employeeNumber)!;
        run = a.shiftType === 'OFF' ? 0 : run + 1;
        expect(run).toBeLessThanOrEqual(6);
      }
    }
  });
});
