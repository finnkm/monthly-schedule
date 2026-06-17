import type { ShiftType } from './schedule';

// A1_REQUIRED: 이 그룹에서 매 평일 최소 1명은 반드시 A1에 포함되어야 함
// JUNIOR: 신입 그룹 — 토요일 B2 배정 시 신입끼리 겹치지 않도록 제한 (최대 1명/토요일)
export type StaffGroup = 'A1_REQUIRED' | 'GENERAL' | 'JUNIOR';

export interface StaffMember {
  employeeNumber: string; // 사번 (유니크, 낮을수록 고연차)
  name: string;
  group: StaffGroup;
  excludedShifts: ShiftType[];
}

export type StaffFormInput = StaffMember;
