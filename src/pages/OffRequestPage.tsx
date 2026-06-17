import { useState } from 'react';
import { getDaysInMonth, getDay, startOfMonth } from 'date-fns';
import { useCalendarStore } from '@/store/calendarStore';
import { useStaffStore } from '@/store/staffStore';
import { useOffRequestStore } from '@/store/offRequestStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const YEARS = [2025, 2026, 2027];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function OffRequestPage() {
  const { year, month, setYear, setMonth } = useCalendarStore();
  const { staff } = useStaffStore();
  const { toggleRequest, getMonthRequests } = useOffRequestStore();

  const [modalEmpNum, setModalEmpNum] = useState<string | null>(null);

  const activeStaff = staff;
  const monthRequests = getMonthRequests(year, month);

  const selectedStaff = activeStaff.find((s) => s.employeeNumber === modalEmpNum);
  const selectedDates = new Set(
    monthRequests
      .filter((r) => r.employeeNumber === modalEmpNum)
      .map((r) => r.date)
  );

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDayOfWeek = getDay(startOfMonth(new Date(year, month - 1)));

  const dateStr = (d: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">OFF 신청</h2>

      {/* 연도/월 선택 */}
      <div className="flex gap-3">
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
      </div>

      {/* 직원 목록 테이블 — row 클릭으로 모달 오픈 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>사번</TableHead>
            <TableHead>이름</TableHead>
            <TableHead>신청 날짜</TableHead>
            <TableHead>신청 수</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeStaff.map((s) => {
            const reqs = monthRequests
              .filter((r) => r.employeeNumber === s.employeeNumber)
              .sort((a, b) => a.date.localeCompare(b.date));
            return (
              <TableRow
                key={s.employeeNumber}
                className="cursor-pointer hover:bg-muted/60"
                onClick={() => setModalEmpNum(s.employeeNumber)}
              >
                <TableCell className="font-mono">{s.employeeNumber}</TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {reqs.map((r) => (
                      <Badge key={r.id} variant="secondary" className="text-xs">
                        {r.date.slice(8)}일
                      </Badge>
                    ))}
                    {reqs.length === 0 && (
                      <span className="text-muted-foreground text-xs">없음</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{reqs.length}</TableCell>
              </TableRow>
            );
          })}
          {activeStaff.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                등록된 직원이 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* OFF 신청 달력 모달 */}
      <Dialog open={!!modalEmpNum} onOpenChange={(open) => !open && setModalEmpNum(null)}>
        <DialogContent className="w-fit">
          <DialogHeader>
            <DialogTitle>
              {selectedStaff?.name} — {year}년 {month}월 OFF 신청
            </DialogTitle>
          </DialogHeader>

          <div className="pt-2">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_LABELS.map((d, i) => (
                <div
                  key={d}
                  className={cn(
                    'text-center text-xs font-medium w-9 h-9 flex items-center justify-center',
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
                const isSelected = selectedDates.has(ds);
                const dow = getDay(new Date(ds));
                return (
                  <button
                    key={d}
                    onClick={() => modalEmpNum && toggleRequest(modalEmpNum, ds)}
                    className={cn(
                      'w-9 h-9 rounded text-sm flex items-center justify-center transition-colors',
                      isSelected
                        ? 'bg-green-500 text-white font-medium'
                        : 'hover:bg-muted',
                      dow === 0 && !isSelected && 'text-red-400',
                      dow === 6 && !isSelected && 'text-blue-400'
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              신청 {selectedDates.size}일
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
