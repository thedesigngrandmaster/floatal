import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleDollarSign,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WifiOff,
} from 'lucide-react'
import { BrandLockup, BrandMark, Brand } from '../components/Brand'
import { Avatar, NetworkMap } from '../components/ui'
import { useFloatal, useMediaQuery, useNow } from '../lib/hooks'
import { formatCompactMoney, formatMoney, relativeTime } from '../lib/format'

export function Launch() {
  const isMobile = useMediaQuery('(max-width: 899px)')
  const snapshot = useFloatal()
  const now = useNow(30_000)
  const [selectedId, setSelectedId] = useState<string | null>('agt_ama')
  const { agents, operator, requests, events } = snapshot.data

  if (isMobile) return <Navigate to="/app" replace />

  const totalFloat = agents.reduce((sum, agent) => sum + agent.floatBalance, 0)
  const onlineAgents = agents.filter(
    (agent) => now - new Date(agent.lastSyncAt).getTime() < 45 * 60_000,
  ).length
  const selected = agents.find((agent) => agent.id === selectedId) ?? agents[0]
  const completed = requests.filter((request) => request.status === 'completed').length
  const reconciledRate = requests.length
    ? Math.round((completed / Math.max(1, requests.filter((request) => request.status !== 'pending').length)) * 1000) / 10
    : 100
  const latest = events[0]
  const hasAgentSession = Boolean(snapshot.agentSession)
  const hasOperatorSession = Boolean(snapshot.operatorSession)

  return (
    <div className="grain relative min-h-[100dvh] overflow-hidden bg-forest-950 text-[#F7F5EF]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-[-20%] h-[620px] w-[620px] rounded-full bg-[#1C7A5E]/15 blur-[120px]" />
        <div className="absolute -right-40 bottom-[-30%] h-[700px] w-[700px] rounded-full bg-gold-400/[0.06] blur-[130px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(168,222,194,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(168,222,194,0.055) 1px, transparent 1px)',
            backgroundSize: '88px 88px',
            maskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 72%)',
          }}
        />
        <svg className="absolute right-[-6%] top-[8%] h-[560px] w-[560px] opacity-[0.1]" viewBox="0 0 500 500" fill="none">
          {[90, 150, 210, 270].map((radius) => (
            <circle key={radius} cx="250" cy="250" r={radius} stroke="#A8DEC2" strokeWidth="0.7" />
          ))}
          <circle cx="250" cy="250" r="2.5" fill="#F5C518" />
        </svg>
      </div>

      <header className="relative z-20 mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-6 lg:px-12">
        <Link to="/" aria-label="Floatal home">
          <BrandLockup tone="light" subtitle="Float infrastructure" />
        </Link>
        <nav className="hidden items-center gap-8 text-[12px] font-medium text-white/55 md:flex">
          <Link to="/app" className="transition-colors hover:text-white">
            Agent app
          </Link>
          <Link to="/ops" className="transition-colors hover:text-white">
            Operator console
          </Link>
          <a href="#principles" className="transition-colors hover:text-white">
            Platform
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium text-white/50 sm:inline-flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-300 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint-300" />
            </span>
            Live demo network
          </span>
          <Link
            to="/ops"
            className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-4 py-2.5 text-[11.5px] font-semibold text-forest-950 shadow-[0_10px_30px_-12px_rgba(245,197,24,0.55)] transition-transform hover:scale-[1.02]"
          >
            Enter console <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-14 px-6 pb-16 pt-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:px-12 lg:pb-10 lg:pt-10 xl:gap-20">
        <div className="max-w-[620px]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/55"
          >
            <span className="h-1 w-1 rounded-full bg-gold-400" />
            Float infrastructure for Africa
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="font-display mt-6 text-[clamp(46px,5.3vw,78px)] font-medium leading-[0.96] tracking-[-0.06em] text-[#F7F5EF] text-balance"
          >
            Liquidity, in
            <br />
            perfect balance<span className="text-gold-400">.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-6 max-w-[490px] text-[14px] leading-[1.7] text-white/52"
          >
            The float rebalancing network for mobile-money and banking agents. Report a position, find liquidity
            nearby, and settle every movement with two-sided reconciliation.
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.36 }}
            className="mt-10 grid max-w-[500px] grid-cols-3 gap-4 border-t border-white/8 pt-6"
          >
            {[
              { value: formatCompactMoney(totalFloat), label: 'Float under management' },
              { value: String(agents.length), label: 'Agents in Accra Metro' },
              { value: `${reconciledRate}%`, label: 'Reconciled rebalances' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="tnum font-display text-[21px] font-medium tracking-[-0.04em] text-white/90">
                  {stat.value}
                </div>
                <div className="mt-1 text-[8px] font-medium uppercase leading-relaxed tracking-[0.1em] text-white/30">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative mx-auto w-full max-w-[600px] lg:mx-0"
        >
          <div className="absolute -inset-6 rounded-[40px] bg-mint-400/[0.045] blur-3xl" />
          <div className="relative rounded-[30px] border border-white/10 bg-white/[0.035] p-2.5 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.7)] backdrop-blur-md">
            <div className="overflow-hidden rounded-[23px] border border-white/8 bg-[#06271F]">
              <div className="flex items-center justify-between px-5 pb-4 pt-5">
                <div>
                  <div className="flex items-center gap-2 text-[8.5px] font-semibold uppercase tracking-[0.17em] text-white/35">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#78C9A4] opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#78C9A4]" />
                    </span>
                    Live network
                  </div>
                  <div className="mt-1.5 text-[13px] font-medium tracking-[-0.02em] text-white/85">
                    {operator.networkName}, Accra
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {agents.slice(0, 3).map((agent) => (
                    <Avatar
                      key={agent.id}
                      name={agent.name}
                      hue={agent.avatarHue}
                      size="sm"
                      className="ring-2 ring-[#06271F]"
                    />
                  ))}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[9px] font-medium text-white/70 ring-2 ring-[#06271F]">
                    +{agents.length - 3}
                  </span>
                </div>
              </div>

              <NetworkMap
                agents={agents}
                selectedId={selected?.id}
                onSelect={setSelectedId}
                currentAgentId="agt_ama"
                className="h-[318px] w-full"
                showLabels
              />

              <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06] bg-white/[0.02]">
                {[
                  { label: 'Online', value: `${onlineAgents}/${agents.length}` },
                  {
                    label: 'Selected float',
                    value: selected ? formatCompactMoney(selected.floatBalance) : '—',
                  },
                  {
                    label: 'Need attention',
                    value: String(agents.filter((agent) => agent.status !== 'healthy').length),
                  },
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
            className="absolute -bottom-7 -left-4 w-[255px] rounded-[18px] border border-forest-900/[0.06] bg-paper p-3.5 text-forest-900 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] sm:-left-8"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-healthy-50 text-healthy-600">
                <Check size={12} strokeWidth={2.6} />
              </span>
              <div className="flex-1">
                <div className="text-[9.5px] font-medium text-forest-900">Rebalance reconciled</div>
                <div className="mt-0.5 text-[8.5px] text-muted">
                  {latest ? relativeTime(latest.createdAt, now) : 'Just now'} · two-sided
                </div>
              </div>
              <BadgeCheck size={14} className="text-forest-600/50" />
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-forest-900/6 pt-2">
              <span className="text-[8.5px] text-muted">Kofi Adjei → Nana Yaa</span>
              <span className="tnum text-[10px] font-medium text-forest-900">GHS 3,500</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="absolute -right-3 top-20 flex items-center gap-2 rounded-full border border-gold-400/25 bg-[#0A2F25]/90 px-3 py-1.5 text-[9px] font-medium text-gold-200 shadow-lg backdrop-blur-md sm:-right-6"
          >
            <Sparkles size={10} className="text-gold-400" />
            {selected ? formatMoney(selected.floatBalance) : 'GHS 0'} float
          </motion.div>
        </motion.div>
      </main>

      <section id="principles" className="relative z-10 border-t border-white/8">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-6 px-6 py-7 sm:grid-cols-3 lg:px-12">
          {[
            {
              icon: WifiOff,
              title: 'Offline by design',
              copy: 'Agents report float without a connection. Reports queue and reconcile automatically.',
            },
            {
              icon: ShieldCheck,
              title: 'Settled by both sides',
              copy: 'A request completes only when the requester and provider both confirm the handover.',
            },
            {
              icon: CircleDollarSign,
              title: 'Built for real volume',
              copy: 'Live positions, operator oversight and a clean audit trail across the whole network.',
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-mint-300/80">
                  <Icon size={14} />
                </span>
                <div>
                  <div className="text-[10.5px] font-medium text-white/70">{item.title}</div>
                  <p className="mt-1 max-w-[310px] text-[9.5px] leading-relaxed text-white/32">{item.copy}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="border-t border-white/[0.06]">
          <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3 px-6 py-3.5 text-[9px] text-white/25 lg:px-12">
            <span className="inline-flex items-center gap-2">
              <Brand tone="light" size="sm" />
              <span className="text-white/15">·</span>
              <span>Quiet infrastructure for serious financial institutions.</span>
            </span>
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Demo agent 024 555 0192 · code 246810</span>
              <span className="inline-flex items-center gap-1 text-white/30">
                <BrandMark size={12} /> Built with Supabase · PWA
              </span>
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
