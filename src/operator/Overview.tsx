import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Flag,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
  Wallet,
  Wifi,
} from 'lucide-react'
import { Avatar, Donut, RequestPill, StatusPill } from '../components/ui'
import { useAnimatedNumber, useFloatal, useNow } from '../lib/hooks'
import {
  cx,
  formatCompactMoney,
  formatLongDate,
  formatMoney,
  greeting,
  relativeTime,
  statusLabel,
} from '../lib/format'
import type { ActivityEvent, Agent } from '../lib/types'
import {
  AgentDrawer,
  InviteAgentDialog,
  LiveBadge,
  MetricCard,
  PageHeader,
  RequestDrawer,
  SectionCard,
  downloadCsv,
} from './OperatorParts'

export function Overview() {
  const snapshot = useFloatal()
  const now = useNow(25_000)
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agt_ama')
  const [drawerAgentId, setDrawerAgentId] = useState<string | null>(null)
  const [drawerRequestId, setDrawerRequestId] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const { agents, requests, events, operator, reports } = snapshot.data
  const totalFloat = agents.reduce((sum, agent) => sum + agent.floatBalance, 0)
  const animatedFloat = useAnimatedNumber(totalFloat)
  const onlineAgents = agents.filter((agent) => now - new Date(agent.lastSyncAt).getTime() < 45 * 60_000)
  const attention = agents.filter((agent) => agent.status !== 'healthy')
  const openRequests = requests.filter((request) => request.status === 'pending' || request.status === 'accepted')
  const openValue = openRequests.reduce((sum, request) => sum + request.amount, 0)
  const completed = requests.filter((request) => request.status === 'completed')
  const closed = requests.filter((request) => request.status === 'completed' || request.status === 'declined')
  const reconciledRate = closed.length ? Math.round((completed.length / closed.length) * 100) : 100
  const selected = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0]
  const healthy = agents.filter((agent) => agent.status === 'healthy')
  const low = agents.filter((agent) => agent.status === 'low')
  const critical = agents.filter((agent) => agent.status === 'critical')
  const healthyFloat = healthy.reduce((sum, agent) => sum + agent.floatBalance, 0)
  const lowFloat = low.reduce((sum, agent) => sum + agent.floatBalance, 0)
  const criticalFloat = critical.reduce((sum, agent) => sum + agent.floatBalance, 0)
  const recentReports = [...reports]
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .slice(-14)
    .map((report) => report.balance)
  const requestSeries = [...requests]
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .slice(-10)
    .map((request) => request.amount)

  const exportOverview = () => {
    downloadCsv('floatal-network-overview.csv', [
      {
        operator: operator.name,
        network: operator.networkName,
        exported_at: new Date().toISOString(),
        agents: agents.length,
        online_agents: onlineAgents.length,
        total_float_ghs: totalFloat,
        healthy_agents: healthy.length,
        low_agents: low.length,
        critical_agents: critical.length,
        open_requests: openRequests.length,
        open_request_value_ghs: openValue,
        reconciled_rate_pct: reconciledRate,
      },
    ])
  }

  return (
    <div className="space-y-5 pb-4">
      <PageHeader
        eyebrow={formatLongDate(new Date(now))}
        title={`${greeting(new Date(now))}, Adjoa.`}
        description={`${operator.name} is live across ${operator.networkName}. ${
          attention.length === 0
            ? 'Every agent is reporting a healthy position.'
            : `${attention.length} agent${attention.length === 1 ? '' : 's'} need attention before the afternoon peak.`
        }`}
        actions={
          <>
            <button
              type="button"
              onClick={exportOverview}
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
          label="Float under management"
          value={formatCompactMoney(animatedFloat)}
          hint={`${formatCompactMoney(agents.reduce((sum, agent) => sum + agent.todayVolume, 0))} volume today`}
          delta={{ label: '+4.2%', direction: 'up' }}
          icon={<Wallet size={14} />}
          spark={recentReports.length > 1 ? recentReports : agents.map((agent) => agent.floatBalance)}
        />
        <MetricCard
          label="Agents online"
          value={`${onlineAgents.length}/${agents.length}`}
          hint={`${attention.length} need attention`}
          delta={{ label: onlineAgents.length === agents.length ? 'All online' : 'Live', direction: 'flat' }}
          icon={<Wifi size={14} />}
          tone={onlineAgents.length < agents.length ? 'warn' : 'healthy'}
        />
        <MetricCard
          label="Open rebalancing"
          value={String(openRequests.length)}
          hint={`${formatCompactMoney(openValue)} in motion`}
          delta={{ label: openRequests.filter((request) => request.status === 'pending').length ? 'Action needed' : 'On track', direction: 'flat' }}
          icon={<RefreshCw size={14} />}
          tone={openRequests.length > 0 ? 'gold' : 'default'}
          spark={requestSeries.length > 1 ? requestSeries : undefined}
        />
        <MetricCard
          label="Two-sided reconciliation"
          value={`${reconciledRate}%`}
          hint={`${completed.length} settled requests`}
          delta={{ label: 'On target', direction: 'up' }}
          icon={<ShieldCheck size={14} />}
          tone="healthy"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <section className="relative overflow-hidden rounded-[24px] border border-forest-950/10 bg-forest-950 shadow-[0_24px_60px_-34px_rgba(5,31,24,0.65)]">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-1 pt-5">
            <div>
              <div className="flex items-center gap-2">
                <LiveBadge label="Live network" className="border-white/10 bg-white/[0.06] text-[#B7EBD3]" />
                <span className="text-[8.5px] font-medium uppercase tracking-[0.13em] text-white/30">
                  {operator.networkName}
                </span>
              </div>
              <h2 className="font-display mt-2 text-[18px] font-medium tracking-[-0.03em] text-white/90">
                Network pulse
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: 'Healthy', color: 'bg-[#78C9A4]' },
                { label: 'Low', color: 'bg-gold-400' },
                { label: 'Critical', color: 'bg-[#F07A6B]' },
              ].map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5 text-[8.5px] text-white/40">
                  <span className={cx('h-1.5 w-1.5 rounded-full', item.color)} />
                  {item.label}
                </span>
              ))}
              <Link
                to="/ops/network"
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[9px] font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                Open map <ArrowUpRight size={10} />
              </Link>
            </div>
          </div>

          <div className="relative mt-1">
            <NetworkOverviewMap
              agents={agents}
              selectedId={selected?.id}
              onSelect={(agentId) => setSelectedAgentId(agentId)}
            />

            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-[18px] border border-white/10 bg-[#08271f]/88 p-3 backdrop-blur-xl"
              >
                <Avatar name={selected.name} hue={selected.avatarHue} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[12px] font-medium text-white">{selected.name}</span>
                    <span className="text-[8px] text-white/30">{selected.businessName}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-white/45">
                    <MapPin size={8} /> {selected.area}
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>{formatMoney(selected.floatBalance)} float</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>{selected.reliability}% reliability</span>
                  </div>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <StatusPill status={selected.status} onDark size="sm" />
                  <button
                    type="button"
                    onClick={() => setDrawerAgentId(selected.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label={`Open ${selected.name}`}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06] bg-white/[0.02]">
            {[
              { label: 'Online now', value: `${onlineAgents.length} agents` },
              { label: 'Open requests', value: `${openRequests.length} Â· ${formatCompactMoney(openValue)}` },
              { label: 'Healthy float', value: formatCompactMoney(healthyFloat) },
            ].map((item) => (
              <div key={item.label} className="px-4 py-3">
                <div className="text-[7.5px] font-medium uppercase tracking-[0.12em] text-white/28">{item.label}</div>
                <div className="tnum mt-1 text-[11.5px] font-medium text-white/70">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        <SectionCard
          title="Needs attention"
          subtitle="Agents below their safety floor"
          action={
            <Link to="/ops/agents" className="inline-flex items-center gap-1 text-[10px] font-medium text-forest-700">
              All agents <ArrowRight size={10} />
            </Link>
          }
          bodyClassName="p-2"
        >
          {attention.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-healthy-50 text-healthy-600">
                <CheckCircle2 size={20} />
              </span>
              <div className="mt-3 text-[12px] font-medium text-forest-900">Every agent is healthy</div>
              <p className="mt-1 max-w-[220px] text-[10px] leading-relaxed text-muted">
                All reported balances are above their low-float floor. The network is calm.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-forest-900/[0.05]">
              {attention.slice(0, 5).map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setDrawerAgentId(agent.id)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-cream/70"
                >
                  <Avatar name={agent.name} hue={agent.avatarHue} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-medium text-forest-900">{agent.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-muted">
                      <span>{agent.area}</span>
                      <span className="h-1 w-1 rounded-full bg-sand-300" />
                      <span>{relativeTime(agent.lastReportAt, now)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tnum text-[11px] font-medium text-forest-900">{formatCompactMoney(agent.floatBalance)}</div>
                    <div className="mt-0.5"><StatusPill status={agent.status} size="sm" /></div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="mt-1 rounded-xl bg-cream/60 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[8.5px] font-medium uppercase tracking-[0.1em] text-muted/60">
                Liquidity coverage
              </span>
              <span className="text-[9.5px] font-medium text-forest-800">
                {formatCompactMoney(healthyFloat)} available
              </span>
            </div>
            <div className="mt-2 flex h-1.5 gap-1 overflow-hidden rounded-full">
              <span className="rounded-full bg-healthy-500" style={{ width: `${Math.max(4, (healthyFloat / Math.max(1, totalFloat)) * 100)}%` }} />
              <span className="rounded-full bg-warn-500" style={{ width: `${Math.max(2, (lowFloat / Math.max(1, totalFloat)) * 100)}%` }} />
              <span className="rounded-full bg-danger-500" style={{ width: `${Math.max(2, (criticalFloat / Math.max(1, totalFloat)) * 100)}%` }} />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Open rebalancing"
          subtitle={`${openRequests.length} requests Â· ${formatCompactMoney(openValue)} in motion`}
          action={
            <Link to="/ops/rebalancing" className="inline-flex items-center gap-1 text-[10px] font-medium text-forest-700">
              View all <ArrowRight size={10} />
            </Link>
          }
          bodyClassName="overflow-x-auto"
        >
          {openRequests.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-50 text-forest-600">
                <Check size={19} />
              </span>
              <div className="mt-3 text-[12px] font-medium text-forest-900">No open requests</div>
              <p className="mx-auto mt-1 max-w-[240px] text-[10px] leading-relaxed text-muted">
                Every float movement has been accepted or reconciled. New requests appear here instantly.
              </p>
            </div>
          ) : (
            <table className="ops-table min-w-[580px]">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Route</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-right">Age</th>
                </tr>
              </thead>
              <tbody>
                {openRequests.slice(0, 6).map((request) => {
                  const requester = agents.find((agent) => agent.id === request.fromAgentId)
                  const provider = agents.find((agent) => agent.id === request.toAgentId)
                  return (
                    <tr key={request.id} className="cursor-pointer" onClick={() => setDrawerRequestId(request.id)}>
                      <td>
                        <div className="font-medium text-forest-900">{request.reference}</div>
                        <div className="mt-0.5 text-[9px] text-muted">{request.status === 'pending' ? 'Awaiting provider' : 'In reconciliation'}</div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Avatar name={requester?.name ?? 'R'} hue={requester?.avatarHue} size="xs" />
                          <ArrowRight size={10} className="text-muted/40" />
                          <Avatar name={provider?.name ?? 'P'} hue={provider?.avatarHue} size="xs" />
                          <div className="ml-1">
                            <div className="text-[10px] font-medium text-forest-800">{requester?.name.split(' ')[0]}</div>
                            <div className="text-[8.5px] text-muted">{provider?.name.split(' ')[0]}</div>
                          </div>
                        </div>
                      </td>
                      <td className="tnum font-medium text-forest-900">{formatMoney(request.amount)}</td>
                      <td><RequestPill status={request.status} size="sm" /></td>
                      <td className="text-right text-[9.5px] text-muted">{relativeTime(request.updatedAt, now)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </SectionCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <SectionCard title="Liquidity split" subtitle="Reported float by health">
            <div className="flex items-center gap-5 px-5 py-5">
              <Donut
                segments={[
                  { value: healthyFloat, color: '#1E8E63' },
                  { value: lowFloat, color: '#F5C518' },
                  { value: criticalFloat, color: '#C94A3C' },
                ]}
                size={122}
                thickness={10}
                trackColor="#EEF1EC"
              >
                <div className="text-center">
                  <div className="font-display tnum text-[20px] font-medium leading-none tracking-[-0.04em] text-forest-900">
                    {formatCompactMoney(totalFloat)}
                  </div>
                  <div className="mt-1 text-[8px] font-medium uppercase tracking-[0.1em] text-muted/60">Total float</div>
                </div>
              </Donut>
              <div className="min-w-0 flex-1 space-y-3">
                {[
                  { label: 'Healthy', value: healthyFloat, count: healthy.length, color: 'bg-healthy-500', text: 'text-healthy-700' },
                  { label: 'Low float', value: lowFloat, count: low.length, color: 'bg-warn-500', text: 'text-warn-700' },
                  { label: 'Critical', value: criticalFloat, count: critical.length, color: 'bg-danger-500', text: 'text-danger-700' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-[10px] text-muted">
                      <span className={cx('h-1.5 w-1.5 rounded-full', item.color)} />
                      {item.label}
                    </span>
                    <span className="text-right">
                      <span className={cx('block text-[10.5px] font-medium', item.text)}>{formatCompactMoney(item.value)}</span>
                      <span className="block text-[8.5px] text-muted/55">{item.count} agents</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Today's reconciliation" subtitle="Two-sided settlement health">
            <div className="grid grid-cols-3 divide-x divide-forest-900/[0.06]">
              {[
                { label: 'Settled', value: String(completed.length), tone: 'text-healthy-700' },
                { label: 'Open', value: String(openRequests.length), tone: 'text-warn-700' },
                { label: 'Flagged', value: String(requests.filter((request) => request.status === 'flagged').length), tone: 'text-danger-600' },
              ].map((item) => (
                <div key={item.label} className="px-4 py-4">
                  <div className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted/60">{item.label}</div>
                  <div className={cx('font-display tnum mt-1 text-[21px] font-medium tracking-[-0.03em]', item.tone)}>{item.value}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-forest-900/[0.06] px-5 py-3">
              <div className="flex items-center justify-between text-[9px] text-muted">
                <span>Completed only after both agents confirm</span>
                <span className="font-medium text-forest-800">{reconciledRate}%</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-sand-100">
                <div className="h-full rounded-full bg-forest-700" style={{ width: `${reconciledRate}%` }} />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Activity stream"
          subtitle="Reports, requests and confirmations as they happen"
          action={<LiveBadge label="Live" />}
          bodyClassName="px-5 py-1"
        >
          <div className="divide-y divide-forest-900/[0.055]">
            {events.slice(0, 7).map((event) => (
              <EventRow
                key={event.id}
                event={event}
                agents={agents}
                now={now}
                onOpenRequest={(requestId) => setDrawerRequestId(requestId)}
                onOpenAgent={(agentId) => setDrawerAgentId(agentId)}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Agent reliability"
          subtitle="Top agents by reported consistency"
          action={
            <Link to="/ops/agents" className="inline-flex items-center gap-1 text-[10px] font-medium text-forest-700">
              Directory <ArrowRight size={10} />
            </Link>
          }
          bodyClassName="p-2"
        >
          <div className="divide-y divide-forest-900/[0.05]">
            {[...agents]
              .sort((a, b) => b.reliability - a.reliability || b.todayVolume - a.todayVolume)
              .slice(0, 5)
              .map((agent, index) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setDrawerAgentId(agent.id)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-cream/70"
                >
                  <span className="w-3 text-[9px] font-medium text-muted/45">{index + 1}</span>
                  <Avatar name={agent.name} hue={agent.avatarHue} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-medium text-forest-900">{agent.name}</div>
                    <div className="mt-0.5 text-[9px] text-muted">
                      {formatCompactMoney(agent.todayVolume)} volume Â· {agent.area}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10.5px] font-medium text-forest-800">{agent.reliability}%</div>
                    <div className="text-[8.5px] text-muted/55">reliable</div>
                  </div>
                </button>
              ))}
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-forest-900/[0.06] bg-white/55 px-4 py-3 text-[9px] text-muted/60">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={10} /> Every operator action is captured in the reconciliation audit trail.
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 size={9} /> Live view refreshes automatically Â· {formatLongDate(new Date(now))}
        </span>
      </div>

      <AgentDrawer agentId={drawerAgentId} onClose={() => setDrawerAgentId(null)} />
      <RequestDrawer requestId={drawerRequestId} onClose={() => setDrawerRequestId(null)} />
      <InviteAgentDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}

function NetworkOverviewMap({
  agents,
  selectedId,
  onSelect,
}: {
  agents: Agent[]
  selectedId?: string
  onSelect: (agentId: string) => void
}) {
  const statusColor = { healthy: '#7ED0A9', low: '#F5C518', critical: '#F07A6B' }
  const toPoint = (agent: Agent) => ({ x: 42 + agent.position.x * 5.6, y: 22 + agent.position.y * 3.1 })
  return (
    <div className="relative h-[310px] w-full">
      <div className="absolute inset-0 map-grid opacity-70" />
      <svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-label="Live agent map">
        <defs>
          <radialGradient id="overview-glow" cx="55%" cy="45%" r="62%">
            <stop offset="0%" stopColor="#0F6B50" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0C4232" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="overview-coast" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A8DEC2" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#A8DEC2" stopOpacity="0.015" />
          </linearGradient>
        </defs>
        <rect width="640" height="360" fill="url(#overview-glow)" />
        <path d="M392 372 C 430 326 496 310 528 272 C 558 236 568 196 622 174 L 660 160 L 660 372 Z" fill="url(#overview-coast)" />
        <path d="M392 372 C 430 326 496 310 528 272 C 558 236 568 196 622 174 L 660 160" fill="none" stroke="#A8DEC2" strokeOpacity="0.2" strokeWidth="1" />
        <g fill="none" stroke="#A8DEC2" strokeLinecap="round">
          <path d="M-20 286 C 110 252 168 264 268 208 C 362 155 454 176 680 116" strokeOpacity="0.13" strokeWidth="10" />
          <path d="M-20 286 C 110 252 168 264 268 208 C 362 155 454 176 680 116" strokeOpacity="0.25" strokeWidth="1" />
          <path d="M86 -16 C 112 86 172 132 246 176 C 318 220 346 286 372 396" strokeOpacity="0.12" strokeWidth="7" />
          <path d="M86 -16 C 112 86 172 132 246 176 C 318 220 346 286 372 396" strokeOpacity="0.2" strokeWidth="1" />
          <path d="M-20 142 C 94 150 162 182 228 244 C 286 300 360 306 460 316" strokeOpacity="0.09" strokeWidth="5" />
          <path d="M260 -10 C 276 74 340 112 402 154 C 476 204 520 260 560 372" strokeOpacity="0.1" strokeWidth="4" />
          <circle cx="286" cy="208" r="42" strokeOpacity="0.12" strokeDasharray="2 6" />
          <circle cx="286" cy="208" r="78" strokeOpacity="0.08" strokeDasharray="2 7" />
        </g>
        <g opacity="0.4">
          <text x="34" y="334" fill="#A8DEC2" fontSize="8" letterSpacing="2.4" fontFamily="Manrope, sans-serif">ACCRA METRO</text>
          <text x="34" y="347" fill="#A8DEC2" fontSize="7" letterSpacing="0.8" opacity="0.6" fontFamily="Manrope, sans-serif">5.560Â° N Â· 0.196Â° W</text>
        </g>
        {agents.map((agent) => {
          const point = toPoint(agent)
          const selected = selectedId === agent.id
          const color = statusColor[agent.status]
          return (
            <g
              key={agent.id}
              role="button"
              tabIndex={0}
              aria-label={`${agent.name}, ${statusLabel(agent.status)}`}
              onClick={() => onSelect(agent.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onSelect(agent.id)
              }}
              className="cursor-pointer"
            >
              <circle cx={point.x} cy={point.y} r={selected ? 20 : 14} fill={color} opacity="0.09" />
              <circle cx={point.x} cy={point.y} r={selected ? 13 : 9} fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="1" />
              <circle cx={point.x} cy={point.y} r={selected ? 7 : 5.5} fill={color} stroke="#06271F" strokeWidth="2.5" />
              {selected && (
                <circle cx={point.x} cy={point.y} r="18" fill="none" stroke={color} strokeOpacity="0.4" strokeWidth="1.5">
                  <animate attributeName="r" values="12;23" dur="2.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.45;0" dur="2.8s" repeatCount="indefinite" />
                </circle>
              )}
              <text
                x={point.x}
                y={point.y + (selected ? 28 : 23)}
                textAnchor="middle"
                fill={selected ? '#F7F5EF' : '#D7EFE3'}
                fontSize={selected ? 7.5 : 6}
                letterSpacing="0.7"
                opacity={selected ? 1 : 0.7}
                fontFamily="Manrope, sans-serif"
              >
                {agent.name.split(' ')[0].toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="absolute left-4 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-[8.5px] text-white/60 backdrop-blur-md">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#78C9A4] opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#78C9A4]" />
        </span>
        Tap an agent to inspect
      </div>
    </div>
  )
}

function EventRow({
  event,
  agents,
  now,
  onOpenRequest,
  onOpenAgent,
}: {
  event: ActivityEvent
  agents: Agent[]
  now: number
  onOpenRequest: (requestId: string) => void
  onOpenAgent: (agentId: string) => void
}) {
  const agent = agents.find((candidate) => candidate.id === event.agentId)
  const meta = {
    report: { icon: ArrowDownLeft, cls: 'bg-mint-50 text-forest-700' },
    request: { icon: ArrowUpRight, cls: 'bg-warn-50 text-warn-600' },
    sync: { icon: RefreshCw, cls: 'bg-mint-50 text-forest-600' },
    complete: { icon: Check, cls: 'bg-healthy-50 text-healthy-600' },
    confirm: { icon: Check, cls: 'bg-healthy-50 text-healthy-600' },
    accept: { icon: CheckCircle2, cls: 'bg-healthy-50 text-healthy-600' },
    decline: { icon: Clock3, cls: 'bg-sand-100 text-muted' },
    flag: { icon: Flag, cls: 'bg-danger-50 text-danger-600' },
    threshold: { icon: BellRing, cls: 'bg-warn-50 text-warn-600' },
    join: { icon: UsersRound, cls: 'bg-mint-50 text-forest-700' },
  }[event.type] ?? { icon: Sparkles, cls: 'bg-sand-100 text-muted' }
  const Icon = meta.icon
  return (
    <div className="flex items-center gap-3 py-3">
      <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', meta.cls)}>
        <Icon size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-medium text-forest-900">{event.title}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-muted">
          {event.detail && <span className="truncate">{event.detail}</span>}
          {event.detail && <span className="h-1 w-1 rounded-full bg-sand-300" />}
          <span className="shrink-0">{relativeTime(event.createdAt, now)}</span>
        </div>
      </div>
      {event.requestId ? (
        <button
          type="button"
          onClick={() => onOpenRequest(event.requestId as string)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted/45 transition-colors hover:bg-cream hover:text-forest-800"
          aria-label="Open request"
        >
          <ChevronRight size={13} />
        </button>
      ) : event.agentId && agent ? (
        <button
          type="button"
          onClick={() => onOpenAgent(agent.id)}
          className="shrink-0"
          aria-label={`Open ${agent.name}`}
        >
          <Avatar name={agent.name} hue={agent.avatarHue} size="xs" />
        </button>
      ) : null}
    </div>
  )
}
