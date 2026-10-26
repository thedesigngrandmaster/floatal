import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { Brand, BrandLockup, BrandMark } from '../components/Brand'
import { Avatar, NetworkMap, Spinner } from '../components/ui'
import { ThemeToggle } from '../components/ThemeToggle'
import { useFloatal, useNow } from '../lib/hooks'
import { DEFAULT_MARKET, MARKETS, marketByCode } from '../lib/markets'
import { store } from '../lib/store'
import { signInOperator } from '../lib/auth'
import { emitToast } from '../lib/toast'
import { supabaseEnabled } from '../lib/supabase'

export function OperatorLogin() {
  const snapshot = useFloatal()
  const navigate = useNavigate()
  const now = useNow(30_000)
  const [email, setEmail] = useState('adjoa@floatal.app')
  const [password, setPassword] = useState('floatal-demo')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (snapshot.operatorSession) navigate('/ops', { replace: true })
  }, [snapshot.operatorSession, navigate])

  const homeMarket = marketByCode[DEFAULT_MARKET]
  const homeAgents = snapshot.data.agents.filter((agent) => agent.country === DEFAULT_MARKET)
  const online = homeAgents.filter(
    (agent) => now - new Date(agent.lastSyncAt).getTime() < 45 * 60_000,
  ).length

  const submit = async () => {
    setSubmitting(true)
    setError('')
    await new Promise((resolve) => window.setTimeout(resolve, 620))
    const result = await signInOperator(email, password)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not sign in')
      return
    }
    const operator = snapshot.data.operator
    store.setOperatorSession(operator, !supabaseEnabled)
    emitToast('Workspace ready', { tone: 'success', description: `${operator.name} · ${operator.networkName}` })
    navigate('/ops', { replace: true })
  }

  return (
    <div className="grid min-h-[100dvh] bg-cream lg:grid-cols-[1.08fr_0.92fr]">
      <div className="grain relative hidden overflow-hidden bg-forest-950 px-12 py-10 text-[#F7F5EF] lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-[-10%] h-[520px] w-[520px] rounded-full bg-[#1C7A5E]/18 blur-[110px]" />
          <div className="absolute -right-24 bottom-[-20%] h-[500px] w-[500px] rounded-full bg-gold-400/[0.07] blur-[120px]" />
          <svg className="absolute right-[-10%] top-[15%] h-[520px] w-[520px] opacity-[0.1]" viewBox="0 0 500 500" fill="none">
            {[100, 165, 230, 295].map((radius) => (
              <circle key={radius} cx="250" cy="250" r={radius} stroke="#A8DEC2" strokeWidth="0.7" />
            ))}
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <BrandLockup tone="light" subtitle="Operator console" />
          <div className="flex items-center gap-2">
            <ThemeToggle onDark className="h-8 w-8" />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft size={11} /> floatal.app
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-16 max-w-[520px]">
          <div className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-gold-400/75">
            <span className="h-px w-6 bg-gold-400/40" /> Liquidity operations
          </div>
          <h1 className="font-display mt-6 text-[clamp(42px,4.6vw,62px)] font-medium leading-[0.98] tracking-[-0.06em] text-[#F7F5EF]">
            Run the network
            <br />
            <span className="text-white/35">with certainty.</span>
          </h1>
          <p className="mt-6 max-w-[420px] text-[13px] leading-[1.75] text-white/45">
            Every agent position, every request, every confirmation — reconciled live in one quiet, exact
            operating view.
          </p>

          <div className="mt-9 flex flex-wrap gap-2">
            {[
              `${MARKETS.length} markets`,
              `${snapshot.data.agents.length} agents`,
              `${online} online in ${homeMarket.capital}`,
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[10px] font-medium text-white/55"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.035] p-2 backdrop-blur-sm">
            <div className="relative overflow-hidden rounded-[18px] border border-white/[0.07] bg-[#06271F]">
              <NetworkMap
                agents={homeAgents}
                selectedId={homeAgents[0]?.id}
                className="h-[212px] w-full"
                currentAgentId={homeAgents[0]?.id}
              />
              <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#78C9A4] opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#78C9A4]" />
                  </span>
                  <span className="text-[8.5px] font-medium uppercase tracking-[0.14em] text-white/40">
                    {homeMarket.capital} · live
                  </span>
                </div>
                <div className="flex -space-x-1.5">
                  {homeAgents.slice(0, 4).map((agent) => (
                    <Avatar key={agent.id} name={agent.name} hue={agent.avatarHue} size="xs" className="ring-2 ring-[#06271F]" />
                  ))}
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[8px] text-white/60 ring-2 ring-[#06271F]">
                    +{Math.max(0, homeAgents.length - 4)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between border-t border-white/8 pt-5">
            <div>
              <p className="max-w-[380px] text-[11px] leading-relaxed text-white/38">
                “Floatal gives the network team one reconciled view. We stopped chasing spreadsheets.”
              </p>
              <div className="mt-2 text-[9px] font-medium uppercase tracking-[0.12em] text-white/25">
                Adjoa Serwaa · Head of Network
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[8.5px] font-medium uppercase tracking-[0.12em] text-white/25">
              <ShieldCheck size={12} className="text-mint-300/50" /> Enterprise
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-[100dvh] flex-col bg-cream">
        <div className="flex items-center justify-between px-6 py-6 lg:justify-end lg:px-10">
          <div className="lg:hidden">
            <BrandLockup tone="dark" subtitle="Operator console" />
          </div>
          <Link to="/app" className="text-[10.5px] font-medium text-muted transition-colors hover:text-forest-900">
            Agent app →
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[390px]"
          >
            <div className="mb-8 hidden items-center gap-3 lg:flex">
              <BrandMark size={36} />
              <div>
                <Brand tone="dark" size="md" />
                <div className="mt-1 text-[8.5px] font-medium uppercase tracking-[0.16em] text-muted/70">
                  Operator console
                </div>
              </div>
            </div>

            <div className="eyebrow text-forest-700/60">Secure workspace</div>
            <h2 className="font-display mt-3 text-[30px] font-medium leading-[1.05] tracking-[-0.045em] text-forest-900">
              Welcome back, Adjoa.
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Sign in to the {snapshot.data.operator.name} network operations workspace.
            </p>

            <div className="mt-7 space-y-3.5">
              <label className="block">
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Work email
                </span>
                <div className="relative mt-2">
                  <Mail size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="field bg-white pl-10 text-[13px]"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted">Password</span>
                  <span className="text-[9.5px] font-medium text-forest-600">SSO available</span>
                </div>
                <div className="relative mt-2">
                  <LockKeyhole size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void submit()
                    }}
                    className="field bg-white pl-10 text-[13px]"
                    autoComplete="current-password"
                  />
                </div>
              </label>

              {error && <p className="text-[11px] font-medium text-danger-600">{error}</p>}

              <button
                type="button"
                onClick={() => void submit()}
                disabled={submitting || !email || !password}
                className="btn btn-forest btn-block mt-1 h-[50px]"
              >
                {submitting ? (
                  <>
                    <Spinner size={15} /> Opening workspace
                  </>
                ) : (
                  <>
                    Continue to console <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>

            {!supabaseEnabled && (
              <div className="mt-5 rounded-xl border border-gold-400/20 bg-gold-400/[0.07] px-3.5 py-3">
                <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-warn-700">
                  <KeyRound size={10} /> Demo workspace
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-warn-700/70">
                  Credentials are pre-filled. Continue to explore the seeded {snapshot.data.operator.name} network.
                </p>
              </div>
            )}

            <div className="mt-7 flex items-center justify-center gap-4 text-[8.5px] font-medium uppercase tracking-[0.1em] text-muted/50">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={10} /> Supabase Auth
              </span>
              <span className="h-3 w-px bg-sand-300" />
              <span className="inline-flex items-center gap-1.5">
                <Check size={10} /> Row-level security
              </span>
            </div>
          </motion.div>
        </div>

        <div className="px-6 py-5 text-center text-[9px] text-muted/45">
          Protected workspace · {snapshot.data.operator.legalName}
        </div>
      </div>
    </div>
  )
}
