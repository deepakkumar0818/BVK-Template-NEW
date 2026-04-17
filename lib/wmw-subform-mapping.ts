/**
 * Zoho Creator — Category 1 WMW subform join & display mapping
 *
 * JOINING LOGIC (high level)
 * ----------------------------
 * 1. The canonical driver for “one line on the quotation” is `Category_1_MM_Database_WMW` (main subform).
 *    Each main row should carry `last_item_ref`, which is the correlation key to rows in the linked subforms.
 *
 * 2. For a given `last_item_ref` value R, we collect at most one “extension” row from each linked subform by
 *    grouping all rows with normalized ref === R. If multiple rows share the same R in one subform, we take
 *    the first row in API order only (deterministic, avoids multiplying lines). Callers can change this policy
 *    in `pickFirstRowForRef` if they need merge rules later.
 *
 * 3. Scalar fields that the business considers “from linked detail” (supply form, size, seam type) are read
 *    with precedence: `WMW_2_0` → `WMW_3_0` → main row fallback, so missing linked rows stay blank but
 *    main-row values still surface when present.
 *
 * 4. UOM, Qty, Total_SQM (shown as rate/sqm column), Total_Price (amount) use precedence: main → `WMW_2_0`
 *    → `WMW_3_0`, matching how your payload stores those values on the main line today.
 *
 * 5. `Category_1_MM_Database_WMW_Desired_Date` joins on `last_item_ref` → `Date_field` (“Delivery Date”).
 *
 * 6. Other charges (`Category_1_MM_Database_WMW_Other_Charges`):
 *    - Primary match is charge `Name` (normalized trim / case-insensitive).
 *    - If a charge row includes a non-empty `last_item_ref`, we only use it for lines whose ref matches;
 *      this prevents line 2 inheriting line 1’s freight row.
 *    - If a charge row has no `last_item_ref`, it is treated as global for that name (applies to any line
 *      when no ref-scoped row matched).
 *
 * This module is intentionally data-only (no React) so the same shapes can be reused in APIs, PDFs, or tests.
 */

import type { ZohoQuotation } from './types'

/** Subform keys used by this mapper (exported for reuse / tests). */
export const WMW_SUBFORM_KEYS = {
  MAIN: 'Category_1_MM_Database_WMW',
  LINK_2_0: 'Category_1_MM_Database_WMW_2_0',
  LINK_3_0: 'Category_1_MM_Database_WMW_3_0',
  OTHER_CHARGES: 'Category_1_MM_Database_WMW_Other_Charges',
  DESIRED_DATE: 'Category_1_MM_Database_WMW_Desired_Date',
} as const

export const WMW_STANDARD_CHARGE_NAMES = {
  FREIGHT: 'Freight Charge',
  PACKING: 'Packing Charges',
  SEAM: 'Seam Charges',
} as const

export interface WmwJoinedLineDisplayRow {
  rowKey: string
  lastItemRef: string
  rowIndex: number
  mainRowId: string

  productLabel: string
  /** Shown as “Form” on quotation — from End_Type, else Supply_Form */
  supplyForm: string
  size: string
  /** Shown as “Type” — `Brand_Selling_Name` from Category_1_MM_Database_WMW (main first), else linked rows, else Seam_Type */
  seamType: string
  /** HSN_Code from linked WMW tax row (e.g. Category_1_MM_Database_WMW_3_0) */
  hsnCode: string
  uom: string
  quantity: string
  /** Source field Total_SQM — displayed as “Rate/Sqm” per business mapping */
  ratePerSqmDisplay: string
  /** Source field Total_Price — displayed as “Amount INR” (or invoice currency in UI) */
  amountDisplay: string
  deliveryDate: string

  freightCharge: string
  packingCharges: string
  seamCharges: string
}

export interface WmwFormTotalsDisplay {
  totalAmountBeforeTax: string
  addCgst: string
  addSgst: string
  addIgst: string
  taxAmountGst: string
  totalAmountAfterGst: string
}

type UnknownRecord = Record<string, unknown>

function isRecord(v: unknown): v is UnknownRecord {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/** Normalize correlation key: trim; empty → "" */
export function normalizeLastItemRef(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value).trim()
  return s
}

/** Safe string for display: null/undefined → "" */
export function stringifyField(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value).trim()
}

function normalizeChargeName(value: unknown): string {
  return stringifyField(value).replace(/\s+/g, ' ').toLowerCase()
}

