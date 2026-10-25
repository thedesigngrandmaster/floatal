import { useMemo, useState } from 'react'
import {
  ArrowUpDown,
  ChevronRight,
  CircleAlert,
  Download,
  Filter,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { Avatar, StatusPill } from '../components/ui'
import { useFloatal, useNow } from '../lib/hooks'
import {
  cx,
  formatCompactMoney,
  formatMoney,
  formatPhone,
  relativeTime,
} from '../lib/format'
import type { Agent, FloatStatus } from '../lib/types'
import {
  AgentDrawer,
  InviteAgentDialog,
  LiveBadge,
  MetricCard,
  PageHeader,
  SectionCard,
  exportAgents,
} from './OperatorParts'

type StatusFilter = 'all' | FloatStatus
type SortKey = 'name' | 'float' | 'attention' | 'reliability' | 'volume'

export function Agents() {
  const snapshot = useFloatal()
  const now = useNow(30_000)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('attention')
  const [drawerAgentId, setDrawerAgentId] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const { agents, operator } = snapshot.data
  const online = agents.filter((agent) => now - new Date(agent.lastSyncAt).getTime() < 45 * 60_000)
  const attention = agents.filter((agent) => agent.status !== 'healthy')
  const totalFloat = agents.reduce((sum, agent) => sum + agent.floatBalance, 0)
  const totalVolume = agents.reduce((sum, agent) => sum + agent.todayVolume, 0)
  const avgReliability = Math.round(agents.reduce((sum, agent) => sum + agent.reliability, 0) / Math.max(1, agents.length))
  const counts = {
    all: agents.length,
    healthy: agents.filter((agent) => agent.status === 'healthy').length,
    low: agents.filter((agent) => agent.status === 'low').length,
    critical: agents.filter((agent) => agent.status === 'critical').length,
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return agents
      .filter((agent) => filter === 'all' || agent.status === filter)
      .filter((agent) =>
        `${agent.name} ${agent.businessName} ${agent.area} ${agent.phone}`
          .toLowerCase()
          .includes(normalized),
      )
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        if (sort === 'reliability') return b.reliability - a.reliability
        if (sort === 'volume') return b.todayVolume - a.todayVolume
        if (sort === 'float') return b.floatBalance - a.floatBalance
        const rank = { critical: 0, low: 1, healthy: 2 }
        return rank[a.status] - rank[b.status] || a.floatBalance - b.floatBalance
      })
  }, [agents, filter, query, sort])

  const open = (agent: Agent) => setDrawerAgentId(agent.id)
  const isOnline = (agent: Agent) => now - new Date(agent.lastSyncAt).getTime() < 45 * 60_000

  return (
    <div className="space-y-5 pb-4">
      <PageHeader
        eyebrow="Agent network"
        title="Agents"
        description={`${agents.length} agents operating under ${operator.name}. Monitor float health, reliability and network coverage.`}
        actions={
          <>
            <button
              type="button"
              onClick={() => exportAgents(agents, 'floatal-agents.csv')}
              className="btn btn-ghost btn-sm h-9 rounded-full bg-white text-[10.5px]"
            >
              <Download size={12} /> Export
            </button>
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="btn btn-forest btn-sm h-9 rounded-full text-[10.5px]"
            >
              <UserPlus size={12} /> Invite agent
            </button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total agents"
          value={String(agents.length)}
          hint={`${counts.healthy} reporting healthy`}
          icon={<UsersRound size={14} />}
        />
        <MetricCard
          label="Online now"
          value={`${online.length}/${agents.length}`}
          hint={`${agents.length - online.length} inactive`}
          icon={<Wifi size={14} />}
          tone={online.length === agents.length ? 'healthy' : 'warn'}
        />
        <MetricCard
          label="Need attention"
          value={String(attention.length)}
          hint={`${counts.critical} critical · ${counts.low} low`}
          icon={<CircleAlert size={14} />}
          tone={attention.length ? 'danger' : 'healthy'}
        />
        <MetricCard
          label="Network volume today"
          value={formatCompactMoney(totalVolume)}
          hint={`${formatCompactMoney(totalFloat)} float · ${avgReliability}% reliability`}
          icon={<Sparkles size={14} />}
          tone="gold"
        />
      </div>

      <SectionCard bodyClassName="">
        <div className="flex flex-col gap-3 border-b border-forest-900/[0.06] px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
            {(
              [
                { key: 'all', label: 'All agents', count: counts.all },
                { key: 'healthy', label: 'Healthy', count: counts.healthy },
                { key: 'low', label: 'Low float', count: counts.low },
                { key: 'critical', label: 'Critical', count: counts.critical },
              ] as Array<{ key: StatusFilter; label: string; count: number }>
            ).map((item) => {
              const active = filter === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={cx(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9.5px] font-medium transition-colors',
                    active
                      ? 'bg-forest-900 text-white'
                      : 'border border-forest-900/[0.08] bg-white text-forest-800 hover:bg-cream',
                  )}
                >
                  {item.label}
                  <span className={cx('text-[8.5px]', active ? 'text-white/50' : 'text-muted/50')}>{item.count}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:w-[220px]">
              <Search size={11} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted/55" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search agents"
                className="field h-8 rounded-full bg-cream/50 pl-8 pr-7 text-[10.5px]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-sand-100 text-muted"
                  aria-label="Clear search"
                >
                  <X size={8} />
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="h-8 appearance-none rounded-full border border-forest-900/[0.08] bg-white pl-7 pr-6 text-[9.5px] font-medium text-forest-800 outline-none"
                aria-label="Sort agents"
              >
                <option value="attention">Attention</option>
                <option value="float">Highest float</option>
                <option value="volume">Volume</option>
                <option value="reliability">Reliability</option>
                <option value="name">Name</option>
              </select>
              <ArrowUpDown size={10} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted/55" />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-50 text-forest-600">
              <Filter size={19} />
            </span>
            <div className="mt-3 text-[13px] font-medium text-forest-900">No agents match</div>
            <p className="mt-1 max-w-[260px] text-[10.5px] leading-relaxed text-muted">
              Clear the search or choose another status to see the rest of the network.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter('all')
                setQuery('')
              }}
              className="btn btn-ghost btn-sm mt-4 h-8 rounded-lg text-[9.5px]"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="ops-table min-w-[880px]">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Area</th>
                    <th>Float position</th>
                    <th>Reserve progress</th>
                    <th>Volume today</th>
                    <th>Reliability</th>
                    <th>Last sync</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((agent) => {
                    const progress = Math.min(100, Math.round((agent.floatBalance / Math.max(1, agent.targetFloat)) * 100))
                    return (
                      <tr key={agent.id} className="cursor-pointer" onClick={() => open(agent)}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <span className="relative shrink-0">
                              <Avatar name={agent.name} hue={agent.avatarHue} size="sm" />
                              <span
                                className={cx(
                                  'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white',
                                  isOnline(agent) ? 'bg-healthy-500' : 'bg-sand-400',
                                )}
                              />
                            </span>
                            <div className="min-w-0">
                              <div className="max-w-[150px] truncate text-[10.5px] font-medium text-forest-900">{agent.name}</div>
                              <div className="max-w-[150px] truncate text-[8.5px] text-muted">{agent.businessName}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="inline-flex items-center gap-1 text-[10px] text-forest-800">
                            <MapPin size={10} className="text-forest-600/50" /> {agent.area}
                          </div>
                          <div className="mt-0.5 text-[8.5px] text-muted">{formatPhone(agent.phone)}</div>
                        </td>
                        <td>
                          <div className="tnum font-medium text-forest-900">{formatMoney(agent.floatBalance)}</div>
                          <div className="mt-0.5"><StatusPill status={agent.status} size="sm" /></div>
                        </td>
                        <td>
                          <div className="flex w-[120px] items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-100">
                              <div
                                className={cx(
                                  'h-full rounded-full',
                                  agent.status === 'healthy'
                                    ? 'bg-healthy-500'
                                    : agent.status === 'low'
                                      ? 'bg-warn-500'
                                      : 'bg-danger-500',
                                )}
                                style={{ width: `${Math.max(3, progress)}%` }}
                              />
                            </div>
                            <span className="w-6 text-[8.5px] text-muted">{progress}%</span>
                          </div>
                          <div className="mt-1 text-[8px] text-muted/55">Target {formatCompactMoney(agent.targetFloat)}</div>
                        </td>
                        <td className="tnum text-[10px] text-forest-800">{formatCompactMoney(agent.todayVolume)}</td>
                        <td>
                          <span className={cx('text-[10px] font-medium', agent.reliability >= 97 ? 'text-healthy-600' : 'text-forest-800')}>
                            {agent.reliability}%
                          </span>
                        </td>
                        <td>
                          <span className={cx('inline-flex items-center gap-1 text-[9px]', isOnline(agent) ? 'text-healthy-600' : 'text-muted/60')}>
                            {isOnline(agent) ? <Wifi size={9} /> : <WifiOff size={9} />}
                            {relativeTime(agent.lastSyncAt, now)}
                          </span>
                        </td>
                        <td>
                          <span className="flex h-6 w-6 items-center justify-center rounded-full text-muted/45">
                            <ChevronRight size={12} />
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-forest-900/[0.055] md:hidden">
              {filtered.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => open(agent)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-cream/60"
                >
                  <span className="relative shrink-0">
                    <Avatar name={agent.name} hue={agent.avatarHue} size="md" />
                    <span
                      className={cx(
                        'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-paper',
                        isOnline(agent) ? 'bg-healthy-500' : 'bg-sand-400',
                      )}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[11.5px] font-medium text-forest-900">{agent.name}</span>
                      <StatusPill status={agent.status} size="sm" />
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-muted">
                      <span>{agent.area}</span>
                      <span className="h-1 w-1 rounded-full bg-sand-300" />
                      <span>{relativeTime(agent.lastSyncAt, now)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="tnum text-[11px] font-medium text-forest-900">{formatMoney(agent.floatBalance)}</span>
                      <span className="text-[8.5px] text-muted">{agent.reliability}% reliable</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-sand-400" />
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-forest-900/[0.06] bg-cream/35 px-4 py-2.5 text-[8.5px] text-muted/55">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={9} /> Agent float is visible to the agent and their operator only.
          </span>
          <span>
            Showing {filtered.length} of {agents.length}
          </span>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <SectionCard title="Attention queue" subtitle="Agents below their low-float floor">
          {attention.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-healthy-50 text-healthy-600">
                <ShieldCheck size={19} />
              </span>
              <div className="mt-3 text-[12px] font-medium text-forest-900">No agents need attention</div>
              <p className="mt-1 text-[10px] text-muted">Every position is above its safety floor.</p>
            </div>
          ) : (
            <div className="divide-y divide-forest-900/[0.05] px-2">
              {[...attention]
                .sort((a, b) => a.floatBalance - b.floatBalance)
                .slice(0, 5)
                .map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => open(agent)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-cream/60"
                  >
                    <Avatar name={agent.name} hue={agent.avatarHue} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[10.5px] font-medium text-forest-900">{agent.name}</div>
                      <div className="mt-0.5 text-[8.5px] text-muted">
                        {formatMoney(agent.floatBalance)} · {agent.area}
                      </div>
                    </div>
                    <span className="text-[9px] font-medium text-danger-600">
                      {formatCompactMoney(Math.max(0, agent.lowThreshold - agent.floatBalance))} short
                    </span>
                    <ChevronRight size={12} className="text-muted/40" />
                  </button>
                ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Network composition" subtitle="Coverage and reliability at a glance">
          <div className="grid grid-cols-2 gap-3 p-4">
            {[
              { label: 'Healthy positions', value: String(counts.healthy), detail: `${Math.round((counts.healthy / Math.max(1, agents.length)) * 100)}% of network`, cls: 'text-healthy-600' },
              { label: 'Below floor', value: String(counts.low + counts.critical), detail: `${counts.critical} critical`, cls: 'text-danger-600' },
              { label: 'Average reliability', value: `${avgReliability}%`, detail: 'Reporting consistency', cls: 'text-forest-800' },
              { label: 'Float coverage', value: formatCompactMoney(totalFloat), detail: `${agents.length} agents`, cls: 'text-forest-800' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-forest-900/[0.06] bg-white px-3 py-2.5">
                <div className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted/55">{item.label}</div>
                <div className={cx('font-display tnum mt-1 text-[17px] font-medium tracking-[-0.03em]', item.cls)}>{item.value}</div>
                <div className="mt-0.5 text-[8.5px] text-muted/55">{item.detail}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-forest-900/[0.06] px-4 py-3">
            <LiveBadge label={`${online.length} online`} />
            <span className="inline-flex items-center gap-1 text-[8.5px] text-muted/55">
              <Download size={8} /> Export includes full float history
            </span>
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-forest-900/[0.06] bg-white/55 px-4 py-3 text-[9px] text-muted/60">
        <span className="inline-flex items-center gap-1.5">
          <UsersRound size={10} /> {operator.name} · {operator.networkName} · {operator.currency}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Plus size={9} /> New agents start at zero float until their first report.
        </span>
      </div>

      <AgentDrawer agentId={drawerAgentId} onClose={() => setDrawerAgentId(null)} />
      <InviteAgentDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}
