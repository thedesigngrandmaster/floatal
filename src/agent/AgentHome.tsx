import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  ChevronRight,
  CircleAlert,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wifi,
} from 'lucide-react'
import { Avatar, RequestPill, SectionHeading, StatusPill, SyncChip } from '../components/ui'
import { useAnimatedNumber, useFloatal, useNow } from '../lib/hooks'
import {
  availableExcess,
  clamp,
  formatAmount,
  formatCompactMoney,
  formatLongDate,
  formatMoney,
  greeting,
  relativeTime,
} from '../lib/format'
import { effectiveAgent, store, type StoreSnapshot } from '../lib/store'
import { useRequestFlow } from './requestFlow'
import { emitHaptic } from '../lib/toast'
import type { Agent, RebalanceRequest } from '../lib/types'

type ProviderEntry = { agent: Agent; excess: number; online: boolean }

export function AgentHome() {
  const snapshot = useFloatal()
  const now = useNow(20_000)
  const openRequest = useRequestFlow()
  const raw = snapshot.data.agents.find((agent) => agent.id === snapshot.agentSession?.agentId)
  if (!raw) return null
  const queue = snapshot.queues[raw.id] ?? []
  const agent = effectiveAgent(raw, queue)
  const animatedBalance = useAnimatedNumber(agent.floatBalance)
  const queued = queue.length

  const providers: ProviderEntry[] = snapshot.data.agents
    .filter((candidate) => candidate.id !== agent.id)
    .map((candidate) => {
      const reserved = snapshot.data.requests
        .filter((request) => request.toAgentId === candidate.id && request.status === 'accepted')
        .reduce((sum, request) => sum + request.amount, 0)
      return {
        agent: candidate,
        excess: Math.max(
          0,
          availableExcess(candidate.floatBalance, candidate.lowThreshold, candidate.targetFloat) - reserved,
        ),
        online: now - new Date(candidate.lastSyncAt).getTime() < 45 * 60_000,
      }
    })
    .filter((entry) => entry.excess >= 500)
    .sort((a, b) => Number(b.online) - Number(a.online) || a.agent.distanceKm - b.agent.distanceKm)

  const myRequests = snapshot.data.requests
    .filter((request) => request.fromAgentId === agent.id || request.toAgentId === agent.id)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))

  const actionable = myRequests.find((request) => {
    if (request.status === 'pending' && request.toAgentId === agent.id) return true
    if (request.status !== 'accepted') return false
    if (request.fromAgentId === agent.id && !request.requesterConfirmed) return true
    if (request.toAgentId === agent.id && !request.providerConfirmed) return true
    return false
  })

  const counterparty = (request: RebalanceRequest) =>
    snapshot.data.agents.find((candidate) =>
      candidate.id === (request.fromAgentId === agent.id ? request.toAgentId : request.fromAgentId),
    )

  const online = snapshot.online && !snapshot.offlineSimulated
  const statusLine =
    agent.status === 'healthy'
      ? `Above your ${formatMoney(agent.lowThreshold)} safety floor`
      : `${formatMoney(Math.max(0, agent.lowThreshold - agent.floatBalance))} below your ${formatMoney(agent.lowThreshold)} floor`
  const targetProgress = clamp((agent.floatBalance / Math.max(1, agent.targetFloat)) * 100, 0, 100)
  const lowMarker = clamp((agent.lowThreshold / Math.max(1, agent.targetFloat)) * 100, 0, 100)
  const firstName = agent.name.split(' ')[0]

  return (
    <>
      <HomeHeader agent={agent} snapshot={snapshot} />

      <div className="mt-6">
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.13em] text-muted/80">
          <span>{formatLongDate(new Date(now))}</span>
          <span className="inline-flex items-center gap-1.5 text-forest-700/60">
            <span className={online ? 'h-1.5 w-1.5 rounded-full bg-healthy-500' : 'h-1.5 w-1.5 rounded-full bg-warn-500'} />
            {online ? 'Connected' : 'Offline'}
          </span>
        </div>

        <h1 className="font-display mt-3 text-[27px] font-medium leading-[1.05] tracking-[-0.045em] text-forest-900">
          {greeting(new Date(now))}, {firstName}.
        </h1>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
          {agent.status === 'healthy'
            ? 'Your float is in good shape. Keep the network balanced.'
            : 'Your float is running light. There is liquidity close by.'}
        </p>
      </div>

      {actionable && (
        <ActionBanner
          request={actionable}
          partner={counterparty(actionable)}
        />
      )}

      <div className="mt-5">
        <HeroCard
          agent={agent}
          operatorName={snapshot.data.operator.name}
          animatedBalance={animatedBalance}
          targetProgress={targetProgress}
          lowMarker={lowMarker}
          statusLine={statusLine}
          queued={queued}
          syncing={snapshot.syncing}
          lastSync={raw.lastSyncAt}
          now={now}
        />
      </div>

      {queued > 0 && (
        <QueuedStrip
          count={queued}
          online={online}
          syncing={snapshot.syncing}
          onSync={() => void store.syncNow()}
        />
      )}

      <NearbySection providers={providers.slice(0, 4)} onRequest={openRequest} />
      <RecentSection
        requests={myRequests.slice(0, 3)}
        agentId={agent.id}
        counterparty={counterparty}
      />
      <HomeFooter />
    </>
  )
}

