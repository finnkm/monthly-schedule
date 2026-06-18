import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { PageHeader } from '@/components/PageHeader';

const STORE_KEYS = [
  'staff-store',
  'schedule-store',
  'off-request-store',
  'holiday-store',
  'calendar-store',
] as const;

interface BackupData {
  version: 1;
  exportedAt: string;
  stores: Record<string, unknown>;
}

function exportAllData(): BackupData {
  const stores: Record<string, unknown> = {};
  for (const key of STORE_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        stores[key] = JSON.parse(raw);
      } catch {
        stores[key] = raw;
      }
    }
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    stores,
  };
}

function downloadJson(data: BackupData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  link.download = `schedule-backup-${date}.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

function validateBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return d.version === 1 && typeof d.stores === 'object' && d.stores !== null;
}

export function DataPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null);

  const handleExport = () => {
    const data = exportAllData();
    downloadJson(data);
    toast.success('백업 파일이 다운로드되었습니다.');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!validateBackup(parsed)) {
          toast.error('올바른 백업 파일이 아닙니다.');
          return;
        }
        setPendingImport(parsed);
      } catch {
        toast.error('파일을 읽을 수 없습니다. JSON 형식을 확인해주세요.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportConfirm = () => {
    if (!pendingImport) return;

    for (const [key, value] of Object.entries(pendingImport.stores)) {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }

    setPendingImport(null);
    toast.success('데이터를 복원했습니다. 페이지를 새로고침합니다.');
    setTimeout(() => window.location.reload(), 800);
  };

  const storeLabels: Record<string, string> = {
    'staff-store': '직원 정보',
    'schedule-store': '근무 스케줄',
    'off-request-store': 'OFF 신청',
    'holiday-store': '공휴일',
    'calendar-store': '캘린더 설정',
  };

  const currentData = exportAllData();
  const storeCount = Object.keys(currentData.stores).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data"
        title="데이터 관리"
        description="다른 PC에서 사용하기 위해 데이터를 내보내거나, 백업 파일을 불러올 수 있습니다."
      />

      {/* 내보내기 섹션 */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">데이터 내보내기</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              현재 저장된 모든 데이터를 JSON 파일로 다운로드합니다.
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
          <p className="font-medium text-muted-foreground">포함되는 데이터 ({storeCount}개 항목)</p>
          <ul className="grid grid-cols-2 gap-1 text-muted-foreground">
            {STORE_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${currentData.stores[key] ? 'bg-green-500' : 'bg-gray-300'}`} />
                {storeLabels[key]}
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={handleExport}>
          <Download className="h-4 w-4" />
          백업 파일 다운로드
        </Button>
      </div>

      {/* 불러오기 섹션 */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">데이터 불러오기</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              다른 PC에서 내보낸 백업 파일을 업로드하여 데이터를 복원합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>불러오기를 실행하면 현재 데이터가 덮어씌워집니다.</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          백업 파일 선택
        </Button>
      </div>

      {/* 불러오기 확인 다이얼로그 */}
      <AlertDialog open={!!pendingImport} onOpenChange={(open) => { if (!open) setPendingImport(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>데이터를 복원하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block space-y-2">
                <span className="block">
                  백업 시점: {pendingImport?.exportedAt
                    ? new Date(pendingImport.exportedAt).toLocaleString('ko-KR')
                    : '-'}
                </span>
                <span className="block">
                  포함된 데이터: {pendingImport ? Object.keys(pendingImport.stores).map(k => storeLabels[k] || k).join(', ') : ''}
                </span>
                <span className="block text-destructive font-medium">
                  현재 저장된 데이터가 모두 덮어씌워집니다.
                </span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm}>복원하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
