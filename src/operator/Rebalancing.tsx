import { useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  Filter,
  Flag,
  Inbox,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { Avatar, RequestPill } from '../components/ui'
import { useFloatal, useNow } from '../lib/hooks'
import {
  cx,
  formatCompactMoney,
  formatMoney,
  relativeTime,
} from '../lib/format'
import type { RebalanceRequest, RequestStatus } from '../lib/types'
import {
  LiveBadge,
  MetricCard,
  PageHeader,
  RequestDrawer,
  SectionCard,
  exportRequests,
} from './OperatorParts'

type FilterKey = 'all' | RequestStatus

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All requests' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'In reconciliation' },
  { key: 'completed', label: 'Completed' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'declined', label: 'Declined' },
]

export function Rebalancing() {
  const snapshot = useFloatal()
  const now = useNow(20_000)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'recent' | 'amount'>('recent')
  const [drawerRequestId, setDrawerRequestId] = useState<string | null>(null)

  const { requests, agents } = snapshot.data
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

  const open = requests.filter((request) => request.status === 'pending' || request.status === 'accepted')
  const openValue = open.reduce((sum, request) => sum + request.amount, 0)
  const pendingValue = requests
    .filter((request) => request.status === 'pending')
    .reduce((sum, request) => sum + request.amount, 0)
  const settledValue = requests
    .filter((request) => request.status === 'completed')
    .reduce((sum, request) => sum + request.amount, 0)
  const flagged = requests.filter((request) => request.status === 'flagged')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return requests
      .filter((request) => filter === 'all' || request.status === filter)
      .filter((request) => {
        if (!normalized) return true
        const requester = agents.find((agent) => agent.id === request.fromAgentId)
        const provider = agents.find((agent) => agent.id === request.toAgentId)
        return `${request.reference} ${requester?.name ?? ''} ${provider?.name ?? ''} ${request.note ?? ''} ${request.flagReason ?? ''}`
          .toLowerCase()
          .includes(normalized)
      })
      .sort((a, b) =>
        sort === 'amount' ? b.amount - a.amount : +new Date(b.updatedAt) - +new Date(a.updatedAt),
      )
  }, [requests, agents, filter, query, sort])

  const nameOf = (id: string) => agents.find((agent) => agent.id === id)?.name ?? 'Agent'
  const agentOf = (id: string) => agents.find((agent) => agent.id === id)

  return (
    <div className="space-y-5 pb-4">
      <PageHeader
        eyebrow="Reconciliation"
        title="Rebalancing"
        description="Every float request across the network, with two-sided confirmation status and operator oversight."
        actions={
          <>
            <button
              type="button"
              onClick={() => exportRequests(filtered, agents, `floatal-rebalancing-${filter}.csv`)}
              className="btn btn-ghost btn-sm h-9 rounded-full bg-white text-[10.5px]"
            >
              <Download size={12} /> Export {filter === 'all' ? 'all' : filter}
            </button>
            <LiveBadge label="Live" />
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Open value in motion"
          value={formatCompactMoney(openValue)}
          hint={`${open.length} open requests`}
          delta={{ label: 'Live', direction: 'flat' }}
          icon={<ArrowUpDown size={14} />}
          tone="warn"
        />
        <MetricCard
          label="Awaiting provider"
          value={String(counts.pending)}
          hint={`${formatCompactMoney(pendingValue)} pending`}
          icon={<Clock3 size={14} />}
          tone={counts.pending > 0 ? 'gold' : 'default'}
        />
        <MetricCard
          label="In reconciliation"
          value={String(counts.accepted)}
          hint="Awaiting both confirmations"
          icon={<ShieldCheck size={14} />}
          tone={counts.accepted > 0 ? 'warn' : 'healthy'}
        />
        <MetricCard
          label="Settled value"
          value={formatCompactMoney(settledValue)}
          hint={`${counts.completed} completed requests`}
          delta={{ label: 'Two-sided', direction: 'up' }}
          icon={<CheckCircle2 size={14} />}
          tone="healthy"
        />
      </div>

      {flagged.length > 0 && (
        <div className="flex flex-col gap-2.5 rounded-[16px] border border-danger-100 bg-danger-50/65 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-danger-600 shadow-sm">
              <Flag size={13} />
            </span>
            <div>
              <div className="text-[11px] font-medium text-danger-700">
                {flagged.length} request{flagged.length === 1 ? '' : 's'} need operator review
              </div>
              <p className="mt-0.5 text-[9.5px] leading-relaxed text-danger-700/65">
                Flagged by agents for amount mismatches or reconciliation concerns. Review before settlement.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilter('flagged')}
            className="btn btn-sm h-8 shrink-0 rounded-lg bg-white text-[9.5px] text-danger-700 shadow-sm"
          >
            Review flagged <ArrowRight size={11} />
          </button>
        </div>
      )}

      <SectionCard bodyClassName="">
        <div className="flex flex-col gap-3 border-b border-forest-900/[0.06] px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
            {filters.map((item) => {
              const active = filter === item.key
              const count = counts[item.key]
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
                  <span className={cx('text-[8.5px]', active ? 'text-white/50' : 'text-muted/50')}>{count}</span>
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:w-[210px]">
              <Search size={11} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted/55" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reference or agent"
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
            <button
              type="button"
              onClick={() => setSort((current) => (current === 'recent' ? 'amount' : 'recent'))}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-forest-900/[0.08] bg-white px-2.5 text-[9.5px] font-medium text-forest-800"
            >
              <ArrowUpDown size={10} /> {sort === 'recent' ? 'Recent' : 'Amount'}
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-50 text-forest-600">
              {query || filter !== 'all' ? <Filter size={19} /> : <Inbox size={19} />}
            </span>
            <div className="mt-3 text-[13px] font-medium text-forest-900">
              {query || filter !== 'all' ? 'No matching requests' : 'No rebalancing yet'}
            </div>
            <p className="mt-1 max-w-[280px] text-[10.5px] leading-relaxed text-muted">
              {query || filter !== 'all'
                ? 'Try another status or clear the search to see the full network ledger.'
                : 'When agents request float, every step will appear here in real time.'}
            </p>
            {(query || filter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setFilter('all')
                  setQuery('')
                }}
                className="btn btn-ghost btn-sm mt-4 h-8 rounded-lg text-[9.5px]"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="ops-table min-w-[820px]">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Route</th>
                    <th>Amount</th>
                    <th>Confirmation</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((request) => {
                    const requester = agentOf(request.fromAgentId)
                    const provider = agentOf(request.toAgentId)
                    return (
                      <tr
                        key={request.id}
                        className="cursor-pointer"
                        onClick={() => setDrawerRequestId(request.id)}
                      >
                        <td>
                          <div className="font-medium text-forest-900">{request.reference}</div>
                          <div className="mt-0.5 max-w-[150px] truncate text-[9px] text-muted">
                            {request.note ?? (request.status === 'flagged' ? request.flagReason : 'Standard rebalance')}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Avatar name={requester?.name ?? 'R'} hue={requester?.avatarHue} size="xs" />
                            <div className="min-w-0">
                              <div className="max-w-[92px] truncate text-[10px] font-medium text-forest-900">{requester?.name}</div>
                              <div className="text-[8.5px] text-muted">{requester?.area}</div>
                            </div>
                            <ArrowRight size={10} className="mx-0.5 shrink-0 text-sand-400" />
                            <Avatar name={provider?.name ?? 'P'} hue={provider?.avatarHue} size="xs" />
                            <div className="min-w-0">
                              <div className="max-w-[92px] truncate text-[10px] font-medium text-forest-900">{provider?.name}</div>
                              <div className="text-[8.5px] text-muted">{provider?.area}</div>
                            </div>
                          </div>
                        </td>
                        <td className="tnum font-medium text-forest-900">{formatMoney(request.amount)}</td>
                        <td>
                          <ConfirmState request={request} />
                        </td>
                        <td><RequestPill status={request.status} size="sm" /></td>
                        <td className="text-[9.5px] text-muted">{relativeTime(request.updatedAt, now)}</td>
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
              {filtered.map((request) => {
                const requester = agentOf(request.fromAgentId)
                const provider = agentOf(request.toAgentId)
                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setDrawerRequestId(request.id)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-cream/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-forest-900">{request.reference}</span>
                        <RequestPill status={request.status} size="sm" />
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[9.5px] text-muted">
                        <span className="truncate">{requester?.name.split(' ')[0]}</span>
                        <ArrowRight size={9} />
                        <span className="truncate">{provider?.name.split(' ')[0]}</span>
                        <span className="h-1 w-1 rounded-full bg-sand-300" />
                        <span className="tnum font-medium text-forest-800">{formatMoney(request.amount)}</span>
                      </div>
                      <div className="mt-1 text-[8.5px] text-muted/55">
                        {relativeTime(request.updatedAt, now)} · {request.requesterConfirmed ? 'Requester confirmed' : 'Requester pending'} · {request.providerConfirmed ? 'Provider confirmed' : 'Provider pending'}
                      </div>
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-sand-400" />
                  </button>
                )
              })}
            </div>
          </>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-forest-900/[0.06] bg-cream/35 px-4 py-2.5 text-[8.5px] text-muted/55">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={9} /> Requests settle only when both agents confirm the handover.
          </span>
          <span>
            Showing {filtered.length} of {requests.length}
          </span>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <SectionCard title="Confirmation discipline" subtitle="Operator view of two-sided reconciliation">
          <div className="space-y-4 px-5 py-4">
            {(['pending', 'accepted', 'completed'] as RequestStatus[]).map((status) => {
              const list = requests.filter((request) => request.status === status)
              const value = list.reduce((sum, request) => sum + request.amount, 0)
              const pct = requests.length ? Math.round((list.length / requests.length) * 100) : 0
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-medium capitalize text-forest-900">{status === 'accepted' ? 'In reconciliation' : status}</span>
                    <span className="text-muted">{list.length} · {formatCompactMoney(value)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand-100">
                    <div
                      className={cx(
                        'h-full rounded-full',
                        status === 'completed' ? 'bg-healthy-500' : status === 'accepted' ? 'bg-forest-600' : 'bg-gold-400',
                      )}
                      style={{ width: `${Math.max(3, pct)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <div className="flex items-start gap-2 rounded-xl bg-mint-50 px-3 py-2.5 text-[9.5px] leading-relaxed text-forest-800/75">
              <Sparkles size={11} className="mt-0.5 shrink-0 text-forest-600" />
              Completed requests represent float that has moved and been confirmed by both sides.
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Recent settlements"
          subtitle="Latest completed, declined and flagged requests"
          action={
            <button
              type="button"
              onClick={() => exportRequests(requests, agents, 'floatal-full-rebalancing-ledger.csv')}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-forest-700"
            >
              Export ledger <Download size={10} />
            </button>
          }
          bodyClassName="p-2"
        >
          {[...requests]
            .filter((request) => request.status !== 'pending' && request.status !== 'accepted')
            .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
            .slice(0, 5)
            .map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => setDrawerRequestId(request.id)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-cream/60"
              >
                <span
                  className={cx(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    request.status === 'completed'
                      ? 'bg-healthy-50 text-healthy-600'
                      : request.status === 'flagged'
                        ? 'bg-danger-50 text-danger-600'
                        : 'bg-sand-100 text-muted',
                  )}
                >
                  {request.status === 'completed' ? <Check size={12} /> : request.status === 'flagged' ? <Flag size={11} /> : <X size={11} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[10.5px] font-medium text-forest-900">
                    {nameOf(request.fromAgentId)} <span className="font-normal text-muted">→</span> {nameOf(request.toAgentId)}
                  </div>
                  <div className="mt-0.5 text-[8.5px] text-muted">
                    {request.reference} · {relativeTime(request.updatedAt, now)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="tnum text-[10px] font-medium text-forest-900">{formatMoney(request.amount)}</div>
                  <div className="mt-0.5"><RequestPill status={request.status} size="sm" /></div>
                </div>
              </button>
            ))}
          {requests.filter((request) => request.status === 'completed' || request.status === 'declined' || request.status === 'flagged').length === 0 && (
            <div className="px-4 py-10 text-center text-[10.5px] text-muted">No settled requests yet.</div>
          )}
        </SectionCard>
      </div>

      <RequestDrawer requestId={drawerRequestId} onClose={() => setDrawerRequestId(null)} />
    </div>
  )
}

function ConfirmState({ request }: { request: RebalanceRequest }) {
  if (request.status === 'declined') {
    return <span className="text-[9px] text-muted/60">Closed</span>
  }
  if (request.status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[9px] text-muted/60">
        <Clock3 size={10} /> Awaiting acceptance
      </span>
    )
  }
  const count = Number(request.requesterConfirmed) + Number(request.providerConfirmed)
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex items-center gap-0.5">
        <span
          className={cx(
            'h-2 w-2 rounded-full',
            request.requesterConfirmed ? 'bg-healthy-500' : 'bg-sand-200',
          )}
          title="Requester confirmation"
        />
        <span
          className={cx(
            'h-2 w-2 rounded-full',
            request.providerConfirmed ? 'bg-healthy-500' : 'bg-sand-200',
          )}
          title="Provider confirmation"
        />
      </span>
      <span className={cx('text-[9px]', count === 2 ? 'text-healthy-600' : 'text-muted')}>
        {count}/2
      </span>
      {request.status === 'flagged' && <CircleAlert size={10} className="text-danger-500" />}
    </span>
  )
}
