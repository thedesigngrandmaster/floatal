import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Copy,
  Flag,
  Info,
  MoreHorizontal,
  ShieldCheck,
  Sparkles,
  WifiOff,
  X,
} from 'lucide-react'
import { Avatar, RequestPill, StatusPill, SyncChip } from '../components/ui'
import { useSheet } from '../components/Sheet'
import { useFloatal, useNow } from '../lib/hooks'
import { formatMoney, relativeTime, formatTime } from '../lib/format'
import { effectiveAgent, store } from '../lib/store'
import { emitHaptic, emitToast } from '../lib/toast'
import type { Agent, RebalanceRequest } from '../lib/types'

type ReasonMode = 'decline' | 'flag'

export function AgentRequestDetail() {
  const { id } = useParams<{ id: string }>()
  const snapshot = useFloatal()
  const now = useNow(15_000)
  const { openSheet, closeSheet } = useSheet()
  const [accepting, setAccepting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const raw = snapshot.data.agents.find((agent) => agent.id === snapshot.agentSession?.agentId)
  const request = snapshot.data.requests.find((item) => item.id === id)
  if (!raw || !request) {
    return (
      <div className="agent-page flex min-h-full flex-col items-center justify-center pt-safe text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-50 text-forest-600">
          <Info size={22} />
        </div>
        <p className="mt-4 text-[14px] font-medium text-forest-900">Request not found</p>
        <p className="mt-1 max-w-[240px] text-[11px] leading-relaxed text-muted">
          This request may belong to a different agent or has been removed.
        </p>
        <Link to="/app/activity" className="btn btn-forest btn-sm mt-4">
          Back to activity
        </Link>
      </div>
    )
  }

  const agent = effectiveAgent(raw, snapshot.queues[raw.id] ?? [])
  const isRequester = request.fromAgentId === agent.id
  const isProvider = request.toAgentId === agent.id
  const otherId = isRequester ? request.toAgentId : request.fromAgentId
  const requester = snapshot.data.agents.find((candidate) => candidate.id === request.fromAgentId)
  const provider = snapshot.data.agents.find((candidate) => candidate.id === request.toAgentId)
  const other = snapshot.data.agents.find((candidate) => candidate.id === otherId)
  const online = snapshot.online && !snapshot.offlineSimulated
  const incomingPending = request.status === 'pending' && isProvider
  const myConfirmed = isRequester ? request.requesterConfirmed : request.providerConfirmed
  const otherConfirmed = isRequester ? request.providerConfirmed : request.requesterConfirmed
  const canConfirm = request.status === 'accepted' && !myConfirmed
  const insufficient = request.amount > agent.floatBalance
  const queued = snapshot.queues[agent.id]?.length ?? 0

  const statusHeading =
    request.status === 'completed'
      ? 'Settled & reconciled'
      : request.status === 'accepted'
        ? 'Handover in progress'
        : request.status === 'declined'
          ? 'Request declined'
          : request.status === 'flagged'
            ? 'Under operator review'
            : incomingPending
              ? 'Incoming request'
              : 'Request pending'

  const accept = async () => {
    setAccepting(true)
    await new Promise((resolve) => window.setTimeout(resolve, 680))
    const success = store.acceptRequest(request.id)
    setAccepting(false)
    if (success) {
      emitToast('Request accepted', {
        tone: 'success',
        description: `${formatMoney(request.amount, request.currency)} reserved. Complete the handover, then confirm.`,
      })
    }
  }

  const confirm = async () => {
    setConfirming(true)
    await new Promise((resolve) => window.setTimeout(resolve, 560))
    const nextStatus = store.confirmHandover(request.id)
    setConfirming(false)
    if (nextStatus === 'completed') {
      emitToast('Rebalance complete', {
        tone: 'success',
        description: `${formatMoney(request.amount, request.currency)} settled and reconciled.`,
      })
    } else if (nextStatus === 'accepted') {
      emitToast('Handover confirmed', {
        tone: 'sync',
        description: `Awaiting ${other?.name.split(' ')[0] ?? 'the other agent'}'s confirmation.`,
      })
    }
  }

  const openReason = (mode: ReasonMode) => {
    openSheet(
      <ReasonSheet
        mode={mode}
        otherName={other?.name ?? 'the other agent'}
        onSubmit={(reason) => {
          if (mode === 'decline') {
            const success = store.declineRequest(request.id, reason)
            if (success) {
              emitToast('Request declined', { tone: 'warning', description: 'No float has moved.' })
            }
          } else {
            store.flagRequest(request.id, reason)
          }
          closeSheet()
        }}
        onClose={closeSheet}
      />,
      { onClose: closeSheet },
    )
  }

  const openMenu = () => {
    openSheet(
      <div className="pb-1">
        <div className="px-1">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted/70">Request options</div>
          <div className="mt-1 font-display text-[18px] font-medium tracking-[-0.03em] text-forest-900">
            {request.reference}
          </div>
        </div>
        <div className="mt-4 divide-y divide-forest-900/[0.06]">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(request.reference).catch(() => undefined)
              emitToast('Reference copied', { tone: 'success' })
              closeSheet()
            }}
            className="flex w-full items-center gap-3 py-3.5 text-left"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-50 text-forest-700">
              <Copy size={14} />
            </span>
            <span className="flex-1 text-[12.5px] font-medium text-forest-900">Copy reference</span>
            <ChevronRight size={14} className="text-sand-400" />
          </button>
          {request.status !== 'declined' && request.status !== 'completed' && (
            <button
              type="button"
              onClick={() => {
                closeSheet()
                window.setTimeout(() => openReason('flag'), 260)
              }}
              className="flex w-full items-center gap-3 py-3.5 text-left"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-50 text-danger-600">
                <Flag size={13} />
              </span>
              <div className="flex-1">
                <div className="text-[12.5px] font-medium text-forest-900">Report an issue</div>
                <div className="mt-0.5 text-[10px] text-muted">Send this request to operator review</div>
              </div>
              <ChevronRight size={14} className="text-sand-400" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={closeSheet}
          className="btn btn-ghost btn-block mt-4"
        >
          Close
        </button>
      </div>,
      { onClose: closeSheet },
    )
  }

  return (
    <div className="agent-page pt-safe">
      <header className="flex items-center justify-between gap-2">
        <Link to="/app/activity" className="icon-btn" aria-label="Back to activity">
          <ArrowLeft size={16} />
        </Link>
        <div className="text-center">
          <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted/70">Rebalance</div>
          <div className="mt-0.5 text-[13px] font-medium tracking-[-0.015em] text-forest-900">Request</div>
        </div>
        <div className="flex items-center gap-1.5">
          <SyncChip online={online} syncing={snapshot.syncing} queued={queued} compact />
          <button type="button" onClick={openMenu} className="icon-btn h-9 w-9" aria-label="More options">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </header>

      <section className="relative mt-5 overflow-hidden rounded-[25px] bg-forest-900 p-5 text-white shadow-[0_22px_50px_-26px_rgba(5,31,24,0.62)]">
        <div className="hero-halo pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full border border-white/[0.06]" />
        <div className="relative flex items-start justify-between gap-2">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/35">
              {statusHeading}
            </div>
            <div className="mt-1.5 text-[10px] font-medium text-white/45">{request.reference}</div>
          </div>
          <RequestPill status={request.status} />
        </div>

        <div className="relative mt-4 flex items-baseline gap-1.5">
          <span className="text-[11px] font-medium text-white/40">{request.currency}</span>
          <span className="balance-display text-[43px] leading-none text-[#F7F5EF]">
            {formatMoney(request.amount, request.currency).replace(`${request.currency} `, '')}
          </span>
        </div>

        <div className="relative mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-white/10 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar name={requester?.name ?? 'Agent'} hue={requester?.avatarHue} size="sm" />
            <div className="min-w-0">
              <div className="text-[8px] font-medium uppercase tracking-[0.1em] text-white/30">From</div>
              <div className="truncate text-[10.5px] font-medium text-white/80">
                {isRequester ? 'You' : requester?.name.split(' ')[0]}
              </div>
            </div>
          </div>
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-gold-400">
            <ArrowRight size={11} />
          </span>
          <div className="flex min-w-0 items-center justify-end gap-2 text-right">
            <div className="min-w-0">
              <div className="text-[8px] font-medium uppercase tracking-[0.1em] text-white/30">To</div>
              <div className="truncate text-[10.5px] font-medium text-white/80">
                {isProvider ? 'You' : provider?.name.split(' ')[0]}
              </div>
            </div>
            <Avatar name={provider?.name ?? 'Agent'} hue={provider?.avatarHue} size="sm" />
          </div>
        </div>

        <div className="relative mt-3.5 flex items-center justify-between text-[9px] text-white/30">
          <span>{relativeTime(request.createdAt, now)}</span>
          <span>{other?.area ?? agent.area} · {other?.distanceKm.toFixed(1)} km</span>
        </div>
      </section>

      {incomingPending && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-3 rounded-[20px] border border-forest-900/[0.08] bg-white p-4 shadow-[0_10px_30px_-24px_rgba(13,34,26,0.4)]"
        >
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint-50 text-forest-600">
              <ShieldCheck size={12} />
            </span>
            <div>
              <div className="text-[11px] font-medium text-forest-900">Review before accepting</div>
              <p className="mt-0.5 text-[9.5px] leading-relaxed text-muted">
                Accepting reserves {formatMoney(request.amount, request.currency)} from your float. Nothing moves until both sides
                confirm the handover.
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-cream/80 p-2.5">
            <div>
              <div className="text-[8px] font-medium uppercase tracking-[0.1em] text-muted/60">Your float</div>
              <div className="tnum mt-0.5 text-[12px] font-medium text-forest-900">{formatMoney(agent.floatBalance, agent.currency)}</div>
            </div>
            <div className="text-right">
              <div className="text-[8px] font-medium uppercase tracking-[0.1em] text-muted/60">After handover</div>
              <div className="tnum mt-0.5 text-[12px] font-medium text-forest-900">
                {formatMoney(Math.max(0, agent.floatBalance - request.amount), agent.currency)}
              </div>
            </div>
          </div>

          {insufficient && (
            <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-danger-50 px-2.5 py-2 text-[9.5px] text-danger-700">
              <CircleAlert size={11} /> Your reported float is below this request.
            </p>
          )}
          {!online && (
            <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-warn-50 px-2.5 py-2 text-[9.5px] text-warn-700">
              <WifiOff size={11} /> Reconnect to respond to this request.
            </p>
          )}

          <button
            type="button"
            onClick={() => void accept()}
            disabled={accepting || insufficient || !online}
            className="btn btn-gold btn-block mt-3 h-[48px]"
          >
            {accepting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest-900/25 border-t-forest-900" />
                Accepting…
              </>
            ) : (
              <>Accept request <Check size={15} /></>
            )}
          </button>
          <button
            type="button"
            onClick={() => openReason('decline')}
            className="btn btn-ghost btn-block mt-2 h-[44px] border-transparent text-muted hover:text-forest-900"
          >
            Decline
          </button>
        </motion.section>
      )}

      {request.status === 'pending' && isRequester && (
        <div className="mt-3 flex items-start gap-2.5 rounded-[18px] border border-mint-200 bg-mint-50/70 px-3.5 py-3.5">
          <span className="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-forest-600">
            <Clock3 size={12} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-gold-400" />
          </span>
          <div>
            <div className="text-[10.5px] font-medium text-forest-900">Waiting for {other?.name ?? 'the provider'}</div>
            <p className="mt-0.5 text-[9.5px] leading-relaxed text-forest-800/60">
              They will review your request. You will see their response here instantly.
            </p>
          </div>
        </div>
      )}

      {request.status === 'accepted' && (
        <Reconciliation
          request={request}
          requester={requester}
          provider={provider}
          agentId={agent.id}
          canConfirm={canConfirm}
          myConfirmed={myConfirmed}
          otherConfirmed={otherConfirmed}
          confirming={confirming}
          online={online}
          onConfirm={() => void confirm()}
        />
      )}

      {request.status === 'completed' && (
        <div className="mt-3 overflow-hidden rounded-[20px] border border-healthy-100 bg-healthy-50/80">
          <div className="flex items-start gap-3 p-4">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 17 }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-healthy-500 text-white"
            >
              <Check size={16} strokeWidth={2.5} />
            </motion.span>
            <div className="flex-1">
              <div className="text-[11.5px] font-medium text-healthy-700">Settled &amp; reconciled</div>
              <p className="mt-0.5 text-[9.5px] leading-relaxed text-healthy-700/65">
                Both agents confirmed the handover
                {request.completedAt ? ` · ${formatTime(request.completedAt)}` : ''}. No further action.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-healthy-500/10 divide-x divide-healthy-500/10">
            <div className="p-3">
              <div className="text-[8px] font-medium uppercase tracking-[0.1em] text-healthy-700/50">Your float now</div>
              <div className="tnum mt-0.5 text-[13px] font-medium text-healthy-700">{formatMoney(agent.floatBalance, agent.currency)}</div>
            </div>
            <div className="p-3">
              <div className="text-[8px] font-medium uppercase tracking-[0.1em] text-healthy-700/50">Status</div>
              <div className="mt-0.5"><StatusPill status={agent.status} size="sm" /></div>
            </div>
          </div>
        </div>
      )}

      {request.status === 'declined' && (
        <div className="mt-3 flex items-start gap-3 rounded-[18px] border border-forest-900/[0.07] bg-white p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand-100 text-muted">
            <Ban size={14} />
          </span>
          <div className="flex-1">
            <div className="text-[11px] font-medium text-forest-900">No float has moved</div>
            <p className="mt-0.5 text-[9.5px] leading-relaxed text-muted">
              {request.note ? `Reason: ${request.note}` : 'This request was declined.'} Your position is unchanged.
            </p>
            <Link to="/app/network" className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-forest-700">
              Try another agent <ArrowRight size={10} />
            </Link>
          </div>
        </div>
      )}

      {request.status === 'flagged' && (
        <div className="mt-3 rounded-[18px] border border-danger-100 bg-danger-50/80 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium text-danger-700">
            <Flag size={13} /> Flagged for operator review
          </div>
          <p className="mt-1.5 text-[9.5px] leading-relaxed text-danger-700/65">
            {request.flagReason ?? 'This rebalance needs a manual check.'} Your operator has been notified. Do not
            hand over additional funds.
          </p>
        </div>
      )}

      <div className="mt-3 rounded-[20px] border border-forest-900/[0.07] bg-white px-4 py-1">
        <DetailRow label="Reference" value={request.reference} mono />
        <DetailRow label="Requested" value={`${relativeTime(request.createdAt, now)} · ${formatTime(request.createdAt)}`} />
        <DetailRow label="Network" value={`${other?.area ?? agent.area} · ${other?.distanceKm.toFixed(1) ?? '—'} km`} />
        {request.note && <DetailRow label="Note" value={request.note} />}
      </div>

      <Timeline request={request} requester={requester} provider={provider} />

      {snapshot.agentSession?.demo && other && request.status !== 'completed' && request.status !== 'declined' && (
        <div className="mt-4 rounded-[18px] border border-dashed border-forest-900/15 bg-white/55 p-3.5">
          <div className="flex items-center gap-1.5 text-[8.5px] font-semibold uppercase tracking-[0.13em] text-muted/60">
            <Sparkles size={10} className="text-gold-500" /> Demo control
          </div>
          <p className="mt-1.5 text-[9.5px] leading-relaxed text-muted">
            Switch sides to complete the two-sided reconciliation.
          </p>
          <button
            type="button"
            onClick={() => {
              store.switchAgent(other.id)
              emitToast(`Viewing as ${other.name.split(' ')[0]}`, {
                tone: 'default',
                description: 'Demo shortcut — switch back in Profile.',
              })
              emitHaptic(10)
            }}
            className="mt-2.5 inline-flex items-center gap-1.5 text-[10.5px] font-medium text-forest-800"
          >
            View as {other.name.split(' ')[0]} <ArrowRight size={11} />
          </button>
        </div>
      )}

      <div className="mt-5 flex items-center justify-center gap-1.5 pb-1 text-[9px] text-muted/45">
        <ShieldCheck size={10} /> Protected by two-sided reconciliation
      </div>
    </div>
  )
}

