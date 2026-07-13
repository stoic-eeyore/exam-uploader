export default function InboxEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-200 rounded-md mt-4">
      {hasFilters ? 'No exams match your filters' : 'No inbox items yet'}
    </div>
  )
}
