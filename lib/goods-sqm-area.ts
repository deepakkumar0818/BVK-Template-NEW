/**
 * "Sqm Area / PC" from length × width only (same sources as SIZE [Mtrs] L×W).
 * No Zoho Total_SQM / SQM or line-item subQty — if L×W cannot be parsed, returns ''.
 */

/** First numeric token in a dimension string (handles commas, labeled Zoho values). */
export function parseGoodsDimNumber(value: unknown): number {
  const s = String(value ?? '')
    .trim()
    .replace(/,/g, '')
  if (!s) return 0
  const m = s.match(/(\d+(?:\.\d+)?)/)
  return m && Number.isFinite(parseFloat(m[1])) ? parseFloat(m[1]) : 0
}

/** Invoice line dimensions often include text; take the first numeric token. */
export function parseInvoiceDimensionNumber(raw: string | undefined | null): number {
  if (raw == null || String(raw).trim() === '') return 0
  const cleaned = String(raw).replace(/Length|length|Width|width/gi, '').trim()
  const m = cleaned.match(/(\d+(?:\.\d+)?)/)
  return m && Number.isFinite(parseFloat(m[1])) ? parseFloat(m[1]) : 0
}

export function multiplyLenWidthToSqm(len: number, wid: number): string {
  if (len > 0 && wid > 0 && Number.isFinite(len * wid)) return (len * wid).toFixed(4)
  return ''
}

/**
 * Parse a composed SIZE cell like "4.728 x 3.020" or "4.728 × 3.020" (meters).
 */
export function sqmAreaFromSizeDisplayString(size: string | null | undefined): string {
  if (!size || !String(size).trim()) return ''
  const parts = String(size)
    .trim()
    .split(/\s*[x×]\s*/i)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length !== 2) return ''
  const a = parseGoodsDimNumber(parts[0])
  const b = parseGoodsDimNumber(parts[1])
  return multiplyLenWidthToSqm(a, b)
}

export interface ResolveGoodsSqmAreaParams {
  invoiceDimension1?: string | null | undefined
  invoiceDimension2?: string | null | undefined
  lengthField?: unknown
  width?: unknown
  /** Ekamas-style when Length_field / Width are empty */
  supplyDimension1?: unknown
  supplyDimension2?: unknown
  /** Composed SIZE column text — parse as L × W when numeric fields do not yield an area */
  sizeDisplay?: string | null | undefined
}

/**
 * Priority matches SIZE column: length/width (+ optional supply), invoice dimensions, then `sizeDisplay`.
 */
export function resolveGoodsSqmArea(params: ResolveGoodsSqmAreaParams): string {
  const lenMain = parseGoodsDimNumber(params.lengthField)
  const widMain = parseGoodsDimNumber(params.width)
  const lenSup = parseGoodsDimNumber(params.supplyDimension1)
  const widSup = parseGoodsDimNumber(params.supplyDimension2)
  const lenEff = lenMain || lenSup
  const widEff = widMain || widSup
  const fromFields = multiplyLenWidthToSqm(lenEff, widEff)
  if (fromFields) return fromFields

  const inv1 = params.invoiceDimension1?.trim()
  const inv2 = params.invoiceDimension2?.trim()
  if (inv1 && inv2) {
    const a = parseInvoiceDimensionNumber(inv1)
    const b = parseInvoiceDimensionNumber(inv2)
    const fromInv = multiplyLenWidthToSqm(a, b)
    if (fromInv) return fromInv
  }

  return sqmAreaFromSizeDisplayString(params.sizeDisplay)
}
