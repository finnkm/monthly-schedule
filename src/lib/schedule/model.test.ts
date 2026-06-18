import { describe, it, expect } from 'vitest';
import { buildModel, xv } from './model';
import { buildCalendar } from './calendar';
import { getGlpk, solveLp } from './solve';
import { DEFAULT_CONSTRAINTS } from '@/types';
import type { StaffMember, ShiftType } from '@/types';

function makeStaff(n: number): StaffMember[] {
  return Array.from({ length: n }, (_, i) => ({
    employeeNumber: String(100000 + i),
    name: `s${i}`,
    group: i < 3 ? 'A1_REQUIRED' : 'GENERAL',
    excludedShifts: [],
  }));
}

describe('buildModel', () => {
  it('해를 구하면 매 평일 A1>=5, Dur=2, Nur=1을 만족한다', async () => {
    const cal = buildCalendar(2026, 6, []);
    const staff = makeStaff(12);
    const glpk = await getGlpk();
    const lp = buildModel(glpk, staff, cal, new Set(), DEFAULT_CONSTRAINTS);
    const res = await solveLp(glpk, lp, { tmlim: 20 });

    for (const ctx of cal.days.filter((d) => d.isWeekdayWork)) {
      const count = (k: ShiftType) =>
        staff.filter((s) => (res.result.vars[xv(s.employeeNumber, ctx.date, k)] ?? 0) > 0.5).length;
      expect(count('A1')).toBeGreaterThanOrEqual(5);
      expect(count('Dur')).toBe(2);
      expect(count('Nur')).toBe(1);
    }
  });

  it('하루에 직원당 정확히 한 시프트', async () => {
    const cal = buildCalendar(2026, 6, []);
    const staff = makeStaff(12);
    const glpk = await getGlpk();
    const lp = buildModel(glpk, staff, cal, new Set(), DEFAULT_CONSTRAINTS);
    const res = await solveLp(glpk, lp, { tmlim: 20 });
    const shifts: ShiftType[] = ['A1', 'B2', 'Dur', 'Nur', 'OFF'];
    for (const s of staff) {
      for (const ctx of cal.days) {
        const total = shifts.reduce(
          (a, k) => a + ((res.result.vars[xv(s.employeeNumber, ctx.date, k)] ?? 0) > 0.5 ? 1 : 0),
          0,
        );
        expect(total).toBe(1);
      }
    }
  });

  it('승인 OFF는 고정되고, 일요일 230010은 Dur 미배정', async () => {
    const cal = buildCalendar(2026, 6, []);
    const staff: StaffMember[] = [
      ...makeStaff(11),
      { employeeNumber: '230010', name: 'x', group: 'GENERAL', excludedShifts: [] },
    ];
    const glpk = await getGlpk();
    const approved = new Set(['100000-2026-06-02']);
    const lp = buildModel(glpk, staff, cal, approved, DEFAULT_CONSTRAINTS);
    const res = await solveLp(glpk, lp, { tmlim: 20 });
    expect(res.result.vars[xv('100000', '2026-06-02', 'OFF')]).toBeGreaterThan(0.5);
    for (const ctx of cal.days.filter((d) => d.dayOfWeek === 'Sun')) {
      expect(res.result.vars[xv('230010', ctx.date, 'Dur')] ?? 0).toBeLessThan(0.5);
    }
  });
});
