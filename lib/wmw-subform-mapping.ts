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
 * 3. Scalar fields that the business considers “from linked detail” (End_Type as form, Invoice_Dimension_1/2
 *    as size for Cat 1 WMW, Material_Code for WMWD1 “Quality”, seam type) are read with precedence:
 *    `WMW_2_0` → `WMW_3_0` → main row fallback, so missing linked rows stay blank but main-row values still surface when present.
 *
 * 4. UOM, Qty, Total_SQM use precedence: main → `WMW_2_0` → `WMW_3_0`. The **rate** column uses `Selling_Price`
 *    (same precedence). **Amount** on WMW lines is computed as `Qty × rate` (rate = `Selling_Price`, else `List_Price`);
 *    if that cannot be computed, Zoho `Total_Price` is shown.
 *
 * 5. `Category_1_MM_Database_WMW_Desired_Date` joins on `last_item_ref` → `Date_field` (calendar delivery date).
 *    Zoho `Delivery` on linked rows (e.g. `WMW_3_0`) is the preferred **delivery column** text when set (“1 Week”, etc.).
 *
 * 6. Other charges (`Category_1_MM_Database_WMW_Other_Charges`):
 *    - Primary match is charge `Name` (normalized trim / case-insensitive).
 *    - If a charge row includes a non-empty `last_item_ref`, we only use it for lines whose ref matches;
 *      this prevents line 2 inheriting line 1’s freight row.
 *    - If a charge row has no `last_item_ref`, it is treated as global for that name (applies to any line
 *      when no ref-scoped row matched).
 *
 * 7. **Product Fitment** (when `Product_Fitments` / `Product_Fitments2_0` have rows): the same join shape is
 *    applied using `Product_Fitments_Other_Charges` and `Product_Fitments_Desired_Date`. If Category 1 WMW also
 *    has lines, **WMW rows are listed first**, then fitment rows (continuous `rowIndex`).
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

export const PRODUCT_FITMENT_SUBFORM_KEYS = {
  MAIN: 'Product_Fitments',
  LINK_2_0: 'Product_Fitments2_0',
  LINK_3_0: '',
  OTHER_CHARGES: 'Product_Fitments_Other_Charges',
  DESIRED_DATE: 'Product_Fitments_Desired_Date',
} as const

