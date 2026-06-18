import type {
  StaffMember,
  LeaveRequest,
  ScheduleConstraints,
  GenerationResult,
} from '@/types';
import type { SolveRequest } from './solveWorker';
import { generateMonthlySchedule } from './index';

type WorkerResponse =
  | { ok: true; result: GenerationResult }
  | { ok: false; error: string };

// Web Worker에서 스케줄을 생성한다 (UI 메인 스레드 블로킹 방지).
// Worker 실패 시 메인 스레드에서 직접 실행한다.
export function generateMonthlyScheduleInWorker(
  staff: StaffMember[],
  year: number,
  month: number,
  approvedLeaves: LeaveRequest[],
  publicHolidays: string[],
  constraints?: ScheduleConstraints,
): Promise<GenerationResult> {
  return new Promise<GenerationResult>((resolve, reject) => {
    let settled = false;
    const worker = new Worker(new URL('./solveWorker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      if (e.data.ok) resolve(e.data.result);
      else reject(new Error(e.data.error));
    };
    worker.onerror = (e) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      console.warn('Worker 실패, 메인 스레드에서 실행합니다:', e.message);
      resolve(
        generateMonthlySchedule(staff, year, month, approvedLeaves, publicHolidays, constraints)
      );
    };
    const req: SolveRequest = { staff, year, month, approvedLeaves, publicHolidays, constraints };
    worker.postMessage(req);
  });
}
