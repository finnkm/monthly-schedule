import type { DayOfWeek } from '@/types';

// 주말·공휴일 Dur를 피해야 하는 직원.
// 일요일 = hard 금지(절대 미배정), 그 외 주말·공휴일 = soft 페널티(최후수단 가능).
export const WEEKEND_HOLIDAY_DUR_EXEMPT = new Set<string>(['230010']);

// 화요일(평일)에 반드시 A1을 배정해야 하는 직원.
export const TUESDAY_A1_FIXED = new Set<string>(['160432']);

export const isDurExemptHard = (
  emp: string,
  ctx: { dayOfWeek: DayOfWeek },
): boolean => ctx.dayOfWeek === 'Sun' && WEEKEND_HOLIDAY_DUR_EXEMPT.has(emp);

export const isDurExemptSoft = (
  emp: string,
  ctx: { isWeekend: boolean; isHoliday: boolean },
): boolean => (ctx.isWeekend || ctx.isHoliday) && WEEKEND_HOLIDAY_DUR_EXEMPT.has(emp);

// 목적함수 가중치(튜닝 상수). 큰 값일수록 강하게 회피.
export const WEIGHTS = {
  cover: 100000,     // 일별 정원(커버리지) 미충족 — 기존 "위반"에 해당
  a1req: 50000,      // A1_REQUIRED 평일 최소 1명 미충족
  exemptSoft: 10000, // 230010 주말·공휴일 Dur (기존 +9999)
  offExcess: 500,    // 휴식 등가일이 쿼터 초과 — 재량 OFF 억제
  offShort: 500,     // 휴식 등가일이 쿼터 미달 — 보상휴일(주말·공휴일 Dur/Nur 근무분) 지급 유도
  b2Fair: 300,       // 토요일 B2 부하 편차 — 0회 받는 사람 방지(일반 공평보다 강하게)
  b2Fill: 200,       // 인원 여유 시 토요일 B2를 saturdayMax(4)까지 채우도록 유도
  fair: 100,         // Nur/Dur 부하 편차
} as const;
