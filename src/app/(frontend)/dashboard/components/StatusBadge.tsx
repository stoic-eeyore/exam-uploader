// app/dashboard/components/StatusBadge.tsx
import { ProcessingStatus, STATUS_CONFIG } from '../types'

export function StatusBadge({ status }: { status?: ProcessingStatus }) {
  const config = status ? STATUS_CONFIG[status] : null
  if (!config) return <span className="text-[#6b7280] text-xs">-</span>

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-xs font-medium ${config.bg} ${config.color}`}>
      {config.dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'extracting' ? 'animate-pulse' : ''}`} />
      )}
      {config.label}
    </span>
  )
}

