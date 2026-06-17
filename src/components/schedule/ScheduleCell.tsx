import type { ShiftType } from '@/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const CELL_COLORS: Record<ShiftType, string> = {
  Dur: 'bg-red-200 text-red-800',
  Nur: 'bg-yellow-200 text-yellow-800',
  A1: 'bg-white text-gray-700 border border-gray-200',
  B2: 'bg-blue-200 text-blue-800',
  OFF: 'bg-green-100 text-green-600',
};

const APPROVED_OFF_COLOR = 'bg-green-200 text-green-900 font-semibold';
const BONUS_OFF_COLOR = 'bg-teal-100 text-teal-700';

interface ScheduleCellProps {
  shiftType: ShiftType;
  isApprovedLeave?: boolean;
  isBonusOff?: boolean;
  hasViolation?: boolean;
  violationMsg?: string;
}

export function ScheduleCell({ shiftType, isApprovedLeave, isBonusOff, hasViolation, violationMsg }: ScheduleCellProps) {
  const colorClass =
    shiftType === 'OFF' && isApprovedLeave
      ? APPROVED_OFF_COLOR
      : shiftType === 'OFF' && isBonusOff
      ? BONUS_OFF_COLOR
      : CELL_COLORS[shiftType];

  const tooltipText = hasViolation
    ? violationMsg
    : isApprovedLeave
    ? '신청 OFF'
    : isBonusOff
    ? '보상 휴일'
    : undefined;
  const label = shiftType === 'OFF' ? 'OF' : shiftType;

  if (!tooltipText) {
    return (
      <div className={cn('w-10 h-8 flex items-center justify-center text-xs rounded select-none', colorClass, hasViolation && 'ring-2 ring-red-500')}>
        {label}
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className={cn('w-10 h-8 flex items-center justify-center text-xs rounded select-none', colorClass, hasViolation && 'ring-2 ring-red-500')} />
        }
      >
        {label}
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}
