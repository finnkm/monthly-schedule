import type { DailySchedule, ShiftType } from '@/types';
import { cn } from '@/lib/utils';

interface DailySummaryRowProps {
  label: string;
  days: DailySchedule[];
  shiftType: ShiftType;
}

export function DailySummaryRow({ label, days, shiftType }: DailySummaryRowProps) {
  return (
    <tr className="bg-muted/50 text-xs">
      <td className="sticky left-0 bg-muted/80 px-3 py-1 font-medium border-r z-10">
        {label}
      </td>
      <td className="border-r" />
      {days.map((day) => {
        const outside = !!day.isOutsideMonth;
        const count = day.assignments.filter((a) => a.shiftType === shiftType).length;
        return (
          <td
            key={day.date}
            className={cn(
              'text-center py-1 border-r border-border/30 min-w-10',
              outside && 'bg-gray-100 opacity-50'
            )}
          >
            {count > 0 ? count : <span className="text-muted-foreground">-</span>}
          </td>
        );
      })}
      <td className="border-r" />
      <td className="border-r" />
      <td className="border-r" />
      <td className="border-r" />
      <td />
    </tr>
  );
}
