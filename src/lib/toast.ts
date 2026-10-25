export type ToastTone = 'default' | 'success' | 'warning' | 'error' | 'sync'

export interface ToastPayload {
  id: string
  message: string
  description?: string
  tone: ToastTone
  duration: number
}

export function emitToast(
  message: string,
  options: { tone?: ToastTone; description?: string; duration?: number } = {},
) {
  if (typeof window === 'undefined') return
  const payload: ToastPayload = {
    id: crypto.randomUUID(),
    message,
    description: options.description,
    tone: options.tone ?? 'default',
    duration: options.duration ?? 3600,
  }
  window.dispatchEvent(new CustomEvent<ToastPayload>('floatal:toast', { detail: payload }))
}

export function emitHaptic(pattern: number | number[] = 10) {
  if (typeof navigator === 'undefined') return
  if (typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern)
    } catch {
      /* haptics are a progressive enhancement */
    }
  }
}
