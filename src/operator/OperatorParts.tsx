import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Copy,
  Download,
  Flag,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Wifi,
  X,
} from 'lucide-react'
import { Avatar, RequestPill, Sparkline, StatusPill } from '../components/ui'
import { useFloatal, useNow } from '../lib/hooks'
import {
  cx,
  formatMoney,
  formatPhone,
  formatTime,
  relativeTime,
  statusLabel,
} from '../lib/format'
import { store } from '../lib/store'
import { MARKETS, marketByCode } from '../lib/markets'
import { emitToast } from '../lib/toast'
import type { Agent, CountryCode, RebalanceRequest } from '../lib/types'

/* ————————————————————————————————————————————————
   Small building blocks
   ———————————————————————————————————————————————— */

export function LiveBadge({
  label = 'Live',
  tone = 'healthy',
  className,
}: {
  label?: string
  tone?: 'healthy' | 'warn' | 'muted'
  className?: string
}) {
  const colors = {
    healthy: 'border-healthy-500/20 bg-healthy-50 text-healthy-700',
    warn: 'border-warn-500/20 bg-warn-50 text-warn-700',
    muted: 'border-forest-900/8 bg-white text-muted',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium',
        colors[tone],
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {tone === 'healthy' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-healthy-500 opacity-50" />
        )}
        <span
          className={cx(
            'relative inline-flex h-1.5 w-1.5 rounded-full',
            tone === 'healthy' ? 'bg-healthy-500' : tone === 'warn' ? 'bg-warn-500' : 'bg-sand-400',
          )}
        />
      </span>
      {label}
    </span>
  )
}

export function MetricCard({
  label,
  value,
  hint,
  delta,
  icon,
  spark,
  tone = 'default',
  className,
}: {
  label: string
  value: ReactNode
  hint?: string
  delta?: { label: string; direction?: 'up' | 'down' | 'flat'; positive?: boolean }
  icon?: ReactNode
  spark?: number[]
  tone?: 'default' | 'healthy' | 'warn' | 'danger' | 'gold'
  className?: string
}) {
  const accents = {
    default: 'text-forest-800 bg-mint-50',
    healthy: 'text-healthy-600 bg-healthy-50',
    warn: 'text-warn-600 bg-warn-50',
    danger: 'text-danger-600 bg-danger-50',
    gold: 'text-warn-700 bg-gold-400/15',
  }
  const sparkColor =
    tone === 'danger' ? '#C94A3C' : tone === 'warn' || tone === 'gold' ? '#C58A12' : '#1E8E63'
  return (
    <div className={cx('ops-card flex flex-col p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="pt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted">
          {label}
        </span>
        {icon && (
          <span className={cx('flex h-8 w-8 items-center justify-center rounded-xl', accents[tone])}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display tnum text-[30px] font-medium leading-none tracking-[-0.045em] text-forest-900">
            {value}
          </div>
          {(hint || delta) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {delta && (
                <span
                  className={cx(
                    'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                    delta.direction === 'flat'
                      ? 'bg-sand-100 text-muted'
                      : delta.positive === false
                        ? 'bg-danger-50 text-danger-600'
                        : 'bg-healthy-50 text-healthy-600',
                  )}
                >
                  {delta.direction === 'flat' ? null : delta.direction === 'down' ? (
                    <TrendingUp size={9} className="rotate-180" />
                  ) : (
                    <TrendingUp size={9} />
                  )}
                  {delta.label}
                </span>
              )}
              {hint && <span className="text-[10px] text-muted/80">{hint}</span>}
            </div>
          )}
        </div>
        {spark && spark.length > 1 && (
          <div className="w-[86px] shrink-0 opacity-90">
            <Sparkline values={spark} color={sparkColor} height={32} />
          </div>
        )}
      </div>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.15em] text-forest-700/60">
            <span className="h-px w-5 bg-forest-700/30" />
            {eyebrow}
          </div>
        )}
        <h1 className="font-display mt-2 text-[clamp(25px,2.7vw,34px)] font-medium leading-[1.03] tracking-[-0.05em] text-forest-900">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-[590px] text-[12px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cx('ops-card overflow-hidden', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-forest-900/[0.055] px-5 py-4">
          <div>
            {title && (
              <h2 className="font-display text-[14px] font-medium tracking-[-0.025em] text-forest-900">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-0.5 text-[10px] text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cx('relative', className)}>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/60"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="field h-9 rounded-full bg-white pl-9 pr-8 text-[11.5px]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-sand-100 text-muted"
        >
          <X size={9} />
        </button>
      )}
    </div>
  )
}

/* ————————————————————————————————————————————————
   Modal + drawer
   ———————————————————————————————————————————————— */

function useModalChrome(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])
}

