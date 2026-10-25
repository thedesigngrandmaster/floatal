import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface SheetEntry {
  content: ReactNode
  onClose?: () => void
  dismissible: boolean
}

interface SheetApi {
  openSheet: (content: ReactNode, options?: { onClose?: () => void; dismissible?: boolean }) => void
  closeSheet: () => void
}

const SheetContext = createContext<SheetApi | null>(null)

export function useSheet() {
  const context = useContext(SheetContext)
  if (!context) throw new Error('useSheet must be used within a BottomSheetProvider')
  return context
}

export function BottomSheetProvider({ children }: { children: ReactNode }) {
  const [entry, setEntry] = useState<SheetEntry | null>(null)
  const [visible, setVisible] = useState(false)

  const closeSheet = useCallback(() => {
    setVisible(false)
    const callback = entry?.onClose
    window.setTimeout(() => {
      setEntry(null)
      callback?.()
    }, 220)
  }, [entry])

  const openSheet = useCallback<SheetApi['openSheet']>((content, options) => {
    setEntry({
      content,
      onClose: options?.onClose,
      dismissible: options?.dismissible ?? true,
    })
    window.requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    if (!visible) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && entry?.dismissible) closeSheet()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, entry, closeSheet])

  const api = useMemo(() => ({ openSheet, closeSheet }), [openSheet, closeSheet])

  return (
    <SheetContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {visible && entry && (
          <div className="absolute inset-0 z-[60]">
            <motion.button
              type="button"
              aria-label="Close sheet"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="sheet-backdrop"
              onClick={() => entry.dismissible && closeSheet()}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              drag={entry.dismissible ? 'y' : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.02, bottom: 0.42 }}
              onDragEnd={(_, info) => {
                if (entry.dismissible && (info.offset.y > 100 || info.velocity.y > 720)) closeSheet()
              }}
              className="sheet-panel"
            >
              {entry.dismissible && <div className="sheet-grabber" />}
              <div className="sheet-body no-scrollbar">{entry.content}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SheetContext.Provider>
  )
}