/**
 * Reads a Zoho subform field as a row list.
 * Creator usually returns an array; some API shapes return a single object — normalize to one-element array.
 */
function toRowArray(raw: ZohoQuotation | null | undefined, key: string): UnknownRecord[] {
  if (!raw || !isRecord(raw)) return []
  const v = raw[key]
  if (v == null) return []
  if (Array.isArray(v)) {
    return v.filter(isRecord) as UnknownRecord[]
  }
  if (isRecord(v)) {
    return [v as UnknownRecord]
  }
  return []
}

function refFromRow(row: UnknownRecord): string {
  return normalizeLastItemRef(row.last_item_ref ?? row.Last_item_ref ?? row.Line_Item_ref)
}

function rowHasExplicitLastItemRef(row: UnknownRecord): boolean {
  return (
    normalizeLastItemRef(row.last_item_ref) !== '' || normalizeLastItemRef(row.Last_item_ref) !== ''
  )
}

/**
 * Groups subform rows by normalized last_item_ref. Rows with empty ref land under key "".
 */
export function groupRowsByLastItemRef(rows: UnknownRecord[]): Map<string, UnknownRecord[]> {
  const map = new Map<string, UnknownRecord[]>()
  if (!rows || rows.length === 0) return map
  for (const row of rows) {
    const key = refFromRow(row)
    const list = map.get(key)
    if (list) list.push(row)
    else map.set(key, [row])
  }
  return map
}

/**
 * First row for ref R (stable: first occurrence in source array order).
 */
export function pickFirstRowForRef(grouped: Map<string, UnknownRecord[]>, refNormalized: string): UnknownRecord | undefined {
  if (!grouped || grouped.size === 0) return undefined
  const list = grouped.get(refNormalized)
  if (!list || list.length === 0) return undefined
  return list[0]
}

const WMW_3_0_KEYS = {
  CAT1: 'Category_1_MM_Database_WMW_3_0',
  CAT2: 'Category_2_MM_Database_WMW_3_0',
} as const

/**
 * Blend_Category on WMW 3.0 (or 2.0 / main) drives the quotation “Product” line for WMWD1 when set.
 * Category 2 uses the same API name on Category_2_MM_Database_WMW_3_0 when that subform exists.
 */
export function pickBlendCategoryFromWmw30Row(
  raw: ZohoQuotation | null | undefined,
  lastItemRefNormalized: string,
  category: '1' | '2'
): string {
  if (!raw || lastItemRefNormalized === '') return ''
  const key = category === '2' ? WMW_3_0_KEYS.CAT2 : WMW_3_0_KEYS.CAT1
  const rows = toRowArray(raw, key)
  if (rows.length === 0) return ''
  const grouped = groupRowsByLastItemRef(rows)
  const row = pickFirstRowForRef(grouped, lastItemRefNormalized)
  return row ? stringifyField(row.Blend_Category) : ''
}

function coalesceLinkedFirst(
  row2: UnknownRecord | undefined,
  row3: UnknownRecord | undefined,
  main: UnknownRecord | undefined,
  field: string
): string {
  const a = row2 ? stringifyField(row2[field]) : ''
  if (a !== '') return a
  const b = row3 ? stringifyField(row3[field]) : ''
  if (b !== '') return b
  return main ? stringifyField(main[field]) : ''
}

/**
 * HSN_Code for one Category 1 WMW goods line (same precedence as `buildWmwJoinedLineRows`):
 * `Category_1_MM_Database_WMW_2_0` row → linked `Category_1_MM_Database_WMW_3_0` by `last_item_ref` → main `Category_1_MM_Database_WMW` row.
 * For WMW Performa tab HSN column only; WI already uses `buildWmwJoinedLineRows`.
 */
export function resolveCategory1WmwHsnCode(
  raw: ZohoQuotation | null | undefined,
  link20Row: UnknownRecord,
  mainProductRow: UnknownRecord,
  lastItemRefNormalized: string
): string {
  if (!raw) return ''
  const rows3 = toRowArray(raw, WMW_SUBFORM_KEYS.LINK_3_0)
  const ext3 = pickFirstRowForRef(groupRowsByLastItemRef(rows3), lastItemRefNormalized)
  return coalesceLinkedFirst(link20Row, ext3, mainProductRow, 'HSN_Code')
}

function coalesceMainFirst(
  main: UnknownRecord | undefined,
  row2: UnknownRecord | undefined,
  row3: UnknownRecord | undefined,
  field: string
): string {
  const m = main ? stringifyField(main[field]) : ''
  if (m !== '') return m
  const a = row2 ? stringifyField(row2[field]) : ''
  if (a !== '') return a
  return row3 ? stringifyField(row3[field]) : ''
}

