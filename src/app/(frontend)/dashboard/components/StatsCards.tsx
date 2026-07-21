// app/dashboard/components/StatsCards.tsx
'use client'

import { STATUS_CONFIG } from '../types'

type Stats = {
  total: number
  byStatus: {
    uploaded: number
    extracting: number
    review: number
    consultation: number
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
    {
      key: 'total',
      label: 'Total',
      count: stats.total,
      color: 'text-[#374151]',
      bg: 'bg-white',
      borderColor: 'border-[#e5e7eb]',
    },
    { key: 'uploaded', ...STATUS_CONFIG.uploaded, count: stats.byStatus.uploaded },
    { key: 'extracting', ...STATUS_CONFIG.extracting, count: stats.byStatus.extracting },
    { key: 'review', ...STATUS_CONFIG.review, count: stats.byStatus.review },
    { key: 'consultation', ...STATUS_CONFIG.consultation, count: stats.byStatus.consultation },
    { key: 'completed', ...STATUS_CONFIG.completed, count: stats.byStatus.completed },
    // { key: 'failed', ...STATUS_CONFIG.failed, count: stats.byStatus.failed },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      {items.map((item) => (
        <div
          key={item.key}
          className={`rounded-lg border p-3 ${
            item.key === 'total' ? 'bg-white border-[#e5e7eb]' : `${item.bg} border-transparent`
          }`}
        >
          <div className={`text-2xl font-bold ${item.color}`}>{item.count}</div>
          <div className={`text-xs font-medium mt-1 ${item.color}`}>{item.label}</div>
        </div>
      ))}
    </div>
  )
}
