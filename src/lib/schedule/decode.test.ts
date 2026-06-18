import { describe, it, expect } from 'vitest';
import { decodeSolution } from './decode';
import { buildCalendar } from './calendar';
import { xv } from './model';
import type { StaffMember } from '@/types';

const staff: StaffMember[] = [
  { employeeNumber: '100000', name: 'a', group: 'GENERAL', excludedShifts: [] },
];

describe('decodeSolution', () => {
  it('변수 해를 일별 배정으로 변환하고 슬랙을 위반으로 복원', () => {
    const cal = buildCalendar(2026, 6, []);
    const d0 = cal.days[0].date;
    const vars: Record<string, number> = {
      [xv('100000', d0, 'A1')]: 1,
      [`s|A1min|${d0}`]: 2, // A1 2명 부족
    };
    const res = decodeSolution(vars, staff, cal, new Set(), 2026, 6, []);
    const day0 = res.schedule.days.find((d) => d.date === d0)!;
    expect(day0.assignments[0].shiftType).toBe('A1');
    expect(res.violations.some((v) => v.date === d0 && /A1/.test(v.rule))).toBe(true);
    expect(res.schedule.year).toBe(2026);
  });

  it('승인 OFF는 isApprovedLeave, 주말 Dur/Nur는 holidayBonuses 집계', () => {
    const cal = buildCalendar(2026, 6, []);
    const sun = cal.days.find((d) => d.dayOfWeek === 'Sun')!.date;
    const off = cal.days[0].date;
    const vars: Record<string, number> = {
      [xv('100000', off, 'OFF')]: 1,
      [xv('100000', sun, 'Dur')]: 1,
    };
    const res = decodeSolution(vars, staff, cal, new Set([`100000-${off}`]), 2026, 6, []);
    const offDay = res.schedule.days.find((d) => d.date === off)!;
    expect(offDay.assignments[0].isApprovedLeave).toBe(true);
    expect(res.holidayBonuses['100000']).toBe(1);
  });
});