/**
 * Resolves a charge price for one line.
 * Name match is required. Ref on charge row scopes the match; missing ref = global fallback.
 */
export function pickOtherChargePrice(
  chargeRows: UnknownRecord[],
  canonicalChargeName: string,
  lineRefNormalized: string
): string {
  if (!chargeRows || chargeRows.length === 0) return ''
  const target = normalizeChargeName(canonicalChargeName)
  if (!target) return ''

  const nameMatches = chargeRows.filter((r) => normalizeChargeName(r.Name) === target)
  if (nameMatches.length === 0) return ''

  if (lineRefNormalized !== '') {
    const scoped = nameMatches.filter(
      (r) => rowHasExplicitLastItemRef(r) && refFromRow(r) === lineRefNormalized
    )
    if (scoped.length > 0) return stringifyField(scoped[0].Price)
  }

  const globalRows = nameMatches.filter((r) => !rowHasExplicitLastItemRef(r))
  if (globalRows.length > 0) return stringifyField(globalRows[0].Price)

  return ''
}

function desiredDateForRef(
  desiredRows: UnknownRecord[],
  refNormalized: string
): string {
  if (!desiredRows.length) return ''
  const grouped = groupRowsByLastItemRef(desiredRows)
  const row = pickFirstRowForRef(grouped, refNormalized)
  if (!row) return ''
  return stringifyField(row.Date_field)
}

/**
 * Builds joined line rows for UI / export. Never throws; missing pieces become blank strings.
 */
export function buildWmwJoinedLineRows(raw: ZohoQuotation | null | undefined): WmwJoinedLineDisplayRow[] {
  if (!raw) return []

  const mainRows = toRowArray(raw, WMW_SUBFORM_KEYS.MAIN)
  if (mainRows.length === 0) return []

  const rows2 = toRowArray(raw, WMW_SUBFORM_KEYS.LINK_2_0)
  const rows3 = toRowArray(raw, WMW_SUBFORM_KEYS.LINK_3_0)
  const chargeRows = toRowArray(raw, WMW_SUBFORM_KEYS.OTHER_CHARGES)
  const desiredRows = toRowArray(raw, WMW_SUBFORM_KEYS.DESIRED_DATE)

  const byRef2 = groupRowsByLastItemRef(rows2)
  const byRef3 = groupRowsByLastItemRef(rows3)

  const parseNumeric = (value: unknown): number => {
    const s = stringifyField(value).replace(/,/g, '')
    if (!s) return NaN
    const n = parseFloat(s)
    return Number.isFinite(n) ? n : NaN
  }

  return mainRows.map((main, idx) => {
    const lastItemRef = refFromRow(main)
    const ext2 = pickFirstRowForRef(byRef2, lastItemRef)
    const ext3 = pickFirstRowForRef(byRef3, lastItemRef)

    const mainId = stringifyField(main.ID) || `main-${idx}`

    const blendProductLabel =
      stringifyField(ext3?.Blend_Category) ||
      stringifyField(ext2?.Blend_Category) ||
      stringifyField(main.Blend_Category)

    return {
      rowKey: `${mainId}-${idx}`,
      lastItemRef,
      rowIndex: idx + 1,
      mainRowId: mainId,

      productLabel: blendProductLabel || stringifyField(main.Product_Group),
      supplyForm:
        coalesceLinkedFirst(ext2, ext3, main, 'End_Type') ||
        coalesceLinkedFirst(ext2, ext3, main, 'Supply_Form'),
      size: coalesceLinkedFirst(ext2, ext3, main, 'Supply_Dimension_Type'),
      seamType:
        coalesceMainFirst(main, ext2, ext3, 'Brand_Selling_Name') ||
        coalesceLinkedFirst(ext2, ext3, main, 'Seam_Type'),
      hsnCode: coalesceLinkedFirst(ext2, ext3, main, 'HSN_Code'),
      uom: coalesceMainFirst(main, ext2, ext3, 'UOM_Billing'),
      quantity: coalesceMainFirst(main, ext2, ext3, 'Qty'),
      ratePerSqmDisplay: coalesceMainFirst(main, ext2, ext3, 'Total_SQM'),
      amountDisplay: (() => {
        const qty = parseNumeric(coalesceMainFirst(main, ext2, ext3, 'Qty'))
        const rate = parseNumeric(coalesceMainFirst(main, ext2, ext3, 'Total_SQM'))
        const computed = qty * rate
        if (Number.isFinite(computed)) return computed.toFixed(2)
        return coalesceMainFirst(main, ext2, ext3, 'Total_Price')
      })(),

      deliveryDate: desiredDateForRef(desiredRows, lastItemRef),

      freightCharge: pickOtherChargePrice(chargeRows, WMW_STANDARD_CHARGE_NAMES.FREIGHT, lastItemRef),
      packingCharges: pickOtherChargePrice(chargeRows, WMW_STANDARD_CHARGE_NAMES.PACKING, lastItemRef),
      seamCharges: pickOtherChargePrice(chargeRows, WMW_STANDARD_CHARGE_NAMES.SEAM, lastItemRef),
    }
  })
}

