import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleAlert,
  CloudOff,
  Globe2,
  Layers,
  LockKeyhole,
  MapPin,
  Radio,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  WifiOff,
} from 'lucide-react'
import { BrandLockup, BrandMark, Brand } from '../components/Brand'
import { Avatar, Flag, NetworkMap } from '../components/ui'
import { ThemeToggle } from '../components/ThemeToggle'
import { useFloatal, useNow } from '../lib/hooks'
import { formatCompactMoney, formatMoney, relativeTime } from '../lib/format'
import { MARKETS, marketByCode } from '../lib/markets'

const problemPoints = [
  {
    icon: CircleAlert,
    title: 'Agents run dry at the worst moment',
    copy: 'A cash-out request lands, the float is short, and the customer walks. The cost is not just the transaction — it is the trust built over years.',
  },
  {
    icon: Radio,
    title: 'Liquidity is coordinated by phone calls',
    copy: 'When a position runs low, the search happens on WhatsApp and memory. Nobody knows who has excess, how far away they are, or whether they will actually show up.',
  },
  {
    icon: Layers,
    title: 'The books never quite agree',
    copy: 'Transfers are confirmed in person, then reconstructed later. One side says settled, the other says short, and the operator is left reconciling spreadsheets.',
  },
]

const steps = [
  {
    icon: Wallet,
    title: 'Report your position',
    copy: 'Agents confirm their float in two taps, online or offline. Every report is timestamped and queued safely until it syncs.',
  },
  {
    icon: MapPin,
    title: 'Find liquidity nearby',
    copy: 'Floatal ranks same-market agents by available excess and distance, so the nearest healthy source surfaces first.',
  },
  {
    icon: ShieldCheck,
    title: 'Agree the movement',
    copy: 'The provider accepts, funds are reserved, and both sides see the same amount, reference and handover instructions.',
  },
  {
    icon: BadgeCheck,
    title: 'Confirm and reconcile',
    copy: 'The request completes only when both agents confirm. The operator sees one clean, auditable trail.',
  },
]

const features = [
  {
    icon: WifiOff,
    title: 'Offline-first reporting',
    copy: 'Agents keep working through dead zones. Reports queue locally and sync automatically, with a visible pending count.',
  },
  {
    icon: ShieldCheck,
    title: 'Two-sided confirmation',
    copy: 'No movement is marked complete on one side alone. Requester and provider both attest to the handover.',
  },
  {
    icon: Globe2,
    title: 'Five markets, local currency',
    copy: 'Nigeria, Kenya, Rwanda, Ghana and Gambia — with local phone formats, float thresholds and currency formatting built in.',
  },
  {
    icon: Layers,
    title: 'Operator console',
    copy: 'A market-scoped command centre for float health, open requests, agent performance and threshold management.',
  },
  {
    icon: CloudOff,
    title: 'Resilient by default',
    copy: 'Local-first state, visible sync status and a durable audit trail. The network keeps moving when the signal does not.',
  },
  {
    icon: Smartphone,
    title: 'Installable PWA',
    copy: 'A native-feeling agent app with safe areas, bottom navigation and home-screen installation. No app store required.',
  },
]

const faqs = [
  {
    question: 'How is Floatal different from a group chat?',
    answer:
      'Group chats coordinate intent. Floatal records the position, reserves the amount, tracks both confirmations and closes the loop with a reference the operator can audit. It is the system of record, not another channel.',
  },
  {
    question: 'What happens when an agent is offline?',
    answer:
      'Reports are written to the device first, then queued. The app shows an offline badge and a pending count, and syncs automatically when connectivity returns. Nothing is silently lost.',
  },
  {
    question: 'When does a rebalance count as complete?',
    answer:
      'Only after the requester and the provider both confirm the handover. If either side reports a mismatch, the request is flagged for operator review instead of being closed.',
  },
  {
    question: 'Which countries and currencies are supported?',
    answer:
      'Nigeria (NGN), Kenya (KES), Rwanda (RWF), Ghana (GHS) and Gambia (GMD). Each market has its own dial code, phone length, thresholds and settlement increment.',
  },
  {
    question: 'Can the console combine markets?',
    answer:
      'The console is deliberately scoped to one market at a time, so every figure is in a single currency. Operators switch markets from the top bar rather than reading a blended, misleading total.',
  },
  {
    question: 'Is this a live product or a demo?',
    answer:
      'This deployment is a fully interactive demo. It runs on a local-first dataset with seeded agents, requests and operators, and needs no backend credentials. A Supabase adapter is included for production wiring.',
  },
]

