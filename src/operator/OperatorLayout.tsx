import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Command,
  CreditCard,
  Gauge,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  UsersRound,
  Wifi,
  X,
} from 'lucide-react'
import { BrandLockup } from '../components/Brand'
import { ToastViewport } from '../components/ToastViewport'
import { Avatar, SyncChip } from '../components/ui'
import { ThemeToggle } from '../components/ThemeToggle'
import { useFloatal, useNow } from '../lib/hooks'
import { cx, formatCompactMoney, relativeTime, statusLabel } from '../lib/format'
import { store } from '../lib/store'
import { signOutRemote } from '../lib/auth'
import { OpsModal } from './OperatorParts'
import { MarketSwitcher, useOperatorMarket } from './MarketContext'

const navGroups = [
  {
    label: 'Operations',
    items: [
      { to: '/ops', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/ops/network', label: 'Live network', icon: Map, end: false },
      { to: '/ops/rebalancing', label: 'Rebalancing', icon: CreditCard, end: false },
      { to: '/ops/agents', label: 'Agents', icon: UsersRound, end: false },
    ],
  },
  {
    label: 'Workspace',
    items: [{ to: '/ops/settings', label: 'Settings', icon: Settings, end: false }],
  },
]

const pageTitles: Record<string, { label: string; title: string }> = {
  '/ops': { label: 'Overview', title: 'Network overview' },
  '/ops/network': { label: 'Live network', title: 'Live network' },
  '/ops/rebalancing': { label: 'Rebalancing', title: 'Rebalancing' },
  '/ops/agents': { label: 'Agents', title: 'Agents' },
  '/ops/settings': { label: 'Settings', title: 'Settings' },
}

export function OperatorLayout() {
  const snapshot = useFloatal()
  const navigate = useNavigate()
  const location = useLocation()
  const now = useNow(30_000)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const { meta, agents, requests } = useOperatorMarket()

  const openRequests = requests.filter(
    (request) => request.status === 'pending' || request.status === 'accepted',
  ).length
  const lowAgents = agents.filter((agent) => agent.status !== 'healthy').length
  const onlineAgents = agents.filter(
    (agent) => now - new Date(agent.lastSyncAt).getTime() < 45 * 60_000,
  ).length
  const totalFloat = agents.reduce((sum, agent) => sum + agent.floatBalance, 0)
  const page = pageTitles[location.pathname] ?? { label: 'Console', title: 'Operator console' }

  const commandItems = useMemo(
    () =>
      navGroups.flatMap((group) =>
        group.items.map((item) => ({
          ...item,
          group: group.label,
        })),
      ),
    [],
  )
  const filteredCommands = commandItems.filter((item) =>
    `${item.label} ${item.group}`.toLowerCase().includes(commandQuery.toLowerCase()),
  )

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!snapshot.data.settings.ambientActivity) return
    const timer = window.setInterval(() => store.simulateActivity(), 30_000)
    return () => window.clearInterval(timer)
  }, [snapshot.data.settings.ambientActivity])

  const signOut = async () => {
    await signOutRemote()
    store.signOutOperator()
    setSignOutOpen(false)
    navigate('/ops/login', { replace: true })
  }

  return (
    <div className="ops-shell">
      <aside className="ops-sidebar hidden lg:flex">
        <div className="px-5 pb-5 pt-6">
          <BrandLockup tone="light" subtitle="Operator console" />
        </div>

        <div className="mx-3 rounded-[14px] border border-white/[0.08] bg-white/[0.045] p-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400 text-[11px] font-semibold text-forest-950">
              AM
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11.5px] font-medium text-white">{snapshot.data.operator.name}</div>
              <div className="mt-0.5 truncate text-[9px] text-white/38">{snapshot.data.operator.networkName}</div>
            </div>
            <ChevronDown size={12} className="text-white/30" />
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2">
            <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-white/28">
              {snapshot.data.operator.plan}
            </span>
            <span className="inline-flex items-center gap-1 text-[8.5px] font-medium text-[#8FE0BB]">
              <span className="h-1 w-1 rounded-full bg-[#78C9A4]" /> Live
            </span>
          </div>
        </div>

        <nav className="mt-5 flex-1 overflow-y-auto no-scrollbar" aria-label="Operator">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <div className="px-5 pb-1.5 text-[8.5px] font-semibold uppercase tracking-[0.16em] text-white/25">
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon
                const count = item.to === '/ops/rebalancing' ? openRequests : 0
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className="ops-nav-item"
                    data-active={location.pathname === item.to}
                  >
                    <Icon size={15} strokeWidth={1.7} />
                    <span className="flex-1">{item.label}</span>
                    {count > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[8.5px] font-semibold text-forest-950">
                        {count}
                      </span>
                    )}
                    {item.to === '/ops/network' && (
                      <span className="dot-live relative h-1.5 w-1.5 rounded-full bg-[#78C9A4] text-[#78C9A4]" />
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="mx-3 mb-3 rounded-[16px] border border-white/[0.07] bg-white/[0.035] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-white/30">
              Network float
            </span>
            <span className="inline-flex items-center gap-1 text-[8px] font-medium text-[#8FE0BB]">
              <Wifi size={9} /> {onlineAgents}/{agents.length}
            </span>
          </div>
          <div className="tnum font-display mt-1.5 text-[21px] font-medium tracking-[-0.04em] text-white/90">
            {formatCompactMoney(totalFloat, meta.currency)}
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gold-400"
              style={{ width: `${Math.max(5, Math.min(100, (onlineAgents / Math.max(1, agents.length)) * 100))}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[8.5px] text-white/35">
            <span>{agents.length} agents · {meta.name}</span>
            {lowAgents > 0 ? (
              <span className="inline-flex items-center gap-1 text-[#FFE291]">
                <CircleAlert size={8} /> {lowAgents} need attention
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#8FE0BB]">
                <ShieldCheck size={8} /> All healthy
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={snapshot.operatorSession?.name ?? 'Adjoa Serwaa'} hue={156} size="sm" className="ring-1 ring-white/10" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10.5px] font-medium text-white/80">
                {snapshot.operatorSession?.name ?? 'Adjoa Serwaa'}
              </div>
              <div className="mt-0.5 truncate text-[8.5px] text-white/30">
                {snapshot.operatorSession?.email ?? 'adjoa@floatal.app'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSignOutOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/8 hover:text-white"
              aria-label="Sign out"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      <div className="ops-main">
        <header className="ops-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="icon-btn h-9 w-9 shrink-0 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={16} />
            </button>
            <div className="hidden items-center gap-2 text-[10px] text-muted sm:flex">
              <span className="font-medium text-forest-800/70">Aya Money</span>
              <ChevronRight size={10} className="text-muted/40" />
              <span>{page.label}</span>
            </div>
            <div className="sm:hidden">
              <span className="text-[12px] font-medium text-forest-900">{page.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />
            <MarketSwitcher />
            <SyncChip
              online={snapshot.online && !snapshot.offlineSimulated}
              syncing={snapshot.syncing}
              queued={0}
              className="hidden sm:inline-flex"
            />
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-full border border-forest-900/[0.08] bg-white px-3 text-[10px] text-muted transition-colors hover:border-forest-900/15 md:flex"
            >
              <Search size={12} />
              <span>Search console</span>
              <span className="ml-5 inline-flex items-center gap-0.5 rounded border border-forest-900/8 bg-cream px-1 py-0.5 text-[8px] font-medium text-muted/60">
                <Command size={7} /> K
              </span>
            </button>
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-forest-900/[0.08] bg-white text-forest-800 transition-colors hover:bg-mint-50"
              aria-label="Notifications"
            >
              <Bell size={14} />
              {lowAgents > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger-500 ring-2 ring-white" />
              )}
            </button>
            <div className="hidden h-6 w-px bg-forest-900/8 sm:block" />
            <div className="hidden items-center gap-2 sm:flex">
              <div className="text-right">
                <div className="text-[10px] font-medium leading-none text-forest-900">{snapshot.operatorSession?.name}</div>
                <div className="mt-1 text-[8px] uppercase tracking-[0.08em] text-muted/55">Network lead</div>
              </div>
              <Avatar name={snapshot.operatorSession?.name ?? 'Adjoa Serwaa'} hue={156} size="sm" />
            </div>
          </div>
        </header>

        <main className="ops-content">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="mx-auto flex w-full max-w-[1480px] flex-wrap items-center justify-between gap-2 px-6 pb-5 pt-2 text-[8.5px] text-muted/40 lg:px-10">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={9} /> Floatal Operator · {snapshot.data.operator.legalName}
          </span>
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <RefreshCw size={8} /> Synced {relativeTime(snapshot.data.lastSyncAt, now).toLowerCase()}
            </span>
            <span>v1.0 · {meta.name}</span>
          </span>
        </footer>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.button
              type="button"
              aria-label="Close navigation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="absolute inset-y-0 left-0 flex w-[286px] max-w-[84vw] flex-col bg-forest-950 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 pb-4 pt-5">
                <BrandLockup tone="light" subtitle="Operator console" size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/60"
                  aria-label="Close navigation"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="mx-4 rounded-xl border border-white/[0.08] bg-white/[0.045] px-3 py-2.5">
                <div className="text-[10.5px] font-medium text-white/85">{snapshot.data.operator.name}</div>
                <div className="mt-0.5 text-[8.5px] text-white/35">{snapshot.data.operator.networkName} · {snapshot.data.operator.plan}</div>
              </div>
              <nav className="mt-4 flex-1 px-3">
                {navGroups.map((group) => (
                  <div key={group.label} className="mb-4">
                    <div className="px-2 pb-1.5 text-[8.5px] font-semibold uppercase tracking-[0.16em] text-white/25">
                      {group.label}
                    </div>
                    {group.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white data-[active=true]:bg-white/10 data-[active=true]:text-white"
                          data-active={location.pathname === item.to}
                          onClick={() => setMobileOpen(false)}
                        >
                          <Icon size={15} /> {item.label}
                          {item.to === '/ops/rebalancing' && openRequests > 0 && (
                            <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[8.5px] font-semibold text-forest-950">
                              {openRequests}
                            </span>
                          )}
                        </NavLink>
                      )
                    })}
                  </div>
                ))}
              </nav>
              <div className="border-t border-white/8 p-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={snapshot.operatorSession?.name ?? 'Adjoa Serwaa'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10.5px] text-white/80">{snapshot.operatorSession?.name}</div>
                    <div className="truncate text-[8.5px] text-white/30">{snapshot.operatorSession?.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSignOutOpen(true)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40"
                    aria-label="Sign out"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <OpsModal
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        title="Sign out of the console?"
        description="Your network stays live. You can sign back in at any time."
        footer={
          <>
            <button type="button" onClick={() => setSignOutOpen(false)} className="btn btn-ghost btn-sm rounded-xl">
              Stay signed in
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="btn btn-sm rounded-xl bg-danger-500 text-white hover:bg-danger-600"
            >
              <LogOut size={13} /> Sign out
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-[16px] bg-cream/80 p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-forest-700 shadow-sm">
            <Building2 size={16} />
          </span>
          <div>
            <div className="text-[11.5px] font-medium text-forest-900">
              {snapshot.data.operator.name} · {snapshot.data.operator.networkName}
            </div>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
              Live positions and agent requests will continue to update for the rest of the network team.
            </p>
          </div>
        </div>
      </OpsModal>

      <OpsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Network alerts"
        description="Live signals from agents, requests and reconciliation."
        width="max-w-[480px]"
      >
        <div className="space-y-2">
          {agents
            .filter((agent) => agent.status !== 'healthy')
            .slice(0, 4)
            .map((agent) => (
              <div
                key={agent.id}
                className={cx(
                  'flex items-start gap-2.5 rounded-xl border px-3 py-2.5',
                  agent.status === 'critical'
                    ? 'border-danger-100 bg-danger-50/60'
                    : 'border-warn-100 bg-warn-50/60',
                )}
              >
                <span
                  className={cx(
                    'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                    agent.status === 'critical' ? 'bg-danger-500' : 'bg-warn-500',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-medium text-forest-900">
                    {agent.name} · {statusLabel(agent.status)}
                  </div>
                  <div className="mt-0.5 text-[9px] text-muted">
                    {formatCompactMoney(agent.floatBalance, agent.currency)} reported · {agent.area}
                  </div>
                </div>
                <span className="text-[8.5px] text-muted/50">{relativeTime(agent.lastReportAt, now)}</span>
              </div>
            ))}
          {openRequests > 0 && (
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen(false)
                navigate('/ops/rebalancing')
              }}
              className="flex w-full items-center gap-2.5 rounded-xl border border-mint-200 bg-mint-50 px-3 py-2.5 text-left"
            >
              <ClockAlert />
              <div className="flex-1">
                <div className="text-[10.5px] font-medium text-forest-900">
                  {openRequests} rebalance{openRequests === 1 ? '' : 's'} open
                </div>
                <div className="mt-0.5 text-[9px] text-muted">Review requests moving across the network.</div>
              </div>
              <ChevronRight size={13} className="text-forest-700/50" />
            </button>
          )}
          <div className="flex items-start gap-2.5 rounded-xl border border-forest-900/[0.06] bg-white px-3 py-2.5">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-healthy-500" />
            <div className="flex-1">
              <div className="text-[10.5px] font-medium text-forest-900">All systems reconciled</div>
              <div className="mt-0.5 text-[9px] text-muted">
                {agents.length - lowAgents} of {agents.length} agents reporting healthy float.
              </div>
            </div>
          </div>
        </div>
      </OpsModal>

      <OpsModal
        open={commandOpen}
        onClose={() => {
          setCommandOpen(false)
          setCommandQuery('')
        }}
        title="Jump to"
        description="Quickly move around the operator console."
        width="max-w-[420px]"
      >
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted/60" />
          <input
            value={commandQuery}
            onChange={(event) => setCommandQuery(event.target.value)}
            placeholder="Search pages"
            autoFocus
            className="field h-10 bg-white pl-9 text-[12px]"
          />
        </div>
        <div className="mt-2 space-y-0.5">
          {filteredCommands.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => {
                  setCommandOpen(false)
                  setCommandQuery('')
                  navigate(item.to)
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-mint-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cream text-forest-700">
                  <Icon size={13} />
                </span>
                <div className="flex-1">
                  <div className="text-[11px] font-medium text-forest-900">{item.label}</div>
                  <div className="text-[8.5px] text-muted/60">{item.group}</div>
                </div>
                <ArrowUpRight size={12} className="text-muted/40" />
              </button>
            )
          })}
          {filteredCommands.length === 0 && (
            <div className="px-3 py-6 text-center text-[10.5px] text-muted">No pages match that search.</div>
          )}
        </div>
      </OpsModal>

      <ToastViewport variant="operator" />
    </div>
  )
}

function ClockAlert() {
  return (
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-forest-700 shadow-sm">
      <Gauge size={13} />
    </span>
  )
}
