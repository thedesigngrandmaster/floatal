import { useId, type ReactNode } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Clock3,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { cx, formatAmount, formatCompactMoney, statusLabel } from '../lib/format'
import { marketByCode } from '../lib/markets'
import type { Agent, FloatStatus, RequestStatus } from '../lib/types'

export function StatusPill({
  status,
  size = 'md',
  onDark = false,
  className,
}: {
  status: FloatStatus
  size?: 'sm' | 'md' | 'lg'
  onDark?: boolean
  className?: string
}) {
  const light = {
    healthy: 'bg-healthy-50 text-healthy-700 border-healthy-100',
    low: 'bg-warn-50 text-warn-700 border-warn-100',
    critical: 'bg-danger-50 text-danger-700 border-danger-100',
  }
  const dark = {
    healthy: 'bg-[#78C9A4]/12 text-[#B7EBD3] border-[#78C9A4]/20',
    low: 'bg-[#F5C518]/12 text-[#FFE291] border-[#F5C518]/25',
    critical: 'bg-[#E4695A]/14 text-[#FFB5AC] border-[#E4695A]/25',
  }
  const dot = {
    healthy: 'bg-healthy-500',
    low: 'bg-warn-500',
    critical: 'bg-danger-500',
  }
  const darkDot = {
    healthy: 'bg-[#78C9A4]',
    low: 'bg-[#F5C518]',
    critical: 'bg-[#E4695A]',
  }
  const sizes = {
    sm: 'px-2 py-[3px] text-[10px] gap-1.5',
    md: 'px-2.5 py-1 text-[11px] gap-1.5',
    lg: 'px-3 py-1.5 text-xs gap-2',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border font-medium tracking-[0.005em]',
        onDark ? dark[status] : light[status],
        sizes[size],
        className,
      )}
    >
      <span
        className={cx(
          'h-1.5 w-1.5 rounded-full',
          onDark ? darkDot[status] : dot[status],
          status === 'critical' && 'animate-pulse',
        )}
      />
      {statusLabel(status)}
    </span>
  )
}

export function RequestPill({
  status,
  size = 'md',
  className,
}: {
  status: RequestStatus
  size?: 'sm' | 'md'
  className?: string
}) {
  const styles: Record<RequestStatus, { cls: string; dot: string; label: string }> = {
    pending: {
      cls: 'bg-warn-50 text-warn-700 border-warn-100',
      dot: 'bg-warn-500',
      label: 'Pending',
    },
    accepted: {
      cls: 'bg-mint-50 text-forest-800 border-mint-200',
      dot: 'bg-forest-600',
      label: 'Accepted',
    },
    completed: {
      cls: 'bg-healthy-50 text-healthy-700 border-healthy-100',
      dot: 'bg-healthy-500',
      label: 'Completed',
    },
    declined: {
      cls: 'bg-sand-100 text-muted border-sand-200',
      dot: 'bg-sand-400',
      label: 'Declined',
    },
    flagged: {
      cls: 'bg-danger-50 text-danger-700 border-danger-100',
      dot: 'bg-danger-500',
      label: 'Flagged',
    },
  }
  const item = styles[status]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-[3px] text-[10px]' : 'px-2.5 py-1 text-[11px]',
        item.cls,
        className,
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full', item.dot)} />
      {item.label}
    </span>
  )
}

export function SyncChip({
  online,
  syncing,
  queued = 0,
  onDark = false,
  compact = false,
  className,
}: {
  online: boolean
  syncing: boolean
  queued?: number
  onDark?: boolean
  compact?: boolean
  className?: string
}) {
  const state = syncing ? 'syncing' : online ? 'online' : 'offline'
  const label = syncing ? 'Syncing' : online ? 'Online' : queued > 0 ? `Offline · ${queued}` : 'Offline'
  const icon =
    state === 'syncing' ? (
      <RefreshCw size={11} className="animate-spin" />
    ) : state === 'online' ? (
      <Wifi size={11} />
    ) : (
      <WifiOff size={11} />
    )
  const styles = onDark
    ? state === 'online'
      ? 'border-white/15 bg-white/8 text-white/75'
      : state === 'syncing'
        ? 'border-[#78C9A4]/25 bg-[#78C9A4]/12 text-[#C6F3E0]'
        : 'border-[#F5C518]/30 bg-[#F5C518]/12 text-[#FFE291]'
    : state === 'online'
      ? 'border-healthy-100 bg-healthy-50 text-healthy-700'
      : state === 'syncing'
        ? 'border-mint-200 bg-mint-50 text-forest-700'
        : 'border-warn-100 bg-warn-50 text-warn-700'
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center rounded-full border font-medium',
        compact ? 'gap-1 px-2 py-[4px] text-[10px]' : 'gap-1.5 px-2.5 py-1 text-[10.5px]',
        styles,
        className,
      )}
    >
      {icon}
      <span>{label}</span>
      {!compact && queued > 0 && !syncing && (
        <span className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-warn-500/15 px-1 text-[9px] font-semibold text-warn-700">
          {queued}
        </span>
      )}
    </span>
  )
}

