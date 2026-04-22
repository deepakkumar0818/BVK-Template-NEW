/**
 * Consecutive rows with identical Product + Form + Quality (trimmed) share one meta block
 * within a chunk (same behaviour as Ekamas goods table).
 */
export type GoodsMetaGroupRow = {
  product: string
  form: string
  quality: string
}

export function groupChunkRowsByProductFormQuality<T extends GoodsMetaGroupRow>(chunk: T[]): T[][] {
  const groups: T[][] = []
  const keyOf = (r: T) =>
    `${String(r.product ?? '').trim()}\u0000${String(r.form ?? '').trim()}\u0000${String(r.quality ?? '').trim()}`
  for (const row of chunk) {
    const prev = groups[groups.length - 1]
    if (prev && prev.length > 0 && keyOf(prev[0]) === keyOf(row)) {
      prev.push(row)
    } else {
      groups.push([row])
    }
  }
  return groups
}
