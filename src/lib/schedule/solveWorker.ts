/// <reference lib="webworker" />
// glpk.js의 solve는 동기 연산이라 메인 스레드를 수십 초 블로킹한다.
// 이 워커에서 돌려 UI(로딩 애니메이션)가 멈추지 않도록 한다.
import { generateMonthlySchedule } from './index';
import type { StaffMember, LeaveRequest, ScheduleConstraints } from '@/types';

export interface SolveRequest {
  staff: StaffMember[];
  year: number;
  month: number;
  approvedLeaves: LeaveRequest[];
  publicHolidays: string[];
  constraints?: ScheduleConstraints;
}

self.onmessage = async (e: MessageEvent<SolveRequest>) => {
  const { staff, year, month, approvedLeaves, publicHolidays, constraints } = e.data;
  try {
    const result = await generateMonthlySchedule(
      staff,
      year,
      month,
      approvedLeaves,
      publicHolidays,
      constraints,
    );
    self.postMessage({ ok: true, result });
  } catch (err) {
    self.postMessage({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