export function Avatar({
  name,
  hue = 152,
  size = 'md',
  className,
}: {
  name: string
  hue?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  const sizes = {
    xs: 'h-7 w-7 text-[10px]',
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-[12px]',
    lg: 'h-12 w-12 text-sm',
    xl: 'h-16 w-16 text-lg',
  }
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-[0.01em] ring-1 ring-inset ring-black/[0.04]',
        sizes[size],
        className,
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 40% 93%), hsl(${hue + 10} 32% 87%))`,
        color: `hsl(${hue} 46% 23%)`,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cx('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}

export function Sparkline({
  values,
  color = '#1E8E63',
  height = 34,
  filled = true,
  className,
}: {
  values: number[]
  color?: string
  height?: number
  filled?: boolean
  className?: string
}) {
  const rawId = useId()
  const id = rawId.replace(/[^a-zA-Z0-9]/g, '')
  const width = 120
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = 4
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width
    const y = height - pad - ((value - min) / range) * (height - pad * 2)
    return [x, y] as const
  })
  let line = `M ${points[0][0]},${points[0][1]}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const [x1, y1] = points[index]
    const [x2, y2] = points[index + 1]
    const mid = (x1 + x2) / 2
    line += ` C ${mid},${y1} ${mid},${y2} ${x2},${y2}`
  }
  const area = `${line} L ${width},${height} L 0,${height} Z`
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cx('metric-spark', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {filled && <path d={area} fill={`url(#spark-${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function Donut({
  segments,
  size = 132,
  thickness = 11,
  trackColor = '#EDEFE8',
  children,
  className,
}: {
  segments: Array<{ value: number; color: string }>
  size?: number
  thickness?: number
  trackColor?: string
  children?: ReactNode
  className?: string
}) {
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1
  let offset = 0
  return (
    <div className={cx('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        {segments.map((segment, index) => {
          const length = (segment.value / total) * circumference
          const element = (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0, length - 4)} ${circumference - Math.max(0, length - 4)}`}
              strokeDashoffset={-offset}
              opacity={segment.value === 0 ? 0 : 1}
            />
          )
          offset += length
          return element
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex flex-col items-center px-6 py-12 text-center', className)}>
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] border border-mint-200 bg-mint-50 text-forest-700">
        <div className="absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/60" />
        {icon}
      </div>
      <h3 className="font-display text-[17px] font-medium tracking-[-0.02em] text-forest-900">{title}</h3>
      <p className="mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function SectionHeading({
  title,
  action,
  subtitle,
  className,
}: {
  title: string
  action?: ReactNode
  subtitle?: string
  className?: string
}) {
  return (
    <div className={cx('flex items-end justify-between gap-3', className)}>
      <div>
        <h2 className="font-display text-[16px] font-medium tracking-[-0.025em] text-forest-900">{title}</h2>
        {subtitle && <p className="mt-1 text-[11.5px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className="toggle"
      data-on={on}
      onClick={() => onChange(!on)}
    >
      <span className="toggle-thumb block" />
    </button>
  )
}

const eventIcons = {
  complete: Check,
  report: ArrowDownLeft,
  request: ArrowUpRight,
  sync: RefreshCw,
  pending: Clock3,
}

export function EventGlyph({
  type,
  tone = 'default',
}: {
  type: keyof typeof eventIcons
  tone?: 'default' | 'healthy' | 'warn' | 'danger' | 'forest'
}) {
  const Icon = eventIcons[type]
  const palette = {
    default: 'bg-sand-100 text-forest-700',
    healthy: 'bg-healthy-50 text-healthy-600',
    warn: 'bg-warn-50 text-warn-600',
    danger: 'bg-danger-50 text-danger-600',
    forest: 'bg-mint-50 text-forest-700',
  }
  return (
    <span className={cx('flex h-8 w-8 items-center justify-center rounded-full', palette[tone])}>
      <Icon size={14} />
    </span>
  )
}

export function NetworkMap({
  agents,
  selectedId,
  onSelect,
  currentAgentId,
  className,
  showLabels = false,
}: {
  agents: Agent[]
  selectedId?: string | null
  onSelect?: (agentId: string) => void
  currentAgentId?: string | null
  className?: string
  showLabels?: boolean
}) {
  const rawId = useId()
  const id = rawId.replace(/[^a-zA-Z0-9]/g, '')
  const market = agents[0] ? marketByCode[agents[0].country] : null
  const coordinates = market
    ? `${Math.abs(market.coordinates.lat).toFixed(3)}° ${market.coordinates.lat >= 0 ? 'N' : 'S'} · ${Math.abs(market.coordinates.lng).toFixed(3)}° ${market.coordinates.lng >= 0 ? 'E' : 'W'}`
    : '5.560° N · 0.196° W'
  const statusColor: Record<FloatStatus, string> = {
    healthy: '#7ED0A9',
    low: '#F5C518',
    critical: '#F07A6B',
  }
  const toPoint = (agent: Agent) => ({
    x: 42 + agent.position.x * 5.6,
    y: 22 + agent.position.y * 3.1,
  })
  return (
    <div className={cx('relative overflow-hidden', className)}>
      <div className="absolute inset-0 map-grid opacity-60" />
      <svg
        viewBox="0 0 640 360"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={`Abstract map of agent float positions across ${market?.name ?? 'the network'}`}
      >
        <defs>
          <radialGradient id={`mapglow-${id}`} cx="55%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#0F6B50" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0C4232" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`coast-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A8DEC2" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#A8DEC2" stopOpacity="0.015" />
          </linearGradient>
        </defs>

        <rect width="640" height="360" fill={`url(#mapglow-${id})`} />
        <path
          d="M392 372 C 430 326 496 310 528 272 C 558 236 568 196 622 174 L 660 160 L 660 372 Z"
          fill={`url(#coast-${id})`}
        />
        <path
          d="M392 372 C 430 326 496 310 528 272 C 558 236 568 196 622 174 L 660 160"
          fill="none"
          stroke="#A8DEC2"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
        <g fill="none" stroke="#A8DEC2" strokeLinecap="round">
          <path d="M-20 286 C 110 252 168 264 268 208 C 362 155 454 176 680 116" strokeOpacity="0.12" strokeWidth="10" />
          <path d="M-20 286 C 110 252 168 264 268 208 C 362 155 454 176 680 116" strokeOpacity="0.22" strokeWidth="1" />
          <path d="M86 -16 C 112 86 172 132 246 176 C 318 220 346 286 372 396" strokeOpacity="0.11" strokeWidth="7" />
          <path d="M86 -16 C 112 86 172 132 246 176 C 318 220 346 286 372 396" strokeOpacity="0.18" strokeWidth="1" />
          <path d="M-20 142 C 94 150 162 182 228 244 C 286 300 360 306 460 316" strokeOpacity="0.09" strokeWidth="5" />
          <path d="M260 -10 C 276 74 340 112 402 154 C 476 204 520 260 560 372" strokeOpacity="0.1" strokeWidth="4" />
          <path d="M480 360 C 490 296 532 250 620 224" strokeOpacity="0.08" strokeWidth="4" />
          <circle cx="286" cy="208" r="42" strokeOpacity="0.12" strokeDasharray="2 6" />
          <circle cx="286" cy="208" r="78" strokeOpacity="0.08" strokeDasharray="2 7" />
        </g>

        <g opacity="0.4">
          <text x="34" y="334" fill="#A8DEC2" fontSize="8" letterSpacing="2.4" fontFamily="Bricolage Grotesque, sans-serif">
            {market ? market.capital.toUpperCase() : 'NETWORK'}
          </text>
          <text x="34" y="347" fill="#A8DEC2" fontSize="7" letterSpacing="0.8" opacity="0.6" fontFamily="Bricolage Grotesque, sans-serif">
            {coordinates}
          </text>
        </g>
        <g transform="translate(604 40)" opacity="0.5">
          <circle r="12" fill="none" stroke="#A8DEC2" strokeOpacity="0.25" />
          <path d="M0 -8 L3 3 L0 1 L-3 3 Z" fill="#A8DEC2" fillOpacity="0.6" />
          <text x="0" y="-16" textAnchor="middle" fill="#A8DEC2" fontSize="6.5" letterSpacing="1" fontFamily="Bricolage Grotesque, sans-serif">
            N
          </text>
        </g>

        {agents.map((agent) => {
          const point = toPoint(agent)
          const offline = Date.now() - new Date(agent.lastSyncAt).getTime() > 45 * 60_000
          const selected = selectedId === agent.id
          const isCurrent = currentAgentId === agent.id
          const color = statusColor[agent.status]
          return (
            <g
              key={agent.id}
              className={cx('transition-opacity', onSelect && 'cursor-pointer', offline && 'opacity-45')}
              onClick={() => onSelect?.(agent.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onSelect?.(agent.id)
              }}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={`${agent.name}, ${statusLabel(agent.status)} float`}
            >
              <title>{`${agent.name} — ${statusLabel(agent.status)}`}</title>
              <circle cx={point.x} cy={point.y} r={isCurrent ? 19 : 14} fill={color} opacity="0.1" />
              <circle
                cx={point.x}
                cy={point.y}
                r={isCurrent ? 14 : selected ? 12 : 9}
                fill="none"
                stroke={isCurrent ? '#F5C518' : color}
                strokeOpacity={isCurrent ? 0.85 : 0.4}
                strokeWidth="1"
                strokeDasharray={isCurrent ? '2 3' : undefined}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={selected ? 7.5 : 6}
                fill={color}
                stroke="#06271F"
                strokeWidth="2.5"
              />
              {selected && (
                <circle cx={point.x} cy={point.y} r="17" fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="1.5">
                  <animate attributeName="r" values="12;22" dur="2.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.45;0" dur="2.8s" repeatCount="indefinite" />
                </circle>
              )}
              {(showLabels || isCurrent) && (
                <g>
                  <rect
                    x={point.x - (isCurrent ? 20 : 34)}
                    y={point.y + (isCurrent ? 14 : 17)}
                    width={isCurrent ? 40 : 68}
                    height="17"
                    rx="8.5"
                    fill="#06271F"
                    fillOpacity="0.82"
                    stroke={isCurrent ? '#F5C518' : '#A8DEC2'}
                    strokeOpacity={isCurrent ? 0.35 : 0.12}
                  />
                  <text
                    x={point.x}
                    y={point.y + (isCurrent ? 25.5 : 28.5)}
                    textAnchor="middle"
                    fill={isCurrent ? '#FFE291' : '#D7EFE3'}
                    fontSize={isCurrent ? 6.5 : 6}
                    letterSpacing="0.7"
                    fontFamily="Bricolage Grotesque, sans-serif"
                  >
                    {isCurrent ? 'YOU' : agent.name.split(' ')[0].toUpperCase()}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function AgentExcess({ agent }: { agent: Agent }) {
  const excess = Math.max(0, agent.floatBalance - agent.lowThreshold * 1.5)
  return (
    <span className="tnum text-[13px] font-medium text-forest-800">
      {formatCompactMoney(excess)}
    </span>
  )
}

export function MiniStat({
  label,
  value,
  tone = 'default',
  icon,
}: {
  label: string
  value: string
  tone?: 'default' | 'healthy' | 'warn' | 'danger'
  icon?: ReactNode
}) {
  const colors = {
    default: 'text-forest-900',
    healthy: 'text-healthy-600',
    warn: 'text-warn-600',
    danger: 'text-danger-600',
  }
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
        {icon}
        {label}
      </div>
      <div className={cx('tnum mt-1 text-[15px] font-medium tracking-[-0.02em]', colors[tone])}>{value}</div>
    </div>
  )
}

export function AmountText({
  value,
  currency = 'GHS',
  className,
  codeClassName,
}: {
  value: number
  currency?: string
  className?: string
  codeClassName?: string
}) {
  return (
    <span className={cx('tnum inline-flex items-baseline gap-1', className)}>
      <span className={cx('text-[0.55em] font-medium tracking-[0.02em] text-current/55', codeClassName)}>{currency}</span>
      <span>{formatAmount(value)}</span>
    </span>
  )
}
