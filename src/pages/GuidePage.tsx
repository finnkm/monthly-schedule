import { BookOpen, Users, CalendarOff, Star, Calendar, Database, ChevronRight, Cpu, Scale, Layers, Shield, BarChart2, Award, ChevronDown, UserCheck, User, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface StepProps {
  number: number;
  text: string;
}

function Step({ number, text }: StepProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary mt-0.5">
        {number}
      </span>
      <span className="text-sm text-muted-foreground leading-relaxed">{text}</span>
    </div>
  );
}

interface SectionCardProps {
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
  steps: string[];
  tip?: string;
}

function SectionCard({ icon, badge, title, description, steps, tip }: SectionCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
          {icon}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] font-medium">{badge}</Badge>
          </div>
          <h3 className="text-base font-semibold leading-tight">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        {steps.map((step, i) => (
          <Step key={i} number={i + 1} text={step} />
        ))}
      </div>
      {tip && (
        <div className="rounded-xl bg-muted/50 px-4 py-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Tip.</span> {tip}
          </p>
        </div>
      )}
    </div>
  );
}

export function GuidePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">

      {/* Hero */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>사용 가이드</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">어떻게 사용하나요?</h1>
        <p className="text-muted-foreground leading-relaxed">
          근무 스케줄표는 직원 등록부터 월간 스케줄 자동 생성까지, 복잡한 근무 계획을 간단하게 관리할 수 있도록 설계되었습니다.
        </p>
      </div>

      {/* Data storage notice */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 flex gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <Database className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-900">모든 데이터는 이 브라우저에 저장돼요</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            직원 정보, OFF 신청, 공휴일 설정, 생성된 스케줄 — 모든 내용은 서버 없이 브라우저 로컬 스토리지에 저장됩니다.
            같은 기기·브라우저라면 새로고침해도 데이터가 유지되고, 다른 기기에서는 데이터를 공유할 수 없습니다.
          </p>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: <Users className="h-4 w-4" />, label: '직원 관리' },
          { icon: <CalendarOff className="h-4 w-4" />, label: 'OFF 신청' },
          { icon: <Star className="h-4 w-4" />, label: '공휴일 관리' },
          { icon: <Calendar className="h-4 w-4" />, label: '스케줄 생성' },
        ].map(({ icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5 text-sm font-medium text-muted-foreground"
          >
            {icon}
            <span className="text-xs">{label}</span>
            <ChevronRight className="h-3 w-3 ml-auto opacity-40" />
          </div>
        ))}
      </div>

      <Separator />

      {/* Section cards */}
      <div className="space-y-4">

        <SectionCard
          icon={<Users className="h-5 w-5" />}
          badge="STEP 1"
          title="직원 먼저 등록하세요"
          description="스케줄 생성을 위해 근무 중인 직원 정보를 먼저 입력해야 합니다. 이름, 사번, 근무 그룹, 제외 근무 유형을 설정할 수 있어요."
          steps={[
            '사이드바에서 직원 관리 메뉴로 이동하세요.',
            '우측 상단 직원 추가 버튼을 눌러 이름, 사번, 그룹을 입력하세요.',
            '특정 근무 유형(Dur, Nur 등)을 배정받으면 안 되는 직원은 제외 근무를 체크하세요.',
            '등록된 직원은 언제든 수정·삭제할 수 있습니다.',
          ]}
          tip="A1_REQUIRED 그룹은 A1 근무가 반드시 필요한 직원입니다. 스케줄 생성 시 해당 직원이 A1 공백이 생기지 않도록 자동으로 조정됩니다."
        />

        <SectionCard
          icon={<CalendarOff className="h-5 w-5" />}
          badge="STEP 2"
          title="직원이 요청한 OFF를 등록하세요"
          description="직원이 미리 요청한 휴가 날짜를 등록합니다. 승인된 OFF는 스케줄 생성 시 해당 날짜에 우선적으로 반영됩니다."
          steps={[
            'OFF 신청 메뉴로 이동하세요.',
            '직원을 선택하고 OFF를 원하는 날짜를 선택하세요.',
            '신청 추가를 누르면 목록에 등록됩니다.',
            '취소가 필요할 경우 목록에서 삭제할 수 있습니다.',
          ]}
          tip="승인된 OFF는 스케줄 표에서 진한 초록색으로 표시되어 자동 배정된 OFF와 구분됩니다."
        />

        <SectionCard
          icon={<Star className="h-5 w-5" />}
          badge="STEP 3"
          title="공휴일을 설정하세요"
          description="한국 공휴일은 연도마다 날짜가 달라지기 때문에 직접 지정해야 합니다. 공휴일로 지정된 날에 근무한 직원에게는 보상 휴일이 부여됩니다."
          steps={[
            '공휴일 관리 메뉴로 이동하세요.',
            '월을 선택하고 캘린더에서 공휴일 날짜를 클릭하세요.',
            '클릭한 날짜가 공휴일로 지정되며, 다시 클릭하면 해제됩니다.',
            '스케줄 생성 전에 해당 월의 공휴일을 모두 등록해두세요.',
          ]}
          tip="공휴일에 Dur 또는 Nur 근무를 한 직원은 스케줄 생성 후 보상 휴일 열에 카운트가 표시됩니다."
        />

        <SectionCard
          icon={<Calendar className="h-5 w-5" />}
          badge="STEP 4"
          title="스케줄을 자동으로 생성하세요"
          description="직원 정보, OFF 신청, 공휴일 설정이 완료되면 월간 스케줄을 자동 생성할 수 있습니다. 각종 제약 조건을 고려해 최적의 배정을 만들어냅니다."
          steps={[
            '스케줄 메뉴에서 원하는 연도와 월을 선택하세요.',
            '생성 버튼을 눌러 스케줄을 자동 생성하세요.',
            '표에서 직원별·날짜별 근무 배정을 확인하세요.',
            '빨간 테두리 셀은 제약 위반이 감지된 항목입니다. 마우스를 올리면 사유를 확인할 수 있어요.',
          ]}
          tip="비신청 평일 OFF는 해당 주의 주말·공휴일 수를 초과할 수 없습니다. 초과분은 자동으로 A1 근무로 변환됩니다."
        />

      </div>

      {/* ── 스케줄 알고리즘 ── */}
      <div className="space-y-4">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-blue-500/10" />
          <div className="pointer-events-none absolute right-6 bottom-4 h-24 w-24 rounded-full bg-violet-500/10" />
          <div className="pointer-events-none absolute right-20 top-6 h-10 w-10 rounded-full bg-cyan-400/10" />
          <div className="relative space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                <Cpu className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-[10px] font-semibold tracking-widest text-blue-400 uppercase">AI Algorithm</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">스케줄은 어떻게 만들어지나요?</h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              단순한 무작위 배정이 아닙니다. 수십 가지 제약 조건을 동시에 고려하는
              AI 기반 최적화 알고리즘이 모든 직원에게 공평하고 합리적인 근무를 배분합니다.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['공정 분배', '우선순위 최적화', '제약 조건 검증', '자동 보정'].map((tag) => (
                <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 3 pillars */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Scale className="h-4 w-4" />, bg: 'bg-emerald-50 text-emerald-600', title: '공정 분배', desc: '모든 직원이 비슷한 빈도로 당직을 받도록 지속적으로 조정합니다' },
            { icon: <Layers className="h-4 w-4" />, bg: 'bg-blue-50 text-blue-600', title: '우선순위', desc: '7단계 배정 순서로 충돌 없이 최적 조합을 탐색합니다' },
            { icon: <Shield className="h-4 w-4" />, bg: 'bg-violet-50 text-violet-600', title: '규칙 준수', desc: '연속근무·당직 간격·그룹 조건을 자동으로 검증합니다' },
          ].map(({ icon, bg, title, desc }) => (
            <div key={title} className="rounded-2xl border bg-card p-4 space-y-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>{icon}</div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Priority flow */}
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold">배정 우선순위</h3>
            <p className="text-xs text-muted-foreground mt-0.5">매일 이 순서대로 배정이 확정됩니다. 위에 있을수록 먼저 처리됩니다.</p>
          </div>
          <div className="space-y-1">
            {[
              { step: '01', emoji: '🗓️', bg: 'border-violet-200 bg-violet-50', tc: 'text-violet-800', title: 'Nur 블록 사전 계획', desc: '한 달치 밤당직을 2~3일 블록 단위로 미리 균등 배분 · 1인당 최소 1회 보장' },
              { step: '02', emoji: '✅', bg: 'border-emerald-200 bg-emerald-50', tc: 'text-emerald-800', title: '신청 OFF 우선 확정', desc: '직원이 요청한 휴가를 가장 먼저 고정 — 어떠한 조건도 덮어쓰지 않음' },
              { step: '03', emoji: '😴', bg: 'border-yellow-200 bg-yellow-50', tc: 'text-yellow-900', title: 'Nur 이후 휴식 보장', desc: '밤당직 종료 다음 날은 무조건 OFF — 야간 연속 근무 방지' },
              { step: '04', emoji: '⏱️', bg: 'border-orange-200 bg-orange-50', tc: 'text-orange-800', title: '연속 근무 한도', desc: '6일 연속 근무 시 다음 날 자동 OFF 배정 · 주간 최대 5일 근무 제한' },
              { step: '05', emoji: '⚡', bg: 'border-red-200 bg-red-50', tc: 'text-red-800', title: 'Dur 공정 배분', desc: '주간 편중 방지 스코어로 가장 적게 받은 사람 우선 · 주간 최대 2회 제한' },
              { step: '06', emoji: '🏢', bg: 'border-blue-200 bg-blue-50', tc: 'text-blue-800', title: 'A1 상근 배정', desc: '나머지 인원을 A1 배정 · 고연차·저연차 교대 배치로 경험 균형 유지' },
              { step: '07', emoji: '🎁', bg: 'border-teal-200 bg-teal-50', tc: 'text-teal-800', title: '보상 휴일 자동 부여', desc: '주말·공휴일 Dur·Nur 근무자에게 평일 A1을 청록색 보상 휴일로 자동 전환' },
            ].map(({ step, emoji, bg, tc, title, desc }, i, arr) => (
              <div key={step}>
                <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${bg}`}>
                  <span className="text-lg leading-none mt-0.5 select-none">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold font-mono opacity-40 ${tc}`}>{step}</span>
                      <span className={`text-sm font-semibold ${tc}`}>{title}</span>
                    </div>
                    <p className={`text-xs leading-relaxed mt-0.5 opacity-70 ${tc}`}>{desc}</p>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ChevronDown className="h-3 w-3 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fairness detail */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <BarChart2 className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">Dur 공정 점수</span>
            </div>
            <div className="rounded-xl bg-muted/50 p-4 text-center space-y-1">
              <p className="text-[11px] text-muted-foreground">점수 낮은 순서로 우선 배정</p>
              <p className="font-mono font-bold text-foreground text-sm leading-relaxed">
                주간 횟수 × 100<br />
                <span className="text-muted-foreground text-xs font-normal">+  누적 총 횟수</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              이번 주에 한 번도 Dur가 없는 사람이 여러 번 한 사람보다 항상 먼저 배정됩니다.
              주간 편중 방지에 100배 높은 가중치를 부여합니다.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
                <Award className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">Nur 최소 보장</span>
            </div>
            <div className="rounded-xl bg-muted/50 p-4 text-center space-y-0.5">
              <p className="text-3xl font-bold text-foreground">최소 1회</p>
              <p className="text-[11px] text-muted-foreground">Nur 미제외 직원 전원 보장</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              초기 배분 후 0회인 직원이 있으면 가장 많이 받은 사람의 블록을
              재배정하여 균등성을 자동으로 보정합니다.
            </p>
          </div>
        </div>

        {/* Constraints chips */}
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <h3 className="text-base font-semibold">주요 제약 조건</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '연속 근무 최대 6일', color: 'bg-orange-50 text-orange-700 border-orange-200' },
              { label: '주간 근무 최대 5일', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Dur 주간 최대 2회', color: 'bg-red-50 text-red-700 border-red-200' },
              { label: 'Nur 2~3일 블록 구성', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
              { label: 'Nur 종료 후 1일 필수 휴식', color: 'bg-purple-50 text-purple-700 border-purple-200' },
              { label: 'OFF 쿼터 = 주말 + 공휴일 수', color: 'bg-green-50 text-green-700 border-green-200' },
              { label: '신청 OFF 최우선 보호', color: 'bg-teal-50 text-teal-700 border-teal-200' },
              { label: 'A1 최소 인원 유지', color: 'bg-slate-50 text-slate-700 border-slate-200' },
            ].map(({ label, color }) => (
              <span key={label} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${color}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* ── 그룹별 근무 규칙 ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">그룹별 근무 규칙</h2>
          <p className="text-sm text-muted-foreground mt-1">
            직원 그룹에 따라 스케줄 배정 방식이 달라집니다. 그룹은 직원 등록 시 지정합니다.
          </p>
        </div>

        <div className="space-y-3">

          {/* A1 필수 */}
          <div className="rounded-2xl border border-slate-200 bg-card overflow-hidden">
            <div className="flex items-center gap-3 bg-slate-900 px-5 py-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <UserCheck className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">A1 필수</span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-slate-300">A1_REQUIRED</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">매 평일 이 그룹에서 최소 1명은 반드시 A1에 배정됩니다</p>
              </div>
            </div>
            <div className="p-5 space-y-2">
              {[
                { icon: '🛡️', text: '평일마다 A1_REQUIRED 그룹 중 최소 1명 A1 배정 — A1 공백 발생 불가' },
                { icon: '🔄', text: 'Nur(밤당직) 배정 시 A1 공백이 생기지 않는지 사전 시뮬레이션 후 배정' },
                { icon: '⚡', text: 'Nur 배정으로 A1 커버리지가 깨질 경우 자동으로 다른 인원으로 교체' },
                { icon: '📌', text: 'Dur·B2 근무도 가능 — A1 외 근무는 일반 규칙과 동일하게 적용' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-2.5">
                  <span className="text-sm leading-none mt-0.5 select-none">{icon}</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 일반 */}
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="flex items-center gap-3 bg-muted/60 px-5 py-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">일반</span>
                  <span className="rounded-full bg-muted border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">GENERAL</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">기본 배정 규칙이 동일하게 적용됩니다</p>
              </div>
            </div>
            <div className="p-5 space-y-2">
              {[
                { icon: '📋', text: 'Dur · Nur · A1 · B2 — 제외 근무로 설정하지 않은 모든 유형 배정 가능' },
                { icon: '⚖️', text: '근무 횟수·주간 배분 기준 점수로 균등 배정 (많이 한 사람은 뒤로)' },
                { icon: '🗓️', text: 'Nur 배정 시 A1 커버리지 시뮬레이션 미적용 — 그룹 제약 없음' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-2.5">
                  <span className="text-sm leading-none mt-0.5 select-none">{icon}</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 신입 */}
          <div className="rounded-2xl border border-amber-200 bg-card overflow-hidden">
            <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <Sparkles className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-amber-900">신입</span>
                  <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700">JUNIOR</span>
                </div>
                <p className="text-xs text-amber-700/70 mt-0.5">토요일 B2 배정 시 신입끼리 겹치지 않도록 분산됩니다</p>
              </div>
            </div>
            <div className="p-5 space-y-2">
              {[
                { icon: '📅', text: '토요일 B2에 신입은 최대 1명만 배정 — 매 주 다른 신입이 돌아가며 근무' },
                { icon: '🔀', text: '토요일 B2는 고연차 1명 · 중연차 1명 · 신입 1명 우선 확보 후 나머지 채움' },
                { icon: '📋', text: '평일 Dur · Nur · A1 배정은 일반 그룹과 동일한 규칙 적용' },
                { icon: '⚠️', text: '신입만으로 최소 인원 미달 시 예외적으로 신입 추가 배정 허용 (fallback)' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-2.5">
                  <span className="text-sm leading-none mt-0.5 select-none">{icon}</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 연차 구분 */}
        <div className="rounded-2xl border bg-muted/30 p-5 space-y-3">
          <h3 className="text-sm font-semibold">고연차 · 중연차 구분 기준</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            별도 설정 없이 <span className="font-semibold text-foreground">사번 숫자 기준</span>으로 자동 분류됩니다.
            사번이 낮을수록 고연차로 간주하며, 전체 인원의 상위 50%가 고연차, 나머지가 중연차입니다.
            신입(JUNIOR) 그룹은 사번 기반 연차 구분과 별개로 동작합니다.
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-foreground">고연차 — 사번 낮은 순 상위 50%</span>
            <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">중연차 — 나머지 (GENERAL + 비고연차)</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">신입 — JUNIOR 그룹 (그룹 설정 기준)</span>
          </div>
        </div>

      </div>

      {/* Shift types */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h3 className="text-base font-semibold">근무 유형이 뭔가요?</h3>
        <div className="space-y-3">
          {[
            { type: 'Dur', color: 'bg-red-100 text-red-800', desc: '낮당직 — 07:30 ~ 20:00' },
            { type: 'Nur', color: 'bg-yellow-100 text-yellow-800', desc: '밤당직 — 19:30 ~ 익일 08:00' },
            { type: 'A1', color: 'bg-gray-100 text-gray-700', desc: '상근직 — 08:30 ~ 17:30' },
            { type: 'B2', color: 'bg-blue-100 text-blue-800', desc: '토요직 — (토요일) 08:30 ~ 12:30' },
            { type: 'OFF', color: 'bg-green-100 text-green-700', desc: '휴일 — 진한 초록은 신청 OFF, 연한 초록은 자동 배정 OFF' },
          ].map(({ type, color, desc }) => (
            <div key={type} className="flex items-center gap-3">
              <span className={`flex h-7 w-10 shrink-0 items-center justify-center rounded text-xs font-semibold ${color}`}>
                {type === 'OFF' ? 'OF' : type}
              </span>
              <span className="text-sm text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
