'use client'

type Props = {
  search: string
  statusFilter: 'all' | 'processed' | 'pending'
  onSearchChange: (value: string) => void
  onStatusChange: (value: 'all' | 'processed' | 'pending') => void
}

export default function InboxFilters({
  search,
  statusFilter,
  onSearchChange,
  onStatusChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <input
        type="text"
        placeholder="Search filename..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="border border-gray-200 rounded-md px-2.5 py-1 text-xs w-[180px]"
      />

      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as 'all' | 'processed' | 'pending')}
        className="border border-gray-200 rounded-md px-2.5 py-1 text-xs bg-white"
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="processed">Processed</option>
      </select>
    </div>
  )
}