function ActionBanner({
  request,
  partner,
}: {
  request: RebalanceRequest
  partner: Agent | undefined
}) {
  const isIncoming = request.status === 'pending'
  return (
    <Link
      to={`/app/request/${request.id}`}
      onClick={() => emitHaptic(8)}
      className="group mt-4 flex items-center gap-3 rounded-[20px] border border-gold-400/35 bg-gradient-to-r from-gold-400/[0.13] to-gold-400/[0.04] p-3.5 transition-colors hover:border-gold-400/60"
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-400 text-forest-950">
        <BellRing size={16} strokeWidth={2.2} />
        <span className="absolute inset-0 animate-ping rounded-full border border-gold-400/50" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-warn-700/75">
          {isIncoming ? 'Incoming request' : 'Action needed'}
        </div>
        <div className="mt-0.5 truncate text-[12.5px] font-medium text-forest-900">
          {isIncoming
            ? `${partner?.name ?? 'An agent'} needs ${formatMoney(request.amount)}`
            : `Confirm your handover with ${partner?.name.split(' ')[0] ?? 'your partner'}`}
        </div>
      </div>
      <ChevronRight
        size={16}
        className="shrink-0 text-forest-700/50 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  )
}

function HomeHeader({ agent, snapshot }: { agent: Agent; snapshot: StoreSnapshot }) {
  const queued = snapshot.queues[agent.id]?.length ?? 0
  const online = snapshot.online && !snapshot.offlineSimulated
  return (
    <header className="pt-safe flex items-center justify-between gap-3">
      <Link to="/app/profile" className="flex min-w-0 items-center gap-3">
        <span className="relative">
          <Avatar name={agent.name} hue={agent.avatarHue} size="md" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-paper bg-healthy-500">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </span>
        <div className="min-w-0">
          <div className="text-[9.5px] font-medium uppercase tracking-[0.11em] text-muted/75">
            {snapshot.data.operator.name} · {agent.area}
          </div>
          <div className="mt-0.5 truncate text-[14px] font-medium tracking-[-0.02em] text-forest-900">
            {agent.name}
          </div>
        </div>
      </Link>
      <SyncChip online={online} syncing={snapshot.syncing} queued={queued} />
    </header>
  )
}

function HeroCard({
  agent,
  operatorName,
  animatedBalance,
  targetProgress,
  lowMarker,
  statusLine,
  queued,
  syncing,
  lastSync,
  now,
}: {
  agent: Agent
  operatorName: string
  animatedBalance: number
  targetProgress: number
  lowMarker: number
  statusLine: string
  queued: number
  syncing: boolean
  lastSync: string
  now: number
}) {
  const statusTone =
    agent.status === 'healthy' ? '#78C9A4' : agent.status === 'low' ? '#F5C518' : '#F07A6B'
  return (
    <section className="hero-halo relative overflow-hidden rounded-[26px] bg-forest-900 p-5 text-white shadow-[0_24px_60px_-24px_rgba(5,31,24,0.6)]">
      <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full border border-white/[0.07]" />
      <div className="pointer-events-none absolute -right-4 -top-8 h-28 w-28 rounded-full border border-gold-400/[0.12]" />
      <svg
        className="pointer-events-none absolute -bottom-10 right-0 h-36 w-36 opacity-[0.12]"
        viewBox="0 0 140 140"
        fill="none"
      >
        {[26, 48, 70].map((radius) => (
          <circle key={radius} cx="70" cy="70" r={radius} stroke="#A8DEC2" strokeWidth="0.75" />
        ))}
      </svg>

      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.07] px-2.5 py-1 text-[9.5px] font-medium text-white/65 backdrop-blur-sm">
          <Sparkles size={9} className="text-gold-400" />
          {operatorName} · {agent.area}
        </span>
        <StatusPill status={agent.status} onDark size="sm" />
      </div>

      <div className="relative mt-5">
        <div className="text-[9.5px] font-medium uppercase tracking-[0.15em] text-white/40">
          Available float
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-[12px] font-medium tracking-[0.02em] text-white/45">GHS</span>
          <span className="balance-display text-[47px] leading-none text-[#F7F5EF]">
            {formatAmount(animatedBalance)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-white/50">
          <span className="h-1 w-1 rounded-full" style={{ background: statusTone }} />
          {statusLine}
        </div>
      </div>

      <div className="relative mt-5">
        <div className="relative h-[5px] overflow-hidden rounded-full bg-white/[0.09]">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${Math.max(2, targetProgress)}%`,
              background: `linear-gradient(90deg, ${statusTone}99, ${statusTone})`,
            }}
          />
          <span
            className="absolute top-1/2 h-2 w-[1.5px] -translate-y-1/2 rounded-full bg-white/30"
            style={{ left: `${lowMarker}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[9.5px] text-white/35">
          <span>{Math.round(targetProgress)}% of float target</span>
          <span>{formatMoney(agent.targetFloat)} target</span>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-3.5">
        <div>
          <div className="text-[8.5px] font-medium uppercase tracking-[0.13em] text-white/30">
            {queued > 0 ? 'Saved offline' : 'Last report'}
          </div>
          <div className="mt-0.5 text-[11px] font-medium text-white/70">
            {relativeTime(agent.lastReportAt, now)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8.5px] font-medium uppercase tracking-[0.13em] text-white/30">Sync</div>
          <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-white/70">
            {syncing ? (
              <RefreshCw size={10} className="animate-spin text-mint-300" />
            ) : queued > 0 ? (
              <CircleAlert size={10} className="text-gold-400" />
            ) : (
              <Wifi size={10} className="text-mint-300" />
            )}
            {syncing
              ? 'Syncing now'
              : queued > 0
                ? `${queued} waiting`
                : `Synced ${relativeTime(lastSync, now).toLowerCase()}`}
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex gap-2">
        <Link
          to="/app/report"
          className="btn btn-gold h-11 flex-1 text-[12.5px]"
          onClick={() => emitHaptic(8)}
        >
          Report float
        </Link>
        <Link
          to="/app/network"
          className="btn btn-glass h-11 flex-1 text-[12.5px]"
          onClick={() => emitHaptic(8)}
        >
          Find float <ArrowUpRight size={13} className="text-gold-400" />
        </Link>
      </div>
    </section>
  )
}

function QueuedStrip({
  count,
  online,
  syncing,
  onSync,
}: {
  count: number
  online: boolean
  syncing: boolean
  onSync: () => void
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-[16px] border border-warn-100 bg-warn-50/80 px-3.5 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warn-500/12 text-warn-700">
          <RefreshCw size={12} />
        </span>
        <div>
          <div className="text-[10.5px] font-medium text-warn-700">
            {count} report{count === 1 ? '' : 's'} waiting to sync
          </div>
          <div className="text-[9.5px] text-warn-700/60">
            {online ? 'Connection restored — ready to send.' : 'Saved securely on this device.'}
          </div>
        </div>
      </div>
      {online && (
        <button
          type="button"
          onClick={onSync}
          disabled={syncing}
          className="rounded-full bg-white px-2.5 py-1.5 text-[10px] font-medium text-warn-700 shadow-sm disabled:opacity-50"
        >
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      )}
    </div>
  )
}

function NearbySection({
  providers,
  onRequest,
}: {
  providers: ProviderEntry[]
  onRequest: (agent: Agent) => void
}) {
  return (
    <section className="mt-7">
      <SectionHeading
        title="Float near you"
        subtitle="Agents with available liquidity"
        action={
          <Link
            to="/app/network"
            className="inline-flex items-center gap-1 text-[10.5px] font-medium text-forest-700"
          >
            See all <ArrowRight size={11} />
          </Link>
        }
      />
      {providers.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-forest-900/7 bg-white p-4">
          <p className="text-[12px] font-medium text-forest-900">No float available nearby</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
            We will notify you when an agent opens capacity in your area.
          </p>
        </div>
      ) : (
        <div className="no-scrollbar -mx-5 mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-1">
          {providers.map((entry, index) => (
            <button
              key={entry.agent.id}
              type="button"
              onClick={() => onRequest(entry.agent)}
              className="group relative w-[178px] shrink-0 snap-start overflow-hidden rounded-[19px] border border-forest-900/[0.07] bg-white p-3.5 text-left shadow-[0_8px_24px_-18px_rgba(13,34,26,0.3)] transition-transform active:scale-[0.98]"
            >
              {index === 0 && entry.online && (
                <span className="absolute right-3 top-3 rounded-full bg-gold-400/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-warn-700">
                  Best
                </span>
              )}
              <div className="flex items-center gap-2.5">
                <Avatar name={entry.agent.name} hue={entry.agent.avatarHue} size="sm" />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium tracking-[-0.01em] text-forest-900">
                    {entry.agent.name.split(' ')[0]} {entry.agent.name.split(' ')[1]?.[0]}.
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[9px] text-muted">
                    <span
                      className={
                        entry.online ? 'h-1 w-1 rounded-full bg-healthy-500' : 'h-1 w-1 rounded-full bg-warn-500'
                      }
                    />
                    {entry.agent.area} · {entry.agent.distanceKm.toFixed(1)} km
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-forest-900/[0.055] pt-2.5">
                <div>
                  <div className="text-[8px] font-medium uppercase tracking-[0.1em] text-muted/70">
                    Excess
                  </div>
                  <div className="tnum mt-0.5 text-[13px] font-medium tracking-[-0.02em] text-forest-900">
                    {formatCompactMoney(entry.excess)}
                  </div>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-900 text-gold-400 transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRight size={13} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function RecentSection({
  requests,
  agentId,
  counterparty,
}: {
  requests: RebalanceRequest[]
  agentId: string
  counterparty: (request: RebalanceRequest) => Agent | undefined
}) {
  return (
    <section className="mt-7">
      <SectionHeading
        title="Recent activity"
        action={
          <Link
            to="/app/activity"
            className="inline-flex items-center gap-1 text-[10.5px] font-medium text-forest-700"
          >
            All activity <ArrowRight size={11} />
          </Link>
        }
      />
      {requests.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-forest-900/7 bg-white px-4 py-5">
          <p className="text-[12px] font-medium text-forest-900">No rebalancing yet</p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
            When you request float, every step will be recorded here.
          </p>
        </div>
      ) : (
        <div className="mt-2 divide-y divide-forest-900/[0.055]">
          {requests.map((request) => {
            const other = counterparty(request)
            const outgoing = request.fromAgentId === agentId
            return (
              <Link
                key={request.id}
                to={`/app/request/${request.id}`}
                className="flex items-center gap-3 py-3 transition-opacity active:opacity-60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint-50 text-forest-700">
                  {outgoing ? <ArrowUpRight size={14} /> : <ArrowRight size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-medium text-forest-900">
                    {outgoing ? 'Request to' : 'Request from'} {other?.name.split(' ')[0] ?? 'agent'}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-muted">
                    <span className="tnum">{formatMoney(request.amount)}</span>
                    <span className="text-sand-300">·</span>
                    <span>{relativeTime(request.updatedAt)}</span>
                  </div>
                </div>
                <RequestPill status={request.status} size="sm" />
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

function HomeFooter() {
  return (
    <>
      <div className="mt-7 flex items-start gap-3 rounded-[18px] border border-forest-900/[0.06] bg-mint-50/60 px-3.5 py-3.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-forest-700 shadow-sm">
          <ShieldCheck size={13} />
        </span>
        <p className="text-[10px] leading-relaxed text-forest-800/70">
          Every float movement is confirmed by both agents before it settles. Floatal keeps your position and
          history reconciled.
        </p>
      </div>
      <div className="mt-5 flex items-center justify-center gap-1.5 pb-2 text-[9px] uppercase tracking-[0.14em] text-muted/40">
        <MapPin size={9} /> {formatLongDate()} · Osu, Accra
      </div>
    </>
  )
}
