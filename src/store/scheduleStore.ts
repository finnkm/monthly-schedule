import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MonthlySchedule } from '@/types';

interface ScheduleStore {
  schedules: Record<string, MonthlySchedule>;
  saveSchedule: (schedule: MonthlySchedule) => void;
  getSchedule: (year: number, month: number) => MonthlySchedule | undefined;
  deleteSchedule: (year: number, month: number) => void;
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      schedules: {},
      saveSchedule: (schedule) => {
        const key = `${schedule.year}-${String(schedule.month).padStart(2, '0')}`;
        set((state) => ({
          schedules: { ...state.schedules, [key]: schedule },
        }));
      },
      getSchedule: (year, month) => {
        const key = `${year}-${String(month).padStart(2, '0')}`;
        return get().schedules[key];
      },
      deleteSchedule: (year, month) => {
        const key = `${year}-${String(month).padStart(2, '0')}`;
        set((state) => {
          const next = { ...state.schedules };
          delete next[key];
          return { schedules: next };
        });
      },
    }),
    { name: 'schedule-store' }
  )
);