function Reconciliation({
  request,
  requester,
  provider,
  agentId,
  canConfirm,
  myConfirmed,
  otherConfirmed,
  confirming,
  online,
  onConfirm,
}: {
  request: RebalanceRequest
  requester?: Agent
  provider?: Agent
  agentId: string
  canConfirm: boolean
  myConfirmed: boolean
  otherConfirmed: boolean
  confirming: boolean
  online: boolean
  onConfirm: () => void
}) {
  const me = agentId === request.fromAgentId ? requester : provider
  const other = agentId === request.fromAgentId ? provider : requester
  return (
    <div className="mt-3 rounded-[20px] border border-mint-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-medium text-forest-900">Reconciliation</div>
          <div className="mt-0.5 text-[9px] text-muted">Both confirmations required</div>
        </div>
        <span className="rounded-full border border-forest-900/[0.07] bg-cream px-2 py-1 text-[9px] font-medium text-forest-800">
          {Number(request.requesterConfirmed) + Number(request.providerConfirmed)} / 2
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        <ConfirmRow
          name={requester?.name ?? 'Requester'}
          role="Requester"
          hue={requester?.avatarHue}
          confirmed={request.requesterConfirmed}
          you={requester?.id === me?.id}
        />
        <ConfirmRow
          name={provider?.name ?? 'Provider'}
          role="Provider"
          hue={provider?.avatarHue}
          confirmed={request.providerConfirmed}
          you={provider?.id === me?.id}
        />
      </div>

      {canConfirm ? (
        <>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming || !online}
            className="btn btn-forest btn-block mt-3 h-[46px]"
          >
            {confirming ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Confirming…
              </>
            ) : (
              <>Confirm handover <Check size={14} /></>
            )}
          </button>
          <p className="mt-2 text-center text-[9px] leading-relaxed text-muted/70">
            Only confirm once cash or e-money has changed hands. This is final.
          </p>
        </>
      ) : myConfirmed ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-mint-50 px-3 py-2.5 text-[10px] text-forest-800">
          <CheckCircle2 size={13} className="text-forest-600" />
          {otherConfirmed
            ? 'Both sides confirmed — settling now.'
            : `Confirmed. Waiting for ${other?.name.split(' ')[0] ?? 'the other agent'} to confirm.`}
        </div>
      ) : null}
    </div>
  )
}

