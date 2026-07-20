'use client'

import { useState } from 'react'
import { ProcessingStatus, ALL_STATUSES } from '../types'

export type FilterState = {
  grade: string
  subject: string
  label: string
  year: string
  status: ProcessingStatus | 'all'
  search: string
}

type FilterBarProps = {
  filters: FilterState
  onChange: (filters: FilterState) => void
  options: {
    grades: string[]
    subjects: string[]
    labels: string[]
    years: string[]
  }
  resultCount: number
  totalCount: number
}

const FILTER_LABELS: Record<keyof FilterState, string> = {
  grade: 'Grade',
  subject: 'Subject',
  label: 'Label',
  year: 'Year',
  status: 'Status',
  search: 'Search',
}

export function FilterBar({ filters, onChange, options, resultCount, totalCount }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false)

  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (key === 'status') return value !== 'all'
    return value !== ''
  })

  const hasActiveFilters = activeFilters.length > 0

  const update = (patch: Partial<FilterState>) => {
    onChange({ ...filters, ...patch })
  }

  const clearAll = () => {
    onChange({ grade: '', subject: '', label: '', year: '', status: 'all', search: '' })
  }

  const removeFilter = (key: keyof FilterState) => {
    update({ [key]: key === 'status' ? 'all' : '' } as Partial<FilterState>)
  }

  return (
    <div className="mb-4">
      {/* Compact bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search input — always visible, compact */}
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search exams..."
            className="pl-8 pr-3 py-1.5 text-sm border border-[#d1d5db] rounded-[6px] w-[180px] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
          />
          {filters.search && (
            <button
              onClick={() => update({ search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[6px] border transition-colors ${
            expanded || hasActiveFilters
              ? 'bg-[#eef0ff] text-[#4f46e5] border-[#c7d2fe]'
              : 'bg-white text-[#374151] border-[#d1d5db] hover:bg-gray-50'
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="bg-[#4f46e5] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {activeFilters.length}
            </span>
          )}
        </button>

        {/* Active filter chips */}
        {activeFilters.map(([key, value]) => (
          <span
            key={key}
            className="inline-flex items-center gap-1 px-2 py-1 bg-[#f3f4f6] text-[#374151] text-xs rounded-[4px] border border-[#e5e7eb]"
          >
            <span className="text-[#9ca3af]">{FILTER_LABELS[key as keyof FilterState]}:</span>
            <span className="font-medium">{value}</span>
            <button
              onClick={() => removeFilter(key as keyof FilterState)}
              className="ml-0.5 text-[#9ca3af] hover:text-[#ef4444] transition-colors"
            >
              ✕
            </button>
          </span>
        ))}

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-[#6b7280] hover:text-[#ef4444] underline transition-colors"
          >
            Clear all
          </button>
        )}

        {/* Result count */}
        <span className="text-xs text-[#9ca3af] ml-auto">
          {resultCount} / {totalCount}
        </span>
      </div>

      {/* Expandable filter panel */}
      {expanded && (
        <div className="mt-3 p-4 bg-white rounded-lg border border-[#e5e7eb] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 animate-[fadeIn_0.15s_ease-out]">
          <div>
            <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">
              Grade
            </label>
            <select
              value={filters.grade}
              onChange={(e) => update({ grade: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-[#d1d5db] rounded-[6px] bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="">All</option>
              {options.grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">
              Subject
            </label>
            <select
              value={filters.subject}
              onChange={(e) => update({ subject: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-[#d1d5db] rounded-[6px] bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="">All</option>
              {options.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">
              Label
            </label>
            <select
              value={filters.label}
              onChange={(e) => update({ label: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-[#d1d5db] rounded-[6px] bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="">All</option>
              {options.labels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) => update({ year: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-[#d1d5db] rounded-[6px] bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="">All</option>
              {options.years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => update({ status: e.target.value as FilterState['status'] })}
              className="w-full px-2.5 py-1.5 text-sm border border-[#d1d5db] rounded-[6px] bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="all">All</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
