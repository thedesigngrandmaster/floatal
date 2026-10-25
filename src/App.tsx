import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AgentActivity } from './agent/AgentActivity'
import { AgentHome } from './agent/AgentHome'
import { AgentLayout } from './agent/AgentLayout'
import { AgentLogin } from './agent/AgentLogin'
import { AgentNetwork } from './agent/AgentNetwork'
import { AgentProfile } from './agent/AgentProfile'
import { AgentReport } from './agent/AgentReport'
import { AgentRequestDetail } from './agent/AgentRequestDetail'
import { useFloatal } from './lib/hooks'
import { Agents } from './operator/Agents'
import { OperatorMarketProvider } from './operator/MarketContext'
import { OperatorLayout } from './operator/OperatorLayout'
import { OperatorLogin } from './operator/OperatorLogin'
import { OperatorNetwork } from './operator/OperatorNetwork'
import { Overview } from './operator/Overview'
import { Rebalancing } from './operator/Rebalancing'
import { Settings } from './operator/Settings'
import { Launch } from './pages/Launch'

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

export default function App() {
  return (
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
