'use client'

import { STATUS_CONFIG } from '../types'

type Stats = {
  total: number
  byStatus: {
    uploaded: number
    extracting: number
    review: number
    completed: number
    failed: number
  }
}

type StatsCardsProps = {
  stats: Stats
  loading?: boolean
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const items = [
    { key: 'total', label: 'Total', count: stats.total, color: 'bg-[#f3f4f6] text-[#374151]' },
    { key: 'uploaded', label: 'Uploaded', count: stats.byStatus.uploaded, ...STATUS_CONFIG.uploaded },
    { key: 'extracting', label: 'Extracting', count: stats.byStatus.extracting, ...STATUS_CONFIG.extracting },
    { key: 'review', label: 'Review', count: stats.byStatus.review, ...STATUS_CONFIG.review },
    { key: 'completed', label: 'Completed', count: stats.byStatus.completed, ...STATUS_CONFIG.completed },
    { key: 'failed', label: 'Failed', count: stats.byStatus.failed, ...STATUS_CONFIG.failed },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      {items.map((item) => (
        <div
          key={item.key}
          className={`rounded-lg border border-[#e5e7eb] p-3 ${item.key === 'total' ? 'bg-white' : item.bg}`}
        >
          <div className={`text-2xl font-bold ${item.key === 'total' ? 'text-[#111827]' : item.color}`}>
            {item.count}
          </div>
          <div className={`text-xs font-medium mt-1 ${item.key === 'total' ? 'text-[#6b7280]' : item.color}`}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  )
}

