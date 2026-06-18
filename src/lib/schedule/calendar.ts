import { getDaysInMonth, getDay, format, addDays } from 'date-fns';
import type { DayOfWeek } from '@/types';

const DAY_NAMES: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface DayCtx {
  date: string;
  dateObj: Date;
  dow: number;
  dayOfWeek: DayOfWeek;
  isHoliday: boolean;
  isWeekend: boolean;
  isWeekdayWork: boolean;
  isSaturday: boolean;
  isOutsideMonth: boolean;
  prev: string;
  next: string;
}

export interface Calendar {
  days: DayCtx[];
  byDate: Map<string, DayCtx>;
  weeks: DayCtx[][];
}

export function buildCalendar(year: number, month: number, holidays: string[]): Calendar {
  const holidaySet = new Set(holidays);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, getDaysInMonth(monthStart));

  const startDow = getDay(monthStart);
  const daysBack = startDow === 0 ? 6 : startDow - 1;
  const extendedStart = addDays(monthStart, -daysBack);

  const endDow = getDay(monthEnd);
  const daysForward = endDow === 0 ? 0 : 7 - endDow;
  const extendedEnd = addDays(monthEnd, daysForward);

  const days: DayCtx[] = [];
  for (let cur = new Date(extendedStart); cur <= extendedEnd; cur = addDays(cur, 1)) {
    const date = format(cur, 'yyyy-MM-dd');
    const dow = getDay(cur);
    const dayOfWeek = DAY_NAMES[dow];
    const isHoliday = holidaySet.has(date);
    const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
    days.push({
      date,
      dateObj: new Date(cur),
      dow,
      dayOfWeek,
      isHoliday,
      isWeekend,
      isWeekdayWork: !isWeekend && !isHoliday,
      isSaturday: dayOfWeek === 'Sat' && !isHoliday,
      isOutsideMonth: cur.getMonth() !== month - 1 || cur.getFullYear() !== year,
      prev: format(addDays(cur, -1), 'yyyy-MM-dd'),
      next: format(addDays(cur, 1), 'yyyy-MM-dd'),
    });
  }

  const byDate = new Map(days.map((d) => [d.date, d]));
  const weeks: DayCtx[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return { days, byDate, weeks };
}
