import type { ReactNode } from 'react';
import {
  BookOpen,
  Database,
  Users,
  CalendarOff,
  CalendarDays,
  Calendar,
  Sparkles,
  Cpu,
  Scale,
  Shield,
  Gauge,
  Clock,
  Binary,
  Network,
  UserCheck,
  User,
  GraduationCap,
  Check,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

/* ── 공통 프리미티브 ──────────────────────────────────────────── */

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="space-y-2">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {desc && <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">{desc}</p>}
    </div>
  );
}

/* ── 페이지 ──────────────────────────────────────────────────── */

export function GuidePage() {
  return (
    <div className="space-y-12 pb-16 sm:space-y-16">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-950 to-zinc-900 px-5 py-10 sm:px-8 sm:py-12 ring-1 ring-white/10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 ring-1 ring-white/10">
            <BookOpen className="h-3.5 w-3.5" />
            사용 가이드
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            복잡한 근무 계획을,<br />
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent">
              한 번의 클릭으로.
            </span>
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-zinc-400">
            직원 등록부터 월간 스케줄 자동 생성까지. 수십 가지 규칙을 동시에 고려하는
            최적화 엔진이 모두에게 공평하고 합리적인 근무표를 만들어 드립니다.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {['공평한 분배', '제약 자동 검증', '보상 휴일 지급', '최적해 탐색'].map((t) => (
              <span key={t} className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-zinc-300 ring-1 ring-white/10">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 데이터 저장 안내 ── */}
      <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 px-5 py-4">
        <Database className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">모든 데이터는 이 브라우저에 저장됩니다.</span>{' '}
          직원 정보·OFF 신청·공휴일·생성된 스케줄은 서버 없이 브라우저 로컬에 보관됩니다.
          같은 기기·브라우저라면 새로고침해도 유지되며, 다른 기기와는 공유되지 않습니다.
        </p>
      </div>

      {/* ── 시작하기 4단계 ── */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Getting started"
          title="네 단계로 시작하세요"
          desc="순서대로 따라오시면 됩니다. 처음 한 번만 설정하면 매월 재사용할 수 있어요."
        />
        <div className="space-y-3">
          {[
            {
              icon: <Users className="h-4 w-4" />,
              step: '01',
              title: '직원 등록',
              desc: '이름·사번·근무 그룹을 입력하고, 배정받지 않을 근무 유형은 제외 근무로 체크합니다.',
              tip: 'A1 필수 그룹은 매 평일 최소 1명이 A1을 맡도록 자동 보장됩니다.',
            },
            {
              icon: <CalendarOff className="h-4 w-4" />,
              step: '02',
              title: 'OFF 신청 등록',
              desc: '직원이 미리 요청한 휴가 날짜를 등록합니다. 승인된 OFF는 생성 시 가장 먼저 고정됩니다.',
              tip: '신청 OFF는 스케줄 표에서 진한 초록색으로 표시되어 자동 OFF와 구분됩니다.',
            },
            {
              icon: <Calendar className="h-4 w-4" />,
              step: '03',
              title: '공휴일 설정',
              desc: '연도마다 달라지는 공휴일을 캘린더에서 직접 지정합니다. 스케줄 페이지 상단에서도 한눈에 확인할 수 있어요.',
              tip: '공휴일에 Dur·Nur로 일한 직원에게는 평일 보상 휴일이 지급됩니다.',
            },
            {
              icon: <CalendarDays className="h-4 w-4" />,
              step: '04',
              title: '스케줄 자동 생성',
              desc: '연도·월을 고르고 생성 버튼만 누르면 됩니다. 모든 제약을 고려한 최적의 배정이 만들어집니다.',
              tip: '빨간 테두리 셀은 제약 위반 항목이에요. 마우스를 올리면 사유가 표시됩니다.',
            },
          ].map(({ icon, step, title, desc, tip }) => (
            <div key={step} className="group rounded-2xl border bg-card p-5 transition-colors hover:border-foreground/20">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
                    {icon}
                  </div>
                  <span className="mt-2 font-mono text-[10px] font-semibold text-muted-foreground/50">{step}</span>
                </div>
                <div className="flex-1 space-y-1.5 pt-1">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  <p className="flex items-start gap-1.5 pt-1 text-xs leading-relaxed text-muted-foreground/80">
                    <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-foreground/40" />
                    {tip}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 왜 시간이 걸리나요? ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-5 py-8 sm:px-8 sm:py-10 ring-1 ring-white/10">
        <div className="pointer-events-none absolute -left-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative space-y-7">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-cyan-300 ring-1 ring-white/10">
              <Cpu className="h-3.5 w-3.5" />
              왜 생성에 ~20초가 걸리나요?
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              느린 게 아니라, 제대로 푸는 데 쓰는 시간입니다
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
              이건 단순히 빈칸을 채우는 작업이 아니라, 수학적으로 가장 어려운 부류에 속하는{' '}
              <span className="font-medium text-zinc-200">조합 최적화(combinatorial optimization)</span> 문제입니다.
              대충 무작위로 배정하면 1초면 끝나지만, 그렇게 만든 표는 누군가에게 불공평하거나 규칙을 어기게 됩니다.
            </p>
          </div>

          {/* stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: <Binary className="h-4 w-4" />, stat: '2,000+', label: '결정 변수\n(직원 × 일수 × 교대)' },
              { icon: <Network className="h-4 w-4" />, stat: '수십 개', label: '동시에 만족해야 할\n제약 조건' },
              { icon: <Gauge className="h-4 w-4" />, stat: '천문학적', label: '가능한 조합의 수\n(전수조사 불가)' },
              { icon: <Clock className="h-4 w-4" />, stat: '~20초', label: '검증된 솔버의\n정밀 탐색 시간' },
            ].map(({ icon, stat, label }) => (
              <div key={stat} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-cyan-300">
                  {icon}
                </div>
                <p className="mt-3 text-lg font-semibold tabular-nums text-white">{stat}</p>
                <p className="mt-0.5 whitespace-pre-line text-[11px] leading-snug text-zinc-400">{label}</p>
              </div>
            ))}
          </div>

          <Separator className="bg-white/10" />

          {/* explanation steps */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                n: '1',
                title: '문제를 수식으로',
                desc: '모든 근무 가능성을 0/1 변수로 바꾸고, 규칙을 수학적 제약과 목표로 표현합니다.',
              },
              {
                n: '2',
                title: '최적해를 탐색',
                desc: '검증된 최적화 엔진(MILP)이 제약을 만족하는 조합 중 가장 좋은 답을 체계적으로 찾습니다.',
              },
              {
                n: '3',
                title: '품질을 보장',
                desc: '공평성·휴식·보상휴일·정원을 동시에 저울질해, 사람이 손으로 짠 것보다 균형 잡힌 결과를 냅니다.',
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="space-y-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 font-mono text-[11px] font-semibold text-zinc-300">
                  {n}
                </div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs leading-relaxed text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>

          <p className="rounded-2xl bg-white/5 px-4 py-3 text-xs leading-relaxed text-zinc-400 ring-1 ring-white/10">
            생성 중에는 계산 진행 상태를 보여주는 화면이 표시됩니다. 잠시 기다리시면, 그 20초가 당신의 머리털을 지켜줍니다.
          </p>
        </div>
      </section>

      {/* ── 어떻게 동작하나요 ── */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="How it works"
          title="무엇을 기준으로 배정하나요"
          desc="아래 규칙들을 순서가 아니라 동시에 고려해, 한 번에 가장 합리적인 배정을 찾습니다."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: <Scale className="h-4 w-4" />, title: '공평한 분배', desc: '같은 종류의 당직이 한 사람에게 몰리지 않도록 편차를 최소화합니다.' },
            { icon: <Cpu className="h-4 w-4" />, title: '동시 최적화', desc: '수십 개의 제약을 동시에 만족하는 최적 조합을 한 번에 탐색합니다.' },
            { icon: <Shield className="h-4 w-4" />, title: '규칙 준수', desc: '연속근무·휴식·그룹·정원 조건을 자동으로 검증하고 지킵니다.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="rounded-2xl border bg-card p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
                {icon}
              </div>
              <p className="mt-3 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {/* core rules list */}
        <div className="overflow-hidden rounded-2xl border bg-card">
          {[
            { title: '신청 OFF · 화요일 고정 보장', desc: '요청한 휴가는 반드시 OFF로 확정하고, 지정 직원의 화요일 A1도 함께 보장합니다.' },
            { title: '일별 필요 인원 충족', desc: '평일 A1 최소 인원, Dur, Nur, 토요일 B2 정원을 매일 빠짐없이 채웁니다.' },
            { title: '연속 근무 · 휴식 보장', desc: 'Dur·Nur 최대 2일 연속, Nur 종료 다음 날 휴식, 연속근무 최대 6일, 주간 휴식 최소 2일.' },
            { title: '당직 공평 분배', desc: 'Nur·Dur·B2를 직원 간 편차가 작도록 분배하고, B2는 0회인 사람이 없게 합니다.' },
            { title: 'OFF 과다 방지', desc: '휴식은 쿼터(주말+공휴일 수)만큼만 — 그 외에는 모두 근무로 배정합니다.' },
            { title: '보상 휴일 지급', desc: '주말·공휴일 Dur·Nur로 잃은 휴식을 평일 보상휴일로 돌려줍니다.' },
          ].map(({ title, desc }, i, arr) => (
            <div key={title}>
              <div className="flex items-start gap-3 px-5 py-4">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                  <Check className="h-3 w-3 text-foreground/70" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </div>
              {i < arr.length - 1 && <Separator />}
            </div>
          ))}
        </div>

        {/* detail cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5">
                <Scale className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">부하 편차 최소화</span>
            </div>
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <p className="font-mono text-sm font-bold text-foreground">최다 − 최소 → 0</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Nur · Dur · B2 각각</p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              가장 많이 받은 사람과 적게 받은 사람의 차이를 줄여 당직 쏠림을 막습니다.
              특히 토요일 B2는 <span className="font-medium text-foreground">0회인 직원이 없도록</span> 보장합니다.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                <Gift className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">보상 휴일</span>
            </div>
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <p className="text-sm font-bold text-foreground">평일 보상 OFF</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">주말·공휴일 Dur·Nur 근무분</p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              주말·공휴일에 당직으로 쉬는 날을 잃으면 평일 보상휴일(청록색)로 돌려줍니다.
              단 <span className="font-medium text-foreground">B2는 휴식 1일을 대체</span>하므로 보상 대상이 아닙니다.
            </p>
          </div>
        </div>
      </section>

      {/* ── 그룹별 규칙 ── */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Staff groups"
          title="그룹별 근무 규칙"
          desc="직원 등록 시 지정하는 그룹에 따라 배정 방식이 달라집니다."
        />

        <div className="space-y-3">
          {[
            {
              icon: <UserCheck className="h-4 w-4" />,
              name: 'A1 필수',
              code: 'A1_REQUIRED',
              accent: 'text-indigo-600',
              tagline: '매 평일 최소 1명이 반드시 A1을 맡습니다',
              rules: [
                '평일마다 이 그룹에서 최소 1명 A1 배정 — A1 공백 불가',
                'Nur 배정으로 A1이 비지 않도록 사전에 검증',
                'Dur · B2 등 다른 근무도 일반 규칙대로 가능',
              ],
            },
            {
              icon: <User className="h-4 w-4" />,
              name: '일반',
              code: 'GENERAL',
              accent: 'text-foreground',
              tagline: '기본 배정 규칙이 동일하게 적용됩니다',
              rules: [
                '제외 근무로 설정하지 않은 모든 유형 배정 가능',
                '당직 횟수 편차를 줄이는 방향으로 균등 배정',
                '그룹 특유의 추가 제약은 없음',
              ],
            },
            {
              icon: <GraduationCap className="h-4 w-4" />,
              name: '신입',
              code: 'JUNIOR',
              accent: 'text-amber-600',
              tagline: '아직 1인분 업무가 어려워 B2 정원에서 제외됩니다',
              rules: [
                '일을 배우는 단계라 토요일 B2 정원(3명)에 포함되지 않음',
                '신입이 B2에 들어간 토요일은 정원 3명 + 신입 1명 = 총 4명',
                '같은 토요일에 신입은 최대 1명만 — 동시 배정 금지',
                '신입도 B2 경험을 쌓도록 공평 분배 — 0회 없이 배정',
                '평일 Dur · Nur · A1은 일반 그룹과 동일',
              ],
            },
          ].map(({ icon, name, code, accent, tagline, rules }) => (
            <div key={code} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5 ${accent}`}>
                  {icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{name}</span>
                    <span className="rounded-full border bg-muted px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                      {code}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{tagline}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <ul className="space-y-2">
                {rules.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                    <Check className={`mt-0.5 h-3 w-3 shrink-0 ${accent}`} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border bg-muted/30 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm font-semibold">고연차 · 중연차 구분</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            별도 설정 없이 <span className="font-medium text-foreground">사번 기준</span>으로 자동 분류됩니다.
            사번이 낮을수록 고연차이며, 전체의 상위 50%가 고연차·나머지가 중연차입니다.
            신입(JUNIOR)은 이 구분과 별개로 그룹 설정을 따릅니다.
          </p>
        </div>
      </section>

      {/* ── 근무 유형 ── */}
      <section className="space-y-6">
        <SectionHeader eyebrow="Shift types" title="근무 유형" />
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[
            { type: 'Dur', color: 'bg-red-100 text-red-800', name: '낮당직', time: '07:30 – 20:00' },
            { type: 'Nur', color: 'bg-yellow-100 text-yellow-800', name: '밤당직', time: '19:30 – 익일 08:00' },
            { type: 'A1', color: 'bg-gray-100 text-gray-700', name: '상근직', time: '08:30 – 17:30' },
            { type: 'B2', color: 'bg-blue-100 text-blue-800', name: '토요직', time: '토요일 08:30 – 12:30' },
            { type: 'OFF', color: 'bg-green-100 text-green-700', name: '휴일', time: '진한 초록=신청 · 청록=보상 · 연한 초록=자동' },
          ].map(({ type, color, name, time }) => (
            <div key={type} className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3">
              <span className={`flex h-8 w-11 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${color}`}>
                {type === 'OFF' ? 'OF' : type}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{time}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
