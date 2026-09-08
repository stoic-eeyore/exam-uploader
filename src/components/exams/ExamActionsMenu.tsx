'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'

import CopyExamForAI from './CopyExamForAI'
import ReviewExamButton from './ReviewExamButton'

interface ExamActionsMenuProps {
  examId: string
}

export default function ExamActionsMenu({ examId }: ExamActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label="Exam actions"
      >
        <MoreHorizontal size={20} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <ReviewExamButton examId={examId} />

          <div className="my-1 border-t" />

          <CopyExamForAI examId={examId} />
        </div>
      )}
    </div>
  )
}
