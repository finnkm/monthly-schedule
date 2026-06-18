import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';

const DISMISSED_KEY = 'feature-banner-data-v1';
const RESHOW_DELAY = 5 * 60 * 1000; // 5분

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISSED_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < RESHOW_DELAY;
}

export function FeatureBanner() {
  const [visible, setVisible] = useState(() => !isDismissed());

  if (!visible) return null;

  const handleClose = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[300px] rounded-[20px] border border-gray-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="relative p-5">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* NEW 뱃지 */}
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-blue-600 text-[10px] font-bold text-white uppercase tracking-wider">
            New
          </span>
          <span className="text-[12px] font-medium text-gray-500">
            새로운 기능이 출시됐어요
          </span>
        </div>

        <p className="mt-3 text-[14px] font-bold text-gray-900 leading-tight">
          데이터 백업 & 복원
        </p>
        <p className="mt-1 text-[12px] text-gray-500 leading-relaxed">
          다른 PC에서도 동일한 데이터로 작업할 수 있어요.
          <br />
          백업 파일로 내보내고, 언제든 불러오세요.
        </p>

        <Link
          to="/data"
          onClick={handleClose}
          className="mt-3.5 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          사용해보기
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
