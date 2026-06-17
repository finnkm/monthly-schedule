import type { MonthlySchedule, StaffMember, ValidationViolation, ShiftType } from '@/types';
import { ScheduleCell } from './ScheduleCell';
import { DailySummaryRow } from './DailySummaryRow';
import { cn } from '@/lib/utils';

const DAY_KO: Record<string, string> = {
  Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일',
};

interface ScheduleTableProps {
  schedule: MonthlySchedule;
  staff: StaffMember[];
  violations: ValidationViolation[];
  holidayBonuses: Record<string, number>;
}

export function ScheduleTable({ schedule, staff, violations, holidayBonuses }: ScheduleTableProps) {
  const { days } = schedule;

  const violationMap = new Map<string, string>();
  violations.forEach((v) => {
    if (v.employeeNumber && v.date) {
      violationMap.set(`${v.employeeNumber}-${v.date}`, v.rule);
    }
  });

  const getAssignment = (empNum: string, date: string) =>
    days.find((d) => d.date === date)?.assignments.find((a) => a.employeeNumber === empNum);

  // 표시된 전체 날짜(이전/다음달 확장분 포함) 집계
  const countMonthly = (empNum: string, type: ShiftType) =>
    days.reduce((acc, d) => {
      const a = d.assignments.find((a) => a.employeeNumber === empNum);
      return acc + (a?.shiftType === type ? 1 : 0);
    }, 0);

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="text-xs border-collapse min-w-max">
        <thead>
          <tr className="bg-muted">
            <th className="sticky left-0 bg-muted z-10 px-3 py-2 text-left border-r min-w-28 font-medium">
              이름
            </th>
            <th className="px-2 py-2 border-r min-w-16 font-medium">사번</th>
            {days.map((d) => {
              const outside = !!d.isOutsideMonth;
              return (
                <th
                  key={d.date}
                  className={cn(
                    'px-1 py-2 text-center border-r min-w-10',
                    outside
                      ? 'bg-gray-100'
                      : (d.isWeekend || d.isPublicHoliday) && 'bg-slate-100'
                  )}
                >
                  <div
                    className={cn(
                      'font-medium',
                      outside
                        ? 'text-gray-400'
                        : d.dayOfWeek === 'Sun'
                        ? 'text-red-500'
                        : d.dayOfWeek === 'Sat'
                        ? 'text-blue-500'
                        : ''
                    )}
                  >
                    {outside
                      ? `${Number(d.date.slice(5, 7))}/${d.date.slice(8)}`
                      : d.date.slice(8)}
                  </div>
                  <div
                    className={cn(
                      'text-[10px]',
                      outside
                        ? 'text-gray-300'
                        : d.dayOfWeek === 'Sun'
                        ? 'text-red-400'
                        : d.dayOfWeek === 'Sat'
                        ? 'text-blue-400'
                        : 'text-muted-foreground'
                    )}
                  >
                    {DAY_KO[d.dayOfWeek]}
                  </div>
                </th>
              );
            })}
            <th className="px-2 py-2 border-r text-center font-medium">Dur</th>
            <th className="px-2 py-2 border-r text-center font-medium">Nur</th>
            <th className="px-2 py-2 border-r text-center font-medium">OF</th>
            <th className="px-2 py-2 border-r text-center font-medium">B2</th>
            <th className="px-2 py-2 text-center font-medium text-purple-600">보상</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.employeeNumber} className="border-b hover:bg-muted/30 transition-colors">
              <td className="sticky left-0 bg-white z-10 px-3 py-1 border-r font-medium">
                {s.name}
              </td>
              <td className="px-2 py-1 border-r font-mono text-muted-foreground text-[11px]">
                {s.employeeNumber}
              </td>
              {days.map((d) => {
                const outside = !!d.isOutsideMonth;
                const assignment = getAssignment(s.employeeNumber, d.date);
                const shiftType: ShiftType = assignment?.shiftType ?? 'OFF';
                const violation = violationMap.get(`${s.employeeNumber}-${d.date}`);
                return (
                  <td
                    key={d.date}
                    className={cn(
                      'px-0.5 py-0.5 border-r',
                      outside
                        ? 'bg-gray-50 opacity-60'
                        : (d.isWeekend || d.isPublicHoliday) && 'bg-slate-50'
                    )}
                  >
                    <ScheduleCell
                      shiftType={shiftType}
                      isApprovedLeave={assignment?.isApprovedLeave}
                      isBonusOff={assignment?.isBonusOff}
                      hasViolation={!!violation}
                      violationMsg={violation}
                    />
                  </td>
                );
              })}
              <td className="px-2 py-1 border-r text-center font-medium">
                {countMonthly(s.employeeNumber, 'Dur')}
              </td>
              <td className="px-2 py-1 border-r text-center font-medium">
                {countMonthly(s.employeeNumber, 'Nur')}
              </td>
              <td className="px-2 py-1 border-r text-center font-medium">
                {countMonthly(s.employeeNumber, 'OFF')}
              </td>
              <td className="px-2 py-1 border-r text-center font-medium">
                {countMonthly(s.employeeNumber, 'B2')}
              </td>
              <td className="px-2 py-1 text-center font-medium text-purple-600">
                {holidayBonuses[s.employeeNumber] ?? '-'}
              </td>
            </tr>
          ))}
          <DailySummaryRow label="Dur" days={days} shiftType="Dur" />
          <DailySummaryRow label="Nur" days={days} shiftType="Nur" />
          <DailySummaryRow label="A1" days={days} shiftType="A1" />
          <DailySummaryRow label="B2" days={days} shiftType="B2" />
        </tbody>
      </table>
    </div>
  );
}
