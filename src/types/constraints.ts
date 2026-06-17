export interface ScheduleConstraints {
  dur: {
    weekday: number;
    weekendOrHoliday: number;
  };
  nur: {
    daily: number;
  };
  a1: {
    weekdayMin: number;
  };
  b2: {
    saturdayMin: number;
    saturdayMax: number;
  };
  consecutiveWork: {
    maxDays: number;
  };
  rest: {
    minDaysPerWeek: number;
    minDaysWithB2: number;
  };
}

export const DEFAULT_CONSTRAINTS: ScheduleConstraints = {
  dur: { weekday: 2, weekendOrHoliday: 1 },
  nur: { daily: 1 },
  a1: { weekdayMin: 5 },
  b2: { saturdayMin: 3, saturdayMax: 4 },
  consecutiveWork: { maxDays: 6 },
  rest: { minDaysPerWeek: 2, minDaysWithB2: 1 },
};