function ConfirmRow({
  name,
  role,
  hue,
  confirmed,
  you,
}: {
  name: string
  role: string
  hue?: number
  confirmed: boolean
  you: boolean
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-forest-900/[0.06] px-2.5 py-2">
      <Avatar name={name} hue={hue} size="xs" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[10.5px] font-medium text-forest-900">
          {you ? 'You' : name} <span className="font-normal text-muted/60">· {role}</span>
        </div>
      </div>
      {confirmed ? (
        <span className="inline-flex items-center gap-1 text-[8.5px] font-medium text-healthy-600">
          <CheckCircle2 size={11} /> Confirmed
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[8.5px] font-medium text-muted/60">
          <Clock3 size={10} /> Pending
        </span>
      )}
    </div>
  )
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-forest-900/[0.055] py-2.5 last:border-b-0">
      <span className="shrink-0 text-[9.5px] text-muted">{label}</span>
      <span className={`text-right text-[10.5px] font-medium text-forest-900 ${mono ? 'tnum' : ''}`}>{value}</span>
    </div>
  )
}

function Timeline({
  request,
  requester,
  provider,
}: {
  request: RebalanceRequest
  requester?: Agent
  provider?: Agent
}) {
  const declined = request.status === 'declined'
  const flagged = request.status === 'flagged'
  const accepted = Boolean(request.acceptedAt)
  const steps = [
    {
      label: 'Request created',
      detail: `${requester?.name ?? 'Requester'} requested ${formatMoney(request.amount, request.currency)}`,
      time: request.createdAt,
      done: true,
      tone: 'forest',
    },
    {
      label: declined ? 'Request declined' : accepted ? 'Accepted by provider' : flagged ? 'Flagged for review' : 'Awaiting acceptance',
      detail: declined
        ? 'No float moved'
        : accepted
          ? `${provider?.name ?? 'Provider'} reserved the float`
          : flagged
            ? 'Operator review opened'
            : `Waiting for ${provider?.name.split(' ')[0] ?? 'provider'}`,
      time: request.declinedAt ?? request.flaggedAt ?? request.acceptedAt,
      done: accepted || declined || flagged,
      tone: declined || flagged ? 'danger' : 'forest',
    },
    {
      label: request.status === 'completed' ? 'Settled' : declined ? 'Closed' : 'Settlement',
      detail: request.status === 'completed' ? 'Both agents confirmed' : declined ? 'Nothing further required' : 'Both confirmations unlock settlement',
      time: request.completedAt,
      done: request.status === 'completed' || declined,
      tone: request.status === 'completed' ? 'healthy' : 'muted',
    },
  ]
  return (
    <div className="mt-5 px-1">
      <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted/60">Timeline</div>
      <div className="relative mt-3 pl-5">
        <span className="absolute bottom-3 left-[5px] top-2 w-px bg-forest-900/[0.08]" />
        {steps.map((step, index) => (
          <div key={index} className="relative pb-4 last:pb-0">
            <span
              className={`absolute -left-5 top-0.5 flex h-[11px] w-[11px] items-center justify-center rounded-full border-2 border-paper ${
                step.done
                  ? step.tone === 'danger'
                    ? 'bg-danger-500'
                    : step.tone === 'healthy'
                      ? 'bg-healthy-500'
                      : 'bg-forest-700'
                  : 'bg-sand-300'
              }`}
            />
            <div className="flex items-baseline justify-between gap-2">
              <span className={`text-[10.5px] font-medium ${step.done ? 'text-forest-900' : 'text-muted/60'}`}>
                {step.label}
              </span>
              <span className="text-[8.5px] text-muted/50">
                {step.time ? relativeTime(step.time) : 'Pending'}
              </span>
            </div>
            <div className="mt-0.5 text-[9px] leading-relaxed text-muted/60">{step.detail}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReasonSheet({
  mode,
  otherName,
  onSubmit,
  onClose,
}: {
  mode: ReasonMode
  otherName: string
  onSubmit: (reason: string) => void
  onClose: () => void
}) {
  const options =
    mode === 'decline'
      ? [
          'Float already committed',
          'Amount too large right now',
          'Cannot complete the handover',
          'Need to verify the request first',
        ]
      : [
          'Amount does not match the handover',
          'Counterparty is not responding',
          'Suspected duplicate request',
          'Other reconciliation concern',
        ]
  const [selected, setSelected] = useState(options[0])
  return (
    <div className="pb-1">
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${mode === 'flag' ? 'text-danger-600' : 'text-muted/70'}`}>
            {mode === 'flag' ? 'Operator review' : 'Decline request'}
          </div>
          <h2 className="font-display mt-1.5 text-[20px] font-medium tracking-[-0.03em] text-forest-900">
            {mode === 'flag' ? 'What went wrong?' : 'Why are you declining?'}
          </h2>
          <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
            {mode === 'flag'
              ? `This will alert your operator and pause the request with ${otherName}.`
              : 'The requester will see your reason. No float will move.'}
          </p>
        </div>
        <button type="button" onClick={onClose} className="icon-btn h-8 w-8 shrink-0" aria-label="Close">
          <X size={14} />
        </button>
      </div>

      <div className="mt-4 space-y-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setSelected(option)}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[11px] transition-colors ${
              selected === option
                ? 'border-forest-700/30 bg-mint-50 text-forest-900'
                : 'border-forest-900/[0.07] bg-white text-forest-800'
            }`}
          >
            <span
              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                selected === option ? 'border-forest-700 bg-forest-900 text-white' : 'border-sand-300'
              }`}
            >
              {selected === option && <Check size={8} strokeWidth={3} />}
            </span>
            {option}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onSubmit(selected)}
        className={`btn btn-block mt-4 ${mode === 'flag' ? 'bg-danger-500 text-white hover:bg-danger-600' : 'btn-forest'}`}
      >
        {mode === 'flag' ? 'Flag for review' : 'Decline request'}
      </button>
      <button type="button" onClick={onClose} className="btn btn-ghost btn-block mt-2 border-transparent">
        Keep request open
      </button>
    </div>
  )
}
