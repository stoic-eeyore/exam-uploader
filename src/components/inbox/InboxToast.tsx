'use client'

type Toast = { message: string; type: 'success' | 'error' } | null

export default function InboxToast({ toast }: { toast: Toast }) {
  if (!toast) return null

  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white z-50 animate-in slide-in-from-bottom-2 ${
        toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
      }`}
    >
      {toast.message}
    </div>
  )
}
