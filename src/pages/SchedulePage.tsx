import { useState } from 'react';
import { toast } from 'sonner';
import { useCalendarStore } from '@/store/calendarStore';
import { useStaffStore } from '@/store/staffStore';
import { useOffRequestStore } from '@/store/offRequestStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { useHolidayStore } from '@/store/holidayStore';
import { generateMonthlySchedule } from '@/lib/scheduleGenerator';
import { DEFAULT_CONSTRAINTS } from '@/types';
import type { ValidationViolation } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScheduleTable } from '@/components/schedule/ScheduleTable';

const YEARS = [2025, 2026, 2027];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function SchedulePage() {
  const { year, month, setYear, setMonth } = useCalendarStore();
  const [violations, setViolations] = useState<ValidationViolation[]>([]);
  const [holidayBonuses, setHolidayBonuses] = useState<Record<string, number>>({});

  // OFF 미설정 직원 목록 — 비어있지 않으면 경고 다이얼로그 표시
  const [offMissingStaff, setOffMissingStaff] = useState<string[]>([]);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const { staff } = useStaffStore();
  const { getMonthRequests, approveMonthRequests } = useOffRequestStore();
  const { saveSchedule, getSchedule, deleteSchedule } = useScheduleStore();
  const { getHolidays } = useHolidayStore();

  const schedule = getSchedule(year, month);
  const activeStaff = staff;

  const handleGenerate = () => {
    if (activeStaff.length === 0) {
      toast.error('등록된 직원이 없습니다.');
      return;
    }

    // 아무도 OFF를 신청하지 않은 경우 생성 차단
    const monthRequests = getMonthRequests(year, month);
    if (monthRequests.length === 0) {
      setOffMissingStaff(['none']);
      return;
    }

    doGenerate();
  };

  const doGenerate = () => {
    approveMonthRequests(year, month);
    const approvedLeaves = getMonthRequests(year, month);
    const result = generateMonthlySchedule(
      activeStaff,
      year,
      month,
      approvedLeaves,
      getHolidays(year, month),
      DEFAULT_CONSTRAINTS
    );
    saveSchedule(result.schedule);
    setViolations(result.violations);
    setHolidayBonuses(result.holidayBonuses);

    const bonusCount = Object.keys(result.holidayBonuses).length;
    if (result.violations.length > 0) {
      toast.warning(`스케줄 생성 완료 — 제약 위반 ${result.violations.length}건`);
    } else if (bonusCount > 0) {
      toast.success(`스케줄 생성 완료 — 보상 휴일 ${bonusCount}명 적용`);
    } else {
      toast.success('스케줄 생성 완료');
    }
  };

  const handleReset = () => {
    deleteSchedule(year, month);
    setViolations([]);
    setHolidayBonuses({});
    setShowResetDialog(false);
    toast.success(`${year}년 ${month}월 스케줄이 초기화되었습니다.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">근무 스케줄</h2>
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
        {schedule ? (
          <Button variant="outline" onClick={() => setShowResetDialog(true)}>
            초기화
          </Button>
        ) : (
          <Button onClick={handleGenerate}>스케줄 생성</Button>
        )}
      </div>

      {violations.length > 0 && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 text-sm">
          <div className="px-4 py-3 border-b border-yellow-200">
            <p className="font-semibold text-yellow-800">
              제약 조건 위반 {violations.length}건
            </p>
            <p className="text-yellow-600 text-xs mt-0.5">
              스케줄 생성 시 충족되지 않은 조건 목록입니다.
            </p>
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-yellow-100">
            {violations.map((v, i) => {
              const staffName = v.employeeNumber
                ? (activeStaff.find((s) => s.employeeNumber === v.employeeNumber)?.name ?? v.employeeNumber)
                : null;
              const dateLabel = v.date
                ? `${v.date.slice(5).replace('-', '/')} (${['일','월','화','수','목','금','토'][new Date(v.date).getDay()]})`
                : null;
              return (
                <div key={i} className="px-4 py-2.5 flex gap-3 items-start">
                  <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-yellow-200 text-yellow-800 text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-yellow-800 font-medium text-xs">{v.rule}</p>
                    <p className="text-yellow-600 text-[11px]">
                      {[dateLabel, staffName && `담당: ${staffName}`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {schedule ? (
        <ScheduleTable
          schedule={schedule}
          staff={activeStaff}
          violations={violations}
          holidayBonuses={holidayBonuses}
        />
      ) : (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          "스케줄 생성" 버튼을 눌러 {year}년 {month}월 스케줄을 생성하세요.
        </div>
      )}

      {/* OFF 미설정 직원 경고 */}
      <AlertDialog
        open={offMissingStaff.length > 0}
        onOpenChange={(open) => { if (!open) setOffMissingStaff([]); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>OFF 신청이 없습니다</AlertDialogTitle>
            <AlertDialogDescription>
              {year}년 {month}월에 OFF를 신청한 직원이 한 명도 없습니다.
              OFF 신청 페이지에서 먼저 직원들의 OFF를 설정해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setOffMissingStaff([])}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 스케줄 초기화 확인 */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>스케줄 초기화</AlertDialogTitle>
            <AlertDialogDescription>
              {year}년 {month}월 스케줄을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>초기화</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
