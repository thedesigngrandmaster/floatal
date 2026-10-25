import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  CloudOff,
  MapPin,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { StatusPill, SyncChip } from '../components/ui'
import { useFloatal, useNow } from '../lib/hooks'
import {
  formatMoney,
  relativeTime,
  statusOf,
  statusLabel,
} from '../lib/format'
import { store } from '../lib/store'
import { emitHaptic } from '../lib/toast'
import type { FloatStatus } from '../lib/types'

const statusMeta: Record<
  FloatStatus,
  { label: string; short: string; dot: string; selected: string; text: string; tone: string }
> = {
  healthy: {
    label: 'Healthy',
    short: 'Above floor',
    dot: 'bg-healthy-500',
    selected: 'border-healthy-500/50 bg-healthy-50/80',
    text: 'text-healthy-700',
    tone: 'bg-healthy-500',
  },
  low: {
    label: 'Low',
    short: 'Watch',
    dot: 'bg-warn-500',
    selected: 'border-warn-500/50 bg-warn-50/80',
    text: 'text-warn-700',
    tone: 'bg-warn-500',
  },
  critical: {
    label: 'Critical',
    short: 'Act now',
    dot: 'bg-danger-500',
    selected: 'border-danger-500/50 bg-danger-50/80',
    text: 'text-danger-700',
    tone: 'bg-danger-500',
  },
}

