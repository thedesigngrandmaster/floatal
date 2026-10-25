import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  CircleAlert,
  CloudOff,
  Download,
  HelpCircle,
  Info,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { Avatar, StatusPill, SyncChip, Toggle } from '../components/ui'
import { useSheet } from '../components/Sheet'
import { useFloatal, useInstallPrompt, useNow } from '../lib/hooks'
import {
  formatLongDate,
  formatMoney,
  relativeTime,
  statusLabel,
} from '../lib/format'
import { effectiveAgent, store } from '../lib/store'
import { emitToast } from '../lib/toast'
import { supabaseEnabled } from '../lib/supabase'
import type { Agent } from '../lib/types'

export function AgentProfile() {
  const snapshot = useFloatal()
  const now = useNow(20_000)
  const navigate = useNavigate()
  const { openSheet, closeSheet } = useSheet()
  const install = useInstallPrompt()
  const [syncing, setSyncing] = useState(false)
  const raw = snapshot.data.agents.find((agent) => agent.id === snapshot.agentSession?.agentId)
  if (!raw) return null
  const queue = snapshot.queues[raw.id] ?? []
  const agent = effectiveAgent(raw, queue)
  const online = snapshot.online && !snapshot.offlineSimulated
  const operator = snapshot.data.operator

  const syncNow = async () => {
    setSyncing(true)
    await store.syncNow()
    setSyncing(false)
  }

  const openAgentSwitcher = () => {
    openSheet(
      <AgentSwitcher
        currentId={agent.id}
        agents={snapshot.data.agents}
        onSelect={(selected) => {
          store.switchAgent(selected.id)
          closeSheet()
          emitToast(`Viewing as ${selected.name.split(' ')[0]}`, {
            tone: 'default',
            description: 'Demo shortcut — your real session is unaffected.',
          })
        }}
        onClose={closeSheet}
      />,
      { onClose: closeSheet },
    )
  }

  const openInstallHelp = () => {
    openSheet(
      <div className="pb-1">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-forest-700/60">
              Home screen
            </div>
            <h2 className="font-display mt-1.5 text-[21px] font-medium tracking-[-0.03em] text-forest-900">
              Install Floatal
            </h2>
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
              Floatal runs like a native app — full screen, offline-ready, with your reports saved on device.
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest-900 text-gold-400">
            <Smartphone size={19} />
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {(install.isIOS
            ? [
                'Open Floatal in Safari',
                'Tap the Share button',
                'Choose “Add to Home Screen”',
              ]
            : [
                'Open the browser menu',
                'Choose “Install app” or “Add to Home screen”',
                'Launch Floatal from your home screen',
              ]
          ).map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-xl border border-forest-900/[0.07] bg-white px-3 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint-50 text-[10px] font-semibold text-forest-800">
                {index + 1}
              </span>
              <span className="text-[11px] text-forest-900">{step}</span>
            </div>
          ))}
        </div>

        {install.available && (
          <button
            type="button"
            onClick={async () => {
              const result = await install.promptInstall()
              if (result === 'accepted') {
                emitToast('Floatal installed', { tone: 'success' })
                closeSheet()
              }
            }}
            className="btn btn-forest btn-block mt-4"
          >
            <Download size={14} /> Install now
          </button>
        )}
        <button type="button" onClick={closeSheet} className="btn btn-ghost btn-block mt-2 border-transparent">
          Not now
        </button>
      </div>,
      { onClose: closeSheet },
    )
  }

  const openSupport = () => {
    openSheet(
      <div className="pb-1">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-forest-700/60">
              {operator.name}
            </div>
            <h2 className="font-display mt-1.5 text-[21px] font-medium tracking-[-0.03em] text-forest-900">
              Agent support
            </h2>
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
              Your operator's network team is available for float, reconciliation and account questions.
            </p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-50 text-forest-700">
            <HelpCircle size={19} />
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <a
            href={`mailto:${operator.supportEmail}`}
            className="flex items-center gap-3 rounded-xl border border-forest-900/[0.07] bg-white px-3 py-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-50 text-forest-700">
              <Mail size={13} />
            </span>
            <div className="flex-1">
              <div className="text-[11px] font-medium text-forest-900">Email the network team</div>
              <div className="mt-0.5 text-[9.5px] text-muted">{operator.supportEmail}</div>
            </div>
            <ChevronRight size={14} className="text-sand-400" />
          </a>
          <div className="flex items-center gap-3 rounded-xl border border-forest-900/[0.07] bg-white px-3 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-50 text-forest-700">
              <ShieldCheck size={13} />
            </span>
            <div className="flex-1">
              <div className="text-[11px] font-medium text-forest-900">Two-sided reconciliation</div>
              <div className="mt-0.5 text-[9.5px] leading-relaxed text-muted">
                A request only settles when both agents confirm the handover.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-forest-900/[0.07] bg-white px-3 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-50 text-forest-700">
              <LockKeyhole size={13} />
            </span>
            <div className="flex-1">
              <div className="text-[11px] font-medium text-forest-900">Your data</div>
              <div className="mt-0.5 text-[9.5px] leading-relaxed text-muted">
                Float positions are visible only to you and your operator's authorised team.
              </div>
            </div>
          </div>
        </div>
        <button type="button" onClick={closeSheet} className="btn btn-ghost btn-block mt-4">
          Close
        </button>
      </div>,
      { onClose: closeSheet },
    )
  }

  const openSignOut = () => {
    openSheet(
      <div className="pb-1 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-50 text-danger-600">
          <LogOut size={20} />
        </span>
        <h2 className="font-display mt-3 text-[20px] font-medium tracking-[-0.03em] text-forest-900">
          Sign out of Floatal?
        </h2>
        <p className="mx-auto mt-1.5 max-w-[260px] text-[10.5px] leading-relaxed text-muted">
          {queue.length > 0
            ? `You have ${queue.length} report${queue.length === 1 ? '' : 's'} saved on this device. They will stay queued until you sign back in.`
            : 'You will need your phone number and a new code to sign back in.'}
        </p>
        <button
          type="button"
          onClick={() => {
            store.signOutAgent()
            closeSheet()
            navigate('/app/login', { replace: true })
          }}
          className="btn btn-block mt-4 bg-danger-500 text-white hover:bg-danger-600"
        >
          Sign out
        </button>
        <button type="button" onClick={closeSheet} className="btn btn-ghost btn-block mt-2 border-transparent">
          Stay signed in
        </button>
      </div>,
      { onClose: closeSheet },
    )
  }

  const openReset = () => {
    openSheet(
      <div className="pb-1 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warn-50 text-warn-600">
          <RotateCcw size={20} />
        </span>
        <h2 className="font-display mt-3 text-[20px] font-medium tracking-[-0.03em] text-forest-900">
          Reset demo data?
        </h2>
        <p className="mx-auto mt-1.5 max-w-[260px] text-[10.5px] leading-relaxed text-muted">
          This restores seeded agents, float positions and requests. Every report and request you created in this
          demo will be cleared.
        </p>
        <button
          type="button"
          onClick={() => {
            store.resetDemo()
            closeSheet()
          }}
          className="btn btn-block mt-4 bg-warn-500 text-white hover:bg-warn-600"
        >
          Reset demo
        </button>
        <button type="button" onClick={closeSheet} className="btn btn-ghost btn-block mt-2 border-transparent">
          Keep my data
        </button>
      </div>,
      { onClose: closeSheet },
    )
  }

  return (
    <div className="agent-page pt-safe">
      <header className="flex items-center justify-between gap-3">
        <Link to="/app" className="icon-btn" aria-label="Back to home">
          <ArrowLeft size={16} />
        </Link>
        <div className="text-center">
          <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted/70">Your account</div>
          <div className="mt-0.5 text-[13px] font-medium tracking-[-0.015em] text-forest-900">Profile</div>
        </div>
        <SyncChip online={online} syncing={snapshot.syncing} queued={queue.length} compact />
      </header>

      <section className="relative mt-5 overflow-hidden rounded-[25px] bg-forest-900 p-5 text-white shadow-[0_22px_50px_-28px_rgba(5,31,24,0.62)]">
        <div className="hero-halo pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/[0.06]" />
        <div className="relative flex items-start gap-3.5">
          <Avatar name={agent.name} hue={agent.avatarHue} size="xl" className="ring-2 ring-white/15" />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1.5">
              <h1 className="font-display truncate text-[22px] font-medium tracking-[-0.035em] text-[#F7F5EF]">
                {agent.name}
              </h1>
              <BadgeCheck size={15} className="shrink-0 text-gold-400" />
            </div>
            <p className="mt-0.5 truncate text-[10.5px] text-white/45">{agent.businessName}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.07] px-2 py-0.5 text-[8.5px] font-medium text-white/60">
                <span className="h-1 w-1 rounded-full bg-gold-400" /> {operator.name} agent
              </span>
              <StatusPill status={agent.status} onDark size="sm" />
            </div>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3.5">
          <div>
            <div className="text-[8px] font-medium uppercase tracking-[0.11em] text-white/30">Float reported</div>
            <div className="tnum mt-0.5 text-[13px] font-medium text-white/80">{formatMoney(agent.floatBalance)}</div>
          </div>
          <div>
            <div className="text-[8px] font-medium uppercase tracking-[0.11em] text-white/30">Float status</div>
            <div className="mt-0.5 text-[13px] font-medium text-white/80">{statusLabel(agent.status)}</div>
          </div>
        </div>
      </section>

      <div className="mt-5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted">Sync &amp; offline</span>
          <span className="inline-flex items-center gap-1 text-[8.5px] text-muted/50">
            <Wifi size={9} /> {online ? 'Auto-sync on' : 'Queuing'}
          </span>
        </div>
        <div className="mt-2 rounded-[20px] border border-forest-900/[0.07] bg-white p-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                online ? 'bg-mint-50 text-forest-700' : 'bg-warn-50 text-warn-600'
              }`}
            >
              {snapshot.syncing ? <RefreshCw size={17} className="animate-spin" /> : online ? <Wifi size={17} /> : <WifiOff size={17} />}
            </span>
            <div className="flex-1">
              <div className="text-[12px] font-medium text-forest-900">
                {snapshot.syncing ? 'Syncing reports…' : online ? 'Connected' : 'Working offline'}
              </div>
              <div className="mt-0.5 text-[9.5px] text-muted">
                {online
                  ? `Last synced ${relativeTime(raw.lastSyncAt, now).toLowerCase()} · ${queue.length} queued`
                  : `${queue.length} report${queue.length === 1 ? '' : 's'} saved on this device`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void syncNow()}
              disabled={!online || syncing || snapshot.syncing}
              className="rounded-full border border-forest-900/10 bg-cream px-3 py-1.5 text-[9.5px] font-medium text-forest-800 disabled:opacity-40"
            >
              {snapshot.syncing || syncing ? 'Syncing…' : 'Sync now'}
            </button>
          </div>

          {queue.length > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-warn-50/80 px-2.5 py-2.5">
              <CloudOff size={12} className="mt-0.5 shrink-0 text-warn-600" />
              <div className="text-[9px] leading-relaxed text-warn-700/75">
                {queue.length} report{queue.length === 1 ? '' : 's'} waiting. They will send automatically the moment
                your connection returns.
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-forest-900/[0.06] pt-3">
            <div>
              <div className="text-[10.5px] font-medium text-forest-900">Simulate offline</div>
              <div className="mt-0.5 text-[9px] text-muted">Test offline reporting and queued sync.</div>
            </div>
            <Toggle
              on={snapshot.offlineSimulated}
              onChange={(value) => store.setOfflineSimulated(value)}
              label="Simulate offline mode"
            />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted">Float settings</span>
          <span className="inline-flex items-center gap-1 text-[8.5px] text-muted/50">
            <LockKeyhole size={9} /> Operator managed
          </span>
        </div>
        <div className="mt-2 rounded-[20px] border border-forest-900/[0.07] bg-white p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[9px] text-muted">Target float</div>
              <div className="tnum mt-0.5 text-[18px] font-medium tracking-[-0.03em] text-forest-900">
                {formatMoney(agent.targetFloat)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-muted">Current</div>
              <div className="tnum mt-0.5 text-[12px] font-medium text-forest-800">{Math.round((agent.floatBalance / Math.max(1, agent.targetFloat)) * 100)}%</div>
            </div>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-sand-100">
            <div
              className={`h-full rounded-full ${
                agent.status === 'healthy' ? 'bg-healthy-500' : agent.status === 'low' ? 'bg-warn-500' : 'bg-danger-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(3, (agent.floatBalance / Math.max(1, agent.targetFloat)) * 100))}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-forest-900/[0.06] pt-3">
            <div>
              <div className="text-[8.5px] text-muted/70">Low threshold</div>
              <div className="tnum mt-0.5 text-[11px] font-medium text-warn-700">{formatMoney(agent.lowThreshold)}</div>
            </div>
            <div>
              <div className="text-[8.5px] text-muted/70">Critical threshold</div>
              <div className="tnum mt-0.5 text-[11px] font-medium text-danger-600">{formatMoney(agent.criticalThreshold)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted">App &amp; support</span>
        <div className="mt-2 divide-y divide-forest-900/[0.055] rounded-[20px] border border-forest-900/[0.07] bg-white px-4">
          <ProfileRow
            icon={<Smartphone size={15} />}
            title={install.standalone ? 'Floatal is installed' : 'Install Floatal'}
            subtitle={install.standalone ? 'Running as a native app' : 'Full-screen, offline-ready PWA'}
            right={
              install.standalone ? (
                <span className="inline-flex items-center gap-1 text-[8.5px] font-medium text-healthy-600">
                  <CheckCircle size={11} /> Installed
                </span>
              ) : (
                <ChevronRight size={15} className="text-sand-400" />
              )
            }
            onClick={() => {
              if (install.available) {
                void install.promptInstall().then((result) => {
                  if (result === 'accepted') emitToast('Floatal installed', { tone: 'success' })
                })
              } else {
                openInstallHelp()
              }
            }}
          />
          <ProfileRow
            icon={<HelpCircle size={15} />}
            title="Agent support"
            subtitle="Talk to the Aya Money network team"
            right={<ChevronRight size={15} className="text-sand-400" />}
            onClick={openSupport}
          />
          <ProfileRow
            icon={<ShieldCheck size={15} />}
            title="Security &amp; privacy"
            subtitle="How your float data is protected"
            right={<ChevronRight size={15} className="text-sand-400" />}
            onClick={() => {
              openSheet(
                <div className="pb-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-forest-700/60">
                        Security
                      </div>
                      <h2 className="font-display mt-1.5 text-[21px] font-medium tracking-[-0.03em] text-forest-900">
                        Built for trust
                      </h2>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-50 text-forest-700">
                      <ShieldCheck size={19} />
                    </span>
                  </div>
                  <div className="mt-4 space-y-2.5 text-[10.5px] leading-relaxed text-muted">
                    <p>Your session is protected with a one-time code and a device-bound session.</p>
                    <p>Offline reports are encrypted in this browser and cleared after successful sync.</p>
                    <p>Only you and your operator's authorised network team can see your float position.</p>
                    <p>Every rebalance requires both agents to confirm before funds are considered settled.</p>
                  </div>
                  <button type="button" onClick={closeSheet} className="btn btn-ghost btn-block mt-4">
                    Close
                  </button>
                </div>,
                { onClose: closeSheet },
              )
            }}
          />
        </div>
      </div>

      {snapshot.agentSession?.demo && (
        <div className="mt-5">
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted">Demo tools</span>
            <Sparkles size={10} className="text-gold-500" />
          </div>
          <div className="mt-2 divide-y divide-forest-900/[0.055] rounded-[20px] border border-forest-900/[0.07] bg-white px-4">
            <ProfileRow
              icon={<Users size={15} />}
              title="Switch demo agent"
              subtitle="See both sides of a rebalance"
              right={<ChevronRight size={15} className="text-sand-400" />}
              onClick={openAgentSwitcher}
            />
            <ProfileRow
              icon={<RotateCcw size={15} />}
              title="Reset demo data"
              subtitle="Restore the seeded network"
              right={<ChevronRight size={15} className="text-sand-400" />}
              onClick={openReset}
            />
          </div>
        </div>
      )}

      <div className="mt-5">
        <button
          type="button"
          onClick={openSignOut}
          className="flex w-full items-center gap-3 rounded-[18px] border border-forest-900/[0.07] bg-white px-4 py-3.5 text-left"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-50 text-danger-600">
            <LogOut size={14} />
          </span>
          <span className="flex-1 text-[11.5px] font-medium text-danger-600">Sign out</span>
          <ChevronRight size={14} className="text-sand-400" />
        </button>
      </div>

      <div className="mt-6 flex flex-col items-center gap-1 pb-2 text-center text-[8.5px] leading-relaxed text-muted/45">
        <span className="inline-flex items-center gap-1">
          <MapPin size={8} /> {agent.area}, {agent.city} · Agent since {new Date(agent.joinedAt).getFullYear()}
        </span>
        <span>Floatal v1.0 · {supabaseEnabled ? 'Connected to Supabase' : 'Local demo mode'}</span>
        <span>Agent ID {agent.id}</span>
      </div>

      <div className="mt-2 flex items-center justify-center gap-1.5 text-[8.5px] text-muted/35">
        <Info size={8} /> {formatLongDate()}
      </div>
    </div>
  )
}

