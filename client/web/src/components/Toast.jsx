import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'

function Toast() {
    const [toasts, setToasts] = useState([])

    useEffect(() => {
        const handler = (e) => {
            const { message, retryAfter } = e.detail
            setToasts(prev => [...prev, { id: Date.now(), message, countdown: retryAfter || 0 }])
        }
        window.addEventListener('show-toast', handler)
        return () => window.removeEventListener('show-toast', handler)
    }, [])

    useEffect(() => {
        if (toasts.length === 0) return
        const interval = setInterval(() => {
            setToasts(prev =>
                prev
                    .map(t => ({ ...t, countdown: Math.max(0, t.countdown - 1) }))
                    .filter(t => t.countdown > 0)
            )
        }, 1000)
        return () => clearInterval(interval)
    }, [toasts.length])

    const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id))

    return (
        <div className="fixed bottom-6 right-6 z-[99999] space-y-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map(t => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl bg-red-950 border border-red-500/30 text-white max-w-sm shadow-xl"
                    >
                        <div className="flex-1">
                            <p className="text-sm font-medium">{t.message}</p>
                            {t.countdown > 0 && (
                                <p className="text-xs text-red-300 mt-0.5">Retry in {t.countdown}s</p>
                            )}
                        </div>
                        <button onClick={() => dismiss(t.id)} className="mt-0.5 flex-shrink-0">
                            <X size={14} className="text-red-300" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

export default Toast