export function Launch() {
  const snapshot = useFloatal()
  const now = useNow(30_000)
  const [selectedId, setSelectedId] = useState<string>('agt_ama')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const { agents, operator, requests } = snapshot.data

  const ghana = marketByCode.GH
  const marketAgents = agents.filter((agent) => agent.country === 'GH')
  const selected = marketAgents.find((agent) => agent.id === selectedId) ?? marketAgents[0]
  const onlineAgents = marketAgents.filter(
    (agent) => now - new Date(agent.lastSyncAt).getTime() < 45 * 60_000,
  ).length
  const completed = requests.filter((request) => request.status === 'completed').length
  const reconciledRate = requests.length
    ? Math.round((completed / Math.max(1, requests.filter((request) => request.status !== 'pending').length)) * 1000) / 10
    : 100
  const attention = marketAgents.filter((agent) => agent.status !== 'healthy').length
  const hasAgentSession = Boolean(snapshot.agentSession)
  const hasOperatorSession = Boolean(snapshot.operatorSession)

  return (
    <div className="min-h-[100dvh] bg-cream text-forest-900">
      {/* ————————————————— Header ————————————————— */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-forest-950/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-5 py-4 lg:px-10">
          <Link to="/" aria-label="Floatal home" className="shrink-0">
            <BrandLockup tone="light" subtitle="Float infrastructure" />
          </Link>
          <nav className="hidden items-center gap-7 text-[11.5px] font-medium text-white/55 lg:flex">
            <a href="#problem" className="transition-colors hover:text-white">
              The problem
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-white">
              How it works
            </a>
            <a href="#features" className="transition-colors hover:text-white">
              Features
            </a>
            <a href="#faq" className="transition-colors hover:text-white">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2.5">
            <ThemeToggle onDark />
            <Link
              to="/app"
              className="hidden items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-2 text-[11px] font-medium text-white/70 transition-colors hover:text-white sm:inline-flex"
            >
              <Smartphone size={12} /> Agent app
            </Link>
            <Link
              to="/ops"
              className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-4 py-2 text-[11.5px] font-semibold text-forest-950 shadow-[0_10px_28px_-14px_rgba(245,197,24,0.7)] transition-transform hover:scale-[1.02]"
            >
              Operator console <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* ————————————————— Hero ————————————————— */}
      <section className="grain relative overflow-hidden bg-forest-950 text-[#F7F5EF]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-[-24%] h-[620px] w-[620px] rounded-full bg-[#1C7A5E]/16 blur-[120px]" />
          <div className="absolute -right-44 bottom-[-36%] h-[680px] w-[680px] rounded-full bg-gold-400/[0.07] blur-[130px]" />
          <div
            className="absolute inset-0 opacity-[0.13]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(168,222,194,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(168,222,194,0.06) 1px, transparent 1px)',
              backgroundSize: '86px 86px',
              maskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 74%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 74%)',
            }}
          />
          <svg className="absolute right-[-7%] top-[4%] h-[560px] w-[560px] opacity-[0.1]" viewBox="0 0 500 500" fill="none">
            {[90, 150, 210, 270].map((radius) => (
              <circle key={radius} cx="250" cy="250" r={radius} stroke="#A8DEC2" strokeWidth="0.7" />
            ))}
            <circle cx="250" cy="250" r="2.5" fill="#F5C518" />
          </svg>
        </div>

        <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-14 px-5 pb-16 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:px-10 lg:pb-20 lg:pt-16">
          <div className="max-w-[600px]">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/55"
            >
              <span className="h-1 w-1 rounded-full bg-gold-400" />
              Float infrastructure for African agents
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="font-display mt-6 text-[clamp(44px,5.1vw,74px)] font-medium leading-[0.96] tracking-[-0.06em] text-[#F7F5EF] text-balance"
            >
              Liquidity, in
              <br />
              perfect balance<span className="text-gold-400">.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-6 max-w-[500px] text-[14px] leading-[1.75] text-white/52"
            >
              Floatal keeps mobile-money agents funded. Report a float position, find excess nearby, and settle every
              movement with two-sided reconciliation — one calm system for agents and the operators who run them.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/app"
                className="group inline-flex items-center gap-2.5 rounded-full bg-[#F7F5EF] px-5 py-3.5 text-[12.5px] font-semibold text-forest-950 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.55)] transition-transform hover:scale-[1.015]"
              >
                <Smartphone size={15} className="text-forest-800" />
                {hasAgentSession ? 'Resume agent app' : 'Open agent app'}
                <ArrowRight size={14} className="text-forest-800/50 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/ops"
                className="group inline-flex items-center gap-2.5 rounded-full border border-white/14 bg-white/[0.045] px-5 py-3.5 text-[12.5px] font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/[0.08]"
              >
                <Radio size={14} className="text-gold-400" />
                {hasOperatorSession ? 'Resume operator console' : 'Operator console'}
                <ArrowUpRight size={13} className="text-white/35 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.28 }}
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[9.5px] font-medium uppercase tracking-[0.13em] text-white/30"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={11} className="text-mint-300/70" /> Two-sided reconciliation
              </span>
              <span className="h-3 w-px bg-white/10" />
              <span className="inline-flex items-center gap-1.5">
                <WifiOff size={10} className="text-mint-300/70" /> Offline-first
              </span>
              <span className="h-3 w-px bg-white/10" />
              <span className="inline-flex items-center gap-1.5">
                <LockKeyhole size={10} className="text-mint-300/70" /> Installable PWA
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative mx-auto w-full max-w-[580px] lg:mx-0"
          >
            <div className="absolute -inset-6 rounded-[40px] bg-mint-400/[0.045] blur-3xl" />
            <div className="relative rounded-[28px] border border-white/10 bg-white/[0.035] p-2.5 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.7)] backdrop-blur-md">
              <div className="overflow-hidden rounded-[21px] border border-white/8 bg-[#06271F]">
                <div className="flex items-center justify-between px-5 pb-4 pt-5">
                  <div>
                    <div className="flex items-center gap-2 text-[8.5px] font-semibold uppercase tracking-[0.17em] text-white/35">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#78C9A4] opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#78C9A4]" />
                      </span>
                      Live network · {ghana.capital}
                    </div>
                    <div className="mt-1.5 text-[13px] font-medium tracking-[-0.02em] text-white/85">
                      {operator.networkName}
                    </div>
                  </div>
                  <div className="flex items-center -space-x-2">
                    {marketAgents.slice(0, 3).map((agent, index) => (
                      <span key={agent.id} className="relative inline-flex" style={{ zIndex: 10 - index }}>
                        <Avatar
                          name={agent.name}
                          hue={agent.avatarHue}
                          size="sm"
                          className="ring-2 ring-[#06271F]"
                        />
                      </span>
                    ))}
                    <span className="relative z-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[9px] font-medium text-white/75 ring-2 ring-[#06271F]">
                      +{Math.max(0, marketAgents.length - 3)}
                    </span>
                  </div>
                </div>

                <NetworkMap
                  agents={marketAgents}
                  selectedId={selected?.id}
                  onSelect={setSelectedId}
                  currentAgentId={selected?.id}
                  className="h-[300px] w-full"
                  showLabels
                />

                <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06] bg-white/[0.02]">
                  {[
                    { label: 'Online', value: `${onlineAgents}/${marketAgents.length}` },
                    {
                      label: 'Selected float',
                      value: selected ? formatCompactMoney(selected.floatBalance, selected.currency) : '—',
                    },
                    { label: 'Need attention', value: String(attention) },
                  ].map((item) => (
                    <div key={item.label} className="px-4 py-3">
                      <div className="text-[7.5px] font-medium uppercase tracking-[0.13em] text-white/28">
                        {item.label}
                      </div>
                      <div className="tnum mt-1 text-[12px] font-medium text-white/75">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute -bottom-7 -left-3 w-[248px] rounded-[18px] border border-forest-900/[0.06] bg-paper p-3.5 text-forest-900 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] sm:-left-7"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-healthy-50 text-healthy-600">
                  <Check size={12} strokeWidth={2.6} />
                </span>
                <div className="flex-1">
                  <div className="text-[9.5px] font-medium text-forest-900">Rebalance reconciled</div>
                  <div className="mt-0.5 text-[8.5px] text-muted">
                    {snapshot.data.lastSyncAt ? relativeTime(snapshot.data.lastSyncAt, now) : 'Just now'} · two-sided
                  </div>
                </div>
                <BadgeCheck size={14} className="text-forest-600/50" />
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-forest-900/6 pt-2">
                <span className="text-[8.5px] text-muted">Both agents confirmed</span>
                <span className="tnum text-[10px] font-medium text-forest-900">
                  {selected ? formatMoney(selected.floatBalance, selected.currency) : `${ghana.currency} 0`}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute -right-2 top-20 flex items-center gap-2 rounded-full border border-gold-400/25 bg-[#0A2F25]/90 px-3 py-1.5 text-[9px] font-medium text-gold-200 shadow-lg backdrop-blur-md sm:-right-5"
            >
              <Sparkles size={10} className="text-gold-400" />
              {reconciledRate}% reconciled
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ————————————————— Markets ————————————————— */}
      <section aria-label="Markets covered" className="border-b border-forest-900/[0.08] bg-paper">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-5 py-7 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted/70">
            <Globe2 size={12} className="text-forest-600" /> Live in five markets
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {MARKETS.map((market) => (
              <div key={market.code} className="flex items-center gap-2">
                <Flag code={market.code} className="h-4 w-6 rounded-[3px] shadow-sm" />
                <div>
                  <div className="text-[10.5px] font-medium text-forest-900">{market.name}</div>
                  <div className="text-[8.5px] uppercase tracking-[0.1em] text-muted/60">
                    {market.currency} · {market.capital}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————————————————— Problem ————————————————— */}
      <section id="problem" className="mx-auto w-full max-w-[1280px] scroll-mt-24 px-5 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <div className="eyebrow text-forest-700/60">The problem</div>
            <h2 className="font-display mt-4 text-[clamp(32px,3.6vw,50px)] font-medium leading-[1.02] tracking-[-0.05em] text-forest-900 text-balance">
              Float runs out before the day does.
            </h2>
            <p className="mt-5 max-w-[400px] text-[13px] leading-[1.8] text-muted">
              Mobile-money agents hold the last mile of cash. When a position drops, the whole network feels it — the
              customer, the agent, and the operator trying to hold the line from a spreadsheet.
            </p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-forest-900/10 bg-white/70 px-3.5 py-2 text-[10px] font-medium text-muted">
              <CircleAlert size={11} className="text-warn-600" />
              A short float is a lost customer, not a delayed transaction.
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {problemPoints.map((point, index) => {
              const Icon = point.icon
              return (
                <div
                  key={point.title}
                  className="rounded-[22px] border border-forest-900/[0.08] bg-white/60 p-5 transition-colors hover:bg-white"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-warn-50 text-warn-700">
                      <Icon size={15} />
                    </span>
                    <span className="tnum text-[10px] font-medium text-muted/30">0{index + 1}</span>
                  </div>
                  <div className="mt-4 text-[13px] font-medium tracking-[-0.02em] text-forest-900">{point.title}</div>
                  <p className="mt-1.5 text-[11px] leading-[1.75] text-muted">{point.copy}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ————————————————— Solution ————————————————— */}
      <section className="bg-forest-950 text-[#F7F5EF]">
        <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:py-28">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-gold-400/75">
              <span className="h-px w-6 bg-gold-400/40" /> The solution
            </div>
            <h2 className="font-display mt-5 text-[clamp(32px,3.6vw,50px)] font-medium leading-[1.02] tracking-[-0.05em] text-[#F7F5EF] text-balance">
              One shared ledger for the last mile.
            </h2>
            <p className="mt-5 max-w-[470px] text-[13px] leading-[1.8] text-white/45">
              Floatal turns fragmented float into a visible, trusted network. Agents see who can help and how far away
              they are. Operators see every position, request and confirmation in one market-scoped view.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  title: 'Visibility before the shortage',
                  copy: 'Live positions, thresholds and health status flag a weak agent before the first customer is turned away.',
                },
                {
                  title: 'A movement both sides own',
                  copy: 'Reserved amounts, one shared reference, and a completion rule that requires both confirmations.',
                },
                {
                  title: 'An audit trail by default',
                  copy: 'Every report, acceptance and settlement is recorded — exportable by market, agent or request.',
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-300/10 text-mint-300">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <div>
                    <div className="text-[12px] font-medium text-white/80">{item.title}</div>
                    <p className="mt-1 max-w-[430px] text-[10.5px] leading-[1.75] text-white/35">{item.copy}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/ops"
              className="group mt-9 inline-flex items-center gap-2 text-[11.5px] font-medium text-gold-300 transition-colors hover:text-gold-200"
            >
              See the operator view
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[36px] bg-mint-400/[0.04] blur-3xl" />
            <div className="relative rounded-[26px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-white/35">
                    Reconciliation
                  </div>
                  <div className="mt-1 text-[14px] font-medium text-white/85">FL-4821 · settled</div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-mint-300/20 bg-mint-300/10 px-2.5 py-1 text-[9px] font-medium text-mint-300">
                  <BadgeCheck size={10} /> Both sides
                </span>
              </div>

              <div className="mt-5 rounded-[18px] border border-white/8 bg-[#06271F] p-4">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-white/30">
                  <span>Amount</span>
                  <span>{ghana.currency}</span>
                </div>
                <div className="tnum mt-1.5 font-display text-[32px] font-medium leading-none tracking-[-0.045em] text-[#F7F5EF]">
                  {formatMoney(3500, 'GHS').replace('GHS ', '')}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                  <div className="flex items-center gap-2">
                    <Avatar name="Kofi Adjei" hue={152} size="xs" />
                    <div>
                      <div className="text-[10px] font-medium text-white/75">Kofi Adjei</div>
                      <div className="text-[8px] text-white/30">Requester</div>
                    </div>
                  </div>
                  <ArrowRight size={12} className="text-white/25" />
                  <div className="flex items-center gap-2">
                    <Avatar name="Nana Yaa" hue={44} size="xs" />
                    <div>
                      <div className="text-[10px] font-medium text-white/75">Nana Yaa</div>
                      <div className="text-[8px] text-white/30">Provider</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {[
                  { label: 'Requester confirmed handover', time: '14:32' },
                  { label: 'Provider confirmed receipt', time: '14:34' },
                  { label: 'Operator ledger updated', time: '14:34' },
                ].map((row, index) => (
                  <div key={row.label} className="flex items-center gap-2.5 rounded-xl bg-white/[0.035] px-3 py-2.5">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full ${
                        index === 2 ? 'bg-gold-400/15 text-gold-300' : 'bg-mint-300/15 text-mint-300'
                      }`}
                    >
                      <Check size={8} strokeWidth={3} />
                    </span>
                    <span className="flex-1 text-[10px] text-white/60">{row.label}</span>
                    <span className="tnum text-[8.5px] text-white/25">{row.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ————————————————— How it works ————————————————— */}
      <section id="how-it-works" className="mx-auto w-full max-w-[1280px] scroll-mt-24 px-5 py-20 lg:px-10 lg:py-28">
        <div className="max-w-[560px]">
          <div className="eyebrow text-forest-700/60">How it works</div>
          <h2 className="font-display mt-4 text-[clamp(32px,3.6vw,50px)] font-medium leading-[1.02] tracking-[-0.05em] text-forest-900 text-balance">
            Four steps. No guesswork.
          </h2>
          <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
            The same loop whether an agent is topping up before a rush or an operator is reviewing the day.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="relative rounded-[22px] border border-forest-900/[0.08] bg-white/65 p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-900 text-mint-200">
                    <Icon size={15} />
                  </span>
                  <span className="tnum text-[10px] font-medium text-muted/30">0{index + 1}</span>
                </div>
                <div className="mt-5 text-[13px] font-medium tracking-[-0.02em] text-forest-900">{step.title}</div>
                <p className="mt-1.5 text-[11px] leading-[1.75] text-muted">{step.copy}</p>
                {index < steps.length - 1 && (
                  <span className="absolute -right-2 top-1/2 hidden h-px w-4 bg-forest-900/15 xl:block" />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ————————————————— Features ————————————————— */}
      <section id="features" className="scroll-mt-24 border-y border-forest-900/[0.07] bg-paper">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-20 lg:px-10 lg:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[560px]">
              <div className="eyebrow text-forest-700/60">Platform</div>
              <h2 className="font-display mt-4 text-[clamp(32px,3.6vw,50px)] font-medium leading-[1.02] tracking-[-0.05em] text-forest-900 text-balance">
                Built for the way agents actually work.
              </h2>
            </div>
            <p className="max-w-[330px] text-[11.5px] leading-[1.8] text-muted">
              Local-first by default, reconciled by design, and quiet enough to use on a busy street corner.
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group rounded-[22px] border border-forest-900/[0.08] bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-32px_rgba(12,66,50,0.4)]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-50 text-forest-700 transition-colors group-hover:bg-forest-900 group-hover:text-mint-200">
                    <Icon size={15} />
                  </span>
                  <div className="mt-4 text-[12.5px] font-medium tracking-[-0.02em] text-forest-900">
                    {feature.title}
                  </div>
                  <p className="mt-1.5 text-[10.5px] leading-[1.75] text-muted">{feature.copy}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Agents in seeded network', value: String(agents.length) },
              { label: 'Markets live today', value: String(MARKETS.length) },
              { label: 'Requests reconciled', value: `${reconciledRate}%` },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[18px] border border-forest-900/[0.07] bg-cream/70 px-5 py-4">
                <div className="tnum font-display text-[24px] font-medium tracking-[-0.04em] text-forest-900">
                  {stat.value}
                </div>
                <div className="mt-1 text-[8.5px] font-medium uppercase tracking-[0.12em] text-muted/60">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————————————————— FAQ ————————————————— */}
      <section id="faq" className="mx-auto w-full max-w-[1280px] scroll-mt-24 px-5 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <div className="eyebrow text-forest-700/60">Questions</div>
            <h2 className="font-display mt-4 text-[clamp(30px,3.2vw,44px)] font-medium leading-[1.03] tracking-[-0.05em] text-forest-900">
              Straight answers.
            </h2>
            <p className="mt-4 max-w-[320px] text-[11.5px] leading-[1.8] text-muted">
              Still deciding? Open the demo console and inspect the seeded network yourself. No sign-up required beyond
              the prefilled credentials.
            </p>
            <Link
              to="/ops"
              className="group mt-6 inline-flex items-center gap-2 text-[11px] font-medium text-forest-800 transition-colors hover:text-forest-900"
            >
              Explore the demo <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="divide-y divide-forest-900/[0.08] border-y border-forest-900/[0.08]">
            {faqs.map((faq, index) => {
              const open = openFaq === index
              return (
                <div key={faq.question}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : index)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  >
                    <span className="text-[12.5px] font-medium tracking-[-0.015em] text-forest-900">
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={15}
                      className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {open && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className="max-w-[560px] pb-4 text-[11px] leading-[1.8] text-muted"
                    >
                      {faq.answer}
                    </motion.p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ————————————————— Final CTA ————————————————— */}
      <section className="px-5 pb-20 lg:px-10 lg:pb-24">
        <div className="grain relative mx-auto w-full max-w-[1280px] overflow-hidden rounded-[30px] bg-forest-950 px-6 py-14 text-center text-[#F7F5EF] sm:px-10 lg:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 top-[-40%] h-[420px] w-[420px] rounded-full bg-[#1C7A5E]/20 blur-[100px]" />
            <div className="absolute -right-16 bottom-[-50%] h-[420px] w-[420px] rounded-full bg-gold-400/[0.08] blur-[110px]" />
          </div>
          <div className="relative mx-auto max-w-[620px]">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
              <RefreshCw size={17} className="text-gold-400" />
            </div>
            <h2 className="font-display mt-6 text-[clamp(30px,3.8vw,48px)] font-medium leading-[1.03] tracking-[-0.05em] text-balance">
              Put the network back in balance.
            </h2>
            <p className="mx-auto mt-4 max-w-[440px] text-[12px] leading-[1.8] text-white/45">
              Walk through the agent app or open the operator console. The demo is fully seeded, including five markets
              and two-sided confirmation flows.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/app"
                className="group inline-flex items-center gap-2.5 rounded-full bg-[#F7F5EF] px-5 py-3.5 text-[12px] font-semibold text-forest-950 transition-transform hover:scale-[1.015]"
              >
                <Smartphone size={14} /> Open agent app
                <ArrowRight size={13} className="text-forest-800/50 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/ops"
                className="group inline-flex items-center gap-2.5 rounded-full border border-white/14 bg-white/[0.05] px-5 py-3.5 text-[12px] font-medium text-white/80 transition-colors hover:bg-white/[0.09]"
              >
                <Radio size={13} className="text-gold-400" /> Operator console
                <ArrowUpRight size={12} className="text-white/35" />
              </Link>
            </div>
            <p className="mt-5 text-[9px] uppercase tracking-[0.14em] text-white/25">
              Demo access · agent +233 24 555 0192 · code 246810 · operator adjoa@floatal.app
            </p>
          </div>
        </div>
      </section>

      {/* ————————————————— Footer ————————————————— */}
      <footer className="border-t border-forest-900/[0.08] bg-paper">
        <div className="mx-auto w-full max-w-[1280px] px-5 py-14 lg:px-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Link to="/" aria-label="Floatal home">
                <BrandLockup tone="dark" subtitle="Float infrastructure" />
              </Link>
              <p className="mt-4 max-w-[260px] text-[10.5px] leading-[1.8] text-muted">
                Quiet infrastructure for the agents who keep cash moving across Africa. Built for two-sided trust, not
                one-sided promises.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-forest-900/10 bg-white px-3 py-1.5 text-[9px] font-medium text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-healthy-500" />
                flоatal.app · demo environment
              </div>
            </div>

            <div>
              <div className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-muted/60">Product</div>
              <ul className="mt-3.5 space-y-2.5 text-[10.5px] text-forest-800/80">
                <li>
                  <Link to="/app" className="transition-colors hover:text-forest-900">
                    Agent app
                  </Link>
                </li>
                <li>
                  <Link to="/ops" className="transition-colors hover:text-forest-900">
                    Operator console
                  </Link>
                </li>
                <li>
                  <a href="#features" className="transition-colors hover:text-forest-900">
                    Platform features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="transition-colors hover:text-forest-900">
                    How it works
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-muted/60">Markets</div>
              <ul className="mt-3.5 space-y-2.5 text-[10.5px] text-forest-800/80">
                {MARKETS.map((market) => (
                  <li key={market.code} className="flex items-center gap-2">
                    <Flag code={market.code} className="h-[11px] w-[16px]" />
                    {market.name}
                    <span className="text-[8.5px] text-muted/45">{market.currency}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-muted/60">Company</div>
              <ul className="mt-3.5 space-y-2.5 text-[10.5px] text-forest-800/80">
                <li>
                  <a href="#problem" className="transition-colors hover:text-forest-900">
                    Why Floatal
                  </a>
                </li>
                <li>
                  <a href="#faq" className="transition-colors hover:text-forest-900">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="mailto:network@floatal.app" className="transition-colors hover:text-forest-900">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="mailto:network@floatal.app?subject=Floatal%20demo" className="transition-colors hover:text-forest-900">
                    Request a walkthrough
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-forest-900/[0.08] pt-5 text-[9px] text-muted/50 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2">
              <Brand tone="dark" size="sm" />
              <span className="text-sand-300">·</span>
              <span>© {new Date().getFullYear()} Floatal. All rights reserved.</span>
            </span>
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="inline-flex items-center gap-1.5">
                <LockKeyhole size={9} /> Local-first demo data
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={9} /> Two-sided by design
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BrandMark size={12} /> PWA ready
              </span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
