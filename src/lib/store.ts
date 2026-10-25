import { createSeedData } from './seed'
import type {
  ActivityEvent,
  Agent,
  AgentSession,
  CountryCode,
  FloatReport,
  FloatStatus,
  NetworkSettings,
  Operator,
  OperatorSession,
  QueuedReport,
  RebalanceRequest,
  SharedData,
} from './types'
import { formatMoney, reference, statusLabel, statusOf } from './format'
import { marketByCode } from './markets'
import { emitHaptic, emitToast } from './toast'
import { supabaseEnabled } from './supabase'
import {
  remoteAcceptRequest,
  remoteConfirmHandover,
  remoteCreateRequest,
  remoteDeclineRequest,
  remoteFlagRequest,
  remoteReportFloat,
} from './remote'

const DATA_KEY = 'floatal.data.v2'
const QUEUES_KEY = 'floatal.queues.v1'
const AGENT_SESSION_KEY = 'floatal.session.agent.v1'
const OPERATOR_SESSION_KEY = 'floatal.session.operator.v1'
const OFFLINE_KEY = 'floatal.offline-sim.v1'

export interface StoreSnapshot {
  data: SharedData
  agentSession: AgentSession | null
  operatorSession: OperatorSession | null
  queues: Record<string, QueuedReport[]>
  syncing: boolean
  offlineSimulated: boolean
  online: boolean
  revision: number
}

type Listener = () => void

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function readSession<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  return safeParse<T>(window.localStorage.getItem(key))
}

function loadData(): SharedData {
  const existing = safeParse<SharedData>(window.localStorage.getItem(DATA_KEY))
  if (existing && Array.isArray(existing.agents) && existing.agents.length > 0 && existing.operator) {
    return { ...existing, revision: existing.revision ?? 1 }
  }
  return createSeedData()
}

function loadQueues(): Record<string, QueuedReport[]> {
  return safeParse<Record<string, QueuedReport[]>>(window.localStorage.getItem(QUEUES_KEY)) ?? {}
}

class FloatalStore {
  private data: SharedData
  private queues: Record<string, QueuedReport[]>
  private agentSession: AgentSession | null
  private operatorSession: OperatorSession | null
  private syncing = false
  private offlineSimulated: boolean
  private online = typeof navigator === 'undefined' ? true : navigator.onLine
  private listeners = new Set<Listener>()
  private snapshot: StoreSnapshot
  private channel: BroadcastChannel | null = null
  private syncTimer: number | null = null

  constructor() {
    this.data = loadData()
    this.queues = loadQueues()
    this.agentSession = readSession<AgentSession>(AGENT_SESSION_KEY)
    this.operatorSession = readSession<OperatorSession>(OPERATOR_SESSION_KEY)
    this.offlineSimulated = window.sessionStorage.getItem(OFFLINE_KEY) === '1'
    this.snapshot = this.buildSnapshot()
    this.persistData()
    this.bindNetwork()
    this.bindRealtime()
  }

  private buildSnapshot(): StoreSnapshot {
    return {
      data: this.data,
      agentSession: this.agentSession,
      operatorSession: this.operatorSession,
      queues: this.queues,
      syncing: this.syncing,
      offlineSimulated: this.offlineSimulated,
      online: this.online,
      revision: this.data.revision,
    }
  }

  private rebuild() {
    this.snapshot = this.buildSnapshot()
    for (const listener of this.listeners) listener()
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  private persistData() {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(this.data))
  }

  private persistQueues() {
    window.localStorage.setItem(QUEUES_KEY, JSON.stringify(this.queues))
  }

  private broadcast() {
    if (this.channel) {
      this.channel.postMessage({ source: 'floatal', data: this.data })
    } else {
      window.localStorage.setItem(DATA_KEY, JSON.stringify(this.data))
    }
  }

