import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { useFloatal } from '../lib/hooks'
import { DEFAULT_MARKET, MARKETS, marketByCode, type Market } from '../lib/markets'
import type { ActivityEvent, Agent, CountryCode, RebalanceRequest } from '../lib/types'
import { cx } from '../lib/format'

const MARKET_KEY = 'floatal.ops.market.v2'

interface OperatorMarketValue {
  market: CountryCode
  setMarket: (country: CountryCode) => void
  meta: Market
  agents: Agent[]
  requests: RebalanceRequest[]
  events: ActivityEvent[]
  agentById: Map<string, Agent>
}

const OperatorMarketContext = createContext<OperatorMarketValue | null>(null)

export function OperatorMarketProvider({ children }: { children: ReactNode }) {
  const snapshot = useFloatal()
  const [market, setMarketState] = useState<CountryCode>(() => {
    if (typeof window === 'undefined') return DEFAULT_MARKET
    const stored = window.localStorage.getItem(MARKET_KEY) as CountryCode | null
    return stored && marketByCode[stored] ? stored : DEFAULT_MARKET
  })

  const setMarket = (country: CountryCode) => {
    setMarketState(country)
    window.localStorage.setItem(MARKET_KEY, country)
  }

  const value = useMemo<OperatorMarketValue>(() => {
    const { agents, requests, events } = snapshot.data
    const agentById = new Map(agents.map((agent) => [agent.id, agent]))
    const marketAgents = agents.filter((agent) => agent.country === market)
    const marketRequests = requests.filter((request) => request.country === market)
    const marketEvents = events.filter((event) => {
      if (event.country) return event.country === market
      if (event.agentId && agentById.get(event.agentId)?.country === market) return true
      if (event.counterpartyId && agentById.get(event.counterpartyId)?.country === market) return true
      return false
    })

    return {
      market,
      setMarket,
      meta: marketByCode[market],
      agents: marketAgents,
      requests: marketRequests,
      events: marketEvents,
      agentById,
    }
  }, [snapshot.data, market])

  return <OperatorMarketContext.Provider value={value}>{children}</OperatorMarketContext.Provider>
}

export function useOperatorMarket() {
  const value = useContext(OperatorMarketContext)
  if (!value) throw new Error('useOperatorMarket must be used inside OperatorMarketProvider')
  return value
}

export function MarketSwitcher({ className }: { className?: string }) {
  const { market, setMarket, meta } = useOperatorMarket()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  return (
    <div ref={ref} className={cx('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 items-center gap-2 rounded-full border border-forest-900/[0.08] bg-white px-3 text-left transition-colors hover:border-forest-900/15"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-[13px] leading-none">{meta.flag}</span>
        <span className="hidden text-[10.5px] font-medium text-forest-900 sm:inline">{meta.name}</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-muted/65">{meta.currency}</span>
        <ChevronDown size={11} className={cx('text-muted/50 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-11 z-[120] w-[248px] origin-top-right overflow-hidden rounded-[16px] border border-forest-900/[0.08] bg-paper p-1.5 shadow-[0_24px_60px_-18px_rgba(5,31,24,0.35)]"
            role="listbox"
            aria-label="Operator market"
          >
            <div className="px-2 pb-1.5 pt-1 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-muted/55">
              Operating market
            </div>
            {MARKETS.map((item) => {
              const active = item.code === market
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setMarket(item.code)
                    setOpen(false)
                  }}
                  role="option"
                  aria-selected={active}
                  className={cx(
                    'flex w-full items-center gap-2.5 rounded-[11px] px-2.5 py-2 text-left transition-colors',
                    active ? 'bg-mint-50' : 'hover:bg-cream',
                  )}
                >
                  <span className="text-[15px] leading-none">{item.flag}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-medium text-forest-900">{item.name}</span>
                    <span className="mt-0.5 block text-[9px] text-muted/60">
                      {item.capital} · {item.currency}
                    </span>
                  </span>
                  {active && <Check size={13} className="text-forest-600" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
