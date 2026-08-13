/**
 * WI Process Febric — ISOLATED subform helpers, field mapping and line-item
 * builder for the "WI Process Febric" quotation template.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  DEVELOPER ISOLATION NOTE
 * ─────────────────────────────────────────────────────────────────────────
 * This file is a DELIBERATE fork of the SLS-family helpers in
 * `lib/wi-line-display-shared.ts`. It exists so a second developer can
 * change the WI Process Febric template's data mappings — field names, row
 * shape, charge totals, tax logic — without ever touching a file that any
 * other template imports.
 *
 * Rules of engagement:
 *   • Do NOT re-share helpers from this file with other templates.
 *   • Do NOT import SLS/BVK/GKD-specific helpers here.
 *   • Change Zoho API field names ONLY inside `WI_PROCESS_FEBRIC_ZOHO_FIELDS`
 *     — every consumer in this file reads through that constant so a rename
 *     is a single-line change.
 *   • Everything else (subform readers, tax parser, charge resolver) is a
 *     local copy owned by this template. Modify freely.
 */

import type { QuotationLineItem } from './types'

// ──────────────────────────────────────────────────────────────────────────
// Zoho API field name registry (WI Process Febric ONLY)
// ──────────────────────────────────────────────────────────────────────────
/**
 * Single source of truth for every Zoho Creator API field the WI Process
 * Febric template reads. Change a name here and every consumer in this file
 * picks it up — no scattered string literals.
 */
export const WI_PROCESS_FEBRIC_ZOHO_FIELDS = {
  // Root-level quotation fields
  quotationName: 'Name',
  quotationCreatedDate: 'Created_Date_and_time',
  currency: 'Currency',
  template: 'Template',
  rootRemarks: 'Remarks',
  quotationReference: 'Quotation_Reference',
  insideQuotationText: 'Inside_Quotation_Text',
  pleaseNote: 'Please_Note',
  packingCharge: 'Packing_Charge',
  deliveryTerms: 'Delivery_Terms',
  deliveryTermsAlt: 'Delivery_terms',
  transport: 'Transport',
  taxes: 'Taxes',
  paymentCondition: 'Payment_Condition',
  quotationValidity: 'Quotation_Validity',
  deliveryTime: 'Delivery_Time',
  generalRemarks: 'General_Remarks',
  additionalRemarks: 'Additional_Remarks',
  exclusions: 'The_following_is_not_included_in_this_quotation',
  warrantyDisclaimer: 'Warranty_Disclaimer',
  generalTerms: 'General_Terms',
  closingStatement: 'Closing_Statement',
  contactPerson: 'Contact_Person',
  contactNumber: 'Contact_Number',
  companyName: 'Company_Name',
  companyFormerName: 'Company_Former_Name',
  registeredAddress: 'Registered_Address',
  phone: 'Phone',
  email: 'Email',
  website: 'Website',
  registeredOffice: 'Registered_Office',
  tagline: 'Tagline',
  cin: 'CIN',
  gstin: 'GSTIN',
  groupCompany: 'Group_Company',
  otherCharges: 'Other_Charges',
  typeOfOtherCharges: 'Type_of_Other_Charges',

  // Subform names (the Product_Fitments family is what this template reads)
  subformFitmentsMain: 'Product_Fitments',
  subformFitments20: 'Product_Fitments2_0',

  // Per-row (subform) fields shown in the Product column of the items table
  itemProductName: 'Brand_Selling_Name',
  itemProductFallback: 'Product_Name',
  itemSeam: 'Seam',
  itemSeamAlt: 'Seam_Type',
  itemType: 'Type',
  itemTypeAlt: 'Product_Type',
  itemLength: 'Length',
  itemWidth: 'Width',
  itemSqm: 'SQM',
  itemSqmAlt: 'Sqm',
  itemRemarks: 'Remarks',

  // Per-row commercial fields
  itemQty: 'Qty',
  itemPieces: 'Pieces',
  itemUomBilling: 'UOM_Billing',
  itemSellingPrice: 'Selling_Price',
  itemNetSellingAmount: 'Net_Selling_Amount',
  itemGrossAmount: 'Gross_Amount',
  itemTotalSaleValue: 'Total_Sale_Value',

  // Charge totals (root-level scalars — kept isolated so this template
  // can wire different charge fields without touching SLS/BVK helpers)
  packingTotal: 'Packing_Total',
  freightTotal: 'Freight_Total',
  discountTotal: 'Discount_Total',
} as const

// ──────────────────────────────────────────────────────────────────────────
// Row shape returned by the builder (WI Process Febric ONLY)
// ──────────────────────────────────────────────────────────────────────────
/**
 * Row shape for the WI Process Febric items table.
 *
 * The PDF has one wide "Product" cell that stacks a header label ("Synthetic
 * Mesh : Belt") on top of a labelled key/value block (Seam, Type, Length,
 * Width, Sqm). That structured layout is why this template needs its own
 * row shape rather than reusing the flat `product: string` SLS row.
 */
