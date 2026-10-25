import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { History, House, Plus, UserRound, UsersRound } from 'lucide-react'
import { AgentStage } from './AgentStage'
import { BottomSheetProvider } from '../components/Sheet'
import { ToastViewport } from '../components/ToastViewport'
import { useFloatal } from '../lib/hooks'
import { cx } from '../lib/format'

const tabs = [
  { to: '/app', label: 'Home', icon: House, end: true },
  { to: '/app/network', label: 'Network', icon: UsersRound, end: false },
  { to: '/app/report', label: 'Report', icon: Plus, end: false, cta: true },
  { to: '/app/activity', label: 'Activity', icon: History, end: false },
  { to: '/app/profile', label: 'Profile', icon: UserRound, end: false },
]

export function AgentLayout() {
  const location = useLocation()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const snapshot = useFloatal()

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  const queued = snapshot.agentSession ? (snapshot.queues[snapshot.agentSession.agentId]?.length ?? 0) : 0

  return (
    <AgentStage>
      <BottomSheetProvider>
        <div className="agent-app">
          <div className="agent-scroll" ref={scrollRef}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 0.8, 0.2, 1] }}
            >
              <Outlet />
            </motion.div>
          </div>

          {(snapshot.syncing || (!snapshot.online && !snapshot.offlineSimulated && queued > 0)) && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center pt-safe">
              <div className="mt-1 flex items-center gap-1.5 rounded-full border border-forest-900/8 bg-paper/90 px-2.5 py-1 text-[9.5px] font-medium text-forest-700 shadow-sm backdrop-blur-md">
                <span className={cx('h-1.5 w-1.5 rounded-full', snapshot.syncing ? 'animate-pulse bg-forest-600' : 'bg-warn-500')} />
                {snapshot.syncing ? 'Syncing reports…' : `${queued} report${queued === 1 ? '' : 's'} queued`}
              </div>
            </div>
          )}

          <nav className="bottom-nav" aria-label="Primary">
            <div className="bottom-nav-inner">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    end={tab.end}
                    className={cx('tab-item', tab.cta && 'gap-1')}
                  >
                    {({ isActive }) => (
                      <>
                        {tab.cta ? (
                          <span className="nav-cta">
                            <Icon size={21} strokeWidth={2.2} />
                          </span>
                        ) : (
                          <span className="relative flex h-6 w-6 items-center justify-center">
                            <Icon size={19} strokeWidth={isActive ? 2.1 : 1.7} />
                            {isActive && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-gold-400" />}
                          </span>
                        )}
                        <span data-active={isActive} className={cx(tab.cta && isActive && 'text-forest-900')}>
                          {tab.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </nav>

          <ToastViewport />
        </div>
      </BottomSheetProvider>
    </AgentStage>
  )
}

export function AgentPageSkeleton() {
  return (
    <div className="agent-page animate-pulse pt-safe">
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="flex-1">
          <div className="skeleton h-2.5 w-24 rounded" />
          <div className="skeleton mt-2 h-2 w-16 rounded" />
        </div>
      </div>
      <div className="skeleton mt-7 h-[270px] rounded-[26px]" />
      <div className="mt-6 flex justify-between">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-3 w-12 rounded" />
      </div>
      <div className="mt-3 flex gap-3">
        <div className="skeleton h-[150px] w-[190px] rounded-2xl" />
        <div className="skeleton h-[150px] w-[190px] rounded-2xl" />
      </div>
    </div>
  )
}


