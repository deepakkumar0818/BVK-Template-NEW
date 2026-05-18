/**
 * Max **data** rows per printed page in “Description of Goods” (PDF-style).
 * Chunking: e.g. 15 rows → 7 + 7 + 1 when no summary; with summary-after-goods see
 * {@link chunkLineItemsForPrintWithSummary}. Column headers repeat on each goods segment.
 */
export const GOODS_ROWS_PER_PRINT_PAGE = 7

/**
 * When a tall summary follows the goods table, cap the last chunk so print does not orphan thead + footer.
 */
export const GOODS_LAST_CHUNK_MAX_ROWS_WITH_SUMMARY = 4

/** With summary-after-goods on a **single** segment: at most this many line items keep natural height (no A4 fill / stretch) so summary stays on page 1 when it fits. */
export const GOODS_SUMMARY_SINGLE_PAGE_COMPACT_MAX_ITEMS = 4

/** Print: vertical budget per “missing” row vs 7 (matches `* 11mm` stretch / distribute in CSS). */
export const GOODS_PRINT_FILL_MM_PER_MISSING_ROW = 11

/** Last segment with summary: spread fill across line rows instead of one bottom spacer (5–6 items). */
export const GOODS_EVEN_DISTRIBUTE_MIN_ROWS = 5
export const GOODS_EVEN_DISTRIBUTE_MAX_ROWS = 6

export function chunkLineItems<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]]
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/**
 * Chunk for print when a summary/footer follows the goods table.
 * If the row count is an exact multiple of `pageSize`, the last chunk would fill the
 * page and orphan the summary — move one row to a final partial chunk instead.
 */
export function chunkLineItemsForPrint<T>(
  items: T[],
  pageSize: number = GOODS_ROWS_PER_PRINT_PAGE
): T[][] {
  if (items.length === 0) return [[]]
  if (items.length <= pageSize) return [items.slice()]

  const remainder = items.length % pageSize
  if (remainder !== 0) return chunkLineItems(items, pageSize)

  const fullChunkCount = items.length / pageSize
  const chunks: T[][] = []
  for (let c = 0; c < fullChunkCount - 1; c++) {
    chunks.push(items.slice(c * pageSize, (c + 1) * pageSize))
  }
  const start = (fullChunkCount - 1) * pageSize
  chunks.push(items.slice(start, start + pageSize - 1))
  chunks.push(items.slice(start + pageSize - 1))
  return chunks
}

/**
 * Chunk when `summaryFollowSlot` renders after the last goods table: last segment row cap
 * ({@link GOODS_LAST_CHUNK_MAX_ROWS_WITH_SUMMARY}); earlier segments use full `pageSize`.
 */
export function chunkLineItemsForPrintWithSummary<T>(
  items: T[],
  pageSize: number = GOODS_ROWS_PER_PRINT_PAGE,
  lastChunkMax: number = GOODS_LAST_CHUNK_MAX_ROWS_WITH_SUMMARY
): T[][] {
  if (items.length === 0) return [[]]
  if (items.length <= pageSize) return [items.slice()]

  const n = items.length
  const r = n % pageSize
  const naturalLast = r === 0 ? pageSize : r
  const lastLen = Math.max(1, Math.min(lastChunkMax, naturalLast))
  const headLen = n - lastLen
  const head = items.slice(0, headLen)
  const tail = items.slice(headLen)
  const headChunks = chunkLineItems(head, pageSize)
  return [...headChunks, tail]
}

/** WMW print: head pages full at 7 rows; last (footer) page caps at 5 rows. */
export const GOODS_WMW_FULL_PAGE_ROWS = 7
export const GOODS_WMW_LAST_PAGE_MAX_ROWS = 5

/**
 * WMW-route pagination:
 * - N ≤ 5: single page (items + footer).
 * - N ≥ 6: minPages = ceil((N − lastMax) / fullPage) + 1.
 *   last page = max(1, N − fullPage × (minPages − 1)); head pages fill 7s greedily,
 *   final head page absorbs the remainder.
 *
 * Examples: 6→[5,1], 7→[6,1], 10→[7,3], 12→[7,5], 13→[7,5,1], 14→[7,6,1], 21→[7,7,6,1].
 */
export function chunkLineItemsForWmwPrint<T>(
  items: T[],
  fullPage: number = GOODS_WMW_FULL_PAGE_ROWS,
  lastPageMax: number = GOODS_WMW_LAST_PAGE_MAX_ROWS
): T[][] {
  const n = items.length
  if (n === 0) return [[]]
  if (n <= lastPageMax) return [items.slice()]

  const minPages = Math.ceil((n - lastPageMax) / fullPage) + 1
  const headPages = minPages - 1
  const lastItems = Math.max(1, n - fullPage * headPages)
  const headTotal = n - lastItems

  const chunks: T[][] = []
  let cursor = 0
  for (let i = 0; i < headPages; i++) {
    const take = i < headPages - 1 ? fullPage : headTotal - fullPage * (headPages - 1)
    chunks.push(items.slice(cursor, cursor + take))
    cursor += take
  }
  chunks.push(items.slice(cursor))
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