/**
 * Form-level fields mapped to quotation summary labels (values only; labels are applied in UI).
 */
export function buildWmwFormTotalsDisplay(raw: ZohoQuotation | null | undefined): WmwFormTotalsDisplay {
  if (!raw) {
    return {
      totalAmountBeforeTax: '',
      addCgst: '',
      addSgst: '',
      addIgst: '',
      taxAmountGst: '',
      totalAmountAfterGst: '',
    }
  }
  return {
    totalAmountBeforeTax: stringifyField(raw.Total_Net_Sale_Value_Before_Tax),
    addCgst: stringifyField(raw.Total_CGST),
    addSgst: stringifyField(raw.Total_Cost_Before_Tax),
    addIgst: stringifyField(raw.Total_IGST),
    taxAmountGst: stringifyField(raw.Total_Tax_Amount_IGST_CGST),
    totalAmountAfterGst: stringifyField(raw.Overall_Grand_Total_incl_Accessories),
  }
}

/** True when main WMW subform has at least one row (use joined pipeline). */
export function hasWmwMainLines(raw: ZohoQuotation | null | undefined): boolean {
  return toRowArray(raw, WMW_SUBFORM_KEYS.MAIN).length > 0
}

function parseChargeNumber(value: string | undefined): number {
  if (value === undefined || value === null) return 0
  const n = parseFloat(String(value).replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : 0
}

/**
 * Sums Freight / Packing / Seam other-charges across all joined WMW lines (for WI summary footer).
 */
export function sumWmwOtherChargesByCategory(raw: ZohoQuotation | null | undefined): {
  freightTotal: number
  packingTotal: number
  seamTotal: number
} {
  const rows = buildWmwJoinedLineRows(raw)
  let freightTotal = 0
  let packingTotal = 0
  let seamTotal = 0
  for (const r of rows) {
    freightTotal += parseChargeNumber(r.freightCharge)
    packingTotal += parseChargeNumber(r.packingCharges)
    seamTotal += parseChargeNumber(r.seamCharges)
  }
  return { freightTotal, packingTotal, seamTotal }
}

/** True when Zoho sent a non-empty scalar (trimmed). Used so missing charge fields do not fall back to subform sums. */
export function quotationScalarFieldPresent(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

/**
 * Freight / packing / seam from quotation scalars only: `Total_Freight_Charges`, `Total_Packing_Charges`, `Total_Seam_Charges`.
 * No subform sum and no `Packing_Freight` fallback — empty/missing field → 0 (UI hides the row).
 */
export function resolveWmwChargeTotals(raw: ZohoQuotation | null | undefined): {
  freightTotal: number
  packingTotal: number
  seamTotal: number
} {
  const r = raw as Record<string, unknown> | undefined
  if (!r) {
    return { freightTotal: 0, packingTotal: 0, seamTotal: 0 }
  }

  return {
    freightTotal: quotationScalarFieldPresent(r.Total_Freight_Charges)
      ? parseChargeNumber(String(r.Total_Freight_Charges))
      : 0,
    packingTotal: quotationScalarFieldPresent(r.Total_Packing_Charges)
      ? parseChargeNumber(String(r.Total_Packing_Charges))
      : 0,
    seamTotal: quotationScalarFieldPresent(r.Total_Seam_Charges)
      ? parseChargeNumber(String(r.Total_Seam_Charges))
      : 0,
  }
}

/** Hide charge rows when amount is zero (missing / empty API). */
export function filterNonZeroWmwChargeRows(rows: readonly [string, number][]): [string, number][] {
  return rows.filter(([, amt]) => typeof amt === 'number' && Number.isFinite(amt) && amt !== 0)
}
