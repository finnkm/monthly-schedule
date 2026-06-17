import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LeaveRequest } from '@/types';

interface OffRequestStore {
  requests: LeaveRequest[];
  toggleRequest: (employeeNumber: string, date: string) => void;
  getMonthRequests: (year: number, month: number) => LeaveRequest[];
  approveMonthRequests: (year: number, month: number) => void;
}

export const useOffRequestStore = create<OffRequestStore>()(
  persist(
    (set, get) => ({
      requests: [],
      toggleRequest: (employeeNumber, date) => {
        const id = `${employeeNumber}-${date}`;
        const exists = get().requests.find((r) => r.id === id);
        if (exists) {
          set((state) => ({
            requests: state.requests.filter((r) => r.id !== id),
          }));
        } else {
          const newReq: LeaveRequest = {
            id,
            employeeNumber,
            date,
            status: 'PENDING',
          };
          set((state) => ({ requests: [...state.requests, newReq] }));
        }
      },
      getMonthRequests: (year, month) => {
        const prefix = `${year}-${String(month).padStart(2, '0')}`;
        return get().requests.filter((r) => r.date.startsWith(prefix));
      },
      approveMonthRequests: (year, month) => {
        const prefix = `${year}-${String(month).padStart(2, '0')}`;
        set((state) => ({
          requests: state.requests.map((r) =>
            r.date.startsWith(prefix) ? { ...r, status: 'APPROVED' } : r
          ),
        }));
      },
    }),
    { name: 'off-request-store' }
  )
);
