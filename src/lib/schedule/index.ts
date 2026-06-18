import type { StaffMember, LeaveRequest, ScheduleConstraints, GenerationResult } from '@/types';
import { DEFAULT_CONSTRAINTS } from '@/types';
import { buildCalendar } from './calendar';
import { buildModel } from './model';
import { getGlpk, solveLp } from './solve';
import { decodeSolution } from './decode';

export async function generateMonthlySchedule(
  staff: StaffMember[],
  year: number,
  month: number,
  approvedLeaves: LeaveRequest[],
  publicHolidays: string[],
  constraints: ScheduleConstraints = DEFAULT_CONSTRAINTS,
): Promise<GenerationResult> {
  const sorted = [...staff].sort(
    (a, b) => Number(a.employeeNumber) - Number(b.employeeNumber),
  );
  const approvedOffSet = new Set(
    approvedLeaves
      .filter((r) => r.status === 'APPROVED')
      .map((r) => `${r.employeeNumber}-${r.date}`),
  );

  const cal = buildCalendar(year, month, publicHolidays);
  const glpk = await getGlpk();
  const lp = buildModel(glpk, sorted, cal, approvedOffSet, constraints);
  const res = await solveLp(glpk, lp);

  return decodeSolution(res.result.vars, sorted, cal, approvedOffSet, year, month, publicHolidays);
}