export function AgentReport() {
  const snapshot = useFloatal()
  const navigate = useNavigate()
  const now = useNow(20_000)
  const agent = snapshot.data.agents.find((candidate) => candidate.id === snapshot.agentSession?.agentId)
  if (!agent) return null

  const queued = snapshot.queues[agent.id] ?? []
  const latestQueued = queued[queued.length - 1]
  const currentBalance = latestQueued?.balance ?? agent.floatBalance
  const online = snapshot.online && !snapshot.offlineSimulated
  const [amount, setAmount] = useState(String(currentBalance))
  const [status, setStatus] = useState<FloatStatus>(agent.status)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ queued: boolean; balance: number; status: FloatStatus } | null>(null)
  const [error, setError] = useState('')

  const parsed = amount === '' ? Number.NaN : Number(amount.replace(/\D/g, ''))
  const derivedStatus = Number.isFinite(parsed)
    ? statusOf(parsed, agent.lowThreshold, agent.criticalThreshold)
    : status
  const invalid = !Number.isFinite(parsed) || parsed < 0

  const ranges: Record<FloatStatus, string> = {
    healthy: `Above ${formatMoney(agent.lowThreshold)}`,
    low: `${formatMoney(agent.criticalThreshold)} – ${formatMoney(agent.lowThreshold)}`,
    critical: `Below ${formatMoney(agent.criticalThreshold)}`,
  }

  const handleAmount = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9)
    setAmount(digits)
    setError('')
    if (digits !== '') {
      setStatus(statusOf(Number(digits), agent.lowThreshold, agent.criticalThreshold))
    }
  }

  const submit = async () => {
    if (invalid) {
      setError('Enter your current float balance')
      return
    }
    setSubmitting(true)
    setError('')
    await new Promise((resolve) => window.setTimeout(resolve, online ? 620 : 320))
    const response = await store.reportFloat({
      balance: parsed,
      status,
      note: note.trim() || undefined,
    })
    setSubmitting(false)
    if (!response.ok) {
      setError('Could not save this report. Please try again.')
      return
    }
    setResult({ queued: Boolean(response.queued), balance: parsed, status })
    emitHaptic(response.queued ? [10, 40, 10] : [12, 30, 12])
  }

  if (result) {
    return (
      <ReportSuccess
        result={result}
        online={online}
        now={now}
        onDone={() => navigate('/app')}
      />
    )
  }

  return (
    <div className="agent-page pt-safe">
      <header className="flex items-center justify-between">
        <Link to="/app" className="icon-btn" aria-label="Back to home">
          <ArrowLeft size={16} />
        </Link>
        <div className="text-center">
          <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted/70">Daily check-in</div>
          <div className="mt-0.5 text-[13px] font-medium tracking-[-0.015em] text-forest-900">Report float</div>
        </div>
        <SyncChip online={online} syncing={snapshot.syncing} queued={queued.length} compact />
      </header>

      <div className="mt-7">
        <p className="eyebrow text-forest-700/60">Your position</p>
        <h1 className="font-display mt-2.5 text-[29px] font-medium leading-[1.04] tracking-[-0.045em] text-forest-900">
          How is your float?
        </h1>
        <p className="mt-2 max-w-[290px] text-[11.5px] leading-relaxed text-muted">
          A quick, accurate report keeps your network balanced and your operator informed.
        </p>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Float status
          </span>
          {Number.isFinite(parsed) && status !== derivedStatus && (
            <button
              type="button"
              onClick={() => setStatus(derivedStatus)}
              className="text-[9.5px] font-medium text-forest-600"
            >
              Use {statusLabel(derivedStatus).toLowerCase()}
            </button>
          )}
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {(['healthy', 'low', 'critical'] as FloatStatus[]).map((option) => {
            const meta = statusMeta[option]
            const selected = status === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setStatus(option)
                  emitHaptic(6)
                }}
                className={`relative rounded-[16px] border px-2.5 py-3 text-left transition-all duration-200 ${
                  selected
                    ? `${meta.selected} shadow-[0_4px_14px_-8px_rgba(13,34,26,0.2)]`
                    : 'border-forest-900/[0.08] bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  {selected && (
                    <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${meta.tone} text-white`}>
                      <Check size={7.5} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="mt-2.5 text-[12px] font-medium tracking-[-0.015em] text-forest-900">
                  {meta.label}
                </div>
                <div className={`mt-0.5 text-[8.5px] leading-tight ${selected ? meta.text : 'text-muted/70'}`}>
                  {ranges[option]}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5">
        <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          Current float balance
        </label>
        <div
          className={`mt-2.5 rounded-[20px] border bg-white px-4 pb-4 pt-3.5 transition-shadow ${
            error ? 'border-danger-500/45' : 'border-forest-900/[0.1]'
          }`}
        >
          <div className="flex items-center justify-between text-[9.5px] text-muted/70">
            <span>Cash &amp; e-money available</span>
            <span className="inline-flex items-center gap-1 text-forest-600/70">
              <ShieldCheck size={10} /> Operator verified
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-[17px] font-medium text-muted">GHS</span>
            <input
              value={amount}
              onChange={(event) => handleAmount(event.target.value)}
              inputMode="numeric"
              aria-label="Current float balance"
              placeholder="0"
              className="tnum font-display min-w-0 flex-1 bg-transparent text-[40px] font-medium leading-none tracking-[-0.05em] text-forest-900 outline-none placeholder:text-sand-300"
            />
            <button
              type="button"
              onClick={() => handleAmount(String(agent.floatBalance))}
              className="rounded-full border border-forest-900/8 bg-cream px-2 py-1 text-[8.5px] font-medium text-forest-700"
            >
              Last: {formatMoney(agent.floatBalance)}
            </button>
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-forest-900/[0.055] pt-2.5">
            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta[derivedStatus].dot}`} />
            <span className="text-[10px] text-muted">
              This balance reports as{' '}
              <span className={`font-medium ${statusMeta[derivedStatus].text}`}>
                {statusLabel(derivedStatus)}
              </span>{' '}
              float
            </span>
          </div>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          Note <span className="font-normal normal-case tracking-normal text-muted/60">(optional)</span>
        </span>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 100))}
          placeholder="e.g. Large payout expected this afternoon"
          className="field mt-2 bg-white text-[12.5px]"
        />
      </label>

      <div
        className={`mt-4 flex items-start gap-2.5 rounded-[16px] border px-3.5 py-3 ${
          online ? 'border-mint-200 bg-mint-50/70' : 'border-warn-100 bg-warn-50/80'
        }`}
      >
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white ${
            online ? 'text-forest-600' : 'text-warn-600'
          }`}
        >
          {online ? <Wifi size={12} /> : <WifiOff size={12} />}
        </span>
        <div>
          <div className={`text-[10.5px] font-medium ${online ? 'text-forest-800' : 'text-warn-700'}`}>
            {online ? 'Will sync immediately' : 'Saved on this device'}
          </div>
          <div className={`mt-0.5 text-[9.5px] leading-relaxed ${online ? 'text-forest-700/60' : 'text-warn-700/65'}`}>
            {online
              ? `Your operator sees this update in real time. Last synced ${relativeTime(agent.lastSyncAt, now).toLowerCase()}.`
              : 'Your report is queued securely and will sync automatically when you reconnect. You can close the app.'}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-danger-600">
          <CircleAlert size={12} /> {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={submitting || invalid}
        className="btn btn-forest btn-block mt-4 h-[52px]"
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            {online ? 'Reporting…' : 'Saving…'}
          </>
        ) : (
          <>
            {online ? 'Report float' : 'Save report offline'} <ArrowRight size={15} />
          </>
        )}
      </button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-muted/60">
        <CloudOff size={10} /> Offline-ready · Encrypted on device
      </p>
    </div>
  )
}

