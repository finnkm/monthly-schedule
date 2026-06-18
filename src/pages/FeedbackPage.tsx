import { useState } from 'react';
import { toast } from 'sonner';
import { Send, MessageSquare, Lightbulb, Bug, HelpCircle } from 'lucide-react';
import { useDiscordWebhook } from '@/hooks/use-discord-webhook';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FeedbackType = 'feature' | 'bug' | 'question' | 'other';

const CATEGORIES: { type: FeedbackType; label: string; icon: typeof Lightbulb; color: string }[] = [
  { type: 'feature', label: '기능 개선', icon: Lightbulb, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { type: 'bug', label: '버그 제보', icon: Bug, color: 'text-red-500 bg-red-50 border-red-200' },
  { type: 'question', label: '문의하기', icon: HelpCircle, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { type: 'other', label: '기타', icon: MessageSquare, color: 'text-gray-500 bg-gray-50 border-gray-200' },
];

const TYPE_EMOJI: Record<FeedbackType, string> = {
  feature: '💡',
  bug: '🐛',
  question: '❓',
  other: '💬',
};

const TYPE_LABEL: Record<FeedbackType, string> = {
  feature: '기능 개선 요청',
  bug: '버그 제보',
  question: '문의',
  other: '기타',
};

export function FeedbackPage() {
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { send } = useDiscordWebhook();

  const handleSubmit = async () => {
    if (!selectedType || !message.trim()) return;

    setIsSending(true);
    try {
      const content = [
        `${TYPE_EMOJI[selectedType]} **[${TYPE_LABEL[selectedType]}]**`,
        '',
        message.trim(),
        '',
        `---`,
        `📅 ${new Date().toLocaleString('ko-KR')}`,
      ].join('\n');

      await send({ content });
      setSent(true);
      toast.success('피드백이 전송되었습니다. 감사합니다!');
    } catch (e) {
      console.error(e);
      toast.error('전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setSent(false);
    setSelectedType(null);
    setMessage('');
  };

  if (sent) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Feedback"
          title="개발자 노트"
          description="더 나은 서비스를 위해 의견을 보내주세요."
        />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-3xl mb-4">
            ✅
          </div>
          <p className="text-lg font-bold text-foreground">전송 완료!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            소중한 의견 감사합니다. 빠르게 검토하겠습니다.
          </p>
          <Button variant="outline" className="mt-6" onClick={handleReset}>
            추가 의견 보내기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feedback"
        title="개발자 노트"
        description="더 나은 서비스를 위해 의견을 보내주세요. 기능 개선, 버그 제보, 문의 모두 환영합니다."
      />

      {/* 카테고리 선택 */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">어떤 내용인가요?</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map(({ type, label, icon: Icon, color }) => {
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                  isSelected
                    ? `${color} border-current ring-2 ring-current/20 scale-[1.02]`
                    : 'border-transparent bg-muted/40 hover:bg-muted hover:scale-[1.01]'
                )}
              >
                <Icon className={cn('h-5 w-5', isSelected ? '' : 'text-muted-foreground')} />
                <span className={cn('text-xs font-medium', isSelected ? '' : 'text-muted-foreground')}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 메시지 입력 */}
      <div>
        <p className={cn("text-sm font-medium mb-3", selectedType ? "text-foreground" : "text-muted-foreground")}>내용을 작성해주세요</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={!selectedType}
          placeholder={
            !selectedType
              ? '위에서 카테고리를 먼저 선택해주세요.'
              : selectedType === 'feature'
              ? '어떤 기능이 있으면 좋을까요? 자유롭게 작성해주세요.'
              : selectedType === 'bug'
              ? '어떤 문제가 발생했나요? 상황을 자세히 설명해주세요.'
              : selectedType === 'question'
              ? '궁금한 점이 있으시면 편하게 질문해주세요.'
              : '하고 싶은 말씀을 자유롭게 작성해주세요.'
          }
          className={cn(
            "w-full h-40 rounded-xl border px-4 py-3 text-sm resize-none transition-all",
            selectedType
              ? "bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              : "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60"
          )}
        />
        <p className="mt-1.5 text-[11px] text-muted-foreground text-right">
          {message.length} / 2,000
        </p>
      </div>

      {/* 전송 버튼 */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!selectedType || !message.trim() || isSending}
          className="px-6"
        >
          <Send className="h-4 w-4" />
          {isSending ? '전송 중...' : '의견 보내기'}
        </Button>
      </div>

      {/* 안내 */}
      <div className="rounded-xl bg-muted/30 border px-5 py-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          보내주신 의견은 개발자에게 즉시 전달됩니다.
          모든 피드백은 익명으로 처리되며, 서비스 개선에 반영됩니다.
        </p>
      </div>
    </div>
  );
}
