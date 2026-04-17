/**
 * Max **data** rows per printed page in “Description of Goods” (PDF-style).
 * Chunking: 15 rows → pages of 7 + 7 + 1 (totals/terms stay on the final page).
 * Column headers repeat on each goods segment; master quotation header can repeat each print page (repeating-header).
 */
export const GOODS_ROWS_PER_PRINT_PAGE = 7

export function chunkLineItems<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]]
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/** Trimmed display string; API may omit fields or send numbers. */
export function lineText(value: unknown): string {
  if (value == null) return ''
  return String(value).trim()
}

export function normalizeQty(value: unknown): number {
  if (value == null || value === '') return 0
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  return parseFloat(String(value).replace(/,/g, '')) || 0
}
