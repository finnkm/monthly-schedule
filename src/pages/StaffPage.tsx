import { useState } from 'react';
import { toast } from 'sonner';
import { useStaffStore } from '@/store/staffStore';
import type { StaffFormInput, ShiftType, StaffGroup } from '@/types';
import { SHIFT_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const EXCLUDED_SHIFT_OPTIONS: ShiftType[] = ['Nur', 'Dur', 'B2'];
const GROUP_LABELS: Record<StaffGroup, string> = {
  A1_REQUIRED: 'A1 필수',
  GENERAL: '일반',
  JUNIOR: '신입',
};

const emptyForm: StaffFormInput = {
  employeeNumber: '',
  name: '',
  group: 'GENERAL',
  excludedShifts: [],
};

export function StaffPage() {
  const { staff, addStaff, updateStaff, deleteStaff } = useStaffStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<StaffFormInput>(emptyForm);
  const [empError, setEmpError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ employeeNumber: string; name: string } | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setEmpError('');
    setOpen(true);
  };

  const openEdit = (employeeNumber: string) => {
    const s = staff.find((m) => m.employeeNumber === employeeNumber);
    if (!s) return;
    setEditing(employeeNumber);
    setForm({
      employeeNumber: s.employeeNumber,
      name: s.name,
      group: s.group,
      excludedShifts: s.excludedShifts,
    });
    setEmpError('');
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.employeeNumber.trim()) {
      setEmpError('사번을 입력하세요.');
      return;
    }
    if (!form.name.trim()) return;

    if (editing) {
      const result = updateStaff(editing, form);
      if (!result.success) {
        setEmpError(result.error ?? '오류가 발생했습니다.');
        return;
      }
      toast.success('직원 정보가 수정됐습니다.');
    } else {
      const result = addStaff(form);
      if (!result.success) {
        setEmpError(result.error ?? '오류가 발생했습니다.');
        return;
      }
      toast.success('직원이 등록됐습니다.');
    }
    setOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteStaff(deleteTarget.employeeNumber);
    toast.success(`${deleteTarget.name} 직원이 삭제됐습니다.`);
    setDeleteTarget(null);
  };

  const toggleExcluded = (shift: ShiftType) => {
    setForm((prev) => {
      const next = prev.excludedShifts.includes(shift)
        ? prev.excludedShifts.filter((s) => s !== shift)
        : [...prev.excludedShifts, shift];
      // EXCLUDED_SHIFT_OPTIONS 순서로 고정 정렬
      return {
        ...prev,
        excludedShifts: EXCLUDED_SHIFT_OPTIONS.filter((s) => next.includes(s)),
      };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">직원 관리</h2>
        <Button onClick={openAdd}>직원 추가</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>사번</TableHead>
            <TableHead>이름</TableHead>
            <TableHead>그룹</TableHead>
            <TableHead>제외 근무</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((s) => (
            <TableRow key={s.employeeNumber}>
              <TableCell className="font-mono">{s.employeeNumber}</TableCell>
              <TableCell>{s.name}</TableCell>
              <TableCell>
                <Badge variant={s.group === 'A1_REQUIRED' ? 'default' : s.group === 'JUNIOR' ? 'outline' : 'secondary'}>
                  {GROUP_LABELS[s.group]}
                </Badge>
              </TableCell>
              <TableCell>
                {s.excludedShifts.length === 0
                  ? '-'
                  : EXCLUDED_SHIFT_OPTIONS.filter((sh) => s.excludedShifts.includes(sh))
                      .map((sh) => SHIFT_LABELS[sh])
                      .join(', ')}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(s.employeeNumber)}>
                  수정
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTarget({ employeeNumber: s.employeeNumber, name: s.name })}
                >
                  삭제
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {staff.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                등록된 직원이 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* 직원 등록/수정 다이얼로그 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '직원 수정' : '직원 추가'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>사번</Label>
              <Input
                value={form.employeeNumber}
                onChange={(e) => {
                  setForm((p) => ({ ...p, employeeNumber: e.target.value }));
                  setEmpError('');
                }}
                placeholder="예: 160431"
              />
              {empError && <p className="text-sm text-destructive">{empError}</p>}
            </div>
            <div className="space-y-1">
              <Label>이름</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="홍길동"
              />
            </div>
            <div className="space-y-1">
              <Label>그룹</Label>
              <Select
                value={form.group}
                onValueChange={(v) => setForm((p) => ({ ...p, group: v as StaffGroup }))}
              >
                <SelectTrigger>
                  <SelectValue>{GROUP_LABELS[form.group]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">일반</SelectItem>
                  <SelectItem value="A1_REQUIRED">A1 필수</SelectItem>
                  <SelectItem value="JUNIOR">신입</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>제외 근무</Label>
              {EXCLUDED_SHIFT_OPTIONS.map((shift) => (
                <div key={shift} className="flex items-center gap-2">
                  <Checkbox
                    id={`shift-${shift}`}
                    checked={form.excludedShifts.includes(shift)}
                    onCheckedChange={() => toggleExcluded(shift)}
                  />
                  <label htmlFor={`shift-${shift}`} className="text-sm cursor-pointer">
                    {SHIFT_LABELS[shift]}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button onClick={handleSubmit}>{editing ? '저장' : '추가'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 얼럿 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>직원을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{deleteTarget?.name}</span> ({deleteTarget?.employeeNumber}) 직원이 삭제됩니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
