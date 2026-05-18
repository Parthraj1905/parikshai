import { useEffect } from 'react'
import { useToast } from '../lib/ToastContext'

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration > 0) {
        setTimeout(() => {
          removeToast(toast.id)
        }, toast.duration)
      }
    })
  }, [toasts, removeToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-slide-in-right transition-all ${
            toast.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
          }`}
        >
          <span className="text-lg">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}