import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  ChevronRight,
  Clock3,
  Filter,
  ReceiptText,
  Wifi,
} from 'lucide-react'
import { Avatar, RequestPill, SyncChip } from '../components/ui'
import { useFloatal, useNow } from '../lib/hooks'
import {
  dayGroup,
  formatMoney,
  formatTime,
  relativeTime,
} from '../lib/format'
import { effectiveAgent } from '../lib/store'
import type { RebalanceRequest, RequestStatus } from '../lib/types'

type FilterKey = 'all' | RequestStatus

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'Completed' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'declined', label: 'Declined' },
]

export function AgentActivity() {
  const snapshot = useFloatal()
  const now = useNow(20_000)
  const raw = snapshot.data.agents.find((agent) => agent.id === snapshot.agentSession?.agentId)
  const [filter, setFilter] = useState<FilterKey>('all')
  if (!raw) return null
  const agent = effectiveAgent(raw, snapshot.queues[raw.id] ?? [])

  const requests = useMemo(
    () =>
      snapshot.data.requests
        .filter((request) => request.fromAgentId === agent.id || request.toAgentId === agent.id)
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [snapshot.data.requests, agent.id],
  )

  const counts = useMemo(() => {
    const result: Record<FilterKey, number> = {
      all: requests.length,
      pending: 0,
      accepted: 0,
      completed: 0,
      declined: 0,
      flagged: 0,
    }
    for (const request of requests) result[request.status] += 1
    return result
  }, [requests])

  const filtered = filter === 'all' ? requests : requests.filter((request) => request.status === filter)
  const groups = useMemo(() => {
    const map = new Map<string, RebalanceRequest[]>()
    for (const request of filtered) {
      const key = dayGroup(request.updatedAt, new Date(now))
      map.set(key, [...(map.get(key) ?? []), request])
    }
    return [...map.entries()]
  }, [filtered, now])

  const reports = useMemo(
    () =>
      snapshot.data.reports
        .filter((report) => report.agentId === agent.id)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 5),
    [snapshot.data.reports, agent.id],
  )

  const counterparty = (request: RebalanceRequest) =>
    snapshot.data.agents.find((candidate) =>
      candidate.id === (request.fromAgentId === agent.id ? request.toAgentId : request.fromAgentId),
    )

  const online = snapshot.online && !snapshot.offlineSimulated

  return (
    <div className="agent-page pt-safe">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-forest-700/60">
            <ReceiptText size={10} /> Ledger
          </div>
          <h1 className="font-display mt-1.5 text-[27px] font-medium leading-none tracking-[-0.045em] text-forest-900">
            Activity
          </h1>
        </div>
        <SyncChip online={online} syncing={snapshot.syncing} queued={snapshot.queues[agent.id]?.length ?? 0} compact />
      </header>
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted">
        Every request, confirmation and settlement on your account.
      </p>

      <div className="no-scrollbar -mx-5 mt-5 flex gap-1.5 overflow-x-auto px-5">
        {filters.map((item) => {
          const active = filter === item.key
          const count = counts[item.key]
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={
                active
                  ? 'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-forest-900 px-3 py-1.5 text-[10px] font-medium text-white'
                  : 'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-forest-900/[0.09] bg-white px-3 py-1.5 text-[10px] font-medium text-forest-800'
              }
            >
              {item.label}
              {count > 0 && (
                <span className={active ? 'text-white/50' : 'text-muted/50'}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        {filtered.length === 0 ? (
          filter === 'all' ? (
            <EmptyActivity />
          ) : (
            <div className="rounded-[20px] border border-forest-900/[0.07] bg-white px-4 py-9 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-50 text-forest-600">
                <Filter size={19} />
              </div>
              <p className="mt-3 text-[13px] font-medium text-forest-900">No {itemLabel(filter)} activity</p>
              <p className="mx-auto mt-1 max-w-[230px] text-[10.5px] leading-relaxed text-muted">
                Requests with this status will appear here as your network moves.
              </p>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="btn btn-ghost btn-sm mt-4"
              >
                Show all activity
              </button>
            </div>
          )
        ) : (
          <div className="space-y-5">
            {groups.map(([day, items]) => (
              <section key={day}>
                <div className="mb-1 flex items-center justify-between px-1">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted/60">{day}</span>
                  <span className="text-[9px] text-muted/40">{items.length} items</span>
                </div>
                <div className="divide-y divide-forest-900/[0.055]">
                  {items.map((request) => {
                    const other = counterparty(request)
                    const outgoing = request.fromAgentId === agent.id
                    const needsAction =
                      (request.status === 'pending' && !outgoing) ||
                      (request.status === 'accepted' &&
                        ((outgoing && !request.requesterConfirmed) ||
                          (!outgoing && !request.providerConfirmed)))
                    return (
                      <Link
                        key={request.id}
                        to={`/app/request/${request.id}`}
                        className="group flex items-center gap-3 py-3.5 transition-opacity active:opacity-60"
                      >
                        <span className="relative shrink-0">
                          <Avatar name={other?.name ?? 'Agent'} hue={other?.avatarHue} size="md" />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-paper ${
                              needsAction ? 'bg-gold-400 text-forest-950' : 'bg-mint-100 text-forest-700'
                            }`}
                          >
                            {needsAction ? (
                              <BellRing size={8} />
                            ) : outgoing ? (
                              <ArrowUpRight size={8} />
                            ) : (
                              <ArrowDownLeft size={8} />
                            )}
                          </span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[12px] font-medium tracking-[-0.015em] text-forest-900">
                              {outgoing ? 'To' : 'From'} {other?.name ?? 'agent'}
                            </span>
                            {needsAction && (
                              <span className="shrink-0 rounded-full bg-gold-400/15 px-1.5 py-0.5 text-[7.5px] font-semibold uppercase tracking-[0.06em] text-warn-700">
                                Action
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-muted">
                            <span className="tnum">{formatMoney(request.amount, request.currency)}</span>
                            <span className="text-sand-300">·</span>
                            <span>{request.reference}</span>
                            <span className="text-sand-300">·</span>
                            <span>{relativeTime(request.updatedAt, now)}</span>
                          </div>
                        </div>
                        <RequestPill status={request.status} size="sm" />
                        <ChevronRight size={13} className="shrink-0 text-sand-400/70" />
                      </Link>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {reports.length > 0 && (
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium tracking-[-0.01em] text-forest-900">Float reports</span>
            <span className="inline-flex items-center gap-1 text-[9px] text-muted/50">
              <Wifi size={9} /> Synced
            </span>
          </div>
          <div className="mt-1.5 divide-y divide-forest-900/[0.05]">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center gap-3 py-2.5">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    report.status === 'healthy'
                      ? 'bg-healthy-500'
                      : report.status === 'low'
                        ? 'bg-warn-500'
                        : 'bg-danger-500'
                  }`}
                />
                <span className="flex-1 text-[10.5px] text-forest-800">
                  {report.status === 'healthy' ? 'Healthy' : report.status === 'low' ? 'Low' : 'Critical'} float
                  reported
                </span>
                <span className="tnum text-[10.5px] font-medium text-forest-900">{formatMoney(report.balance, agent.currency)}</span>
                <span className="w-[50px] text-right text-[9px] text-muted/60">{relativeTime(report.createdAt, now)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 flex items-center justify-center gap-1.5 pb-2 text-[9px] text-muted/45">
        <Clock3 size={9} /> Times shown in GMT · {formatTime(new Date().toISOString())}
      </div>
    </div>
  )
}

function itemLabel(filter: FilterKey) {
  return filter === 'all' ? '' : filter
}

function EmptyActivity() {
  return (
    <div className="rounded-[22px] border border-forest-900/[0.07] bg-white px-5 py-9 text-center">
      <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-mint-200 bg-mint-50 text-forest-700">
        <ArrowRight size={22} />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold-400 text-[8px] font-semibold text-forest-950">
          0
        </span>
      </div>
      <p className="mt-4 text-[14px] font-medium text-forest-900">A clean slate</p>
      <p className="mx-auto mt-1 max-w-[230px] text-[10.5px] leading-relaxed text-muted">
        Your rebalancing history will appear here once you request or provide float.
      </p>
      <Link to="/app/network" className="btn btn-forest btn-sm mt-4">
        Find float nearby
      </Link>
    </div>
  )
}
