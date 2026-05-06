import { stringifyField } from './wmw-subform-mapping'

/**
 * Description-of-goods “Form” column: first non-empty Zoho `End_Type` in caller order.
 * Typical WMW order: `Category_*_MM_Database_WMW_3_0` row → `WMW_2_0` line → main `WMW` product.
 */
export function endTypeDisplayFromRecords(
  ...records: (Record<string, unknown> | null | undefined)[]
): string {
  for (const r of records) {
    if (r == null || typeof r !== 'object') continue
    const s = stringifyField((r as Record<string, unknown>).End_Type)
    if (s !== '') return s
  }
  return ''
}

/**
 * Description-of-goods “Delivery” column: first non-empty Zoho `Delivery` in caller order
 * (e.g. `Category_*_MM_Database_WMW_3_0` → line → main).
 */
export function deliveryDisplayFromRecords(
  ...records: (Record<string, unknown> | null | undefined)[]
): string {
  for (const r of records) {
    if (r == null || typeof r !== 'object') continue
    const s = stringifyField((r as Record<string, unknown>).Delivery)
    if (s !== '') return s
  }
  return ''
}