export function OpsModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-[520px]',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  width?: string
}) {
  useModalChrome(open, onClose)
  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <motion.button
            type="button"
            aria-label="Close dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="ops-modal-backdrop"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={cx(
              'relative z-[120] flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-[24px] border border-forest-900/8 bg-paper shadow-[0_40px_120px_-30px_rgba(5,31,24,0.55)]',
              width,
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-forest-900/[0.06] px-5 py-4">
              <div>
                <h2 className="font-display text-[18px] font-medium tracking-[-0.03em] text-forest-900">
                  {title}
                </h2>
                {description && <p className="mt-1 text-[11px] leading-relaxed text-muted">{description}</p>}
              </div>
              <button type="button" onClick={onClose} className="icon-btn h-8 w-8 shrink-0" aria-label="Close">
                <X size={14} />
              </button>
            </header>
            <div className="overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <footer className="flex items-center justify-end gap-2 border-t border-forest-900/[0.06] bg-cream/50 px-5 py-3.5">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function OpsDrawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  children: ReactNode
}) {
  useModalChrome(open, onClose)
  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110]">
          <motion.button
            type="button"
            aria-label="Close panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="ops-modal-backdrop"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            className="ops-drawer"
          >
            <header className="flex items-start justify-between gap-3 border-b border-forest-900/[0.06] px-5 py-4">
              <div>
                {eyebrow && (
                  <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted/70">
                    {eyebrow}
                  </div>
                )}
                <h2 className="font-display mt-1 text-[19px] font-medium tracking-[-0.03em] text-forest-900">
                  {title}
                </h2>
              </div>
              <button type="button" onClick={onClose} className="icon-btn h-8 w-8 shrink-0" aria-label="Close">
                <X size={14} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ————————————————————————————————————————————————
   CSV export
   ———————————————————————————————————————————————— */

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value)
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    emitToast('Nothing to export yet', { tone: 'warning' })
    return
  }
  const headers = Object.keys(rows[0])
  const content = [
    headers.map(csvCell).join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\r\n')
  const blob = new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  emitToast('Export ready', { tone: 'success', description: filename })
}

/* ————————————————————————————————————————————————
   Agent drawer
   ———————————————————————————————————————————————— */

