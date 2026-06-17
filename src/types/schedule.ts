export type ShiftType = 'Dur' | 'Nur' | 'A1' | 'B2' | 'OFF';

export const SHIFT_LABELS: Record<ShiftType, string> = {
  Dur: '낮당직',
  Nur: '밤당직',
  A1: '상근직',
  B2: '토요직',
  OFF: '휴일',
};
