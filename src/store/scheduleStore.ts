import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MonthlySchedule, ValidationViolation } from '@/types';

export interface ScheduleMeta {
  violations: ValidationViolation[];
  holidayBonuses: Record<string, number>;
}

const EMPTY_META: ScheduleMeta = { violations: [], holidayBonuses: {} };

interface ScheduleStore {
  schedules: Record<string, MonthlySchedule>;
  meta: Record<string, ScheduleMeta>;
  saveSchedule: (schedule: MonthlySchedule, meta: ScheduleMeta) => void;
  getSchedule: (year: number, month: number) => MonthlySchedule | undefined;
  getMeta: (year: number, month: number) => ScheduleMeta;
  deleteSchedule: (year: number, month: number) => void;
}

const keyOf = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}`;

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      schedules: {},
      meta: {},
      saveSchedule: (schedule, meta) => {
        const key = keyOf(schedule.year, schedule.month);
        set((state) => ({
          schedules: { ...state.schedules, [key]: schedule },
          meta: { ...state.meta, [key]: meta },
        }));
      },
      getSchedule: (year, month) => get().schedules[keyOf(year, month)],
      getMeta: (year, month) => get().meta[keyOf(year, month)] ?? EMPTY_META,
      deleteSchedule: (year, month) => {
        const key = keyOf(year, month);
        set((state) => {
          const schedules = { ...state.schedules };
          const meta = { ...state.meta };
          delete schedules[key];
          delete meta[key];
          return { schedules, meta };
        });
      },
    }),
    {
      name: 'schedule-store',
      partialize: (state) => ({
        schedules: state.schedules,
        meta: state.meta,
      }),
    }
  )
);
