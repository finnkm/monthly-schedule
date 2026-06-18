import { describe, it, expect } from 'vitest';
import { buildCalendar } from './calendar';

describe('buildCalendar', () => {
  it('완전한 주(월~일)를 포함하도록 범위를 확장한다', () => {
    // 2026-06-01은 월요일, 2026-06-30은 화요일
    const cal = buildCalendar(2026, 6, []);
    expect(cal.days[0].date).toBe('2026-06-01'); // 월요일 시작
    expect(cal.days[0].dayOfWeek).toBe('Mon');
    expect(cal.days[cal.days.length - 1].dayOfWeek).toBe('Sun'); // 일요일 종료
    expect(cal.days.length % 7).toBe(0);
  });

  it('주는 7일 단위로 그룹핑되고 첫날은 월요일', () => {
    const cal = buildCalendar(2026, 6, []);
    expect(cal.weeks.every((w) => w.length === 7)).toBe(true);
    expect(cal.weeks[0][0].dayOfWeek).toBe('Mon');
  });

  it('공휴일·주말·월외 플래그와 byDate 조회', () => {
    const cal = buildCalendar(2026, 6, ['2026-06-06']); // 현충일(토)
    const d = cal.byDate.get('2026-06-06')!;
    expect(d.isHoliday).toBe(true);
    expect(d.isWeekend).toBe(true);
    expect(d.isWeekdayWork).toBe(false);
    expect(d.isSaturday).toBe(false); // 공휴일이면 isSaturday=false
    const weekday = cal.byDate.get('2026-06-02')!;
    expect(weekday.isWeekdayWork).toBe(true);
    expect(weekday.prev).toBe('2026-06-01');
    expect(weekday.next).toBe('2026-06-03');
  });
});
