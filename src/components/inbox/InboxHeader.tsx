'use client'

type Props = {
  count: number
  syncing: boolean
  onSync: (e: React.FormEvent) => void
}

export default function InboxHeader({ count, syncing, onSync }: Props) {
  return (
    <div className="flex justify-between items-center mb-5">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="m-0 text-3xl font-bold text-[#111827]">Inbox</h1>
          <span className="bg-[#e0e7ff] text-[#4338ca] px-2 py-0.5 rounded-[6px] text-xs font-semibold">
            {count} Documents
          </span>
        </div>
      </div>

      <form onSubmit={onSync}>
        <button
          disabled={syncing}
          className={`px-3.5 py-2 text-white border-none rounded-[6px] font-semibold text-[13px] transition ${
            syncing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[#2563eb] hover:bg-blue-700 cursor-pointer'
          }`}
        >
          {syncing ? 'Syncing...' : 'Sync Google Drive'}
        </button>
      </form>
    </div>
  )
}
