import { getSupabase } from './supabase'
import type {
  ActivityEvent,
  Agent,
  CountryCode,
  FloatReport,
  Operator,
  RebalanceRequest,
  SharedData,
} from './types'
import { DEFAULT_MARKET, MARKETS, marketByCode } from './markets'

type Row = Record<string, unknown>

const str = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)
const num = (value: unknown) => (typeof value === 'number' ? value : Number(value) || 0)

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

function mapOperator(row: Row): Operator {
  return {
    id: str(row.id),
    name: str(row.name),
    legalName: str(row.legal_name, str(row.name)),
    networkName: str(row.network_name, 'Aya Network'),
    country: str(row.country, 'Ghana'),
    currency: (str(row.currency, 'GHS') as Operator['currency']) ?? 'GHS',
    markets: (Array.isArray(row.markets) ? row.markets : MARKETS.map((market) => market.code)) as CountryCode[],
    supportEmail: str(row.support_email),
    plan: str(row.plan, 'Enterprise'),
    timezone: str(row.timezone, 'Africa/Accra'),
    joinedAt: str(row.created_at, new Date().toISOString()),
  }
}

function mapAgent(row: Row): Agent {
  const country = str(row.country, DEFAULT_MARKET) as CountryCode
  const market = marketByCode[country] ?? marketByCode[DEFAULT_MARKET]
  const name = str(row.name)
  return {
    id: str(row.id),
    name,
    businessName: str(row.business_name, name),
    operatorId: str(row.operator_id),
    country,
    currency: (str(row.currency, market.currency) as Agent['currency']) ?? market.currency,
    phone: str(row.phone),
    area: str(row.area),
    city: str(row.city, market.capital),
    initials: str(row.initials, initialsOf(name)),
    distanceKm: num(row.distance_km),
    floatBalance: num(row.float_balance),
    lowThreshold: num(row.low_threshold) || market.thresholds.lowThreshold,
    criticalThreshold: num(row.critical_threshold) || market.thresholds.criticalThreshold,
    targetFloat: num(row.target_float) || market.targetFloat,
    status: (str(row.status, 'healthy') as Agent['status']) ?? 'healthy',
    lastSyncAt: str(row.last_sync_at, new Date().toISOString()),
    lastReportAt: str(row.last_report_at, new Date().toISOString()),
    position: { x: num(row.position_x) || 50, y: num(row.position_y) || 50 },
    coordinates: {
      lat: num(row.latitude) || market.coordinates.lat,
      lng: num(row.longitude) || market.coordinates.lng,
    },
    todayVolume: num(row.today_volume),
    reliability: num(row.reliability) || 96,
    joinedAt: str(row.created_at, new Date().toISOString()),
    avatarHue: num(row.avatar_hue) || 152,
  }
}

function mapReport(row: Row): FloatReport {
  return {
    id: str(row.id),
    agentId: str(row.agent_id),
    balance: num(row.balance),
    status: (str(row.status, 'healthy') as FloatReport['status']) ?? 'healthy',
    note: str(row.note) || undefined,
    createdAt: str(row.created_at),
    syncedAt: str(row.synced_at) || str(row.created_at),
    source: (str(row.source, 'agent') as FloatReport['source']) ?? 'agent',
  }
}

function mapRequest(row: Row): RebalanceRequest {
  const currency = (str(row.currency, 'GHS') as RebalanceRequest['currency']) ?? 'GHS'
  return {
    id: str(row.id),
    reference: str(row.reference),
    fromAgentId: str(row.from_agent_id),
    toAgentId: str(row.to_agent_id),
    country: (str(row.country, marketForCurrency(currency)) as CountryCode) ?? 'GH',
    amount: num(row.amount),
    currency,
    status: (str(row.status, 'pending') as RebalanceRequest['status']) ?? 'pending',
    note: str(row.note) || undefined,
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at, str(row.created_at)),
    acceptedAt: str(row.accepted_at) || undefined,
    completedAt: str(row.completed_at) || undefined,
    declinedAt: str(row.declined_at) || undefined,
    flaggedAt: str(row.flagged_at) || undefined,
    flagReason: str(row.flag_reason) || undefined,
    requesterConfirmed: Boolean(row.requester_confirmed),
    providerConfirmed: Boolean(row.provider_confirmed),
  }
}

function marketForCurrency(currency: string): CountryCode {
  return MARKETS.find((market) => market.currency === currency)?.code ?? DEFAULT_MARKET
}

function mapEvent(row: Row): ActivityEvent {
  return {
    id: str(row.id),
    type: (str(row.type, 'sync') as ActivityEvent['type']) ?? 'sync',
    agentId: str(row.agent_id) || undefined,
    counterpartyId: str(row.counterparty_id) || undefined,
    requestId: str(row.request_id) || undefined,
    country: (str(row.country) as CountryCode) || undefined,
    currency: (str(row.currency) as ActivityEvent['currency']) || undefined,
    amount: row.amount === null || row.amount === undefined ? undefined : num(row.amount),
    title: str(row.title),
    detail: str(row.detail) || undefined,
    createdAt: str(row.created_at),
  }
}

