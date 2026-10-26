import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const KEY = 'floatal.theme.v1'
const EVENT = 'floatal:theme'

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode
}

function paint(resolved: 'light' | 'dark') {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolved === 'dark' ? '#041b14' : '#0C4232')
}

export function getStoredTheme(): ThemeMode {
  try {
    const value = window.localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

export function setTheme(mode: ThemeMode) {
  try {
    window.localStorage.setItem(KEY, mode)
  } catch {
    /* storage can be unavailable in private mode */
  }
  paint(resolveTheme(mode))
  window.dispatchEvent(new CustomEvent<ThemeMode>(EVENT, { detail: mode }))
}

export function applyStoredTheme() {
  paint(resolveTheme(getStoredTheme()))
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredTheme() === 'system') paint(resolveTheme('system'))
  })
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredTheme())

  useEffect(() => {
    const sync = () => setMode(getStoredTheme())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return [mode, setTheme] as const
}