  private commit(mutator: (data: SharedData) => void) {
    const next: SharedData = {
      ...this.data,
      agents: [...this.data.agents],
      reports: [...this.data.reports],
      requests: [...this.data.requests],
      events: [...this.data.events],
      settings: { ...this.data.settings },
      operator: { ...this.data.operator },
      revision: this.data.revision + 1,
    }
    mutator(next)
    this.data = next
    this.persistData()
    this.broadcast()
    this.rebuild()
  }

  private bindNetwork() {
    window.addEventListener('online', () => {
      this.online = true
      this.rebuild()
      const queued = this.queuedCount()
      if (queued > 0 && !this.offlineSimulated) {
        emitToast('Connection restored — syncing reports', { tone: 'sync' })
        void this.syncNow()
      }
    })
    window.addEventListener('offline', () => {
      this.online = false
      this.rebuild()
      emitToast('You are offline. Reports will be saved on this device.', { tone: 'warning' })
    })
  }

  private bindRealtime() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('floatal.live')
      this.channel.onmessage = (event: MessageEvent) => {
        const payload = event.data as { source?: string; data?: SharedData } | undefined
        if (payload?.source !== 'floatal' || !payload.data) return
        if (payload.data.revision <= this.data.revision) return
        this.data = payload.data
        this.rebuild()
      }
    }

    window.addEventListener('storage', (event) => {
      if (event.key !== DATA_KEY || !event.newValue) return
      const incoming = safeParse<SharedData>(event.newValue)
      if (!incoming || incoming.revision <= this.data.revision) return
      this.data = incoming
      this.rebuild()
    })
  }

  get isOffline() {
    return !this.online || this.offlineSimulated
  }

  getSyncState(): 'online' | 'offline' | 'syncing' {
    if (this.syncing) return 'syncing'
    return this.isOffline ? 'offline' : 'online'
  }

  queuedFor(agentId: string) {
    return this.queues[agentId] ?? []
  }

  queuedCount() {
    return Object.values(this.queues).reduce((sum, items) => sum + items.length, 0)
  }

  setOfflineSimulated(value: boolean) {
    this.offlineSimulated = value
    window.sessionStorage.setItem(OFFLINE_KEY, value ? '1' : '0')
    this.rebuild()
    emitToast(value ? 'Offline mode on — reports will queue locally' : 'Back online', {
      tone: value ? 'warning' : 'success',
    })
  }

  setAgentSession(agent: Agent, demo = true) {
    const session: AgentSession = {
      role: 'agent',
      agentId: agent.id,
      phone: agent.phone,
      signedInAt: new Date().toISOString(),
      demo,
    }
    this.agentSession = session
    window.localStorage.setItem(AGENT_SESSION_KEY, JSON.stringify(session))
    this.rebuild()
  }

  setOperatorSession(operator: Operator, demo = true) {
    const session: OperatorSession = {
      role: 'operator',
      operatorId: operator.id,
      name: 'Adjoa Serwaa',
      email: 'adjoa@ayamoney.com',
      signedInAt: new Date().toISOString(),
      demo,
    }
    this.operatorSession = session
    window.localStorage.setItem(OPERATOR_SESSION_KEY, JSON.stringify(session))
    this.rebuild()
  }

  signOutAgent() {
    this.agentSession = null
    window.localStorage.removeItem(AGENT_SESSION_KEY)
    this.rebuild()
  }

  signOutOperator() {
    this.operatorSession = null
    window.localStorage.removeItem(OPERATOR_SESSION_KEY)
    this.rebuild()
  }

  switchAgent(agentId: string) {
    const agent = this.data.agents.find((item) => item.id === agentId)
    if (!agent) return
    this.setAgentSession(agent, this.agentSession?.demo ?? true)
    emitHaptic(8)
  }

  currentAgent() {
    if (!this.agentSession) return null
    return this.data.agents.find((agent) => agent.id === this.agentSession?.agentId) ?? null
  }

  private flashSync() {
    this.syncing = true
    this.rebuild()
    if (this.syncTimer) window.clearTimeout(this.syncTimer)
    this.syncTimer = window.setTimeout(() => {
      this.syncing = false
      this.syncTimer = null
      this.rebuild()
    }, 900)
  }

  async reportFloat(input: { balance: number; status: FloatStatus; note?: string }) {
    const agent = this.currentAgent()
    if (!agent) return { ok: false as const, error: 'No agent session' }
    const now = new Date().toISOString()
    const report: FloatReport = {
      id: crypto.randomUUID(),
      agentId: agent.id,
      balance: input.balance,
      status: input.status,
      note: input.note?.trim() || undefined,
      createdAt: now,
      syncedAt: this.isOffline ? null : now,
      pending: this.isOffline,
      source: 'agent' as const,
    }

    if (this.isOffline) {
      this.queues = {
        ...this.queues,
        [agent.id]: [...(this.queues[agent.id] ?? []), { ...report }],
      }
      this.persistQueues()
      this.rebuild()
      emitHaptic([12, 40, 12])
      return { ok: true as const, queued: true, report }
    }

    this.commit((data) => {
      data.reports = [report, ...data.reports].slice(0, 300)
      data.agents = data.agents.map((item) =>
        item.id === agent.id
          ? {
              ...item,
              floatBalance: input.balance,
              status: input.status,
              lastReportAt: now,
              lastSyncAt: now,
            }
          : item,
      )
      data.events = [
        {
          id: crypto.randomUUID(),
          type: 'report' as const,
          agentId: agent.id,
          country: agent.country,
          currency: agent.currency,
          amount: input.balance,
          title: `${agent.name} reported ${statusLabel(input.status).toLowerCase()} float`,
          detail: `${formatMoney(input.balance, agent.currency)} · ${agent.area}`,
          createdAt: now,
        },
        ...data.events,
      ].slice(0, 200)
      data.lastSyncAt = now
    })
    this.flashSync()
    emitHaptic(14)

    if (supabaseEnabled) {
      void remoteReportFloat(report, agent.id)
    }

    return { ok: true as const, queued: false, report }
  }

  async syncNow() {
    if (this.syncing) return { ok: false as const, synced: 0, reason: 'busy' as const }
    if (this.isOffline) {
      emitToast('You are still offline. Reports are safe on this device.', { tone: 'warning' })
      return { ok: false as const, synced: 0, reason: 'offline' as const }
    }

    const pending = Object.values(this.queues).flat()
    this.syncing = true
    this.rebuild()
    await delay(pending.length ? 950 : 550)

    if (this.isOffline) {
      this.syncing = false
      this.rebuild()
      emitToast('Connection lost — reports remain queued', { tone: 'warning' })
      return { ok: false as const, synced: 0, reason: 'offline' as const }
    }

    if (pending.length === 0) {
      const now = new Date().toISOString()
      this.commit((data) => {
        data.lastSyncAt = now
      })
      this.syncing = false
      this.rebuild()
      emitToast('Everything is up to date', { tone: 'success' })
      return { ok: true as const, synced: 0 }
    }

    const now = new Date().toISOString()
    const pendingByAgent = new Map<string, QueuedReport[]>()
    for (const item of pending) {
      pendingByAgent.set(item.agentId, [...(pendingByAgent.get(item.agentId) ?? []), item])
    }

    this.commit((data) => {
      const newReports: FloatReport[] = []
      const newEvents: ActivityEvent[] = []
      for (const item of pending) {
        newReports.push({
          id: item.id,
          agentId: item.agentId,
          balance: item.balance,
          status: item.status,
          note: item.note,
          createdAt: item.createdAt,
          syncedAt: now,
          pending: false,
          source: 'agent' as const,
        })
      }
      for (const [agentId, items] of pendingByAgent) {
        const latest = items[items.length - 1]
        const agent = data.agents.find((candidate) => candidate.id === agentId)
        if (!agent) continue
        newEvents.push({
          id: crypto.randomUUID(),
          type: 'sync' as const,
          agentId,
          country: agent.country,
          currency: agent.currency,
          amount: latest.balance,
          title: `${agent.name} synced ${items.length > 1 ? `${items.length} offline reports` : 'an offline report'}`,
          detail: `Latest float ${formatMoney(latest.balance, agent.currency)} · ${agent.area}`,
          createdAt: now,
        })
        data.agents = data.agents.map((candidate) =>
          candidate.id === agentId
            ? {
                ...candidate,
                floatBalance: latest.balance,
                status: latest.status,
                lastReportAt: latest.createdAt,
                lastSyncAt: now,
              }
            : candidate,
        )
      }
      data.reports = [...newReports, ...data.reports].slice(0, 300)
      data.events = [...newEvents, ...data.events].slice(0, 200)
      data.lastSyncAt = now
      for (const item of pending) {
        const current = this.queues[item.agentId] ?? []
        this.queues = {
          ...this.queues,
          [item.agentId]: current.filter((queued) => queued.id !== item.id),
        }
      }
    })
    this.persistQueues()
    this.syncing = false
    this.rebuild()
    emitHaptic(16)
    emitToast(`${pending.length} ${pending.length === 1 ? 'report' : 'reports'} synced`, { tone: 'success' })
    return { ok: true as const, synced: pending.length }
  }

  createRequest(toAgentId: string, amount: number, note?: string) {
    const agent = this.currentAgent()
    if (!agent) return { ok: false as const, error: 'No agent session' }
    if (this.isOffline) {
      emitToast('Connect to request float from the network', { tone: 'warning' })
      return { ok: false as const, error: 'offline' }
    }
    const provider = this.data.agents.find((candidate) => candidate.id === toAgentId)
    if (!provider) return { ok: false as const, error: 'Provider not found' }
    const now = new Date().toISOString()
    const request: RebalanceRequest = {
      id: crypto.randomUUID(),
      reference: reference(),
      fromAgentId: agent.id,
      toAgentId,
      country: agent.country,
      currency: agent.currency,
      amount: Math.round(amount),
      note: note?.trim() || undefined,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      requesterConfirmed: false,
      providerConfirmed: false,
    }
    this.commit((data) => {
      data.requests = [request, ...data.requests]
      data.events = [
        {
          id: crypto.randomUUID(),
          type: 'request' as const,
          agentId: agent.id,
          counterpartyId: provider.id,
          requestId: request.id,
          country: agent.country,
          currency: agent.currency,
          amount: request.amount,
          title: `${agent.name} requested ${formatMoney(request.amount, agent.currency)}`,
          detail: `${provider.name} · ${agent.area} to ${provider.area}`,
          createdAt: now,
        },
        ...data.events,
      ].slice(0, 200)
    })
    emitHaptic(12)
    if (supabaseEnabled) void remoteCreateRequest(request)
    return { ok: true as const, request }
  }

  acceptRequest(requestId: string) {
    const agent = this.currentAgent()
    if (!agent) return false
    if (this.isOffline) {
      emitToast('Connect to respond to this request', { tone: 'warning' })
      return false
    }
    const request = this.data.requests.find((item) => item.id === requestId)
    if (!request || request.status !== 'pending' || request.toAgentId !== agent.id) return false
    const now = new Date().toISOString()
    const requester = this.data.agents.find((item) => item.id === request.fromAgentId)
    this.commit((data) => {
      data.requests = data.requests.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: 'accepted',
              acceptedAt: now,
              updatedAt: now,
              providerConfirmed: false,
            }
          : item,
      )
      data.events = [
        {
          id: crypto.randomUUID(),
          type: 'accept' as const,
          agentId: agent.id,
          counterpartyId: request.fromAgentId,
          requestId,
          country: request.country,
          currency: request.currency,
          amount: request.amount,
          title: `${agent.name} accepted a request`,
          detail: `${formatMoney(request.amount, request.currency)} · ${requester?.name ?? 'Agent'}`,
          createdAt: now,
        },
        ...data.events,
      ].slice(0, 200)
    })
    emitHaptic([10, 30, 10])
    if (supabaseEnabled) void remoteAcceptRequest(requestId)
    return true
  }

  declineRequest(requestId: string, reason?: string) {
    const agent = this.currentAgent()
    if (!agent) return false
    const request = this.data.requests.find((item) => item.id === requestId)
    if (!request || request.status !== 'pending' || request.toAgentId !== agent.id) return false
    const now = new Date().toISOString()
    this.commit((data) => {
      data.requests = data.requests.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: 'declined',
              declinedAt: now,
              updatedAt: now,
              note: reason?.trim() || item.note,
            }
          : item,
      )
      data.events = [
        {
          id: crypto.randomUUID(),
          type: 'decline' as const,
          agentId: agent.id,
          counterpartyId: request.fromAgentId,
          requestId,
          country: request.country,
          currency: request.currency,
          amount: request.amount,
          title: 'Request declined',
          detail: `${agent.name}${reason?.trim() ? ` · ${reason.trim()}` : ''}`,
          createdAt: now,
        },
        ...data.events,
      ].slice(0, 200)
    })
    emitHaptic(10)
    if (supabaseEnabled) void remoteDeclineRequest(requestId, reason)
    return true
  }

  confirmHandover(requestId: string) {
    const agent = this.currentAgent()
    if (!agent) return null
    if (this.isOffline) {
      emitToast('Connect to confirm this handover', { tone: 'warning' })
      return null
    }
    const request = this.data.requests.find((item) => item.id === requestId)
    if (!request || request.status !== 'accepted') return null
    const isRequester = request.fromAgentId === agent.id
    const isProvider = request.toAgentId === agent.id
    if (!isRequester && !isProvider) return null
    if ((isRequester && request.requesterConfirmed) || (isProvider && request.providerConfirmed)) {
      return request.status
    }

    const now = new Date().toISOString()
    let nextStatus: RebalanceRequest['status'] = 'accepted'
    let completed = false
    const requester = this.data.agents.find((item) => item.id === request.fromAgentId)
    const provider = this.data.agents.find((item) => item.id === request.toAgentId)

    this.commit((data) => {
      let updated = data.requests.map((item) => {
        if (item.id !== requestId) return item
        const next = {
          ...item,
          requesterConfirmed: isRequester ? true : item.requesterConfirmed,
          providerConfirmed: isProvider ? true : item.providerConfirmed,
          updatedAt: now,
        }
        if (next.requesterConfirmed && next.providerConfirmed) {
          next.status = 'completed'
          next.completedAt = now
          completed = true
          nextStatus = 'completed'
        }
        return next
      })
      if (completed) {
        updated = updated.map((item) => {
          if (item.status !== 'completed') return item
          if (item.id !== requestId) return item
          return item
        })
        data.agents = data.agents.map((candidate) => {
          if (candidate.id === request.fromAgentId) {
            const balance = candidate.floatBalance + request.amount
            return {
              ...candidate,
              floatBalance: balance,
              status: statusOf(balance, candidate.lowThreshold, candidate.criticalThreshold),
              lastSyncAt: now,
            }
          }
          if (candidate.id === request.toAgentId) {
            const balance = Math.max(0, candidate.floatBalance - request.amount)
            return {
              ...candidate,
              floatBalance: balance,
              status: statusOf(balance, candidate.lowThreshold, candidate.criticalThreshold),
              lastSyncAt: now,
            }
          }
          return candidate
        })
        data.events = [
          {
            id: crypto.randomUUID(),
            type: 'complete' as const,
            agentId: request.fromAgentId,
            counterpartyId: request.toAgentId,
            requestId,
            country: request.country,
            currency: request.currency,
            amount: request.amount,
            title: 'Rebalance completed',
            detail: `${formatMoney(request.amount, request.currency)} · ${requester?.name ?? 'Agent'} and ${provider?.name ?? 'Agent'} confirmed`,
            createdAt: now,
          },
          ...data.events,
        ].slice(0, 200)
      } else {
        data.events = [
          {
            id: crypto.randomUUID(),
            type: 'confirm' as const,
            agentId: agent.id,
            counterpartyId: isRequester ? request.toAgentId : request.fromAgentId,
            requestId,
            country: request.country,
            currency: request.currency,
            amount: request.amount,
            title: `${agent.name} confirmed handover`,
            detail: `${formatMoney(request.amount, request.currency)} · awaiting ${isRequester ? provider?.name ?? 'provider' : requester?.name ?? 'requester'}`,
            createdAt: now,
          },
          ...data.events,
        ].slice(0, 200)
      }
      data.requests = updated
      data.lastSyncAt = now
    })
    emitHaptic([12, 30, 12])
    if (supabaseEnabled) void remoteConfirmHandover(requestId, isRequester ? 'requester' : 'provider')
    return nextStatus as RebalanceRequest['status']
  }

  flagRequest(requestId: string, reason: string) {
    const request = this.data.requests.find((item) => item.id === requestId)
    if (!request) return false
    const agent = this.currentAgent()
    const now = new Date().toISOString()
    this.commit((data) => {
      data.requests = data.requests.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: 'flagged',
              flaggedAt: now,
              updatedAt: now,
              flagReason: reason,
            }
          : item,
      )
      data.events = [
        {
          id: crypto.randomUUID(),
          type: 'flag' as const,
          agentId: agent?.id ?? request.toAgentId,
          counterpartyId: request.fromAgentId,
          requestId,
          country: request.country,
          currency: request.currency,
          amount: request.amount,
          title: 'Exception flagged for review',
          detail: `${formatMoney(request.amount, request.currency)} · ${reason}`,
          createdAt: now,
        },
        ...data.events,
      ].slice(0, 200)
    })
    emitHaptic([16, 40, 16])
    emitToast('Flagged for operator review', { tone: 'warning' })
    if (supabaseEnabled) void remoteFlagRequest(requestId, reason)
    return true
  }

  updateSettings(partial: Partial<NetworkSettings>) {
    this.commit((data) => {
      data.settings = { ...data.settings, ...partial }
    })
  }

  updateThresholds(country: CountryCode, lowThreshold: number, criticalThreshold: number) {
    const low = Math.max(0, Math.round(lowThreshold))
    const critical = Math.max(0, Math.min(Math.round(criticalThreshold), low))
    const now = new Date().toISOString()
    const market = marketByCode[country]
    this.commit((data) => {
      data.settings = {
        ...data.settings,
        thresholds: {
          ...data.settings.thresholds,
          [country]: { lowThreshold: low, criticalThreshold: critical },
        },
      }
      data.agents = data.agents.map((agent) =>
        agent.country === country
          ? {
              ...agent,
              lowThreshold: low,
              criticalThreshold: critical,
              status: statusOf(agent.floatBalance, low, critical),
            }
          : agent,
      )
      data.events = [
        {
          id: crypto.randomUUID(),
          type: 'threshold' as const,
          country,
          currency: market.currency,
          title: `${market.name} thresholds updated`,
          detail: `Low ${formatMoney(low, market.currency)} · Critical ${formatMoney(critical, market.currency)}`,
          createdAt: now,
        },
        ...data.events,
      ].slice(0, 200)
      data.lastSyncAt = now
    })
    emitToast('Float thresholds updated', {
      tone: 'success',
      description: `${market.name} agent health has been recalculated.`,
    })
  }

  updateOperator(partial: Partial<Operator>) {
    this.commit((data) => {
      data.operator = { ...data.operator, ...partial }
    })
  }

  addAgent(input: {
    name: string
    businessName: string
    phone: string
    area: string
    country: CountryCode
  }) {
    const now = new Date().toISOString()
    const id = `agt_${crypto.randomUUID().slice(0, 8)}`
    const market = marketByCode[input.country]
    const thresholds = this.data.settings.thresholds[input.country]
    const initials = input.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
    const agent: Agent = {
      id,
      operatorId: this.data.operator.id,
      name: input.name.trim(),
      businessName: input.businessName.trim() || `${input.name.trim()} Mobile Money`,
      phone: input.phone,
      country: input.country,
      currency: market.currency,
      area: input.area.trim() || market.zones[0],
      city: market.capital,
      initials,
      floatBalance: 0,
      status: 'critical',
      targetFloat: market.targetFloat,
      lowThreshold: thresholds.lowThreshold,
      criticalThreshold: thresholds.criticalThreshold,
      lastReportAt: now,
      lastSyncAt: now,
      position: { x: 30 + Math.random() * 45, y: 25 + Math.random() * 45 },
      coordinates: market.coordinates,
      distanceKm: Math.round((1 + Math.random() * 8) * 10) / 10,
      todayVolume: 0,
      reliability: 100,
      joinedAt: now,
      avatarHue: Math.floor(120 + Math.random() * 70),
    }
    this.commit((data) => {
      data.agents = [agent, ...data.agents]
      data.events = [
        {
          id: crypto.randomUUID(),
          type: 'join' as const,
          agentId: agent.id,
          country: agent.country,
          currency: agent.currency,
          title: `${agent.name} joined the network`,
          detail: `${agent.businessName} · ${agent.area}, ${market.name}`,
          createdAt: now,
        },
        ...data.events,
      ].slice(0, 200)
    })
    emitHaptic(12)
    return agent
  }

  resetDemo() {
    this.data = createSeedData()
    this.queues = {}
    this.persistQueues()
    this.persistData()
    this.broadcast()
    this.rebuild()
    emitToast('Demo environment restored', { tone: 'success' })
  }

  simulateActivity() {
    const onlineAgents = this.data.agents.filter(
      (agent) => Date.now() - new Date(agent.lastSyncAt).getTime() < 45 * 60_000,
    )
    if (onlineAgents.length === 0) return
    const agent = onlineAgents[Math.floor(Math.random() * onlineAgents.length)]
    const step = marketByCode[agent.country].step
    const delta = Math.round((Math.random() * 8 - 3) * step)
    const balance = Math.max(0, agent.floatBalance + delta)
    const status = statusOf(balance, agent.lowThreshold, agent.criticalThreshold)
    const now = new Date().toISOString()
    this.commit((data) => {
      data.agents = data.agents.map((candidate) =>
        candidate.id === agent.id
          ? { ...candidate, floatBalance: balance, status, lastReportAt: now, lastSyncAt: now }
          : candidate,
      )
      data.reports = [
        {
          id: crypto.randomUUID(),
          agentId: agent.id,
          balance,
          status,
          createdAt: now,
          syncedAt: now,
          source: 'agent' as const,
        },
        ...data.reports,
      ].slice(0, 300)
      data.events = [
        {
          id: crypto.randomUUID(),
          type: 'report' as const,
          agentId: agent.id,
          country: agent.country,
          currency: agent.currency,
          amount: balance,
          title: `${agent.name} reported ${statusLabel(status).toLowerCase()} float`,
          detail: `${formatMoney(balance, agent.currency)} · ${agent.area}`,
          createdAt: now,
        },
        ...data.events,
      ].slice(0, 200)
      data.lastSyncAt = now
    })
  }

  applyRemote(patch: Partial<SharedData>) {
    this.data = {
      ...this.data,
      ...patch,
      revision: this.data.revision + 1,
    }
    this.persistData()
    this.rebuild()
  }
}

export const store = new FloatalStore()

export function effectiveAgent(agent: Agent, queue: QueuedReport[]): Agent {
  const latest = queue[queue.length - 1]
  if (!latest) return agent
  return {
    ...agent,
    floatBalance: latest.balance,
    status: latest.status,
    lastReportAt: latest.createdAt,
  }
}

export function useSyncState(snapshot: StoreSnapshot) {
  if (snapshot.syncing) return 'syncing' as const
  return snapshot.online && !snapshot.offlineSimulated ? ('online' as const) : ('offline' as const)
}
