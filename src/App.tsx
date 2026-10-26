import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useFloatal } from './lib/hooks'
import { RouteSeo } from './lib/seo'
import { BrandMark } from './components/Brand'

const Launch = lazy(() => import('./pages/Launch').then((module) => ({ default: module.Launch })))
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })))

const AgentLogin = lazy(() => import('./agent/AgentLogin').then((module) => ({ default: module.AgentLogin })))
const AgentLayout = lazy(() => import('./agent/AgentLayout').then((module) => ({ default: module.AgentLayout })))
const AgentHome = lazy(() => import('./agent/AgentHome').then((module) => ({ default: module.AgentHome })))
const AgentNetwork = lazy(() => import('./agent/AgentNetwork').then((module) => ({ default: module.AgentNetwork })))
const AgentReport = lazy(() => import('./agent/AgentReport').then((module) => ({ default: module.AgentReport })))
const AgentActivity = lazy(() => import('./agent/AgentActivity').then((module) => ({ default: module.AgentActivity })))
const AgentProfile = lazy(() => import('./agent/AgentProfile').then((module) => ({ default: module.AgentProfile })))
const AgentRequestDetail = lazy(() =>
  import('./agent/AgentRequestDetail').then((module) => ({ default: module.AgentRequestDetail })),
)

const OperatorLogin = lazy(() =>
  import('./operator/OperatorLogin').then((module) => ({ default: module.OperatorLogin })),
)
const OperatorMarketProvider = lazy(() =>
  import('./operator/MarketContext').then((module) => ({ default: module.OperatorMarketProvider })),
)
const OperatorLayout = lazy(() =>
  import('./operator/OperatorLayout').then((module) => ({ default: module.OperatorLayout })),
)
const Overview = lazy(() => import('./operator/Overview').then((module) => ({ default: module.Overview })))
const OperatorNetwork = lazy(() =>
  import('./operator/OperatorNetwork').then((module) => ({ default: module.OperatorNetwork })),
)
const Rebalancing = lazy(() => import('./operator/Rebalancing').then((module) => ({ default: module.Rebalancing })))
const Agents = lazy(() => import('./operator/Agents').then((module) => ({ default: module.Agents })))
const Settings = lazy(() => import('./operator/Settings').then((module) => ({ default: module.Settings })))

function RequireAgent({ children }: { children: ReactNode }) {
  const snapshot = useFloatal()
  const location = useLocation()

  if (!snapshot.agentSession) {
    return <Navigate to="/app/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

function RequireOperator({ children }: { children: ReactNode }) {
  const snapshot = useFloatal()
  const location = useLocation()

  if (!snapshot.operatorSession) {
    return <Navigate to="/ops/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-3">
        <BrandMark size={38} />
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted/50">Loading</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <RouteSeo />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Launch />} />

          <Route path="/app/login" element={<AgentLogin />} />
          <Route
            path="/app"
            element={
              <RequireAgent>
                <AgentLayout />
              </RequireAgent>
            }
          >
            <Route index element={<AgentHome />} />
            <Route path="network" element={<AgentNetwork />} />
            <Route path="report" element={<AgentReport />} />
            <Route path="activity" element={<AgentActivity />} />
            <Route path="request/:id" element={<AgentRequestDetail />} />
            <Route path="profile" element={<AgentProfile />} />
          </Route>

          <Route path="/ops/login" element={<OperatorLogin />} />
          <Route
            path="/ops"
            element={
              <RequireOperator>
                <OperatorMarketProvider>
                  <OperatorLayout />
                </OperatorMarketProvider>
              </RequireOperator>
            }
          >
            <Route index element={<Overview />} />
            <Route path="network" element={<OperatorNetwork />} />
            <Route path="rebalancing" element={<Rebalancing />} />
            <Route path="agents" element={<Agents />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}
