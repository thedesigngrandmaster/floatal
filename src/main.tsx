import '@fontsource-variable/bricolage-grotesque'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { store } from './lib/store'
import { supabaseEnabled } from './lib/supabase'
import { applyStoredTheme } from './lib/theme'
import './styles.css'

applyStoredTheme()

async function bootstrapRemote() {
  if (!supabaseEnabled) return

  const [{ fetchRemoteBundle, subscribeRemote }, { getSupabase }] = await Promise.all([
    import('./lib/remote'),
    import('./lib/supabase'),
  ])

  const bundle = await fetchRemoteBundle()
  if (bundle) store.applyRemote(bundle)

  subscribeRemote(async () => {
    const next = await fetchRemoteBundle()
    if (next) store.applyRemote(next)
  })

  const supabase = await getSupabase()
  supabase?.auth.onAuthStateChange(async (event) => {
    if (event === 'SIGNED_OUT') return
    const next = await fetchRemoteBundle()
    if (next) store.applyRemote(next)
  })
}

void bootstrapRemote()

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline shell is a progressive enhancement */
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
