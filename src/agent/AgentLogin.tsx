import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, ChevronDown, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { AgentStage } from './AgentStage'
import { Brand, BrandMark } from '../components/Brand'
import { Spinner } from '../components/ui'
import { useFloatal } from '../lib/hooks'
import { DEMO_AGENTS, DEMO_OTP, findAgentByPhone, requestAgentOtp, verifyAgentOtp } from '../lib/auth'
import { supabaseEnabled } from '../lib/supabase'
import { emitHaptic, emitToast } from '../lib/toast'
import { cx, phoneDigits, toE164 } from '../lib/format'
import { MARKETS, marketByCode } from '../lib/markets'
import { store } from '../lib/store'
import type { CountryCode } from '../lib/types'

function formatLocal(value: string, length: number) {
  const digits = phoneDigits(value).slice(0, length)
  if (length === 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`
  if (length === 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
}

function demoLocal(country: CountryCode) {
  const demo = DEMO_AGENTS[country]
  if (!demo) return ''
  return phoneDigits(demo.phone).slice(marketByCode[country].dialCode.length - 1)
}

export function AgentLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const snapshot = useFloatal()
  const from = (location.state as { from?: string } | null)?.from ?? '/app'
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [country, setCountry] = useState<CountryCode>('GH')
  const [phone, setPhone] = useState(() => demoLocal('GH'))
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  const market = marketByCode[country]
  const localPhone = phoneDigits(phone).slice(0, market.localLength)
  const e164 = toE164(localPhone, country)
  const agent = useMemo(
    () => (e164 ? findAgentByPhone(e164) : null),
    [e164, snapshot.data.agents],
  )
  const codeValue = code.join('')
  const displayPhone = `${market.dialCode} ${formatLocal(localPhone, market.localLength)}`

  useEffect(() => {
    if (snapshot.agentSession) navigate(from, { replace: true })
  }, [snapshot.agentSession, from, navigate])

  useEffect(() => {
    if (step !== 'otp') return
    inputs.current[0]?.focus()
    setResendIn(30)
    const timer = window.setInterval(() => {
      setResendIn((current) => (current > 0 ? current - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [step])

  const handleRequest = async () => {
    setError('')
    if (localPhone.length !== market.localLength) {
      setError(`Enter a valid ${market.localLength}-digit ${market.name} mobile number`)
      return
    }
    setSubmitting(true)
    const result = await requestAgentOtp(e164)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error ?? 'We could not send a code')
      emitHaptic([20, 50, 20])
      return
    }
    emitHaptic(10)
    setStep('otp')
  }

  const handleVerify = async (override?: string) => {
    const token = override ?? codeValue
    if (token.length !== 6) {
      setError('Enter the 6-digit code')
      return
    }
    setError('')
    setSubmitting(true)
    const result = await verifyAgentOtp(e164, token)
    setSubmitting(false)
    if (!result.ok || !result.agentId) {
      setError(result.error ?? 'That code is not correct')
      emitHaptic([25, 60, 25])
      return
    }
    const signedInAgent = snapshot.data.agents.find((candidate) => candidate.id === result.agentId)
    if (!signedInAgent) {
      setError('Agent profile is still syncing. Try again in a moment.')
      return
    }
    store.setAgentSession(signedInAgent, !supabaseEnabled)
    emitHaptic([10, 40, 10])
    emitToast('Welcome back', { tone: 'success', description: signedInAgent.businessName })
    navigate(from, { replace: true })
  }

  const handleCodeChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '')
    if (!digit) {
      setCode((current) => current.map((value, i) => (i === index ? '' : value)))
      return
    }
    if (digit.length > 1) {
      const chars = digit.slice(0, 6).split('')
      const next = [...code]
      chars.forEach((char, offset) => {
        if (index + offset < 6) next[index + offset] = char
      })
      setCode(next)
      const focusIndex = Math.min(5, index + chars.length)
      inputs.current[focusIndex]?.focus()
      return
    }
    const next = code.map((value, i) => (i === index ? digit : value))
    setCode(next)
    setError('')
    if (index < 5) inputs.current[index + 1]?.focus()
  }

  const handleCodeKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
    if (key === 'Enter' && codeValue.length === 6) void handleVerify()
  }

  return (
    <AgentStage mode="login">
      <div className="grain relative flex h-full flex-col overflow-y-auto bg-forest-950 text-white no-scrollbar">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[52%] overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-400/[0.09] blur-3xl" />
          <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-mint-400/[0.12] blur-3xl" />
          <svg className="absolute right-0 top-6 h-56 w-56 opacity-[0.13]" viewBox="0 0 200 200" fill="none">
            {[44, 68, 92].map((radius) => (
              <circle key={radius} cx="150" cy="40" r={radius} stroke="#A8DEC2" strokeWidth="0.8" />
            ))}
            <circle cx="150" cy="40" r="3" fill="#F5C518" />
          </svg>
        </div>

        <div className="relative flex items-center justify-between px-5 pt-safe">
          <div className="flex items-center gap-2.5">
            <BrandMark size={30} />
            <Brand tone="light" size="sm" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[9.5px] font-medium uppercase tracking-[0.12em] text-white/55 backdrop-blur-sm">
            <ShieldCheck size={10} className="text-gold-400" />
            Secure
          </span>
        </div>

        <div className="relative px-6 pb-8 pt-8">
          <div className="eyebrow text-gold-400/80">Agent access</div>
          <h1 className="font-display mt-4 text-[34px] font-medium leading-[1.02] tracking-[-0.05em] text-[#F7F5EF]">
            {step === 'phone' ? (
              <>
                Your float,
                <br />
                in your hands.
              </>
            ) : (
              <>
                Check your
                <br />
                messages.
              </>
            )}
          </h1>
          <p className="mt-3 max-w-[270px] text-[12.5px] leading-relaxed text-white/45">
            {step === 'phone'
              ? 'Sign in with the number registered to your agent account.'
              : `We sent a 6-digit code to ${displayPhone}.`}
          </p>
        </div>

        <div className="relative mt-auto rounded-t-[32px] border-t border-white/10 bg-paper px-5 pb-safe pt-5 text-ink shadow-[0_-24px_60px_-20px_rgba(5,31,24,0.6)]">
          <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-sand-200" />
          <AnimatePresence mode="wait" initial={false}>
            {step === 'phone' ? (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-[19px] font-medium tracking-[-0.03em] text-forest-900">
                      Sign in
                    </h2>
                    <p className="mt-0.5 text-[11.5px] text-muted">Use your Floatal agent number.</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-50 text-forest-700">
                    <LockKeyhole size={15} />
                  </span>
                </div>

                <label className="mt-5 block">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Mobile number</span>
                  <div
                    className={cx(
                      'mt-2 flex items-center rounded-xl border bg-white transition-shadow focus-within:border-forest-500 focus-within:shadow-[0_0_0_4px_rgba(39,150,117,0.1)]',
                      error ? 'border-danger-500/60' : 'border-forest-900/12',
                    )}
                  >
                    <span className="flex items-center gap-1.5 border-r border-forest-900/8 py-3 pl-3.5 pr-2.5 text-[13px] font-medium text-forest-900">
                      <span className="text-[13px]">🇬🇭</span> +233
                    </span>
                    <input
                      id="agent-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={phone}
                      onChange={(event) => {
                        setPhone(formatLocal(event.target.value))
                        setError('')
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') void handleRequest()
                      }}
                      placeholder="24 555 0192"
                      className="tnum w-full bg-transparent px-3 py-3 text-[15px] font-medium tracking-[0.01em] text-forest-900 outline-none placeholder:text-sand-400"
                    />
                  </div>
                </label>

                {agent && (
                  <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-mint-50/70 px-2.5 py-2">
                    <Check size={11} className="text-healthy-600" />
                    <span className="text-[10.5px] text-forest-800/80">
                      {agent.name} · {agent.businessName}
                    </span>
                  </div>
                )}

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2.5 text-[11px] font-medium text-danger-600"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="button"
                  onClick={() => void handleRequest()}
                  disabled={submitting}
                  className="btn btn-forest btn-block mt-4 h-[50px]"
                >
                  {submitting ? (
                    <>
                      <Spinner size={15} /> Sending code
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight size={15} />
                    </>
                  )}
                </button>

                {!supabaseEnabled && (
                  <div className="mt-4 rounded-xl border border-gold-400/20 bg-gold-400/[0.07] px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-warn-700">
                      <Sparkles size={10} /> Demo access
                    </div>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-warn-700/75">
                      Number pre-filled. Use code <span className="font-semibold">{DEMO_OTP}</span> on the next step.
                    </p>
                  </div>
                )}

                <p className="mt-4 text-center text-[9.5px] leading-relaxed text-muted/70">
                  Protected by Floatal Identity. Only registered agents can access this application.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone')
                    setCode(Array(6).fill(''))
                    setError('')
                  }}
                  className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted transition-colors hover:text-forest-900"
                >
                  <ArrowLeft size={12} /> Change number
                </button>

                <h2 className="font-display text-[20px] font-medium tracking-[-0.03em] text-forest-900">
                  Enter your code
                </h2>
                <p className="mt-1 text-[11.5px] text-muted">
                  A 6-digit code was sent to <span className="font-medium text-forest-900">+233 {formatLocal(phone)}</span>.
                </p>

                <div className="mt-5 flex justify-between gap-1.5">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputs.current[index] = element
                      }}
                      value={digit}
                      onChange={(event) => handleCodeChange(index, event.target.value)}
                      onKeyDown={(event) => handleCodeKeyDown(index, event.key)}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      aria-label={`Digit ${index + 1}`}
                      data-filled={Boolean(digit)}
                      maxLength={6}
                      className="otp-cell"
                    />
                  ))}
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: [0, -3, 3, -2, 0] }}
                    className="mt-3 text-[11px] font-medium text-danger-600"
                  >
                    {error}
                  </motion.p>
                )}

                {!supabaseEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      const digits = DEMO_OTP.split('')
                      setCode(digits)
                      setError('')
                      inputs.current[5]?.focus()
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold-400/25 bg-gold-400/10 px-3 py-1.5 text-[10.5px] font-medium text-warn-700"
                  >
                    <Sparkles size={10} /> Use demo code {DEMO_OTP}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => void handleVerify()}
                  disabled={submitting || codeValue.length !== 6}
                  className="btn btn-forest btn-block mt-4 h-[50px]"
                >
                  {submitting ? (
                    <>
                      <Spinner size={15} /> Verifying
                    </>
                  ) : (
                    <>
                      Verify & sign in <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-between text-[10.5px]">
                  <button
                    type="button"
                    onClick={() => {
                      if (resendIn > 0) return
                      setResendIn(30)
                      emitToast('A new code is on its way', { tone: 'sync' })
                    }}
                    disabled={resendIn > 0}
                    className={cx('font-medium transition-colors', resendIn > 0 ? 'text-muted/60' : 'text-forest-800 hover:text-forest-900')}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                  </button>
                  <span className="inline-flex items-center gap-1 text-muted/70">
                    <ShieldCheck size={10} /> Encrypted
                  </span>
                </div>

                <Link to="/" className="mt-5 block text-center text-[9.5px] text-muted/60 transition-colors hover:text-forest-800">
                  About Floatal
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AgentStage>
  )
}