function ReportSuccess({
  result,
  online,
  now,
  onDone,
}: {
  result: { queued: boolean; balance: number; status: FloatStatus }
  online: boolean
  now: number
  onDone: () => void
}) {
  const synced = !result.queued && online
  return (
    <div className="agent-page flex min-h-full flex-col pt-safe">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onDone} className="icon-btn" aria-label="Close">
          <ArrowLeft size={16} />
        </button>
        <SyncChip online={online} syncing={false} queued={result.queued ? 1 : 0} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <div className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full bg-forest-900">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 15, delay: 0.08 }}
            className={`flex h-[58px] w-[58px] items-center justify-center rounded-full ${synced ? 'bg-gold-400 text-forest-950' : 'bg-warn-500 text-white'}`}
          >
            {synced ? <Check size={28} strokeWidth={2.5} /> : <CloudOff size={25} />}
          </motion.span>
          <motion.span
            initial={{ scale: 0.7, opacity: 0.55 }}
            animate={{ scale: 1.45, opacity: 0 }}
            transition={{ duration: 1, delay: 0.14 }}
            className="absolute inset-0 rounded-full border border-gold-400/50"
          />
        </div>

        <p className="eyebrow mt-6 text-forest-700/60">{synced ? 'Position updated' : 'Saved offline'}</p>
        <h1 className="font-display mt-2 text-[27px] font-medium tracking-[-0.045em] text-forest-900">
          {synced ? 'Float reported' : 'Report queued'}
        </h1>
        <p className="mt-2 max-w-[260px] text-[11.5px] leading-relaxed text-muted">
          {synced
            ? 'Your operator has the new position. Keep your network balanced.'
            : 'Your report is safe on this device and will sync automatically when you reconnect.'}
        </p>

        <div className="mt-6 w-full rounded-[20px] border border-forest-900/[0.08] bg-white p-4 text-left">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted/70">
                Reported balance
              </div>
              <div className="balance-display mt-1 text-[31px] leading-none text-forest-900">
                {formatMoney(result.balance)}
              </div>
            </div>
            <StatusPill status={result.status} />
          </div>
          <div className="mt-4 space-y-2.5 border-t border-forest-900/[0.06] pt-3">
            <div className="flex items-center gap-2.5 text-[10.5px]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-healthy-50 text-healthy-600">
                <Check size={10} strokeWidth={2.5} />
              </span>
              <span className="text-forest-800">Report captured {relativeTime(new Date().toISOString(), now).toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-2.5 text-[10.5px]">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ${synced ? 'bg-healthy-50 text-healthy-600' : 'bg-warn-50 text-warn-600'}`}
              >
                {synced ? <Check size={10} strokeWidth={2.5} /> : <WifiOff size={9} />}
              </span>
              <span className="text-forest-800">
                {synced ? 'Synced to the operator network' : 'Awaiting connection · auto-sync enabled'}
              </span>
            </div>
          </div>
        </div>

        {(result.status === 'low' || result.status === 'critical') && synced && (
          <div className="mt-3 w-full rounded-[16px] border border-gold-400/25 bg-gold-400/[0.08] px-3.5 py-3 text-left">
            <div className="flex items-center gap-2 text-[10.5px] font-medium text-warn-700">
              <CircleAlert size={12} /> Your float is running light
            </div>
            <p className="mt-1 text-[9.5px] leading-relaxed text-warn-700/65">
              Several agents near Osu have excess liquidity ready to rebalance.
            </p>
          </div>
        )}
      </div>

      <div className="pb-2">
        <Link to="/app/network" className="btn btn-gold btn-block h-[50px]">
          Find float nearby <MapPin size={15} />
        </Link>
        <button type="button" onClick={onDone} className="btn btn-ghost btn-block mt-2.5 h-[48px] text-forest-900">
          Back to home
        </button>
      </div>
    </div>
  )
}
