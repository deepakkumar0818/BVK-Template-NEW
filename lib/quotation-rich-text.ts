/** Zoho Creator may return plain string or lookup-style `{ zc_display_value }`. */
export function quotationRichText(raw: unknown, key: string): string {
  if (raw == null || typeof raw !== 'object') return ''
  const v = (raw as Record<string, unknown>)[key]
  if (v == null) return ''
  if (typeof v === 'object' && v !== null && 'zc_display_value' in v) {
    return String((v as { zc_display_value?: unknown }).zc_display_value ?? '').trim()
  }
  return String(v).trim()
}
