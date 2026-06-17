import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CalendarStore {
  year: number;
  month: number;
  setYear: (year: number) => void;
  setMonth: (month: number) => void;
}

const now = new Date();

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set) => ({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      setYear: (year) => set({ year }),
      setMonth: (month) => set({ month }),
    }),
    { name: 'calendar-store' }
  )
);
