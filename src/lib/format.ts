import type { CountryCode, Currency, FloatStatus, RequestStatus } from './types'
import { MARKETS, marketByCode } from './markets'

export const cx = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ')

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const roundTo = (value: number, step: number) => Math.round(value / step) * step

const amountFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 0,
})

const amountWithDecimals = new Intl.NumberFormat('en', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatAmount(value: number, decimals = false) {
  return (decimals ? amountWithDecimals : amountFormatter).format(Math.round(value * 100) / 100)
}

export function formatMoney(value: number, currency: Currency = 'GHS', decimals = false) {
  return `${currency} ${formatAmount(value, decimals)}`
}

export function formatCompact(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    const millions = value / 1_000_000
    return `${millions >= 10 ? millions.toFixed(0) : millions.toFixed(1)}m`
  }
  if (Math.abs(value) >= 1000) {
    const thousands = value / 1000
    return `${thousands >= 100 ? thousands.toFixed(0) : thousands.toFixed(1)}k`
  }
  return formatAmount(value)
}

export function formatCompactMoney(value: number, currency: Currency = 'GHS') {
  return `${currency} ${formatCompact(value)}`
}

export function formatPortfolioMoney(
  items: Array<{ value: number; currency: Currency }>,
  compact = true,
  limit = 2,
) {
  const totals = new Map<Currency, number>()
  for (const item of items) {
    if (item.value <= 0) continue
    totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.value)
  }
  const entries = [...totals.entries()].sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return '—'
  const shown = limit > 0 ? entries.slice(0, limit) : entries
  const rendered = shown.map(
    ([currency, value]) => `${currency} ${compact ? formatCompact(value) : formatAmount(value)}`,
  )
  if (entries.length > shown.length) rendered.push(`+${entries.length - shown.length}`)
  return rendered.join(' · ')
}

export function relativeTime(iso: string, now = Date.now()) {
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(then)
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatLongDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

export function dayGroup(iso: string, now = new Date()) {
  const date = new Date(iso)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const diffDays = Math.round((startOfToday - startOfDate) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' }).format(date)
}

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, '')
}

export function phoneDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function marketForPhone(value: string) {
  const digits = phoneDigits(value)
  return MARKETS.find((market) => digits.startsWith(market.dialCode.slice(1))) ?? null
}

export function phoneToLocal(value: string) {
  const digits = phoneDigits(value)
  const market = marketForPhone(value)
  if (market) return digits.slice(market.dialCode.length - 1)
  if (digits.startsWith('0')) return digits.slice(1)
  return digits
}

export function phoneMatches(stored: string, input: string) {
  const a = phoneDigits(stored)
  const b = phoneDigits(input)
  if (!a || !b) return false
  if (a === b) return true
  if (b.startsWith('0')) return a.endsWith(b.slice(1))
  return b.length >= 7 && a.endsWith(b)
}

function groupLocal(local: string) {
  if (local.length === 7) return `${local.slice(0, 3)} ${local.slice(3)}`
  if (local.length === 10) return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
  if (local.length === 8) return `${local.slice(0, 4)} ${local.slice(4)}`
  return `${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`
}

export function formatPhone(value: string) {
  const digits = phoneDigits(value)
  const market = marketForPhone(value)
  if (!market) return value
  const local = digits.slice(market.dialCode.length - 1)
  return local ? `${market.dialCode} ${groupLocal(local)}` : market.dialCode
}

export function toE164(value: string, country: CountryCode) {
  const market = marketByCode[country]
  const digits = phoneDigits(value).replace(/^0/, '')
  if (digits.length !== market.localLength) return ''
  return `${market.dialCode}${digits}`
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function statusOf(balance: number, lowThreshold: number, criticalThreshold: number): FloatStatus {
  if (balance <= criticalThreshold) return 'critical'
  if (balance <= lowThreshold) return 'low'
  return 'healthy'
}

export function statusLabel(status: FloatStatus) {
  return status === 'healthy' ? 'Healthy' : status === 'low' ? 'Low float' : 'Critical'
}

export function requestStatusLabel(status: RequestStatus) {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'accepted':
      return 'Accepted'
    case 'completed':
      return 'Completed'
    case 'declined':
      return 'Declined'
    case 'flagged':
      return 'Flagged'
  }
}

export function availableExcess(balance: number, lowThreshold: number, targetFloat: number) {
  const reserve = Math.max(lowThreshold * 1.5, targetFloat * 0.35)
  return Math.max(0, balance - reserve)
}

export function suggestAmount(balance: number, lowThreshold: number, providerExcess: number) {
  const target = lowThreshold * 2
  const gap = Math.max(1000, target - balance)
  const stepped = Math.ceil(gap / 500) * 500
  return clamp(stepped, 500, Math.max(500, Math.floor(providerExcess / 500) * 500))
}

export function reference() {
  return `FL-${Math.floor(1000 + Math.random() * 9000)}`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}
