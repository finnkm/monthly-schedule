import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StaffMember, StaffFormInput } from '@/types';

interface StaffStore {
  staff: StaffMember[];
  addStaff: (input: StaffFormInput) => { success: boolean; error?: string };
  updateStaff: (currentEmployeeNumber: string, input: Partial<StaffFormInput>) => { success: boolean; error?: string };
  deleteStaff: (employeeNumber: string) => void;
}

export const useStaffStore = create<StaffStore>()(
  persist(
    (set, get) => ({
      staff: [],
      addStaff: (input) => {
        const exists = get().staff.some(
          (s) => s.employeeNumber === input.employeeNumber
        );
        if (exists) return { success: false, error: '이미 존재하는 사번입니다.' };
        const newMember: StaffMember = { ...input };
        set((state) => ({
          staff: [...state.staff, newMember].sort(
            (a, b) => Number(a.employeeNumber) - Number(b.employeeNumber)
          ),
        }));
        return { success: true };
      },
      updateStaff: (currentEmployeeNumber, input) => {
        const newNum = input.employeeNumber;
        if (newNum && newNum !== currentEmployeeNumber) {
          const duplicate = get().staff.some((s) => s.employeeNumber === newNum);
          if (duplicate) return { success: false, error: '이미 존재하는 사번입니다.' };
        }
        set((state) => ({
          staff: state.staff
            .map((s) =>
              s.employeeNumber === currentEmployeeNumber ? { ...s, ...input } : s
            )
            .sort((a, b) => Number(a.employeeNumber) - Number(b.employeeNumber)),
        }));
        return { success: true };
      },
      deleteStaff: (employeeNumber) => {
        set((state) => ({
          staff: state.staff.filter((s) => s.employeeNumber !== employeeNumber),
        }));
      },
    }),
    { name: 'staff-store' }
  )
);
