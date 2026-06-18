import { describe, it, expect } from 'vitest';
import { isDurExemptHard, isDurExemptSoft, WEEKEND_HOLIDAY_DUR_EXEMPT, WEIGHTS } from './policy';

describe('policy', () => {
  it('230010은 일요일 Dur hard 제외', () => {
    expect(isDurExemptHard('230010', { dayOfWeek: 'Sun' })).toBe(true);
    expect(isDurExemptHard('230010', { dayOfWeek: 'Sat' })).toBe(false);
    expect(isDurExemptHard('999999', { dayOfWeek: 'Sun' })).toBe(false);
  });

  it('230010은 주말·공휴일 Dur soft 회피', () => {
    expect(isDurExemptSoft('230010', { isWeekend: true, isHoliday: false })).toBe(true);
    expect(isDurExemptSoft('230010', { isWeekend: false, isHoliday: true })).toBe(true);
    expect(isDurExemptSoft('230010', { isWeekend: false, isHoliday: false })).toBe(false);
  });

  it('가중치는 커버리지 ≫ A1필수 ≫ exempt ≫ OFF편차 ≫ 공평 순', () => {
    expect(WEIGHTS.cover).toBeGreaterThan(WEIGHTS.a1req);
    expect(WEIGHTS.a1req).toBeGreaterThan(WEIGHTS.exemptSoft);
    expect(WEIGHTS.exemptSoft).toBeGreaterThan(WEIGHTS.offExcess);
    expect(WEIGHTS.exemptSoft).toBeGreaterThan(WEIGHTS.offShort);
    expect(WEIGHTS.offExcess).toBeGreaterThan(WEIGHTS.b2Fair);
    expect(WEIGHTS.b2Fair).toBeGreaterThan(WEIGHTS.b2Fill);
    expect(WEIGHTS.b2Fill).toBeGreaterThan(WEIGHTS.fair);
    expect(WEEKEND_HOLIDAY_DUR_EXEMPT.has('230010')).toBe(true);
  });
});
