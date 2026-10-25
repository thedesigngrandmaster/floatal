import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react'
import { useSheet } from '../components/Sheet'
import { Avatar, Spinner } from '../components/ui'
import { useFloatal } from '../lib/hooks'
import { availableExcess, formatAmount, formatMoney, suggestAmount } from '../lib/format'
import { marketByCode } from '../lib/markets'
import { store } from '../lib/store'
import { emitToast } from '../lib/toast'
import type { Agent, RebalanceRequest } from '../lib/types'

function RequestFlow({ providerId }: { providerId: string }) {
  const navigate = useNavigate()
  const { closeSheet } = useSheet()
  const snapshot = useFloatal()
  const current = snapshot.data.agents.find((agent) => agent.id === snapshot.agentSession?.agentId)
  const provider = snapshot.data.agents.find((agent) => agent.id === providerId)
  const reserved = snapshot.data.requests
    .filter((request) => request.toAgentId === providerId && request.status === 'accepted')
    .reduce((sum, request) => sum + request.amount, 0)
  const excess = provider
    ? Math.max(
        0,
        availableExcess(provider.floatBalance, provider.lowThreshold, provider.targetFloat) - reserved,
      )
    : 0
  const suggested = current && provider
    ? suggestAmount(current.floatBalance, current.lowThreshold, excess, marketByCode[current.country].step)
    : 1000
  const step = current ? marketByCode[current.country].step : 500
  const [amount, setAmount] = useState(String(suggested))
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState<RebalanceRequest | null>(null)
  const [error, setError] = useState('')

  const numericAmount = Number(amount.replace(/\D/g, ''))
  const quickAmounts = useMemo(() => {
    if (!provider) return []
    const values = [suggested, step * 4, step * 10, Math.floor(excess / step) * step]
    return [...new Set(values)].filter((value) => value >= step && value <= excess).slice(0, 3)
  }, [provider, suggested, excess, step])

  if (!provider || !current) {
    return (
      <div className="py-10 text-center text-[13px] text-muted">
        This agent is no longer available.
        <button type="button" onClick={closeSheet} className="btn btn-ghost btn-sm mt-4 block w-full">
          Close
        </button>
      </div>
    )
  }

  const offline = !snapshot.online || snapshot.offlineSimulated
  const invalid = numericAmount < step || numericAmount > excess || offline

  const send = async () => {
    if (invalid) {
      if (offline) setError('Reconnect to send a request.')
      else if (numericAmount < step) setError(`Minimum request is ${formatMoney(step, current.currency)}`)
      else if (numericAmount > excess) setError('That is more than this agent has available')
      return
    }
    setSubmitting(true)
    setError('')
    await new Promise((resolve) => window.setTimeout(resolve, 620))
    const result = store.createRequest(provider.id, numericAmount, note)
    setSubmitting(false)
    if (!result.ok || !result.request) {
      setError('We could not send the request. Try again.')
      return
    }
    setSent(result.request)
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="pb-1"
      >
        <div className="flex flex-col items-center pt-2 text-center">
          <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full bg-forest-900">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.08 }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-400 text-forest-950"
            >
              <Check size={22} strokeWidth={2.6} />
            </motion.span>
            <motion.span
              initial={{ scale: 0.7, opacity: 0.6 }}
              animate={{ scale: 1.35, opacity: 0 }}
              transition={{ duration: 0.9, delay: 0.12 }}
              className="absolute inset-0 rounded-full border border-gold-400/60"
            />
          </div>
          <h2 className="font-display mt-5 text-[22px] font-medium tracking-[-0.035em] text-forest-900">
            Request sent
          </h2>
          <p className="mt-1 max-w-[260px] text-[12px] leading-relaxed text-muted">
            {provider.name.split(' ')[0]} will see your request. Your float updates once both sides confirm.
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-forest-900/8 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">Requested</div>
              <div className="tnum font-display mt-1 text-[27px] font-medium leading-none tracking-[-0.045em] text-forest-900">
                {formatMoney(sent.amount, sent.currency)}
              </div>
            </div>
            <Avatar name={provider.name} hue={provider.avatarHue} size="lg" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-forest-900/6 pt-3 text-[11px]">
            <div>
              <div className="text-[9px] uppercase tracking-[0.1em] text-muted">To</div>
              <div className="mt-1 font-medium text-forest-900">{provider.name}</div>
              <div className="text-[10px] text-muted">{provider.area}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-[0.1em] text-muted">Reference</div>
              <div className="tnum mt-1 font-medium text-forest-900">{sent.reference}</div>
              <div className="text-[10px] text-muted">Awaiting response</div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl bg-mint-50 px-3 py-2.5 text-[10.5px] leading-relaxed text-forest-800/75">
          <ShieldCheck size={14} className="shrink-0 text-forest-600" />
          No funds move until both agents confirm the handover.
        </div>

        <button
          type="button"
          onClick={() => {
            closeSheet()
            navigate(`/app/request/${sent.id}`)
          }}
          className="btn btn-forest btn-block mt-4"
        >
          View request <ArrowRight size={15} />
        </button>

        <button
          type="button"
          onClick={() => {
            store.switchAgent(provider.id)
            emitToast(`Viewing as ${provider.name.split(' ')[0]}`, {
              tone: 'default',
              description: 'Demo shortcut — switch back in Profile.',
            })
            closeSheet()
            navigate(`/app/request/${sent.id}`)
          }}
          className="mt-3 flex w-full items-center justify-center gap-1.5 text-[10.5px] font-medium text-forest-700/70 transition-colors hover:text-forest-900"
        >
          <Sparkles size={11} className="text-gold-500" />
          Demo: view as {provider.name.split(' ')[0]} to accept
        </button>
      </motion.div>
    )
  }

  return (
    <div className="pb-1">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <Avatar name={provider.name} hue={provider.avatarHue} size="lg" />
          <div>
            <div className="font-display text-[16px] font-medium tracking-[-0.02em] text-forest-900">
              {provider.name}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-healthy-500" />
              {provider.area} · {provider.distanceKm.toFixed(1)} km
            </div>
          </div>
        </div>
        <span className="rounded-full border border-forest-900/8 bg-white px-2.5 py-1 text-[9.5px] font-medium text-forest-800">
          {formatMoney(excess, provider.currency)} available
        </span>
      </div>

      <div className="rounded-2xl border border-forest-900/8 bg-white px-4 pb-4 pt-3.5">
        <label className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted">
          Request amount
        </label>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-display text-[17px] font-medium text-muted">{current.currency}</span>
          <input
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value.replace(/\D/g, '').slice(0, 7))
              setError('')
            }}
            inputMode="numeric"
            aria-label="Request amount"
            className="tnum font-display min-w-0 flex-1 bg-transparent text-[38px] font-medium leading-none tracking-[-0.05em] text-forest-900 outline-none"
            placeholder="0"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {quickAmounts.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setAmount(String(value))
                setError('')
              }}
              className={
                numericAmount === value
                  ? 'rounded-full border border-forest-900 bg-forest-900 px-2.5 py-1 text-[10.5px] font-medium text-white'
                  : 'rounded-full border border-forest-900/10 bg-cream px-2.5 py-1 text-[10.5px] font-medium text-forest-800'
              }
            >
              {value === suggested ? `Suggested ${formatAmount(value)}` : formatAmount(value)}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-3 block">
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted">
          Note <span className="font-normal normal-case tracking-normal text-muted/60">(optional)</span>
        </span>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 90))}
          placeholder="e.g. Morning customer payouts"
          className="field mt-1.5 bg-white text-[12.5px]"
        />
      </label>

      {offline && (
        <p className="mt-2.5 rounded-lg bg-warn-50 px-2.5 py-2 text-[10.5px] text-warn-700">
          You are offline. Reconnect to request float.
        </p>
      )}
      {error && <p className="mt-2.5 text-[11px] font-medium text-danger-600">{error}</p>}

      <button
        type="button"
        onClick={() => void send()}
        disabled={submitting || invalid}
        className="btn btn-forest btn-block mt-4 h-[50px]"
      >
        {submitting ? (
          <>
            <Spinner size={15} /> Sending request
          </>
        ) : (
          <>
            Send request <ArrowRight size={15} />
          </>
        )}
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[9.5px] leading-relaxed text-muted/70">
        <ShieldCheck size={11} /> A soft hold is placed on {provider.name.split(' ')[0]}'s float.
      </p>
    </div>
  )
}

export function useRequestFlow() {
  const { openSheet } = useSheet()
  return (provider: Agent) => {
    openSheet(<RequestFlow providerId={provider.id} />)
  }
}
