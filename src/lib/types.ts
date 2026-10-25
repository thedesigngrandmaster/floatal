export type Currency = 'GHS' | 'NGN' | 'KES' | 'RWF' | 'GMD'

export type CountryCode = 'GH' | 'NG' | 'KE' | 'RW' | 'GM'

export type FloatStatus = 'healthy' | 'low' | 'critical'

export type RequestStatus = 'pending' | 'accepted' | 'completed' | 'declined' | 'flagged'

export type SyncState = 'online' | 'offline' | 'syncing'

export type EventType =
  | 'report'
  | 'request'
  | 'accept'
  | 'decline'
  | 'confirm'
  | 'complete'
  | 'flag'
  | 'sync'
  | 'join'
  | 'threshold'

export interface Operator {
  id: string
  name: string
  legalName: string
  networkName: string
  country: string
  currency: Currency
  markets: CountryCode[]
  supportEmail: string
  plan: string
  timezone: string
  joinedAt: string
}

export interface Agent {
  id: string
  operatorId: string
  name: string
  businessName: string
  phone: string
  country: CountryCode
  currency: Currency
  area: string
  city: string
  initials: string
  floatBalance: number
  status: FloatStatus
  targetFloat: number
  lowThreshold: number
  criticalThreshold: number
  lastReportAt: string
  lastSyncAt: string
  position: { x: number; y: number }
  coordinates: { lat: number; lng: number }
  distanceKm: number
  todayVolume: number
  reliability: number
  joinedAt: string
  avatarHue: number
}

export interface FloatReport {
  id: string
  agentId: string
  balance: number
  status: FloatStatus
  note?: string
  createdAt: string
  syncedAt: string | null
  pending?: boolean
  source?: 'agent' | 'operator' | 'seed'
}

export interface RebalanceRequest {
  id: string
  reference: string
  fromAgentId: string
  toAgentId: string
  country: CountryCode
  currency: Currency
  amount: number
  status: RequestStatus
  note?: string
  createdAt: string
  updatedAt: string
  acceptedAt?: string
  completedAt?: string
  declinedAt?: string
  flaggedAt?: string
  flagReason?: string
  requesterConfirmed: boolean
  providerConfirmed: boolean
}

export interface ActivityEvent {
  id: string
  type: EventType
  agentId?: string
  counterpartyId?: string
  requestId?: string
  country?: CountryCode
  currency?: Currency
  amount?: number
  title: string
  detail?: string
  createdAt: string
}

export interface MarketThresholds {
  lowThreshold: number
  criticalThreshold: number
}

export interface NetworkSettings {
  thresholds: Record<CountryCode, MarketThresholds>
  notifyLow: boolean
  notifyCritical: boolean
  dailyDigest: boolean
  ambientActivity: boolean
}

export interface SharedData {
  operator: Operator
  agents: Agent[]
  reports: FloatReport[]
  requests: RebalanceRequest[]
  events: ActivityEvent[]
  settings: NetworkSettings
  lastSyncAt: string
  seededAt: string
  revision: number
}

export interface QueuedReport {
  id: string
  agentId: string
  balance: number
  status: FloatStatus
  note?: string
  createdAt: string
}

export interface AgentSession {
  role: 'agent'
  agentId: string
  phone: string
  signedInAt: string
  demo: boolean
}

export interface OperatorSession {
  role: 'operator'
  operatorId: string
  name: string
  email: string
  signedInAt: string
  demo: boolean
}

export interface RemoteBundle {
  operator?: Operator | null
  agents?: Agent[]
  reports?: FloatReport[]
  requests?: RebalanceRequest[]
  events?: ActivityEvent[]
}