export function AgentDrawer({
  agentId,
  onClose,
}: {
  agentId: string | null
  onClose: () => void
}) {
  const snapshot = useFloatal()
  const now = useNow(30_000)
  const [copied, setCopied] = useState(false)
  const agent = snapshot.data.agents.find((candidate) => candidate.id === agentId) ?? null

  if (!agent) {
    return (
      <OpsDrawer open={Boolean(agentId)} onClose={onClose} title="Agent" eyebrow="Network">
        <div className="p-6 text-center text-[12px] text-muted">This agent is no longer in the network.</div>
      </OpsDrawer>
    )
  }

  const reports = snapshot.data.reports
    .filter((report) => report.agentId === agent.id)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .slice(-10)
  const series = reports.length > 1 ? reports.map((report) => report.balance) : [agent.floatBalance * 0.9, agent.floatBalance]
  const requests = snapshot.data.requests
    .filter((request) => request.fromAgentId === agent.id || request.toAgentId === agent.id)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  const openRequest = requests.find((request) => request.status === 'pending' || request.status === 'accepted')
  const online = now - new Date(agent.lastSyncAt).getTime() < 45 * 60_000
  const progress = Math.min(100, Math.round((agent.floatBalance / Math.max(1, agent.targetFloat)) * 100))
  const reserved = snapshot.data.requests
    .filter((request) => request.toAgentId === agent.id && request.status === 'accepted')
    .reduce((sum, request) => sum + request.amount, 0)

  const copyPhone = async () => {
    try {
      await navigator.clipboard?.writeText(agent.phone)
      setCopied(true)
      emitToast('Phone number copied', { tone: 'success' })
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      emitToast('Could not copy number', { tone: 'error' })
    }
  }

  const exportAgent = () => {
    downloadCsv(`floatal-agent-${agent.name.toLowerCase().replace(/\s+/g, '-')}.csv`, [
      {
        name: agent.name,
        business: agent.businessName,
        phone: agent.phone,
        area: agent.area,
        status: statusLabel(agent.status),
        float_ghs: agent.floatBalance,
        target_ghs: agent.targetFloat,
        low_threshold_ghs: agent.lowThreshold,
        critical_threshold_ghs: agent.criticalThreshold,
        reserved_ghs: reserved,
        reliability_pct: agent.reliability,
        volume_today_ghs: agent.todayVolume,
        last_report: agent.lastReportAt,
        last_sync: agent.lastSyncAt,
      },
    ])
  }

  return (
    <OpsDrawer open={Boolean(agentId)} onClose={onClose} title={agent.name} eyebrow={agent.businessName}>
      <div className="border-b border-forest-900/[0.06] px-5 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <Avatar name={agent.name} hue={agent.avatarHue} size="xl" />
            <span
              className={cx(
                'absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-[3px] border-paper',
                online ? 'bg-healthy-500' : 'bg-sand-400',
              )}
            />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={agent.status} />
              {online ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-healthy-600">
                  <Wifi size={9} /> Online now
                </span>
              ) : (
                <span className="text-[9px] font-medium text-muted">Offline</span>
              )}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-muted">
              <span>{agent.area}</span>
              <span className="h-1 w-1 rounded-full bg-sand-300" />
              <span>Accra Metro</span>
              <span className="h-1 w-1 rounded-full bg-sand-300" />
              <span>Agent since {new Date(agent.joinedAt).getFullYear()}</span>
            </p>
            <p className="mt-1 text-[10px] text-muted/70">
              Last report {relativeTime(agent.lastReportAt, now).toLowerCase()} · synced{' '}
              {relativeTime(agent.lastSyncAt, now).toLowerCase()}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[18px] bg-forest-900 px-4 py-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-white/35">
                Reported float
              </div>
              <div className="font-display tnum mt-1 text-[29px] font-medium leading-none tracking-[-0.045em]">
                {formatMoney(agent.floatBalance)}
              </div>
            </div>
            <StatusPill status={agent.status} onDark size="sm" />
          </div>
          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(3, progress)}%`,
                  background:
                    agent.status === 'healthy'
                      ? 'linear-gradient(90deg, #78C9A4aa, #78C9A4)'
                      : agent.status === 'low'
                        ? 'linear-gradient(90deg, #F5C51888, #F5C518)'
                        : 'linear-gradient(90deg, #F07A6B88, #F07A6B)',
                }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[9px] text-white/40">
              <span>{progress}% of {formatMoney(agent.targetFloat)} target</span>
              <span>{reserved > 0 ? `${formatMoney(reserved)} reserved` : 'No held float'}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Low floor', value: formatMoney(agent.lowThreshold) },
            { label: 'Critical', value: formatMoney(agent.criticalThreshold) },
            { label: 'Reliability', value: `${agent.reliability}%` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-forest-900/[0.06] bg-white px-2.5 py-2">
              <div className="text-[8px] font-medium uppercase tracking-[0.08em] text-muted/60">
                {item.label}
              </div>
              <div className="tnum mt-1 text-[11px] font-medium text-forest-900">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-forest-900/[0.06] px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Float trend</span>
          <span className="text-[9px] text-muted/60">Last {reports.length || 2} reports</span>
        </div>
        <div className="mt-3 rounded-xl border border-forest-900/[0.055] bg-cream/60 px-3 py-2">
          <Sparkline
            values={series}
            color={agent.status === 'healthy' ? '#1E8E63' : agent.status === 'low' ? '#C58A12' : '#C94A3C'}
            height={48}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[9px] text-muted/60">
          <span>Today's volume {formatMoney(agent.todayVolume)}</span>
          <span>{agent.distanceKm.toFixed(1)} km from centre</span>
        </div>
      </div>

      <div className="border-b border-forest-900/[0.06] px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Recent rebalancing
          </span>
          <span className="text-[9px] text-muted/60">{requests.length} total</span>
        </div>
        {requests.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-forest-900/10 px-3 py-5 text-center text-[10.5px] text-muted">
            No rebalancing activity yet.
          </div>
        ) : (
          <div className="mt-1 divide-y divide-forest-900/[0.05]">
            {requests.slice(0, 4).map((request) => {
              const outgoing = request.fromAgentId === agent.id
              const otherId = outgoing ? request.toAgentId : request.fromAgentId
              const other = snapshot.data.agents.find((candidate) => candidate.id === otherId)
              return (
                <div key={request.id} className="flex items-center gap-2.5 py-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint-50 text-forest-700">
                    <ArrowUpRight size={11} className={outgoing ? '' : 'rotate-180'} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10.5px] font-medium text-forest-900">
                      {outgoing ? 'To' : 'From'} {other?.name ?? 'Agent'}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-muted">
                      <span className="tnum">{formatMoney(request.amount)}</span>
                      <span className="h-1 w-1 rounded-full bg-sand-300" />
                      <span>{relativeTime(request.updatedAt, now)}</span>
                    </div>
                  </div>
                  <RequestPill status={request.status} size="sm" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {openRequest && (
        <div className="border-b border-forest-900/[0.06] px-5 py-4">
          <div className="flex items-start gap-2.5 rounded-[16px] border border-warn-100 bg-warn-50/70 p-3">
            <CircleAlert size={14} className="mt-0.5 shrink-0 text-warn-600" />
            <div className="flex-1">
              <div className="text-[10.5px] font-medium text-warn-700">
                Open request · {openRequest.reference}
              </div>
              <p className="mt-0.5 text-[9.5px] leading-relaxed text-warn-700/70">
                {formatMoney(openRequest.amount)} · {openRequest.status === 'pending' ? 'Awaiting provider' : 'Awaiting reconciliation'}
              </p>
              <button
                type="button"
                onClick={() => {
                  store.flagRequest(openRequest.id, 'Operator review requested from agent profile')
                }}
                className="mt-2 inline-flex items-center gap-1 text-[9.5px] font-semibold text-warn-700"
              >
                <Flag size={10} /> Flag for review
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 px-5 py-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={copyPhone}
            className="btn btn-ghost btn-sm h-9 justify-center rounded-xl text-[10.5px]"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy phone'}
          </button>
          <a
            href={`tel:${agent.phone}`}
            className="btn btn-ghost btn-sm h-9 justify-center rounded-xl text-[10.5px]"
          >
            <Phone size={12} /> Call agent
          </a>
        </div>
        <button
          type="button"
          onClick={() => {
            emitToast(`Check-in sent to ${agent.name.split(' ')[0]}`, {
              tone: 'sync',
              description: 'They will be asked to confirm their float position.',
            })
          }}
          className="btn btn-forest btn-sm h-10 w-full justify-center rounded-xl text-[11px]"
        >
          <MessageSquare size={13} /> Request float check-in
        </button>
        <button
          type="button"
          onClick={exportAgent}
          className="btn btn-quiet btn-sm h-9 w-full justify-center rounded-xl text-[10.5px]"
        >
          <Download size={12} /> Export agent record
        </button>
        <p className="flex items-center justify-center gap-1.5 pt-1 text-[8.5px] text-muted/50">
          <ShieldCheck size={9} /> Operator access is logged and audited
        </p>
      </div>
    </OpsDrawer>
  )
}

/* ————————————————————————————————————————————————
   Request drawer
   ———————————————————————————————————————————————— */

export function RequestDrawer({
  requestId,
  onClose,
}: {
  requestId: string | null
  onClose: () => void
}) {
  const snapshot = useFloatal()
  const now = useNow(20_000)
  const [flagOpen, setFlagOpen] = useState(false)
  const [reason, setReason] = useState('Amount mismatch reported at handover')
  const request = snapshot.data.requests.find((item) => item.id === requestId) ?? null

  useEffect(() => {
    if (requestId) {
      setFlagOpen(false)
      setReason('Amount mismatch reported at handover')
    }
  }, [requestId])

  if (!request) {
    return (
      <OpsDrawer open={Boolean(requestId)} onClose={onClose} title="Rebalance" eyebrow="Request">
        <div className="p-6 text-center text-[12px] text-muted">This request is no longer available.</div>
      </OpsDrawer>
    )
  }

  const requester = snapshot.data.agents.find((agent) => agent.id === request.fromAgentId)
  const provider = snapshot.data.agents.find((agent) => agent.id === request.toAgentId)
  const canFlag = request.status === 'pending' || request.status === 'accepted'

  const flag = () => {
    if (!canFlag) return
    store.flagRequest(request.id, reason)
    setFlagOpen(false)
  }

  const steps = [
    {
      label: 'Request created',
      detail: `${requester?.name ?? 'Requester'} requested float from ${provider?.name ?? 'provider'}.`,
      time: request.createdAt,
      done: true,
      tone: 'forest' as const,
    },
    {
      label: 'Provider accepted',
      detail:
        request.status === 'pending'
          ? `Waiting for ${provider?.name.split(' ')[0] ?? 'provider'} to accept.`
          : request.status === 'declined'
            ? 'Request was declined. No float moved.'
            : `${provider?.name ?? 'Provider'} accepted the request.`,
      time: request.acceptedAt ?? request.declinedAt,
      done: Boolean(request.acceptedAt) || request.status === 'declined',
      tone: request.status === 'declined' ? ('danger' as const) : ('forest' as const),
    },
    {
      label: 'Two-sided confirmation',
      detail:
        request.status === 'completed'
          ? 'Requester and provider both confirmed.'
          : request.status === 'flagged'
            ? 'Sent to the operator for review.'
            : request.status === 'declined'
              ? 'No confirmations required.'
              : `${Number(request.requesterConfirmed) + Number(request.providerConfirmed)} of 2 confirmations received.`,
      time: request.flaggedAt ?? request.completedAt,
      done: request.status === 'completed' || request.status === 'flagged' || request.status === 'declined',
      tone:
        request.status === 'flagged'
          ? ('danger' as const)
          : request.status === 'completed'
            ? ('healthy' as const)
            : ('muted' as const),
    },
    {
      label: 'Settled',
      detail: request.completedAt ? 'Float moved and balances reconciled.' : 'Settlement pending.',
      time: request.completedAt,
      done: request.status === 'completed',
      tone: request.status === 'completed' ? ('healthy' as const) : ('muted' as const),
    },
  ]

  return (
    <OpsDrawer open={Boolean(requestId)} onClose={onClose} title={request.reference} eyebrow="Rebalance request">
      <div className="border-b border-forest-900/[0.06] px-5 pb-5">
        <div className="flex items-center justify-between gap-3">
          <RequestPill status={request.status} />
          <span className="text-[9.5px] text-muted/60">Updated {relativeTime(request.updatedAt, now).toLowerCase()}</span>
        </div>
        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="text-[11px] font-medium text-muted">GHS</span>
          <span className="font-display tnum text-[34px] font-medium leading-none tracking-[-0.045em] text-forest-900">
            {formatMoney(request.amount).replace('GHS ', '')}
          </span>
        </div>

        <div className="mt-4 rounded-[16px] border border-forest-900/[0.06] bg-white p-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar name={requester?.name ?? 'Requester'} hue={requester?.avatarHue} size="sm" />
              <div className="min-w-0">
                <div className="text-[8px] font-medium uppercase tracking-[0.1em] text-muted/60">Requester</div>
                <div className="truncate text-[10.5px] font-medium text-forest-900">{requester?.name ?? 'Agent'}</div>
                <div className="truncate text-[9px] text-muted">{requester?.area}</div>
              </div>
            </div>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-forest-900/8 bg-cream text-forest-700">
              <ArrowRight size={11} />
            </span>
            <div className="flex min-w-0 items-center justify-end gap-2 text-right">
              <div className="min-w-0">
                <div className="text-[8px] font-medium uppercase tracking-[0.1em] text-muted/60">Provider</div>
                <div className="truncate text-[10.5px] font-medium text-forest-900">{provider?.name ?? 'Agent'}</div>
                <div className="truncate text-[9px] text-muted">{provider?.area}</div>
              </div>
              <Avatar name={provider?.name ?? 'Provider'} hue={provider?.avatarHue} size="sm" />
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-forest-900/[0.06] bg-white px-3 py-2.5">
            <div className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted/60">
              Requester confirmed
            </div>
            <div className={cx('mt-1 inline-flex items-center gap-1 text-[10px] font-medium', request.requesterConfirmed ? 'text-healthy-600' : 'text-muted/60')}>
              {request.requesterConfirmed ? <CheckCircle2 size={11} /> : <Clock3 size={10} />}
              {request.requesterConfirmed ? 'Confirmed' : 'Pending'}
            </div>
          </div>
          <div className="rounded-xl border border-forest-900/[0.06] bg-white px-3 py-2.5">
            <div className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted/60">
              Provider confirmed
            </div>
            <div className={cx('mt-1 inline-flex items-center gap-1 text-[10px] font-medium', request.providerConfirmed ? 'text-healthy-600' : 'text-muted/60')}>
              {request.providerConfirmed ? <CheckCircle2 size={11} /> : <Clock3 size={10} />}
              {request.providerConfirmed ? 'Confirmed' : 'Pending'}
            </div>
          </div>
        </div>

        {request.note && (
          <div className="mt-3 rounded-xl bg-cream/80 px-3 py-2.5">
            <div className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted/60">Agent note</div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-forest-800">{request.note}</p>
          </div>
        )}
      </div>

      <div className="border-b border-forest-900/[0.06] px-5 py-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Reconciliation timeline</div>
        <div className="relative mt-3 pl-5">
          <span className="absolute bottom-3 left-[5px] top-1.5 w-px bg-forest-900/[0.08]" />
          {steps.map((step) => (
            <div key={step.label} className="relative pb-4 last:pb-0">
              <span
                className={cx(
                  'absolute -left-5 top-0.5 h-[11px] w-[11px] rounded-full border-2 border-paper',
                  step.done
                    ? step.tone === 'danger'
                      ? 'bg-danger-500'
                      : step.tone === 'healthy'
                        ? 'bg-healthy-500'
                        : 'bg-forest-700'
                    : 'bg-sand-300',
                )}
              />
              <div className="flex items-baseline justify-between gap-2">
                <span className={cx('text-[10.5px] font-medium', step.done ? 'text-forest-900' : 'text-muted/60')}>
                  {step.label}
                </span>
                <span className="shrink-0 text-[8.5px] text-muted/50">
                  {step.time ? `${formatTime(step.time)} · ${relativeTime(step.time, now)}` : 'Pending'}
                </span>
              </div>
              <p className="mt-0.5 text-[9px] leading-relaxed text-muted/65">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {request.status === 'flagged' && (
        <div className="border-b border-forest-900/[0.06] px-5 py-4">
          <div className="rounded-[14px] border border-danger-100 bg-danger-50/70 px-3 py-3">
            <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-danger-700">
              <Flag size={12} /> Flagged for review
            </div>
            <p className="mt-1 text-[9.5px] leading-relaxed text-danger-700/65">
              {request.flagReason ?? 'Manual review required.'}
            </p>
          </div>
        </div>
      )}

      <div className="px-5 py-4">
        {canFlag ? (
          flagOpen ? (
            <div className="rounded-[16px] border border-danger-100 bg-danger-50/50 p-3">
              <label className="text-[9px] font-semibold uppercase tracking-[0.11em] text-danger-700">
                Reason for review
              </label>
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="field mt-1.5 bg-white text-[11px]"
                placeholder="Describe the issue"
              />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setFlagOpen(false)} className="btn btn-ghost btn-sm h-8 flex-1 rounded-lg text-[10px]">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={flag}
                  disabled={!reason.trim()}
                  className="btn btn-sm h-8 flex-1 rounded-lg bg-danger-500 text-[10px] text-white hover:bg-danger-600"
                >
                  <Flag size={11} /> Flag request
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setFlagOpen(true)}
              className="btn btn-ghost btn-sm h-9 w-full justify-center rounded-xl text-[10.5px] text-danger-600"
            >
              <Flag size={12} /> Flag for review
            </button>
          )
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-mint-50 px-3 py-2.5 text-[10px] text-forest-800">
            <BadgeCheck size={13} className="text-forest-600" /> This request is reconciled. No action needed.
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            const partner = requester && provider ? `${requester.name} and ${provider.name}` : 'the agents'
            emitToast('Follow-up sent', {
              tone: 'sync',
              description: `Both sides of ${partner}'s rebalance will be asked to confirm.`,
            })
          }}
          className="btn btn-quiet btn-sm mt-2 h-9 w-full justify-center rounded-xl text-[10.5px]"
        >
          <MessageSquare size={12} /> Send confirmation nudge
        </button>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[8.5px] text-muted/50">
          <Sparkles size={9} /> Operator actions are recorded in the audit trail
        </p>
      </div>
    </OpsDrawer>
  )
}

