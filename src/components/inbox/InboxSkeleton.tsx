export default function InboxSkeleton() {
  return (
    <div className="space-y-3 py-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  )
}
