interface Props {
  score: number | null
}

export function QualityBadge({ score }: Props) {
  if (score == null) {
    return <span className="text-gray-400 text-sm">—</span>
  }

  if (score >= 9) return <span className="text-green-700 font-medium">Excellent</span>

  if (score >= 7) return <span className="text-blue-700 font-medium">Good</span>

  if (score >= 5) return <span className="text-yellow-700 font-medium">Fair</span>

  return <span className="text-red-700 font-medium">Poor</span>
}
