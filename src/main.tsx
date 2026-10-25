import '@fontsource-variable/bricolage-grotesque'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { fetchRemoteBundle, subscribeRemote } from './lib/remote'
import { store } from './lib/store'
import { supabase, supabaseEnabled } from './lib/supabase'
import './styles.css'

async function bootstrapRemote() {
  if (!supabaseEnabled || !supabase) return

  const bundle = await fetchRemoteBundle()
  if (bundle) store.applyRemote(bundle)

  subscribeRemote(async () => {
    const next = await fetchRemoteBundle()
    if (next) store.applyRemote(next)
  })

  supabase.auth.onAuthStateChange(async (event) => {
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
