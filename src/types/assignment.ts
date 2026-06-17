import type { ShiftType } from './schedule';

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface ShiftAssignment {
  date: string;
  employeeNumber: string;
  shiftType: ShiftType;
  isLeave: boolean;
  isApprovedLeave?: boolean; // 직원이 신청하여 승인된 OFF인 경우 true
  isBonusOff?: boolean;      // 주말/공휴일 Dur·Nur 보상 휴일인 경우 true
}

export interface DailySchedule {
  date: string;
  dayOfWeek: DayOfWeek;
  isWeekend: boolean;
  isPublicHoliday: boolean;
  isOutsideMonth?: boolean;
  assignments: ShiftAssignment[];
}

export interface MonthlySchedule {
  year: number;
  month: number;
  days: DailySchedule[];
  publicHolidays: string[];
}

export interface LeaveRequest {
  id: string;
  employeeNumber: string;
  date: string;
  status: 'PENDING' | 'APPROVED';
}
