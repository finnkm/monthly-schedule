import { toPng } from 'html-to-image';
import * as XLSX from 'xlsx';
import type { MonthlySchedule, StaffMember, ShiftType } from '@/types';

const DAY_KO: Record<string, string> = {
  Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일',
};

export async function exportAsImage(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const scrollChild = element.querySelector('.schedule-scroll') as HTMLElement | null;
  const target = scrollChild ?? element;

  const origStyles = {
    overflow: target.style.overflow,
    width: target.style.width,
    maxWidth: target.style.maxWidth,
    parentWidth: element.style.width,
    parentOverflow: element.style.overflow,
  };

  // 커스텀 스크롤바 숨기기
  const scrollbar = element.querySelector('[data-scrollbar]') as HTMLElement | null;
  if (scrollbar) scrollbar.style.display = 'none';

  // 모든 클리핑을 해제하고 전체 테이블 너비로 확장
  const fullWidth = target.scrollWidth;
  target.style.overflow = 'visible';
  target.style.width = `${fullWidth}px`;
  target.style.maxWidth = 'none';
  element.style.width = `${fullWidth}px`;
  element.style.overflow = 'visible';

  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#ffffff',
      pixelRatio: 1,
      width: fullWidth,
      height: element.scrollHeight,
    });
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } finally {
    target.style.overflow = origStyles.overflow;
    target.style.width = origStyles.width;
    target.style.maxWidth = origStyles.maxWidth;
    element.style.width = origStyles.parentWidth;
    element.style.overflow = origStyles.parentOverflow;
    if (scrollbar) scrollbar.style.display = '';
  }
}

export function exportAsExcel(
  schedule: MonthlySchedule,
  staff: StaffMember[],
  holidayBonuses: Record<string, number>,
): void {
  const { year, month, days } = schedule;

  const countShifts = (empNum: string, type: ShiftType) =>
    days.reduce((acc, d) => {
      const a = d.assignments.find((a) => a.employeeNumber === empNum);
      return acc + (a?.shiftType === type ? 1 : 0);
    }, 0);

  const header = [
    '이름',
    '사번',
    ...days.map((d) => {
      const dd = d.date.slice(8);
      return `${dd}(${DAY_KO[d.dayOfWeek]})`;
    }),
    'Dur',
    'Nur',
    'OFF',
    'B2',
    '보상휴일',
  ];

  const rows = staff.map((s) => [
    s.name,
    s.employeeNumber,
    ...days.map((d) => {
      const a = d.assignments.find((a) => a.employeeNumber === s.employeeNumber);
      return a?.shiftType ?? 'OFF';
    }),
    countShifts(s.employeeNumber, 'Dur'),
    countShifts(s.employeeNumber, 'Nur'),
    countShifts(s.employeeNumber, 'OFF'),
    countShifts(s.employeeNumber, 'B2'),
    holidayBonuses[s.employeeNumber] ?? 0,
  ]);

  const summaryShifts: ShiftType[] = ['Dur', 'Nur', 'A1', 'B2'];
  const summaryRows = summaryShifts.map((type) => [
    `[합계] ${type}`,
    '',
    ...days.map((d) => d.assignments.filter((a) => a.shiftType === type).length),
    '', '', '', '', '',
  ]);

  const data = [header, ...rows, [], ...summaryRows];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // 열 너비 설정
  ws['!cols'] = [
    { wch: 8 },
    { wch: 6 },
    ...days.map(() => ({ wch: 5 })),
    { wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 6 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${month}월 스케줄`);
  XLSX.writeFile(wb, `스케줄_${year}년_${month}월.xlsx`);
}
