import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HolidayStore {
  // key: "YYYY-MM", value: sorted date strings "YYYY-MM-DD"
  holidays: Record<string, string[]>;
  getHolidays: (year: number, month: number) => string[];
  toggleHoliday: (year: number, month: number, date: string) => void;
  clearMonth: (year: number, month: number) => void;
}

const key = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}`;

export const useHolidayStore = create<HolidayStore>()(
  persist(
    (set, get) => ({
      holidays: {},
      getHolidays: (year, month) => get().holidays[key(year, month)] ?? [],
      toggleHoliday: (year, month, date) => {
        const k = key(year, month);
        const current = get().holidays[k] ?? [];
        const next = current.includes(date)
          ? current.filter((d) => d !== date)
          : [...current, date].sort();
        set((state) => ({ holidays: { ...state.holidays, [k]: next } }));
      },
      clearMonth: (year, month) => {
        const k = key(year, month);
        set((state) => {
          const { [k]: _, ...rest } = state.holidays;
          return { holidays: rest };
        });
      },
    }),
    { name: 'holiday-store' }
  )
);
