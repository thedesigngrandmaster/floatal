import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  CircleDot,
  MapPin,
  Sparkles,
  TrendingUp,
  Wifi,
} from 'lucide-react'
import { Avatar, NetworkMap, SyncChip } from '../components/ui'
import { useFloatal, useNow } from '../lib/hooks'
import { availableExcess, formatCompactMoney, suggestAmount } from '../lib/format'
import { effectiveAgent } from '../lib/store'
import { useRequestFlow } from './requestFlow'

type SortMode = 'nearby' | 'excess'

export function AgentNetwork() {
  const snapshot = useFloatal()
  const now = useNow(20_000)
  const openRequest = useRequestFlow()
  const raw = snapshot.data.agents.find((agent) => agent.id === snapshot.agentSession?.agentId)
  const [sort, setSort] = useState<SortMode>('nearby')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const agent = raw ? effectiveAgent(raw, snapshot.queues[raw.id] ?? []) : null
  if (!agent) return null

  const providers = useMemo(() => {
    return snapshot.data.agents
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
      .filter((entry) => !onlineOnly || entry.online)
      .sort((a, b) =>
        sort === 'nearby'
          ? a.agent.distanceKm - b.agent.distanceKm
          : b.excess - a.excess,
      )
  }, [snapshot.data.agents, snapshot.data.requests, agent.id, sort, onlineOnly, now])

  const selected = providers.find((entry) => entry.agent.id === selectedId) ?? providers[0] ?? null
  const recommended = Math.min(
    suggestAmount(agent.floatBalance, agent.lowThreshold, 100000),
    Math.max(1000, providers[0]?.excess ?? 5000),
  )
  const online = snapshot.online && !snapshot.offlineSimulated
  const agentOnlineCount = snapshot.data.agents.filter(
    (candidate) => now - new Date(candidate.lastSyncAt).getTime() < 45 * 60_000,
  ).length

  return (
    <div className="agent-page pt-safe">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-forest-700/60">
            <MapPin size={10} />
            {snapshot.data.operator.networkName} · Accra
          </div>
          <h1 className="font-display mt-1.5 text-[27px] font-medium leading-none tracking-[-0.045em] text-forest-900">
            Float network
          </h1>
        </div>
        <SyncChip online={online} syncing={snapshot.syncing} queued={snapshot.queues[agent.id]?.length ?? 0} compact />
      </header>

      <div className="mt-5">
        <div className="relative h-[216px] overflow-hidden rounded-[24px] bg-forest-950 shadow-[0_18px_44px_-26px_rgba(5,31,24,0.6)]">
          <NetworkMap
            agents={snapshot.data.agents}
            selectedId={selected?.agent.id}
            onSelect={setSelectedId}
            currentAgentId={agent.id}
            className="h-full w-full"
            showLabels
          />
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-medium text-white/75 backdrop-blur-md">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#78C9A4] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#78C9A4]" />
            </span>
            {agentOnlineCount} agents online
          </div>

          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-x-3 bottom-3 flex items-center gap-2.5 rounded-[18px] border border-white/10 bg-[#08271f]/85 p-2.5 backdrop-blur-xl"
              >
                <Avatar name={selected.agent.name} hue={selected.agent.avatarHue} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-medium text-white">{selected.agent.name}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-white/45">
                    <span>{selected.agent.area}</span>
                    <span>·</span>
                    <span>{formatCompactMoney(selected.excess)} excess</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openRequest(selected.agent)}
                  className="btn btn-gold h-8 shrink-0 px-3 text-[10px]"
                >
                  Request
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            {[
              { label: 'Healthy', color: 'bg-[#78C9A4]' },
              { label: 'Low', color: 'bg-gold-400' },
              { label: 'Critical', color: 'bg-[#F07A6B]' },
            ].map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1.5 text-[8.5px] text-muted/70">
                <span className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                {item.label}
              </span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 text-[8.5px] text-muted/50">
            <CircleDot size={8} /> Tap to inspect
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-[18px] border border-mint-200 bg-mint-50/70 px-3.5 py-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-gold-600 shadow-sm">
          <Sparkles size={12} />
        </span>
        <div className="flex-1">
          <div className="text-[10.5px] font-medium text-forest-800">
            {providers.length > 0
              ? `GHS ${recommended.toLocaleString('en-GH')} would restore a healthy buffer`
              : 'No excess float in range right now'}
          </div>
          <div className="mt-0.5 text-[9.5px] leading-relaxed text-forest-800/55">
            {providers.length > 0
              ? `${providers.length} agents nearby can rebalance with you.`
              : 'Your operator has been notified. Try widening your radius.'}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setSort('nearby')}
            className={
              sort === 'nearby'
                ? 'rounded-full bg-forest-900 px-3 py-1.5 text-[10px] font-medium text-white'
                : 'rounded-full border border-forest-900/10 bg-white px-3 py-1.5 text-[10px] font-medium text-forest-800'
            }
          >
            Nearest
          </button>
          <button
            type="button"
            onClick={() => setSort('excess')}
            className={
              sort === 'excess'
                ? 'rounded-full bg-forest-900 px-3 py-1.5 text-[10px] font-medium text-white'
                : 'rounded-full border border-forest-900/10 bg-white px-3 py-1.5 text-[10px] font-medium text-forest-800'
            }
          >
            Most float
          </button>
          <button
            type="button"
            onClick={() => setOnlineOnly((value) => !value)}
            className={
              onlineOnly
                ? 'inline-flex items-center gap-1 rounded-full border border-healthy-500/30 bg-healthy-50 px-3 py-1.5 text-[10px] font-medium text-healthy-700'
                : 'inline-flex items-center gap-1 rounded-full border border-forest-900/10 bg-white px-3 py-1.5 text-[10px] font-medium text-forest-800'
            }
          >
            <Wifi size={9} /> Online
          </button>
        </div>
        <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-muted/60">
          {providers.length} agents
        </span>
      </div>

      <div className="mt-2">
        {providers.length === 0 ? (
          <div className="mt-2 rounded-[20px] border border-forest-900/[0.07] bg-white px-4 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-50 text-forest-600">
              <TrendingUp size={20} />
            </div>
            <p className="mt-3 text-[13px] font-medium text-forest-900">No online agents with excess</p>
            <p className="mx-auto mt-1 max-w-[240px] text-[10.5px] leading-relaxed text-muted">
              Turn off the online filter to see the wider network, or check back shortly.
            </p>
            {onlineOnly && (
              <button
                type="button"
                onClick={() => setOnlineOnly(false)}
                className="btn btn-ghost btn-sm mt-4"
              >
                Show all agents
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-forest-900/[0.055]">
            {providers.map((entry, index) => (
              <button
                key={entry.agent.id}
                type="button"
                onClick={() => {
                  setSelectedId(entry.agent.id)
                  openRequest(entry.agent)
                }}
                className={`group flex w-full items-center gap-3 py-3.5 text-left transition-all active:opacity-60 ${
                  selected?.agent.id === entry.agent.id ? '' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar name={entry.agent.name} hue={entry.agent.avatarHue} size="md" />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-paper ${
                      entry.online ? 'bg-healthy-500' : 'bg-sand-400'
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-medium tracking-[-0.015em] text-forest-900">
                      {entry.agent.name}
                    </span>
                    {index === 0 && sort === 'nearby' && (
                      <span className="rounded-full bg-gold-400/15 px-1.5 py-0.5 text-[7.5px] font-semibold uppercase tracking-[0.08em] text-warn-700">
                        Best
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-muted">
                    <span>{entry.agent.area}</span>
                    <span className="text-sand-300">·</span>
                    <span>{entry.agent.distanceKm.toFixed(1)} km</span>
                    {!entry.online && <span className="text-warn-600">· offline</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[7.5px] font-medium uppercase tracking-[0.1em] text-muted/60">excess</div>
                  <div className="tnum mt-0.5 text-[12px] font-medium tracking-[-0.015em] text-forest-800">
                    {formatCompactMoney(entry.excess)}
                  </div>
                </div>
                <span className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-forest-900/8 bg-white text-forest-700 transition-colors group-hover:bg-forest-900 group-hover:text-gold-400">
                  <ArrowUpRight size={13} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-[9px] text-muted/50">
        <CircleDot size={9} /> Network refreshed {snapshot.data.lastSyncAt ? 'automatically' : 'just now'} · Accra Metro
      </p>
    </div>
  )
}