export interface WiProcessFebricTableRow {
  /** 1-based row number rendered in the Item column. */
  item: number
  /** Header line inside the Product cell (e.g. "Synthetic Mesh : Belt"). Empty when Zoho has no value. */
  productName: string
  /** Structured attribute lines rendered as `<label> : <value>` under the header. Empty entries are dropped by the component. */
  attributes: Array<{ label: string; value: string }>
  /** Freeform Remarks text — printed verbatim under the attribute list. */
  remarks: string
  /** Numeric qty as string (kept as string so leading zeros like "03 pc" round-trip). */
  qty: string
  /** Unit of measure — appended after `qty` in the Qty column. */
  uom: string
  /** Raw numeric for `formatCurrency`. */
  unitPrice: number
  /** Raw numeric for `formatCurrency`. */
  totalPrice: number
}

// ──────────────────────────────────────────────────────────────────────────
// Local subform helpers — do NOT export or share with other templates
// ──────────────────────────────────────────────────────────────────────────

function strVal(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}

function numFromString(v: unknown): number {
  const s = strVal(v).replace(/,/g, '')
  if (!s) return 0
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

function subformRows(
  raw: Record<string, unknown> | null | undefined,
  key: string
): Record<string, unknown>[] {
  const v = raw?.[key]
  if (v == null) return []
  if (Array.isArray(v)) return v.filter((r) => r != null && typeof r === 'object') as Record<string, unknown>[]
  if (typeof v === 'object') return [v as Record<string, unknown>]
  return []
}

/**
 * When both Product_Fitments2_0 and Product_Fitments exist, pair them by
 * `S_No` / `Sr_No` (or `S_No` on both). Falls back to same-index pairing.
 * Local to this template — the SLS helper file has its own copy.
 */
function matchFitmentsMainRow(
  fitMain: Record<string, unknown>[],
  fit20Row: Record<string, unknown>,
  index: number
): Record<string, unknown> | undefined {
  const key20 = strVal(fit20Row.S_No) || strVal(fit20Row.Sr_No)
  if (key20) {
    const found = fitMain.find(
      (r) => strVal(r.S_No) === key20 || strVal(r.Sr_No) === key20
    )
    if (found) return found
  }
  return fitMain[index]
}

/**
 * Prefer the qty from the main Product_Fitments row when the _2_0 row omits
 * it. Kept local so tweaks to qty resolution stay contained.
 */
function qtyFromMainOrRow(
  fitMain: Record<string, unknown>[],
  row: Record<string, unknown>,
  index: number
): string {
  const main = matchFitmentsMainRow(fitMain, row, index)
  const F = WI_PROCESS_FEBRIC_ZOHO_FIELDS
  return (
    strVal(main?.[F.itemQty]) ||
    strVal(main?.[F.itemPieces]) ||
    strVal(row[F.itemQty]) ||
    strVal(row[F.itemPieces])
  )
}

/**
 * Unit / total price resolution — mirrors the SLS PF logic but is a local
 * copy so pricing rules can diverge without touching the shared helper.
 */
function unitAndTotalFromRows(
  useFit20: boolean,
  fitMain: Record<string, unknown>[],
  row: Record<string, unknown>,
  index: number
): { unitPrice: number; totalPrice: number } {
  const F = WI_PROCESS_FEBRIC_ZOHO_FIELDS
  const unitPrice = numFromString(row[F.itemSellingPrice])
  const totalPrice =
    numFromString(row[F.itemNetSellingAmount]) ||
    numFromString(row[F.itemTotalSaleValue]) ||
    numFromString(row[F.itemGrossAmount])
  if (unitPrice > 0 || totalPrice > 0) return { unitPrice, totalPrice }
  if (useFit20) {
    const main = matchFitmentsMainRow(fitMain, row, index)
    if (main) {
      return {
        unitPrice: numFromString(main[F.itemSellingPrice]),
        totalPrice:
          numFromString(main[F.itemNetSellingAmount]) ||
          numFromString(main[F.itemTotalSaleValue]) ||
          numFromString(main[F.itemGrossAmount]),
      }
    }
  }
  return { unitPrice, totalPrice }
}

/**
 * Build the visible attribute list (Seam / Type / Length / Width / Sqm) for
 * the Product cell. Empty values are dropped so the column doesn't show
 * "Seam : " with a blank value.
 */
function buildAttributes(
  row: Record<string, unknown>,
  main: Record<string, unknown> | undefined
): Array<{ label: string; value: string }> {
  const F = WI_PROCESS_FEBRIC_ZOHO_FIELDS
  const pick = (primary: string, alt?: string): string => {
    const fromRow = strVal(row[primary]) || (alt ? strVal(row[alt]) : '')
    if (fromRow) return fromRow
    if (!main) return ''
    return strVal(main[primary]) || (alt ? strVal(main[alt]) : '')
  }
  const seam = pick(F.itemSeam, F.itemSeamAlt)
  const type = pick(F.itemType, F.itemTypeAlt)
  const length = pick(F.itemLength)
  const width = pick(F.itemWidth)
  const sqm = pick(F.itemSqm, F.itemSqmAlt)
  const out: Array<{ label: string; value: string }> = []
  if (seam) out.push({ label: 'Seam', value: seam })
  if (type) out.push({ label: 'Type', value: type })
  if (length) out.push({ label: 'Length', value: length })
  if (width) out.push({ label: 'Width', value: width })
  if (sqm) out.push({ label: 'Sqm', value: sqm })
  return out
}

// ──────────────────────────────────────────────────────────────────────────
// Public builder — the ONLY export the component consumes for line items
// ──────────────────────────────────────────────────────────────────────────

/**
 * Build the WI Process Febric items-table rows from a raw Zoho quotation
 * record. Prefers Product_Fitments2_0; falls back to Product_Fitments;
 * finally falls back to the transformed `QuotationLineItem[]` when neither
 * subform is present.
 */
export function buildWiProcessFebricTableRows(
  raw: Record<string, unknown> | null | undefined,
  fallbackLineItems: QuotationLineItem[] = []
): WiProcessFebricTableRow[] {
  const F = WI_PROCESS_FEBRIC_ZOHO_FIELDS
  if (!raw) return fallbackFromLineItems(fallbackLineItems)
  const fit20 = subformRows(raw, F.subformFitments20)
  const fitMain = subformRows(raw, F.subformFitmentsMain)
  const useFit20 = fit20.length > 0
  const rows = useFit20 ? fit20 : fitMain
  if (rows.length === 0) return fallbackFromLineItems(fallbackLineItems)
  return rows.map((row, index) => {
    const main = useFit20 ? matchFitmentsMainRow(fitMain, row, index) : row
    const productName =
      strVal(row[F.itemProductName]) ||
      (main ? strVal(main[F.itemProductName]) : '') ||
      strVal(row[F.itemProductFallback]) ||
      (main ? strVal(main[F.itemProductFallback]) : '')
    const attributes = buildAttributes(row, main)
    const remarks = strVal(row[F.itemRemarks]) || (main ? strVal(main[F.itemRemarks]) : '')
    const qty = useFit20 ? qtyFromMainOrRow(fitMain, row, index) : (strVal(row[F.itemQty]) || strVal(row[F.itemPieces]))
    const uom = strVal(row[F.itemUomBilling]) || (main ? strVal(main[F.itemUomBilling]) : '')
    const { unitPrice, totalPrice } = unitAndTotalFromRows(useFit20, fitMain, row, index)
    return {
      item: index + 1,
      productName,
      attributes,
      remarks,
      qty,
      uom,
      unitPrice,
      totalPrice,
    }
  })
}

function fallbackFromLineItems(items: QuotationLineItem[]): WiProcessFebricTableRow[] {
  return items.map((item, index) => ({
    item: index + 1,
    productName: (item.product ?? '').trim(),
    attributes: [],
    remarks: '',
    qty: (item.qty ?? '').trim(),
    uom: (item.uom ?? '').trim(),
    unitPrice: numFromString(item.rate),
    totalPrice: numFromString(item.amount),
  }))
}

// ──────────────────────────────────────────────────────────────────────────
// Charge totals — LOCAL copy (do not import from wmw-subform-mapping)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Root-level charge scalars used in the summary block. Kept fully local so
 * the WI Process Febric summary can diverge from SLS/BVK without a shared
 * helper edit rippling across templates.
 */
export function resolveWiProcessFebricChargeTotals(
  raw: Record<string, unknown> | null | undefined
): { packingTotal: number; freightTotal: number; discountTotal: number } {
  const F = WI_PROCESS_FEBRIC_ZOHO_FIELDS
  return {
    packingTotal: numFromString(raw?.[F.packingTotal]),
    freightTotal: numFromString(raw?.[F.freightTotal]),
    discountTotal: numFromString(raw?.[F.discountTotal]),
  }
}

/**
 * "Other Charges" scalar — same idea as SLS's version but local so it
 * doesn't share code path.
 */
export function resolveWiProcessFebricOtherCharges(
  raw: Record<string, unknown> | null | undefined
): { amount: number; label: string } {
  const F = WI_PROCESS_FEBRIC_ZOHO_FIELDS
  const amount = numFromString(raw?.[F.otherCharges])
  const type = strVal(raw?.[F.typeOfOtherCharges])
  const label = type ? `Other Charges (${type})` : 'Other Charges'
  return { amount, label }
}
