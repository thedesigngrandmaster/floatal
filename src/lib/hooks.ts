import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { store } from './store'

export function useFloatal() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])
  return now
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export function useAnimatedNumber(target: number, duration = 650) {
  const [display, setDisplay] = useState(target)
  const previous = useRef(target)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const from = previous.current
    const start = performance.now()
    const delta = target - from
    if (delta === 0) {
      setDisplay(target)
      return
    }
    const tick = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + delta * eased)
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick)
      } else {
        previous.current = target
      }
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
      previous.current = target
    }
  }, [target, duration])

  return display
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const installListeners = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    installListeners.forEach((listener) => listener())
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    installListeners.forEach((listener) => listener())
  })
}

export function useInstallPrompt() {
  const [available, setAvailable] = useState(Boolean(deferredPrompt))
  const [standalone, setStandalone] = useState(
    typeof window !== 'undefined'
      ? window.matchMedia('(display-mode: standalone)').matches ||
          Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
      : false,
  )

  useEffect(() => {
    const listener = () => setAvailable(Boolean(deferredPrompt))
    installListeners.add(listener)
    const media = window.matchMedia('(display-mode: standalone)')
    const onChange = () => setStandalone(media.matches)
    media.addEventListener('change', onChange)
    listener()
    return () => {
      installListeners.delete(listener)
      media.removeEventListener('change', onChange)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return 'unavailable' as const
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      deferredPrompt = null
      installListeners.forEach((listener) => listener())
      return 'accepted' as const
    }
    return 'dismissed' as const
  }, [])

  const isIOS =
    typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

  return { available, standalone, promptInstall, isIOS }
}
