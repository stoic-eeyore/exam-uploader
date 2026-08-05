export function relationshipId<T extends { id: number }>(value: number | T | null | undefined) {
  if (value == null) {
    return value
  }
  return typeof value === 'object' ? value.id : value
}
