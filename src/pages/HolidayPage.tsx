import { useCalendarStore } from '@/store/calendarStore';
import { getDaysInMonth, getDay, startOfMonth, format } from 'date-fns';
import { X, Info } from 'lucide-react';
import { useHolidayStore } from '@/store/holidayStore';
import { PageHeader } from '@/components/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const YEARS = [2025, 2026, 2027];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_LABEL = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export function HolidayPage() {
  const { year, month, setYear, setMonth } = useCalendarStore();

  const { getHolidays, toggleHoliday, clearMonth } = useHolidayStore();
  const holidays = getHolidays(year, month);
  const holidaySet = new Set(holidays);

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDayOfWeek = getDay(startOfMonth(new Date(year, month - 1)));

  const dateStr = (d: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Holidays"
        title="공휴일 관리"
        description="이 달의 공휴일을 지정하세요. 스케줄 생성 시 자동으로 반영됩니다."
        actions={
          <>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}년</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={String(m)}>{m}월</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      {/* 달력 */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_LABELS.map((d, i) => (
            <div
              key={d}
              className={cn(
                'text-center text-xs font-medium h-9 flex items-center justify-center',
                i === 0 && 'text-red-500',
                i === 6 && 'text-blue-500'
              )}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="w-9 h-9" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const ds = dateStr(d);
            const dow = getDay(new Date(ds));
            const isHoliday = holidaySet.has(ds);
            const isWeekend = dow === 0 || dow === 6;
            return (
              <button
                key={d}
                onClick={() => toggleHoliday(year, month, ds)}
                className={cn(
                  'w-9 h-9 rounded text-sm flex items-center justify-center transition-colors font-medium',
                  isHoliday
                    ? 'bg-red-500 text-white'
                    : isWeekend
                    ? 'hover:bg-muted text-muted-foreground'
                    : 'hover:bg-muted'
                )}
              >
                {d}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          날짜를 클릭하면 공휴일로 지정/해제됩니다.
        </p>
      </div>

      {/* 지정된 공휴일 목록 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {year}년 {MONTH_LABEL[month - 1]} 공휴일{' '}
            <span className="text-muted-foreground font-normal">({holidays.length}일)</span>
          </p>
          {holidays.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-7"
              onClick={() => clearMonth(year, month)}
            >
              전체 해제
            </Button>
          )}
        </div>

        {holidays.length === 0 ? (
          <p className="text-sm text-muted-foreground">지정된 공휴일이 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {holidays.map((d) => {
              const dayNum = Number(d.slice(8));
              const dow = getDay(new Date(d));
              return (
                <Badge
                  key={d}
                  variant="secondary"
                  className="gap-1 pl-2.5 pr-1.5 py-1 text-sm cursor-pointer hover:bg-destructive/10"
                  onClick={() => toggleHoliday(year, month, d)}
                >
                  {dayNum}일 ({DAY_LABELS[dow]})
                  <X className="w-3 h-3" />
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* 안내 */}
      <div className="rounded-2xl border bg-muted/30 p-5">
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-sm font-semibold">공휴일 적용 방식</p>
        </div>
        <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground list-disc list-inside">
          <li>공휴일에 Dur · Nur 근무 시 평일 보상 휴일이 자동 지급됩니다.</li>
          <li>스케줄 생성 시 반영되므로 생성 전에 먼저 설정하세요.</li>
          <li>{format(new Date(year, month - 1, 1), 'M')}월 공휴일에는 Dur 인력이 우선 배정됩니다.</li>
        </ul>
      </div>
    </div>
  );
}