/* ————————————————————————————————————————————————
   Invite agent dialog
   ———————————————————————————————————————————————— */

export function InviteAgentDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [business, setBusiness] = useState('')
  const [phone, setPhone] = useState('')
  const [area, setArea] = useState('')
  const [country, setCountry] = useState<CountryCode>('GH')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setBusiness('')
    setPhone('')
    setArea('')
    setCountry('GH')
    setError('')
  }, [open])

  const create = () => {
    if (name.trim().length < 2) {
      setError('Enter the agent’s full name')
      return
    }
    const market = marketByCode[country]
    const digits = phone.replace(/\D/g, '').replace(/^0/, '')
    if (digits.length !== market.localLength) {
      setError(`Enter a valid ${market.name} mobile number`)
      return
    }
    store.addAgent({
      name,
      businessName: business,
      phone: `${market.dialCode}${digits}`,
      area,
      country,
    })
    emitToast('Agent added to the network', {
      tone: 'success',
      description: `${name.trim()} can now sign in with a one-time code.`,
    })
    onClose()
  }

  return (
    <OpsModal
      open={open}
      onClose={onClose}
      title="Invite an agent"
      description="Add an agent to the Aya Money network. They will be able to sign in with their phone number."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm rounded-xl">
            Cancel
          </button>
          <button type="button" onClick={create} className="btn btn-forest btn-sm rounded-xl">
            <UserPlus size={13} /> Add agent
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[9px] font-semibold uppercase tracking-[0.11em] text-muted">Market</span>
          <select
            value={country}
            onChange={(event) => {
              setCountry(event.target.value as CountryCode)
              setPhone('')
              setArea('')
              setError('')
            }}
            className="field mt-1.5 bg-white text-[12px]"
          >
            {MARKETS.map((market) => (
              <option key={market.code} value={market.code}>
                {market.flag} {market.name} · {market.currency}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[9px] font-semibold uppercase tracking-[0.11em] text-muted">Full name</span>
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError('')
            }}
            placeholder="e.g. Adwoa Boadi"
            className="field mt-1.5 bg-white text-[12px]"
          />
        </label>
        <label className="block">
          <span className="text-[9px] font-semibold uppercase tracking-[0.11em] text-muted">Business name</span>
          <input
            value={business}
            onChange={(event) => setBusiness(event.target.value)}
            placeholder="e.g. Adwoa Cash Point"
            className="field mt-1.5 bg-white text-[12px]"
          />
        </label>
        <label className="block">
          <span className="text-[9px] font-semibold uppercase tracking-[0.11em] text-muted">Mobile number</span>
          <input
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value)
              setError('')
            }}
            placeholder={`${marketByCode[country].dialCode} local number`}
            inputMode="tel"
            className="field mt-1.5 bg-white text-[12px]"
          />
        </label>
        <label className="block">
          <span className="text-[9px] font-semibold uppercase tracking-[0.11em] text-muted">Area</span>
          <input
            value={area}
            onChange={(event) => setArea(event.target.value)}
            placeholder={marketByCode[country].zones[0]}
            className="field mt-1.5 bg-white text-[12px]"
          />
        </label>
      </div>
      {error && <p className="mt-3 text-[10.5px] font-medium text-danger-600">{error}</p>}
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-mint-50 px-3 py-2.5 text-[9.5px] leading-relaxed text-forest-800/75">
        <ShieldCheck size={12} className="mt-0.5 shrink-0 text-forest-600" />
        New agents start with a zero float and critical status until their first report. Thresholds follow your
        network defaults.
      </div>
    </OpsModal>
  )
}

