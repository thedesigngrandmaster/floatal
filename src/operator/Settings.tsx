import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Cloud,
  Database,
  Download,
  Fingerprint,
  Globe2,
  LifeBuoy,
  LockKeyhole,
  Mail,
  RefreshCw,
  RotateCcw,
  ServerCog,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
  UsersRound,
  Wifi,
} from 'lucide-react'
import { BrandMark } from '../components/Brand'
import { Toggle, Flag } from '../components/ui'
import { useFloatal, useNow } from '../lib/hooks'
import { cx, formatCompactMoney, formatMoney, relativeTime } from '../lib/format'
import { store } from '../lib/store'
import { emitToast } from '../lib/toast'
import { signOutRemote } from '../lib/auth'
import { supabaseEnabled, supabaseProjectHost } from '../lib/supabase'
import type { NetworkSettings } from '../lib/types'
import {
  OpsModal,
  PageHeader,
  SectionCard,
  downloadCsv,
  exportAgents,
  exportRequests,
} from './OperatorParts'
import { useOperatorMarket } from './MarketContext'

export function Settings() {
  const snapshot = useFloatal()
  const navigate = useNavigate()
  const now = useNow(30_000)
  const { market, meta, agents, requests } = useOperatorMarket()
  const { operator, settings, reports } = snapshot.data
  const marketThresholds = settings.thresholds[market]
  const [low, setLow] = useState(String(marketThresholds.lowThreshold))
  const [critical, setCritical] = useState(String(marketThresholds.criticalThreshold))
  const [thresholdError, setThresholdError] = useState('')
  const [workspace, setWorkspace] = useState({
    name: operator.name,
    legalName: operator.legalName,
    networkName: operator.networkName,
    supportEmail: operator.supportEmail,
  })
  const [resetOpen, setResetOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false)

  useEffect(() => {
    setLow(String(marketThresholds.lowThreshold))
    setCritical(String(marketThresholds.criticalThreshold))
    setThresholdError('')
  }, [market, marketThresholds.lowThreshold, marketThresholds.criticalThreshold])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    let cancelled = false
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!cancelled) setServiceWorkerReady(Boolean(registration))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const thresholdsChanged =
    Number(low) !== marketThresholds.lowThreshold || Number(critical) !== marketThresholds.criticalThreshold
  const workspaceChanged =
    workspace.name !== operator.name ||
    workspace.legalName !== operator.legalName ||
    workspace.networkName !== operator.networkName ||
    workspace.supportEmail !== operator.supportEmail
  const totalFloat = agents.reduce((sum, agent) => sum + agent.floatBalance, 0)
  const attention = agents.filter((agent) => agent.status !== 'healthy').length
  const scaleMax = Math.max(Number(low) * 2.4 || 1, Number(critical) * 4 || 1)
  const criticalPct = Math.min(55, Math.max(5, (Number(critical) / scaleMax) * 100))
  const lowPct = Math.min(88, Math.max(criticalPct + 6, (Number(low) / scaleMax) * 100))

  const saveThresholds = () => {
    const nextLow = Number(low)
    const nextCritical = Number(critical)
    if (!Number.isFinite(nextLow) || nextLow <= 0) {
      setThresholdError('Low threshold must be greater than zero')
      return
    }
    if (!Number.isFinite(nextCritical) || nextCritical >= nextLow) {
      setThresholdError('Critical threshold must be below the low threshold')
      return
    }
    setThresholdError('')
    store.updateThresholds(market, nextLow, nextCritical)
  }

  const saveWorkspace = () => {
    if (!workspace.name.trim()) {
      emitToast('Workspace name is required', { tone: 'warning' })
      return
    }
    store.updateOperator({
      name: workspace.name.trim(),
      legalName: workspace.legalName.trim() || workspace.name.trim(),
      networkName: workspace.networkName.trim() || 'Aya Network',
      supportEmail: workspace.supportEmail.trim(),
    })
    emitToast('Workspace updated', { tone: 'success', description: 'Operator branding is now current.' })
  }

  const setSetting = <K extends keyof NetworkSettings>(key: K, value: NetworkSettings[K]) => {
    store.updateSettings({ [key]: value } as Partial<NetworkSettings>)
  }

  const exportFullWorkspace = () => {
    downloadCsv(`floatal-${market.toLowerCase()}-summary.csv`, [
      {
        operator: operator.name,
        legal_name: operator.legalName,
        network: operator.networkName,
        market: meta.name,
        country: meta.code,
        currency: meta.currency,
        plan: operator.plan,
        agents: agents.length,
        total_float: totalFloat,
        attention_agents: attention,
        requests: requests.length,
        reports: reports.length,
        low_threshold: marketThresholds.lowThreshold,
        critical_threshold: marketThresholds.criticalThreshold,
        exported_at: new Date().toISOString(),
      },
    ])
  }

  const resetDemo = () => {
    store.resetDemo()
    setResetOpen(false)
    setLow(String(marketThresholds.lowThreshold))
    setCritical(String(marketThresholds.criticalThreshold))
    setThresholdError('')
    setWorkspace({
      name: 'Aya Money',
      legalName: 'Aya Financial Technologies Ltd',
      networkName: 'Aya Network',
      supportEmail: 'network@floatal.app',
    })
  }

  const signOut = async () => {
    await signOutRemote()
    store.signOutOperator()
    navigate('/ops/login', { replace: true })
  }

  return (
    <div className="space-y-5 pb-4">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Network thresholds, notification rules and the controls behind the Aya Money operator workspace."
        actions={
          <button
            type="button"
            onClick={exportFullWorkspace}
            className="btn btn-ghost btn-sm h-9 rounded-full bg-white text-[10.5px]"
          >
            <Download size={12} /> Export summary
          </button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.85fr]">
        <div className="space-y-4">
          <SectionCard
            title="Workspace identity"
            subtitle="How your operator workspace appears to agents"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-900/[0.07] bg-cream/60 px-2.5 py-1 text-[8.5px] font-medium text-muted">
                <BadgeCheck size={9} className="text-forest-600" /> Verified operator
              </span>
            }
          >
            <div className="p-5">
              <div className="flex items-center gap-3 rounded-[16px] border border-forest-900/[0.06] bg-cream/45 p-3">
                <BrandMark size={38} />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-forest-900">{operator.name}</div>
                  <div className="mt-0.5 text-[9.5px] text-muted">
                    {operator.plan} · {operator.networkName} · {operator.country}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[8.5px] font-medium text-healthy-600">
                  <span className="h-1 w-1 rounded-full bg-healthy-500" /> Active
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.11em] text-muted">Workspace name</span>
                  <input
                    value={workspace.name}
                    onChange={(event) => setWorkspace((current) => ({ ...current, name: event.target.value }))}
                    className="field mt-1.5 bg-white text-[12px]"
                  />
                </label>
                <label className="block">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.11em] text-muted">Legal entity</span>
                  <input
                    value={workspace.legalName}
                    onChange={(event) => setWorkspace((current) => ({ ...current, legalName: event.target.value }))}
                    className="field mt-1.5 bg-white text-[12px]"
                  />
                </label>
                <label className="block">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.11em] text-muted">Network name</span>
                  <input
                    value={workspace.networkName}
                    onChange={(event) => setWorkspace((current) => ({ ...current, networkName: event.target.value }))}
                    className="field mt-1.5 bg-white text-[12px]"
                  />
                </label>
                <label className="block">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.11em] text-muted">Support email</span>
                  <input
                    type="email"
                    value={workspace.supportEmail}
                    onChange={(event) => setWorkspace((current) => ({ ...current, supportEmail: event.target.value }))}
                    className="field mt-1.5 bg-white text-[12px]"
                  />
                </label>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-[8.5px] text-muted/55">
                  <Globe2 size={9} /> {operator.timezone} · {operator.currency}
                </span>
                <button
                  type="button"
                  onClick={saveWorkspace}
                  disabled={!workspaceChanged}
                  className="btn btn-forest btn-sm h-8 rounded-lg text-[9.5px]"
                >
                  <Check size={11} /> Save workspace
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Float thresholds"
            subtitle={`Applied to every ${meta.name} agent. Health updates immediately.`}
            action={
              <span className="inline-flex items-center gap-1 text-[8.5px] text-muted/55">
                <ShieldCheck size={9} /> {attention} agents need attention
              </span>
            }
          >
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2 text-[9.5px] text-muted">
                <Flag code={meta.code} className="h-3.5 w-5" />
                <span className="font-medium text-forest-900">{meta.name}</span>
                <span className="text-muted/50">·</span>
                <span>{meta.currency}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.11em] text-muted">Low float threshold</span>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10.5px] font-medium text-muted">
                      {meta.currency}
                    </span>
                    <input
                      value={low}
                      onChange={(event) => {
                        setLow(event.target.value.replace(/\D/g, '').slice(0, 10))
                        setThresholdError('')
                      }}
                      inputMode="numeric"
                      className="field bg-white pl-14 text-[12px]"
                    />
                  </div>
                  <span className="mt-1 block text-[8.5px] text-muted/55">Agents below this are marked low float.</span>
                </label>
                <label className="block">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.11em] text-muted">Critical threshold</span>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10.5px] font-medium text-muted">
                      {meta.currency}
                    </span>
                    <input
                      value={critical}
                      onChange={(event) => {
                        setCritical(event.target.value.replace(/\D/g, '').slice(0, 10))
                        setThresholdError('')
                      }}
                      inputMode="numeric"
                      className="field bg-white pl-14 text-[12px]"
                    />
                  </div>
                  <span className="mt-1 block text-[8.5px] text-muted/55">Immediate operator alert below this level.</span>
                </label>
              </div>

              <div className="mt-4 rounded-[16px] border border-forest-900/[0.06] bg-cream/55 p-3.5">
                <div className="flex items-center justify-between text-[8.5px] font-medium uppercase tracking-[0.1em] text-muted/60">
                  <span>Critical</span>
                  <span>Low float</span>
                  <span>Healthy</span>
                </div>
                <div className="relative mt-2 h-2 overflow-hidden rounded-full">
                  <div className="absolute inset-0 flex">
                    <span className="bg-danger-500/20" style={{ width: `${criticalPct}%` }} />
                    <span className="bg-warn-500/25" style={{ width: `${Math.max(0, lowPct - criticalPct)}%` }} />
                    <span className="flex-1 bg-healthy-500/20" />
                  </div>
                  <span className="absolute bottom-0 top-0 w-px bg-danger-500/60" style={{ left: `${criticalPct}%` }} />
                  <span className="absolute bottom-0 top-0 w-px bg-warn-500/70" style={{ left: `${lowPct}%` }} />
                  <span
                    className="absolute bottom-0 top-0 h-2 w-1.5 -translate-x-1/2 rounded-full bg-forest-900"
                    style={{ left: `${lowPct}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[9px] text-muted">
                  <span>{formatMoney(Number(critical) || 0, meta.currency)}</span>
                  <span>{formatMoney(Number(low) || 0, meta.currency)}</span>
                  <span>{formatMoney(Math.round(scaleMax), meta.currency)}+</span>
                </div>
              </div>

              {thresholdError && <p className="mt-2 text-[10px] font-medium text-danger-600">{thresholdError}</p>}
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-[8.5px] leading-relaxed text-muted/55">
                  Updating thresholds recalculates the status of all {agents.length} {meta.name} agents.
                </span>
                <button
                  type="button"
                  onClick={saveThresholds}
                  disabled={!thresholdsChanged}
                  className="btn btn-forest btn-sm h-8 shrink-0 rounded-lg text-[9.5px]"
                >
                  <Check size={11} /> Save thresholds
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Notifications" subtitle="Operator alerting for the live network">
            <div className="divide-y divide-forest-900/[0.055] px-5">
              {[
                {
                  key: 'notifyLow' as const,
                  title: 'Low float alerts',
                  description: 'Notify the network team when any agent drops below their low threshold.',
                  icon: <Wifi size={14} />,
                },
                {
                  key: 'notifyCritical' as const,
                  title: 'Critical float alerts',
                  description: 'Immediate alert when an agent falls below the critical floor.',
                  icon: <LockKeyhole size={14} />,
                },
                {
                  key: 'dailyDigest' as const,
                  title: 'Daily network digest',
                  description: 'A reconciled summary of float, requests and settlement performance each morning.',
                  icon: <Mail size={14} />,
                },
                {
                  key: 'ambientActivity' as const,
                  title: 'Ambient network activity',
                  description: 'Allow the demo network to refresh with live agent reports while you observe.',
                  icon: <Sparkles size={14} />,
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-3 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mint-50 text-forest-700">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10.5px] font-medium text-forest-900">{item.title}</div>
                    <div className="mt-0.5 text-[9px] leading-relaxed text-muted">{item.description}</div>
                  </div>
                  <Toggle
                    on={settings[item.key]}
                    onChange={(value) => setSetting(item.key, value)}
                    label={item.title}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-forest-900/[0.06] bg-cream/35 px-5 py-2.5 text-[8.5px] text-muted/55">
              <Cloud size={9} /> Notification rules sync across the operator workspace.
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <section className="relative overflow-hidden rounded-[22px] bg-forest-900 p-5 text-white shadow-[0_22px_50px_-28px_rgba(5,31,24,0.6)]">
            <div className="hero-halo pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full border border-white/[0.06]" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-gold-400/75">
                  {operator.plan} workspace
                </div>
                <h2 className="font-display mt-2 text-[22px] font-medium tracking-[-0.04em] text-white/90">
                  {operator.name}
                </h2>
                <p className="mt-1 text-[10px] text-white/40">{operator.networkName} · {operator.country}</p>
              </div>
              <BrandMark size={34} />
            </div>
            <div className="relative mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3.5">
              <div>
                <div className="text-[8px] font-medium uppercase tracking-[0.1em] text-white/30">Float</div>
                <div className="tnum mt-1 text-[15px] font-medium text-white/85">{formatCompactMoney(totalFloat, meta.currency)}</div>
              </div>
              <div>
                <div className="text-[8px] font-medium uppercase tracking-[0.1em] text-white/30">Agents</div>
                <div className="tnum mt-1 text-[15px] font-medium text-white/85">{agents.length}</div>
              </div>
            </div>
            <div className="relative mt-3 flex flex-wrap gap-1.5">
              {['Two-sided reconciliation', 'Offline-first reports', 'Audit trail'].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[8px] text-white/50">
                  {item}
                </span>
              ))}
            </div>
          </section>

          <SectionCard title="Integrations" subtitle="Platform services and sync">
            <div className="divide-y divide-forest-900/[0.055] px-5">
              {[
                {
                  icon: <Database size={14} />,
                  title: 'Supabase',
                  detail: supabaseEnabled
                    ? `Connected${supabaseProjectHost ? ` · ${supabaseProjectHost}` : ''}`
                    : 'Demo mode · local-first store',
                  status: supabaseEnabled ? 'Connected' : 'Demo',
                  live: supabaseEnabled,
                },
                {
                  icon: <RefreshCw size={14} />,
                  title: 'Live updates',
                  detail: 'BroadcastChannel + Supabase Realtime',
                  status: 'Active',
                  live: true,
                },
                {
                  icon: <Smartphone size={14} />,
                  title: 'Installable PWA',
                  detail: serviceWorkerReady ? 'Service worker registered' : 'Install prompt available',
                  status: serviceWorkerReady ? 'Ready' : 'Installable',
                  live: true,
                },
                {
                  icon: <ServerCog size={14} />,
                  title: 'Auth & access',
                  detail: supabaseEnabled ? 'Phone OTP for agents · email for operators' : 'Demo OTP · 246810',
                  status: supabaseEnabled ? 'Supabase Auth' : 'Demo access',
                  live: true,
                },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mint-50 text-forest-700">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10.5px] font-medium text-forest-900">{item.title}</div>
                    <div className="mt-0.5 truncate text-[8.5px] text-muted">{item.detail}</div>
                  </div>
                  <span
                    className={cx(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-medium',
                      item.live ? 'bg-healthy-50 text-healthy-700' : 'bg-warn-50 text-warn-700',
                    )}
                  >
                    <span className={cx('h-1 w-1 rounded-full', item.live ? 'bg-healthy-500' : 'bg-warn-500')} />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Data & demo" subtitle="Exports, reset and workspace safety">
            <div className="space-y-2 p-3">
              <button
                type="button"
                onClick={() => exportAgents(agents, 'floatal-agents-export.csv')}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-cream/70"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-50 text-forest-700">
                  <Download size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10.5px] font-medium text-forest-900">Export agents</span>
                  <span className="mt-0.5 block text-[8.5px] text-muted">Positions, thresholds and reliability</span>
                </span>
                <ChevronRight size={12} className="text-muted/40" />
              </button>
              <button
                type="button"
                onClick={() => exportRequests(requests, agents, 'floatal-rebalancing-export.csv')}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-cream/70"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-50 text-forest-700">
                  <Download size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10.5px] font-medium text-forest-900">Export ledger</span>
                  <span className="mt-0.5 block text-[8.5px] text-muted">All rebalancing and confirmations</span>
                </span>
                <ChevronRight size={12} className="text-muted/40" />
              </button>
              <button
                type="button"
                onClick={() => setResetOpen(true)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-warn-50/60"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-warn-50 text-warn-600">
                  <RotateCcw size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10.5px] font-medium text-forest-900">Reset demo environment</span>
                  <span className="mt-0.5 block text-[8.5px] text-muted">Restore the seeded Aya Money network</span>
                </span>
                <ChevronRight size={12} className="text-muted/40" />
              </button>
            </div>
            <div className="mx-3 mb-3 flex items-start gap-2 rounded-xl bg-mint-50/70 px-3 py-2.5 text-[8.5px] leading-relaxed text-forest-800/70">
              <Fingerprint size={11} className="mt-0.5 shrink-0 text-forest-600" />
              Demo data lives on this device. Exported CSV files contain the current live snapshot.
            </div>
          </SectionCard>

          <SectionCard title="Session" subtitle="Current operator access">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-50 text-forest-700">
                  <UserRound size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[10.5px] font-medium text-forest-900">
                    {snapshot.operatorSession?.name ?? 'Adjoa Serwaa'}
                  </div>
                  <div className="mt-0.5 truncate text-[8.5px] text-muted">
                    {snapshot.operatorSession?.email ?? 'adjoa@floatal.app'}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[8px] font-medium text-healthy-600">
                  <span className="h-1 w-1 rounded-full bg-healthy-500" /> Signed in
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-forest-900/[0.06] pt-3">
                <div>
                  <div className="text-[8px] font-medium uppercase tracking-[0.09em] text-muted/55">Session started</div>
                  <div className="mt-0.5 text-[9.5px] text-forest-800">
                    {snapshot.operatorSession ? relativeTime(snapshot.operatorSession.signedInAt, now) : 'Just now'}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] font-medium uppercase tracking-[0.09em] text-muted/55">Last sync</div>
                  <div className="mt-0.5 text-[9.5px] text-forest-800">{relativeTime(snapshot.data.lastSyncAt, now)}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSignOutOpen(true)}
                className="btn btn-ghost btn-sm mt-3 h-8 w-full justify-center rounded-lg text-[9.5px] text-danger-600"
              >
                Sign out of console
              </button>
            </div>
          </SectionCard>

          <div className="flex items-start gap-2.5 rounded-[16px] border border-forest-900/[0.06] bg-white/55 px-3.5 py-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-forest-700 shadow-sm">
              <LifeBuoy size={13} />
            </span>
            <div>
              <div className="text-[10px] font-medium text-forest-900">Need help?</div>
              <a href={`mailto:${operator.supportEmail}`} className="mt-0.5 flex items-center gap-1 text-[9px] text-forest-700">
                Contact the Floatal network team <ChevronRight size={9} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <OpsModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset the demo environment?"
        description="This restores the seeded Aya Money network. Requests, reports and agent changes made in this demo will be cleared."
        footer={
          <>
            <button type="button" onClick={() => setResetOpen(false)} className="btn btn-ghost btn-sm rounded-xl">
              Keep my data
            </button>
            <button
              type="button"
              onClick={resetDemo}
              className="btn btn-sm rounded-xl bg-warn-500 text-white hover:bg-warn-600"
            >
              <RotateCcw size={13} /> Reset demo
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-[16px] border border-warn-100 bg-warn-50/70 p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-warn-600 shadow-sm">
            <RotateCcw size={15} />
          </span>
          <div>
            <div className="text-[11px] font-medium text-warn-700">This cannot be undone</div>
            <p className="mt-0.5 text-[9.5px] leading-relaxed text-warn-700/70">
              Five markets, the opening float ledger, notifications and thresholds will be restored to their original
              state.
            </p>
          </div>
        </div>
      </OpsModal>

      <OpsModal
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        title="Sign out?"
        description="You will need your operator credentials to return to the console."
        footer={
          <>
            <button type="button" onClick={() => setSignOutOpen(false)} className="btn btn-ghost btn-sm rounded-xl">
              Stay signed in
            </button>
            <button type="button" onClick={() => void signOut()} className="btn btn-sm rounded-xl bg-danger-500 text-white hover:bg-danger-600">
              Sign out
            </button>
          </>
        }
      >
        <div className="flex items-center gap-2.5 rounded-xl bg-cream/80 px-3 py-3">
          <UsersRound size={14} className="text-forest-700" />
          <p className="text-[10px] leading-relaxed text-muted">
            The network remains live for your team. Your unsaved threshold changes will not be applied.
          </p>
        </div>
      </OpsModal>
    </div>
  )
}
