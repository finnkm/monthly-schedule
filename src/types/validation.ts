import type { ShiftType } from './schedule';

export interface ValidationViolation {
  employeeNumber?: string;
  date?: string;
  shiftType?: ShiftType;
  rule: string;
}

export interface GenerationResult {
  schedule: import('./assignment').MonthlySchedule;
  violations: ValidationViolation[];
  holidayBonuses: Record<string, number>; // employeeNumber → 적용된 보상 휴일 수
}