/* ————————————————————————————————————————————————
   Operator shared helpers
   ———————————————————————————————————————————————— */

export function agentByRequest(
  agents: Agent[],
  request: RebalanceRequest,
  side: 'from' | 'to',
) {
  return agents.find((agent) => agent.id === (side === 'from' ? request.fromAgentId : request.toAgentId))
}

export function exportRequests(requests: RebalanceRequest[], agents: Agent[], filename = 'floatal-rebalances.csv') {
  const name = (id: string) => agents.find((agent) => agent.id === id)?.name ?? id
  downloadCsv(
    filename,
    requests.map((request) => ({
      reference: request.reference,
      status: request.status,
      country: request.country,
      currency: request.currency,
      amount: request.amount,
      requester: name(request.fromAgentId),
      provider: name(request.toAgentId),
      requester_confirmed: request.requesterConfirmed,
      provider_confirmed: request.providerConfirmed,
      created_at: request.createdAt,
      accepted_at: request.acceptedAt ?? '',
      completed_at: request.completedAt ?? '',
      note: request.note ?? '',
      flag_reason: request.flagReason ?? '',
    })),
  )
}

export function exportAgents(agents: Agent[], filename = 'floatal-agents.csv') {
  downloadCsv(
    filename,
    agents.map((agent) => ({
      name: agent.name,
      business: agent.businessName,
      phone: formatPhone(agent.phone),
      country: agent.country,
      currency: agent.currency,
      area: agent.area,
      status: statusLabel(agent.status),
      float_balance: agent.floatBalance,
      target_float: agent.targetFloat,
      low_threshold: agent.lowThreshold,
      critical_threshold: agent.criticalThreshold,
      reliability_pct: agent.reliability,
      volume_today: agent.todayVolume,
      last_report: agent.lastReportAt,
    })),
  )
}

export function AgentPhone({ agent }: { agent: Agent }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted">
      <Phone size={9} /> {formatPhone(agent.phone)}
    </span>
  )
}

export function DrawerFooterLink({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[10px] font-medium text-forest-700"
    >
      {children} <ChevronRight size={11} />
    </button>
  )
}