function ProfileRow({
  icon,
  title,
  subtitle,
  right,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  right: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-3 text-left transition-opacity active:opacity-60">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          danger ? 'bg-danger-50 text-danger-600' : 'bg-mint-50 text-forest-700'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[10.5px] font-medium ${danger ? 'text-danger-600' : 'text-forest-900'}`}>
          {title}
        </span>
        <span className="mt-0.5 block text-[9px] text-muted">{subtitle}</span>
      </span>
      {right}
    </button>
  )
}

function CheckCircle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15" />
      <path d="M4.8 8.2 7 10.3l4.2-4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AgentSwitcher({
  agents,
  currentId,
  onSelect,
  onClose,
}: {
  agents: Agent[]
  currentId: string
  onSelect: (agent: Agent) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const filtered = agents.filter((agent) =>
    `${agent.name} ${agent.area}`.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <div className="pb-1">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-forest-700/60">Demo controls</div>
          <h2 className="font-display mt-1.5 text-[21px] font-medium tracking-[-0.03em] text-forest-900">
            Switch agent
          </h2>
          <p className="mt-1 max-w-[270px] text-[10.5px] leading-relaxed text-muted">
            View the network from another agent's phone. Requests and reports stay live across all sessions.
          </p>
        </div>
        <button type="button" onClick={onClose} className="icon-btn h-8 w-8" aria-label="Close">
          <span className="text-lg leading-none">×</span>
        </button>
      </div>

      <div className="mt-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search agents"
          className="field bg-white text-[12px]"
        />
      </div>

      <div className="mt-2 max-h-[320px] overflow-y-auto no-scrollbar">
        {filtered.map((agent) => {
          const active = agent.id === currentId
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => onSelect(agent)}
              className={`flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left ${
                active ? 'bg-mint-50' : ''
              }`}
            >
              <Avatar name={agent.name} hue={agent.avatarHue} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[11px] font-medium text-forest-900">{agent.name}</span>
                  {active && <span className="text-[8px] font-medium text-forest-600">Current</span>}
                </div>
                <div className="mt-0.5 text-[9px] text-muted">
                  {agent.area} · {formatMoney(agent.floatBalance)}
                </div>
              </div>
              <StatusPill status={agent.status} size="sm" />
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-warn-50/80 px-3 py-2.5 text-[9px] leading-relaxed text-warn-700/75">
        <CircleAlert size={12} className="mt-0.5 shrink-0" />
        This is a demo shortcut. In production, each agent signs in with their own phone and one-time code.
      </div>
    </div>
  )
}
