import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, Check, Info, RefreshCw, X } from 'lucide-react'
import { cx } from '../lib/format'
import type { ToastPayload } from '../lib/toast'

const toneMeta = {
  default: { Icon: Info, tint: 'text-gold-300', ring: 'bg-white/8' },
  success: { Icon: Check, tint: 'text-[#8FE0BB]', ring: 'bg-[#78C9A4]/12' },
  warning: { Icon: AlertTriangle, tint: 'text-gold-300', ring: 'bg-gold-400/12' },
  error: { Icon: AlertCircle, tint: 'text-[#FF9F93]', ring: 'bg-[#E4695A]/12' },
  sync: { Icon: RefreshCw, tint: 'text-[#8FE0BB]', ring: 'bg-[#78C9A4]/12' },
}

export function ToastViewport({ variant = 'agent' }: { variant?: 'agent' | 'operator' }) {
  const [toasts, setToasts] = useState<ToastPayload[]>([])
  const [timers, setTimers] = useState<Record<string, number>>({})

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    setTimers((current) => {
      const next = { ...current }
      if (next[id]) window.clearTimeout(next[id])
      delete next[id]
      return next
    })
  }, [])

  useEffect(() => {
    const onToast = (event: Event) => {
      const payload = (event as CustomEvent<ToastPayload>).detail
      if (!payload) return
      setToasts((current) => [...current.slice(-2), payload])
      const timer = window.setTimeout(() => dismiss(payload.id), payload.duration)
      setTimers((current) => ({ ...current, [payload.id]: timer }))
    }
    window.addEventListener('floatal:toast', onToast)
    return () => {
      window.removeEventListener('floatal:toast', onToast)
      Object.values(timers).forEach((timer) => window.clearTimeout(timer))
    }
    // timers intentionally excluded — cleanup on unmount is best-effort.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismiss])

  return (
    <div
      aria-live="polite"
      className={cx(
        'pointer-events-none z-[85] flex flex-col gap-2',
        variant === 'agent'
          ? 'absolute inset-x-3 bottom-[calc(5.8rem+env(safe-area-inset-bottom))] items-center'
          : 'fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-2rem)] items-end',
      )}
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const meta = toneMeta[toast.tone] ?? toneMeta.default
          const { Icon } = meta
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.16 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex w-full max-w-[370px] items-start gap-3 rounded-2xl border border-white/10 bg-forest-950/95 px-3.5 py-3 text-white shadow-[0_20px_50px_-16px_rgba(5,31,24,0.65)] backdrop-blur-xl"
            >
              <span
                className={cx(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  meta.ring,
                  meta.tint,
                )}
              >
                <Icon size={14} className={toast.tone === 'sync' ? 'animate-spin' : undefined} />
              </span>
              <div className="min-w-0 flex-1 pt-[1px]">
                <p className="text-[12.5px] font-medium leading-snug tracking-[-0.01em]">{toast.message}</p>
                {toast.description && (
                  <p className="mt-0.5 text-[11px] leading-snug text-white/50">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/8 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X size={12} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
