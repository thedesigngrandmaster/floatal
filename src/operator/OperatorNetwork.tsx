import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  ChevronRight,
  CircleAlert,
  Download,
  Filter,
  MapPin,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  UsersRound,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { Avatar, NetworkMap, StatusPill } from '../components/ui'
import { useFloatal, useNow } from '../lib/hooks'
import {
  cx,
  formatCompactMoney,
  formatMoney,
  relativeTime,
  statusLabel,
} from '../lib/format'
import type { Agent, FloatStatus } from '../lib/types'
import {
  AgentDrawer,
  LiveBadge,
  PageHeader,
  SectionCard,
  exportAgents,
} from './OperatorParts'

type StatusFilter = 'all' | FloatStatus
type SortMode = 'float' | 'attention' | 'name'

const statusFilters: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'All agents' },
  { key: 'healthy', label: 'Healthy' },
  { key: 'low', label: 'Low float' },
  { key: 'critical', label: 'Critical' },
]

export function OperatorNetwork() {
  const snapshot = useFloatal()
  const now = useNow(20_000)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortMode>('float')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string>('agt_ama')
  const [drawerAgentId, setDrawerAgentId] = useState<string | null>(null)

  const { agents, operator, events } = snapshot.data
  const online = agents.filter((agent) => now - new Date(agent.lastSyncAt).getTime() < 45 * 60_000)
  const attention = agents.filter((agent) => agent.status !== 'healthy')
  const totalFloat = agents.reduce((sum, agent) => sum + agent.floatBalance, 0)
  const avgReliability = Math.round(agents.reduce((sum, agent) => sum + agent.reliability, 0) / Math.max(1, agents.length))
  const selected = agents.find((agent) => agent.id === selectedId) ?? agents[0]

  const filtered = useMemo(() => {
    const matches = agents
      .filter((agent) => filter === 'all' || agent.status === filter)
      .filter((agent) =>
        `${agent.name} ${agent.businessName} ${agent.area} ${agent.phone}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    return matches.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'attention') {
        const rank = { critical: 0, low: 1, healthy: 2 }
        return rank[a.status] - rank[b.status] || a.floatBalance - b.floatBalance
      }
      return b.floatBalance - a.floatBalance
    })
  }, [agents, filter, query, sort])

  const zoneStats = useMemo(() => {
    const map = new Map<string, Agent[]>()
    for (const agent of agents) {
      map.set(agent.area, [...(map.get(agent.area) ?? []), agent])
    }
    return [...map.entries()]
      .map(([area, list]) => ({
        area,
        agents: list.length,
        float: list.reduce((sum, agent) => sum + agent.floatBalance, 0),
        online: list.filter((agent) => now - new Date(agent.lastSyncAt).getTime() < 45 * 60_000).length,
        attention: list.filter((agent) => agent.status !== 'healthy').length,
      }))
      .sort((a, b) => b.attention - a.attention || b.float - a.float)
  }, [agents, now])

  const latestEvents = events.slice(0, 5)

  return (
    <div className="space-y-5 pb-4">
      <PageHeader
        eyebrow="Real-time topology"
        title="Live network"
        description={`Every float position in ${operator.networkName}, mapped by health and synced in real time. Tap any agent to inspect their position.`}
        actions={
          <>
            <button
              type="button"
              onClick={() => exportAgents(agents, 'floatal-live-network.csv')}
              className="btn btn-ghost btn-sm h-9 rounded-full bg-white text-[10.5px]"
            >
              <Download size={12} /> Export
            </button>
            <div className="inline-flex h-9 items-center gap-2 rounded-full border border-healthy-500/20 bg-healthy-50 px-3 text-[10px] font-medium text-healthy-700">
              <Radio size={11} /> Receiving updates
            </div>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Float under management',
            value: formatCompactMoney(totalFloat),
            detail: `${agents.length} agents reporting`,
            icon: <ArrowUpRight size={13} />,
            cls: 'bg-mint-50 text-forest-700',
          },
          {
            label: 'Online now',
            value: `${online.length}/${agents.length}`,
            detail: `${agents.length - online.length} offline`,
            icon: <Wifi size={13} />,
            cls: 'bg-healthy-50 text-healthy-600',
          },
          {
            label: 'Need attention',
            value: String(attention.length),
            detail: `${attention.filter((agent) => agent.status === 'critical').length} critical`,
            icon: <CircleAlert size={13} />,
            cls: 'bg-warn-50 text-warn-600',
          },
          {
            label: 'Average reliability',
            value: `${avgReliability}%`,
            detail: 'Across network',
            icon: <ShieldCheck size={13} />,
            cls: 'bg-mint-50 text-forest-700',
          },
        ].map((item) => (
          <div key={item.label} className="ops-card flex items-center gap-3.5 px-4 py-3.5">
            <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', item.cls)}>
              {item.icon}
            </span>
            <div className="min-w-0">
              <div className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-muted/70">{item.label}</div>
              <div className="font-display tnum mt-1 text-[19px] font-medium leading-none tracking-[-0.035em] text-forest-900">{item.value}</div>
              <div className="mt-1 text-[8.5px] text-muted/55">{item.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <section className="overflow-hidden rounded-[24px] border border-forest-950/10 bg-forest-950 shadow-[0_24px_60px_-34px_rgba(5,31,24,0.65)]">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5">
            <div>
              <div className="flex items-center gap-2">
                <LiveBadge label="Live" className="border-white/10 bg-white/[0.06] text-[#B7EBD3]" />
                <span className="text-[8.5px] font-medium uppercase tracking-[0.13em] text-white/30">
                  {operator.networkName} · Accra
                </span>
              </div>
              <h2 className="font-display mt-1.5 text-[17px] font-medium tracking-[-0.03em] text-white/90">
                {filter === 'all' ? 'All agent positions' : `${statusLabel(filter)} positions`}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {statusFilters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={cx(
                    'rounded-full px-2.5 py-1 text-[9px] font-medium transition-colors',
                    filter === item.key
                      ? 'bg-white/15 text-white'
                      : 'border border-white/10 text-white/45 hover:bg-white/[0.06] hover:text-white/70',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <NetworkMap
              agents={filtered}
              selectedId={selected?.id}
              onSelect={(agentId) => setSelectedId(agentId)}
              className="h-[390px] w-full"
              showLabels
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#06271F] to-transparent" />
            <div className="absolute left-4 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[8.5px] text-white/60 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#78C9A4] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#78C9A4]" />
              </span>
              {filtered.length} positions shown
            </div>
            <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-3">
              {[
                { label: 'Healthy', color: 'bg-[#78C9A4]' },
                { label: 'Low', color: 'bg-gold-400' },
                { label: 'Critical', color: 'bg-[#F07A6B]' },
              ].map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5 text-[8.5px] text-white/45">
                  <span className={cx('h-1.5 w-1.5 rounded-full', item.color)} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {selected && (
            <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] bg-white/[0.025] px-5 py-3.5">
              <Avatar name={selected.name} hue={selected.avatarHue} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[11.5px] font-medium text-white/90">{selected.name}</span>
                  <StatusPill status={selected.status} onDark size="sm" />
                </div>
                <div className="mt-0.5 text-[9px] text-white/40">
                  {formatMoney(selected.floatBalance)} float · {selected.area} · {selected.distanceKm.toFixed(1)} km
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerAgentId(selected.id)}
                className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-1.5 text-[9.5px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                Inspect agent <ChevronRight size={10} />
              </button>
            </div>
          )}
        </section>

        <SectionCard
          title="Agent directory"
          subtitle={`${filtered.length} of ${agents.length} agents`}
          action={
            <span className="inline-flex items-center gap-1 text-[9px] text-muted/60">
              <Search size={9} /> Search
            </span>
          }
          bodyClassName="p-3"
        >
          <div className="relative">
            <Search size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted/55" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, area or phone"
              className="field h-9 rounded-full bg-cream/60 pl-8 text-[11px]"
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-1">
              {[
                { key: 'float' as SortMode, label: 'Float' },
                { key: 'attention' as SortMode, label: 'Attention' },
                { key: 'name' as SortMode, label: 'Name' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSort(item.key)}
                  className={cx(
                    'rounded-full px-2 py-1 text-[8.5px] font-medium transition-colors',
                    sort === item.key ? 'bg-forest-900 text-white' : 'text-muted hover:bg-cream',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="text-[8.5px] text-muted/55">
              {online.length} online
            </span>
          </div>

          <div className="mt-1 max-h-[314px] overflow-y-auto no-scrollbar">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-50 text-forest-600">
                  <Filter size={18} />
                </span>
                <div className="mt-3 text-[11.5px] font-medium text-forest-900">No agents match</div>
                <p className="mt-1 text-[9.5px] text-muted">Try a wider status filter or another search.</p>
                <button
                  type="button"
                  onClick={() => {
                    setFilter('all')
                    setQuery('')
                  }}
                  className="btn btn-ghost btn-sm mt-3 h-8 rounded-lg text-[9.5px]"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="divide-y divide-forest-900/[0.05]">
                {filtered.map((agent) => {
                  const isOnline = now - new Date(agent.lastSyncAt).getTime() < 45 * 60_000
                  const active = selected?.id === agent.id
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(agent.id)
                        setDrawerAgentId(agent.id)
                      }}
                      className={cx(
                        'flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left transition-colors',
                        active ? 'bg-mint-50' : 'hover:bg-cream/60',
                      )}
                    >
                      <span className="relative shrink-0">
                        <Avatar name={agent.name} hue={agent.avatarHue} size="sm" />
                        <span
                          className={cx(
                            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white',
                            isOnline ? 'bg-healthy-500' : 'bg-sand-400',
                          )}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[10.5px] font-medium text-forest-900">{agent.name}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[8.5px] text-muted">
                          <span>{agent.area}</span>
                          <span className="h-1 w-1 rounded-full bg-sand-300" />
                          <span className="tnum">{formatCompactMoney(agent.floatBalance)}</span>
                        </div>
                      </div>
                      <StatusPill status={agent.status} size="sm" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Coverage by zone"
          subtitle="Float and attention by Accra neighbourhood"
          bodyClassName="overflow-x-auto"
        >
          <table className="ops-table min-w-[540px]">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Agents</th>
                <th>Online</th>
                <th>Float</th>
                <th>Attention</th>
                <th className="text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {zoneStats.map((zone) => (
                <tr key={zone.area}>
                  <td>
                    <span className="inline-flex items-center gap-1.5 font-medium text-forest-900">
                      <MapPin size={11} className="text-forest-600/60" /> {zone.area}
                    </span>
                  </td>
                  <td className="text-muted">{zone.agents}</td>
                  <td>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted">
                      <Wifi size={9} className={zone.online ? 'text-healthy-500' : 'text-sand-400'} />
                      {zone.online}
                    </span>
                  </td>
                  <td className="tnum font-medium text-forest-900">{formatMoney(zone.float)}</td>
                  <td>
                    {zone.attention > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warn-50 px-2 py-0.5 text-[9px] font-medium text-warn-700">
                        <CircleAlert size={8} /> {zone.attention}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] text-healthy-600">
                        <ShieldCheck size={9} /> Clear
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="ml-auto flex w-[88px] items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-sand-100">
                        <div
                          className="h-full rounded-full bg-forest-600"
                          style={{ width: `${Math.max(4, (zone.float / Math.max(1, totalFloat)) * 100)}%` }}
                        />
                      </div>
                      <span className="w-6 text-[8.5px] text-muted">{Math.round((zone.float / Math.max(1, totalFloat)) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard
          title="Live signals"
          subtitle="Latest network telemetry"
          action={<LiveBadge label="Streaming" />}
          bodyClassName="px-4 py-1"
        >
          <div className="divide-y divide-forest-900/[0.055]">
            {latestEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-2.5 py-3">
                <span
                  className={cx(
                    'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                    event.type === 'flag'
                      ? 'bg-danger-500'
                      : event.type === 'complete' || event.type === 'accept' || event.type === 'confirm'
                        ? 'bg-healthy-500'
                        : event.type === 'request'
                          ? 'bg-warn-500'
                          : 'bg-forest-500',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[10px] font-medium text-forest-900">{event.title}</div>
                  <div className="mt-0.5 text-[8.5px] text-muted">
                    {event.detail} · {relativeTime(event.createdAt, now)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 border-t border-forest-900/[0.06] py-3 text-[8.5px] text-muted/50">
            <RefreshCw size={8} /> Updates stream in automatically
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-forest-900/[0.06] bg-white/55 px-4 py-3 text-[9px] text-muted/60">
        <span className="inline-flex items-center gap-1.5">
          <UsersRound size={10} /> {agents.length} agents in {operator.networkName} · {operator.currency}
        </span>
        <span className="inline-flex items-center gap-1.5">
          {online.length === agents.length ? <Wifi size={9} /> : <WifiOff size={9} />}
          {online.length} reporting within the last 45 minutes
        </span>
      </div>

      <AgentDrawer agentId={drawerAgentId} onClose={() => setDrawerAgentId(null)} />
    </div>
  )
}
