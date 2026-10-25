import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react'
import { BrandLockup } from '../components/Brand'
import { Avatar } from '../components/ui'
import { useFloatal } from '../lib/hooks'
import { formatCompactMoney } from '../lib/format'

export function AgentStage({
  children,
  mode = 'app',
}: {
  children: ReactNode
  mode?: 'app' | 'login'
}) {
  const { data, online } = useFloatal()
  const onlineAgents = data.agents.filter(
    (agent) => Date.now() - new Date(agent.lastSyncAt).getTime() < 45 * 60_000,
  ).length
  const totalFloat = data.agents.reduce((sum, agent) => sum + agent.floatBalance, 0)

  return (
    <div className="agent-stage">
      <aside className="hidden h-full w-[min(34vw,390px)] flex-col justify-between py-2 lg:flex">
        <div className="flex items-center justify-between">
          <BrandLockup tone="dark" subtitle="Float infrastructure" />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-forest-900/10 bg-white/60 px-3 py-1.5 text-[10.5px] font-medium text-forest-800 transition-colors hover:bg-white"
          >
            <ArrowLeft size={11} /> Exit
          </Link>
        </div>

        <div className="pb-2">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-forest-700/70">
            <span className="h-px w-6 bg-forest-700/30" />
            {mode === 'login' ? 'Agent access' : 'Agent application'}
          </div>
          <h1 className="font-display mt-6 text-[clamp(38px,4.6vw,54px)] font-medium leading-[0.98] tracking-[-0.055em] text-forest-900">
            {mode === 'login' ? (
              <>
                Your float.
                <br />
                <span className="text-forest-700/60">Your control.</span>
              </>
            ) : (
              <>
                Float, without
                <br />
                <span className="text-forest-700/60">the friction.</span>
              </>
            )}
          </h1>
          <p className="mt-6 max-w-[320px] text-[13.5px] leading-relaxed text-forest-900/60">
            {mode === 'login'
              ? 'Secure, phone-first access to your float position, your network and your reconciliation history.'
              : 'Report your position, rebalance in seconds, and keep every cedi reconciled. Built for the agent behind the counter.'}
          </p>

          <ul className="mt-9 space-y-3.5">
            {[
              'Works offline — reports sync when you reconnect',
              'Requests confirmed by both agents before settlement',
              'Live visibility for your operator, in real time',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-[12.5px] leading-snug text-forest-900/75">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-forest-900 text-gold-400">
                  <Check size={9} strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="pb-2">
          <div className="rounded-[20px] border border-forest-900/8 bg-white/65 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">
                {data.operator.networkName} network
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-healthy-600">
                <span className={online ? 'dot-live relative h-1.5 w-1.5 rounded-full bg-healthy-500' : 'h-1.5 w-1.5 rounded-full bg-warn-500'} />
                {online ? 'Live' : 'Reconnecting'}
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="tnum font-display text-[25px] font-medium leading-none tracking-[-0.04em] text-forest-900">
                  {formatCompactMoney(totalFloat)}
                </div>
                <div className="mt-1 text-[10px] text-muted">Float under management</div>
              </div>
              <div className="flex -space-x-2">
                {data.agents.slice(0, 3).map((agent) => (
                  <Avatar key={agent.id} name={agent.name} hue={agent.avatarHue} size="sm" className="ring-2 ring-white" />
                ))}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-900 text-[9.5px] font-medium text-white ring-2 ring-white">
                  +{Math.max(0, data.agents.length - 3)}
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 border-t border-forest-900/6 pt-3 text-[10px] text-muted">
              <ShieldCheck size={11} className="text-forest-600" />
              {onlineAgents} agents online · Reconciliation active
            </div>
          </div>
          <p className="mt-4 text-[9.5px] uppercase tracking-[0.16em] text-forest-900/30">
            Floatal · Agent OS · v1.0
          </p>
        </div>
      </aside>

      <div className="device-wrap">
        <div className="device">
          <div className="device-screen">{children}</div>
        </div>
      </div>
    </div>
  )
}