export const WMW_STANDARD_CHARGE_NAMES = {
  DISCOUNT: 'Discount',
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
  /** Shown as “Quality” on WMWD1 description — Zoho `Material_Code` (2_0 → 3_0 → main). */
  materialCode: string
  /** Shown as “Form” on quotation — Zoho `End_Type` only (2_0 → 3_0 → main). */
  supplyForm: string
  size: string
  /** Shown as “Type” — `Brand_Selling_Name` from Category_1_MM_Database_WMW (main first), else linked rows, else Seam_Type */
  seamType: string
  /** HSN_Code from linked WMW tax row (e.g. Category_1_MM_Database_WMW_3_0) */
  hsnCode: string
  uom: string
  quantity: string
  /** Zoho `Pieces` (main → 2_0 → 3_0); shown in quantity column instead of synthetic `N Pc` when set. */
  piecesDisplay: string
  /** Source field Total_SQM — displayed as “Rate/Sqm” per business mapping */
  ratePerSqmDisplay: string
  /** Source field Total_Price — displayed as “Amount INR” (or invoice currency in UI) */
  amountDisplay: string
  /** Zoho `Delivery` text from linked rows (`WMW_2_0` → `WMW_3_0` → main). */
  deliveryApi: string
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

type WmwLikeSubformKeyBundle = {
  MAIN: string
  LINK_2_0: string
  LINK_3_0: string
  OTHER_CHARGES: string
  DESIRED_DATE: string
  isProductFitment: boolean
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

/** First numeric token in Zoho invoice dimension strings (e.g. `4.1 Length` → `4.1`). */
export function numericSegmentFromInvoiceDimension(value: unknown): string {
  const s = stringifyField(value)
  if (!s) return ''
  const match = s.match(/(\d+\.?\d*)/)
  return match ? match[1] : ''
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
  return normalizeLastItemRef(row.last_item_ref ?? row.Last_item_ref ?? row.Line_Item_ref ?? row.Sr_No ?? row.S_No)
}

function rowHasExplicitLastItemRef(row: UnknownRecord): boolean {
  return (
    normalizeLastItemRef(row.last_item_ref) !== '' ||
    normalizeLastItemRef(row.Last_item_ref) !== '' ||
    normalizeLastItemRef(row.Sr_No) !== '' ||
    normalizeLastItemRef(row.S_No) !== ''
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

export function desiredDateForRef(
  desiredRows: UnknownRecord[],
  refNormalized: string
): string {
  if (!desiredRows.length) return ''
  const grouped = groupRowsByLastItemRef(desiredRows)
  const row = pickFirstRowForRef(grouped, refNormalized)
  if (!row) return ''
  return stringifyField(row.Date_field)
}

type WmwLikeKeysOnly = Omit<WmwLikeSubformKeyBundle, 'isProductFitment'>

/**
 * Resolves main line drivers: WMW main, or Product_Fitments, or Product_Fitments2_0 (fitment only when 1.0 empty).
 */
function mainRowsForBundle(
  raw: ZohoQuotation,
  keys: WmwLikeKeysOnly,
  isProductFitment: boolean
): UnknownRecord[] {
  const fromMain = toRowArray(raw, keys.MAIN)
  if (fromMain.length > 0) return fromMain
  if (isProductFitment && keys.LINK_2_0) {
    const from20 = toRowArray(raw, keys.LINK_2_0)
    if (from20.length > 0) return from20
  }
  return []
}

/**
 * One joined block: WMW (Category_1) or Product Fitment — same display row shape.
 * `rowIndexBase` is 0-based offset so WMW + fitment lines share one continuous numbering in the document.
 */
function buildJoinedLineRowsForSubformBundle(
  raw: ZohoQuotation,
  keys: WmwLikeKeysOnly,
  isProductFitment: boolean,
  idPrefix: 'wmw' | 'pf',
  rowIndexBase: number
): WmwJoinedLineDisplayRow[] {
  const mainRows = mainRowsForBundle(raw, keys, isProductFitment)
  if (mainRows.length === 0) return []

  const rows2 = toRowArray(raw, keys.LINK_2_0)
  const rows3 = keys.LINK_3_0 ? toRowArray(raw, keys.LINK_3_0) : []
  const chargeRows = toRowArray(raw, keys.OTHER_CHARGES)
  const desiredRows = toRowArray(raw, keys.DESIRED_DATE)

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
      stringifyField(main.Blend_Category) ||
      stringifyField(main.Product_Group) ||
      stringifyField(main.Product_Name) ||
      stringifyField(main.Price_Master)

    /** “Form” column: `End_Type` only (linked 2_0 → 3_0 → main), same as branded goods tables. */
    const supplyForm = coalesceLinkedFirst(ext2, ext3, main, 'End_Type')

    const materialCode = coalesceLinkedFirst(ext2, ext3, main, 'Material_Code')

    const size = isProductFitment
      ? (
          [stringifyField(main.Length_field || ext2?.Length_field), stringifyField(main.Width || ext2?.Width)]
            .filter((v) => v !== '')
            .join(' x ') ||
          coalesceLinkedFirst(ext2, ext3, main, 'Supply_Dimension_Type')
        )
      : (() => {
          const inv1 = numericSegmentFromInvoiceDimension(
            coalesceLinkedFirst(ext2, ext3, main, 'Invoice_Dimension_1')
          )
          const inv2 = numericSegmentFromInvoiceDimension(
            coalesceLinkedFirst(ext2, ext3, main, 'Invoice_Dimension_2')
          )
          if (inv1 !== '' && inv2 !== '') return `${inv1} x ${inv2}`
          if (inv1 !== '' || inv2 !== '') return inv1 || inv2
          return coalesceLinkedFirst(ext2, ext3, main, 'Supply_Dimension_Type')
        })()

    const seamType = isProductFitment
      ? (
          coalesceMainFirst(main, ext2, ext3, 'Brand_Selling_Name') ||
          coalesceMainFirst(main, ext2, ext3, 'Brand_Category') ||
          coalesceMainFirst(main, ext2, ext3, 'Seam_Type')
        )
      : (
          coalesceMainFirst(main, ext2, ext3, 'Brand_Selling_Name') ||
          coalesceLinkedFirst(ext2, ext3, main, 'Seam_Type')
        )

    /** Rate column: Zoho `Selling_Price` only (WMW + Product Fitment). */
    const ratePerSqmDisplay = coalesceMainFirst(main, ext2, ext3, 'Selling_Price')

    const amountDisplay = (() => {
      if (isProductFitment) {
        const netSales = coalesceMainFirst(main, ext2, ext3, 'Net_sales_value')
        if (netSales) return netSales
        const ga = coalesceMainFirst(main, ext2, ext3, 'Gross_Amount')
        if (ga) return ga
        const qtyPf = parseNumeric(coalesceMainFirst(main, ext2, ext3, 'Qty'))
        const ratePf = parseNumeric(
          coalesceMainFirst(main, ext2, ext3, 'Total_SQM') ||
            coalesceMainFirst(main, ext2, ext3, 'Selling_Price')
        )
        const computedPf = qtyPf * ratePf
        if (Number.isFinite(computedPf)) return computedPf.toFixed(2)
        return coalesceMainFirst(main, ext2, ext3, 'Total_Price')
      }
      // WMW: amount = quantity × unit rate (same basis as the rate column), not Qty × Total_SQM.
      const qtyNum = parseNumeric(coalesceMainFirst(main, ext2, ext3, 'Qty'))
      let unitRate = parseNumeric(coalesceMainFirst(main, ext2, ext3, 'Selling_Price'))
      if (!Number.isFinite(unitRate) || unitRate <= 0) {
        unitRate = parseNumeric(coalesceMainFirst(main, ext2, ext3, 'List_Price'))
      }
      const computed = qtyNum * unitRate
      if (Number.isFinite(computed) && computed >= 0) return computed.toFixed(2)
      return coalesceMainFirst(main, ext2, ext3, 'Total_Price')
    })()

    return {
      rowKey: `${idPrefix}-${mainId}-${idx}`,
      lastItemRef,
      rowIndex: rowIndexBase + idx + 1,
      mainRowId: mainId,

      productLabel: blendProductLabel,
      materialCode,
      supplyForm,
      size,
      seamType,
      hsnCode: coalesceLinkedFirst(ext2, ext3, main, 'HSN_Code'),
      uom: coalesceMainFirst(main, ext2, ext3, 'UOM_Billing') || (isProductFitment ? 'SQM' : ''),
      quantity: coalesceMainFirst(main, ext2, ext3, 'Qty') || (isProductFitment ? coalesceMainFirst(main, ext2, ext3, 'Pieces') : ''),
      piecesDisplay: coalesceMainFirst(main, ext2, ext3, 'Pieces'),
      ratePerSqmDisplay,
      amountDisplay,

      deliveryApi: coalesceLinkedFirst(ext2, ext3, main, 'Delivery'),
      deliveryDate: desiredDateForRef(desiredRows, lastItemRef),

      freightCharge: pickOtherChargePrice(chargeRows, WMW_STANDARD_CHARGE_NAMES.FREIGHT, lastItemRef),
      packingCharges: pickOtherChargePrice(chargeRows, WMW_STANDARD_CHARGE_NAMES.PACKING, lastItemRef),
      seamCharges: pickOtherChargePrice(chargeRows, WMW_STANDARD_CHARGE_NAMES.SEAM, lastItemRef),
    }
  })
}

/**
 * Joined lines for UI / export: **Category 1 WMW** block first (when present), then **Product Fitment** block
 * (when `Product_Fitments` and/or `Product_Fitments2_0` has rows). Other charges / desired dates use each
 * block’s subforms. Never throws; missing pieces become blank strings.
 */
export function buildWmwJoinedLineRows(raw: ZohoQuotation | null | undefined): WmwJoinedLineDisplayRow[] {
  if (!raw) return []
  const wmwBlock = buildJoinedLineRowsForSubformBundle(
    raw,
    WMW_SUBFORM_KEYS,
    false,
    'wmw',
    0
  )
  const pfBlock = buildJoinedLineRowsForSubformBundle(
    raw,
    PRODUCT_FITMENT_SUBFORM_KEYS,
    true,
    'pf',
    wmwBlock.length
  )
  return [...wmwBlock, ...pfBlock]
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
 * Right-hand summary label: `Discount_Type` + " Discount", or "Discount" when type is empty.
 * Shown just above Freight Charge on WMWD1 / performa / export goods footers.
 */
export function formatOverallDiscountRowLabel(discountType: unknown): string {
  const t = String(discountType ?? '').trim()
  if (!t) return 'Discount'
  return `${t} Discount`
}

/** Rows in these subforms may carry per-line discount (`Discount_Value` preferred, else `Discount`). */
const LINE_ITEM_DISCOUNT_SUBFORM_KEYS = [
  'Category_1_MM_Database_WMW_2_0',
  'Category_2_MM_Database_WMW_2_0',
  'Category_1_MM_Database_WI_2_0',
  'Category_2_MM_Database_WI_2_0',
] as const

function sumPerLineDiscountFromQuotation(raw: ZohoQuotation | null | undefined): number {
  if (!raw) return 0
  let sum = 0
  for (const key of LINE_ITEM_DISCOUNT_SUBFORM_KEYS) {
    for (const row of toRowArray(raw, key)) {
      const discountValue = parseChargeNumber(stringifyField(row.Discount_Value))
      if (discountValue !== 0) {
        sum += discountValue
        continue
      }
      sum += parseChargeNumber(stringifyField(row.Discount))
    }
  }
  return sum
}

function resolveOverallDiscountScalar(r: Record<string, unknown>): number {
  if (quotationScalarFieldPresent(r.Overall_Discount_Value)) {
    return parseChargeNumber(String(r.Overall_Discount_Value))
  }
  if (quotationScalarFieldPresent(r.Total_Discount)) {
    return parseChargeNumber(String(r.Total_Discount))
  }
  if (quotationScalarFieldPresent(r.Overall_Discount)) {
    return parseChargeNumber(String(r.Overall_Discount))
  }
  return 0
}

/**
 * Freight / discount / packing / seam from quotation scalars + line-item discount subforms.
 * Discount amount: sum of each line’s `Discount_Value` (else `Discount`) across Cat1/Cat2 **WI_2_0** and **WMW_2_0**,
 * plus quotation **`Overall_Discount_Value`** (else **`Total_Discount`**, else **`Overall_Discount`**).
 * Discount label: from `Discount_Type` via {@link formatOverallDiscountRowLabel}.
 * Other charges: `Total_Freight_Charges`, `Total_Packing_Charges`, `Total_Seam_Charges`.
 */
export function resolveWmwChargeTotals(raw: ZohoQuotation | null | undefined): {
  discountTotal: number
  discountLabel: string
  freightTotal: number
  packingTotal: number
  seamTotal: number
} {
  const r = raw as Record<string, unknown> | undefined
  if (!r) {
    return { discountTotal: 0, discountLabel: 'Discount', freightTotal: 0, packingTotal: 0, seamTotal: 0 }
  }

  const discountTotal =
    sumPerLineDiscountFromQuotation(raw) + resolveOverallDiscountScalar(r)

  return {
    discountTotal,
    discountLabel: formatOverallDiscountRowLabel(r.Discount_Type),
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
