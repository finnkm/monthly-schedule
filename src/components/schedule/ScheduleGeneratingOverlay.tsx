import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

// solve 진행 단계를 흉내내는 메시지 (실제 GLPK는 진행률을 주지 않으므로 순환 표시)
const STAGES = [
  '제약 조건을 분석하고 있어요',
  '가능한 근무 조합을 탐색하고 있어요',
  '최적의 배정을 찾고 있어요',
  '공평성과 휴식 균형을 맞추고 있어요',
  '근무표를 다듬고 있어요',
];

export function ScheduleGeneratingOverlay() {
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const s = window.setInterval(() => setStage((p) => (p + 1) % STAGES.length), 2600);
    const t = window.setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => {
      window.clearInterval(s);
      window.clearInterval(t);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center gap-8 px-10 py-12">
        {/* AI 코어 */}
        <div className="ai-float relative h-32 w-32">
          {/* 광원 글로우 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-cyan-400 opacity-60 blur-2xl animate-pulse" />
          {/* 회전 컬러 링 */}
          <div className="ai-core-ring absolute inset-0 rounded-full" />
          {/* 확산 링 */}
          <div className="absolute inset-0 rounded-full border border-fuchsia-400/30 animate-ping" />
          {/* 내부 디스크 + 아이콘 */}
          <div className="absolute inset-3 flex items-center justify-center rounded-full border border-white/10 bg-background/80 backdrop-blur">
            <Sparkles className="h-9 w-9 text-fuchsia-400 animate-pulse" />
          </div>
        </div>

        {/* 텍스트 */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h3 className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-lg font-semibold text-transparent">
            AI가 최적의 근무표를 계산하고 있어요
          </h3>
          <p
            key={stage}
            className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-500"
          >
            {STAGES[stage]}…
          </p>
        </div>

        {/* 인디터미닛 진행 바 (shimmer) */}
        <div className="relative h-1.5 w-64 overflow-hidden rounded-full bg-muted">
          <div className="ai-shimmer absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent" />
        </div>

        <p className="text-xs text-muted-foreground/70">
          {elapsed}초 경과 · 보통 20초 내외 걸려요
        </p>
      </div>
    </div>
  );
}