export async function fetchRemoteBundle(): Promise<Partial<SharedData> | null> {
  const supabase = await getSupabase()
  if (!supabase) return null
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('operator_id, agent_id, role')
    .eq('id', auth.user.id)
    .maybeSingle()

  const operatorId = profile?.operator_id as string | undefined
  if (!operatorId) return null

  const [{ data: operator }, { data: agents }, { data: reports }, { data: requests }, { data: events }] =
    await Promise.all([
      supabase.from('operators').select('*').eq('id', operatorId).maybeSingle(),
      supabase.from('agents').select('*').eq('operator_id', operatorId).order('name'),
      supabase
        .from('float_reports')
        .select('*')
        .eq('operator_id', operatorId)
        .order('created_at', { ascending: false })
        .limit(250),
      supabase
        .from('rebalance_requests')
        .select('*')
        .eq('operator_id', operatorId)
        .order('created_at', { ascending: false })
        .limit(120),
      supabase
        .from('activity_events')
        .select('*')
        .eq('operator_id', operatorId)
        .order('created_at', { ascending: false })
        .limit(160),
    ])

  return {
    operator: operator ? mapOperator(operator as Row) : undefined,
    agents: (agents ?? []).map((row) => mapAgent(row as Row)),
    reports: (reports ?? []).map((row) => mapReport(row as Row)),
    requests: (requests ?? []).map((row) => mapRequest(row as Row)),
    events: (events ?? []).map((row) => mapEvent(row as Row)),
  }
}

export function subscribeRemote(onChange: () => void) {
  let cleanup: (() => void) | undefined
  let cancelled = false

  void getSupabase().then((client) => {
    if (!client || cancelled) return
    const channel = client.channel('floatal-network')
    for (const table of ['agents', 'float_reports', 'rebalance_requests', 'activity_events']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange())
    }
    channel.subscribe()
    cleanup = () => {
      void client.removeChannel(channel)
    }
  })

  return () => {
    cancelled = true
    cleanup?.()
  }
}

export async function remoteRequestOtp(phone: string) {
  const supabase = await getSupabase()
  if (!supabase) return { ok: false as const, error: 'Supabase is not configured' }
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: false },
  })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}

export async function remoteVerifyOtp(phone: string, token: string) {
  const supabase = await getSupabase()
  if (!supabase) return { ok: false as const, error: 'Supabase is not configured' }
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
  if (error) return { ok: false as const, error: error.message }
  const userId = data.user?.id
  if (!userId) return { ok: false as const, error: 'Verification failed' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('agent_id')
    .eq('id', userId)
    .maybeSingle()
  const agentId = profile?.agent_id as string | undefined
  if (!agentId) return { ok: false as const, error: 'No agent is linked to this number' }
  return { ok: true as const, agentId }
}

export async function remoteOperatorSignIn(email: string, password: string) {
  const supabase = await getSupabase()
  if (!supabase) return { ok: false as const, error: 'Supabase is not configured' }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false as const, error: error.message }
  if (!data.user) return { ok: false as const, error: 'Sign in failed' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('operator_id, role')
    .eq('id', data.user.id)
    .maybeSingle()
  if (!profile?.operator_id) return { ok: false as const, error: 'No operator is linked to this account' }
  return { ok: true as const, operatorId: profile.operator_id as string }
}

type RemoteClient = NonNullable<Awaited<ReturnType<typeof getSupabase>>>

async function withRemote(action: (client: RemoteClient) => PromiseLike<unknown> | Promise<unknown>) {
  const supabase = await getSupabase()
  if (!supabase) return
  const { data } = await supabase.auth.getSession()
  if (!data.session) return
  try {
    await action(supabase)
  } catch {
    /* realtime refresh will reconcile optimistic state */
  }
}

export function remoteReportFloat(report: FloatReport, agentId: string) {
  return withRemote((client) =>
    client.rpc('report_float', {
      p_report_id: report.id,
      p_agent_id: agentId,
      p_balance: report.balance,
      p_status: report.status,
      p_note: report.note ?? null,
      p_created_at: report.createdAt,
    }),
  )
}

export function remoteCreateRequest(request: RebalanceRequest) {
  return withRemote((client) =>
    client.rpc('create_float_request', {
      p_id: request.id,
      p_from: request.fromAgentId,
      p_to: request.toAgentId,
      p_amount: request.amount,
      p_note: request.note ?? null,
      p_created_at: request.createdAt,
    }),
  )
}

export function remoteAcceptRequest(requestId: string) {
  return withRemote((client) =>
    client.rpc('respond_to_request', { p_request_id: requestId, p_action: 'accept', p_reason: null }),
  )
}

export function remoteDeclineRequest(requestId: string, reason?: string) {
  return withRemote((client) =>
    client.rpc('respond_to_request', {
      p_request_id: requestId,
      p_action: 'decline',
      p_reason: reason ?? null,
    }),
  )
}

export function remoteConfirmHandover(requestId: string, side: 'requester' | 'provider') {
  return withRemote((client) =>
    client.rpc('confirm_handover', { p_request_id: requestId, p_side: side }),
  )
}

export function remoteFlagRequest(requestId: string, reason: string) {
  return withRemote((client) =>
    client.rpc('flag_request', { p_request_id: requestId, p_reason: reason }),
  )
}
