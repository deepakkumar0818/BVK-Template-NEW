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
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  FIELD MAPPING — confirmed against a real Zoho payload (record
 *  238786000008197042, Template = "Category 1 WI") on 2026-08-13.
 * ─────────────────────────────────────────────────────────────────────────
 * Line items live in the SAME subform triplet BVK/SLS already read —
 * `Category_1_MM_Database_WI` (product master) + `_WI_2_0` (qty/price/HSN)
 * + `_WI_3_0` (Blend_Category/Weave/Delivery) — joined by `Line_Item_ref`,
 * NOT `Product_Fitments*` (empty on the sample record; kept only as a final
 * fallback below in case some records genuinely use Product Fitment).
 * Category 2 (`Category_2_MM_Database_WI*`) is read the same way when
 * `Template` says "Category 2".
 *
 * OPEN QUESTION — not resolved yet, flagged instead of guessed:
 *   The mockup PDF's "Type" attribute (e.g. "Type : 5156") has no confident
 *   match in the sample payload. `itemType` below is left unmapped
 *   (`''`) so the row is simply omitted until confirmed — do not guess.
 */

import type { QuotationLineItem } from './types'

// ──────────────────────────────────────────────────────────────────────────
// Zoho API field name registry (WI Process Febric ONLY)
// ──────────────────────────────────────────────────────────────────────────
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
  /**
   * GST rate scalars — NOT root-level fields. `IGST` / `CGST` live on the
   * `_2_0` line-item row (e.g. Category_1_MM_Database_WI_2_0[0].IGST); `SGST`
   * lives on the matching `_3_0` row. Exactly one is expected non-zero.
   * See `resolveWiProcessFebricGstLine`.
   */
  igstRate: 'IGST',
  cgstRate: 'CGST',
  sgstRate: 'SGST',
  /** Confirmed field name for "Payment Terms" — Zoho stores it as `Term_of_Payment`, NOT `Payment_Condition`. */
  paymentTerms: 'Term_of_Payment',
  /** Confirmed field name for "Quotation Validity" — Zoho stores it as `Quantity_Validity`, NOT `Quotation_Validity`. */
  quotationValidity: 'Quantity_Validity',
  deliveryTime: 'Delivery_Time',
  generalRemarks: 'General_Remarks',
  exclusions: 'The_following_is_not_included_in_this_quotation',
  closingStatement: 'Closing_Statement',
  /** Sample record stores name+phone combined in one string (e.g. "hello world(987654321)") — do not append a separate number. */
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

  // Discount summary fallback scalars (root-level)
  overallDiscountValue: 'Overall_Discount_Value',
  totalDiscount: 'Total_Discount',
  overallDiscount: 'Overall_Discount',
  totalPackingCharges: 'Total_Packing_Charges',
  totalFreightCharges: 'Total_Freight_Charges',

  // Subform names — Category 1 / Category 2 WI triplets (product master + 2_0 + 3_0)
  cat1Product: 'Category_1_MM_Database_WI',
  cat1Line20: 'Category_1_MM_Database_WI_2_0',
  cat1Line30: 'Category_1_MM_Database_WI_3_0',
  cat2Product: 'Category_2_MM_Database_WI',
  cat2Line20: 'Category_2_MM_Database_WI_2_0',
  cat2Line30: 'Category_2_MM_Database_WI_3_0',
  // Product Fitment fallback (used only when the WI triplet above is empty)
  subformFitmentsMain: 'Product_Fitments',
  subformFitments20: 'Product_Fitments2_0',

  // Per-row (subform) fields
  lineItemRef: 'Line_Item_ref',
  /**
   * Product-cell header = "Product Mesh : <this value>". Normally
   * `Brand_Selling_Name`, EXCEPT on `Category_1_MM_Database_WI` where that
   * field is mislabeled `Brand_Category` in the Zoho API — see
   * `buildProductMeshHeader`.
   */
  itemBrandSellingName: 'Brand_Selling_Name',
  itemBrandCategoryAsSellingName: 'Brand_Category',
  /** "Seam" attribute — Category_*_MM_Database_WI.Seam_Type */
  itemSeam: 'Seam_Type',
  /** "Type" attribute — UNCONFIRMED, see file header. Left blank on purpose. */
  itemType: '',
  /** "Length" attribute — Category_*_MM_Database_WI_2_0.Invoice_Dimension_1 */
  itemLength: 'Invoice_Dimension_1',
  /** "Width" attribute — Category_*_MM_Database_WI_2_0.Invoice_Dimension_2 */
  itemWidth: 'Invoice_Dimension_2',
  /** "Sqm" attribute — Category_*_MM_Database_WI_2_0.SQM */
  itemSqm: 'SQM',

  // Per-row commercial fields (all on the `_2_0` linked row)
  itemQty: 'Qty',
  itemPieces: 'Pieces',
  itemUomBilling: 'UOM_Billing',
  itemHsnCode: 'HSN_Code',
  itemSellingPrice: 'Selling_Price',
  itemGrossAmount: 'Gross_Amount',
  itemTotalSaleValue: 'Total_Sale_Value',
  itemNetSellingAmount: 'Net_Selling_Amount',
  itemDiscountValue: 'Discount_Value',
  itemDiscountPercent: 'Discount',
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
  /** Header line inside the Product cell (e.g. "Process Mesh : 45 Mesh"). Empty when Zoho has no value. */
  productName: string
  /** Structured attribute lines rendered as `<label> : <value>` under the header — Seam / Type / Length / Width / Sqm only. */
  attributes: Array<{ label: string; value: string }>
  /** HSN Code column — `_2_0` linked row first, then main product row. */
  hsnCode: string
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
  if (!key) return []
  const v = raw?.[key]
  if (v == null) return []
  if (Array.isArray(v)) return v.filter((r) => r != null && typeof r === 'object') as Record<string, unknown>[]
  if (typeof v === 'object') return [v as Record<string, unknown>]
  return []
}

function lineRef(row: Record<string, unknown>): string {
  const F = WI_PROCESS_FEBRIC_ZOHO_FIELDS
  return strVal(row[F.lineItemRef])
}

/**
 * Which WI triplet (Category 1 vs Category 2) this record's line items use —
 * decided from `Template`, same convention BVK/SLS use for their own WI
 * bundles. Defaults to Category 1 (the common case, and what the sample
 * record uses: `Template = "Category 1 WI"`).
 */
function resolveWiCategoryBundle(raw: Record<string, unknown> | null | undefined): {
  product: string
  line20: string
  line30: string
} {
  const F = WI_PROCESS_FEBRIC_ZOHO_FIELDS
  const t = strVal(raw?.[F.template]).toLowerCase()
  if (t.includes('category 2')) {
    return { product: F.cat2Product, line20: F.cat2Line20, line30: F.cat2Line30 }
  }
  return { product: F.cat1Product, line20: F.cat1Line20, line30: F.cat1Line30 }
}

/** Merge a `_2_0` row with its matching `_3_0` row by `Line_Item_ref` (3_0 fields overlay 2_0). */
function mergedLineRow(
  row20: Record<string, unknown>,
  rows30: Record<string, unknown>[],
  index: number
): Record<string, unknown> {
  const ref = lineRef(row20)
  const row30 = (ref ? rows30.find((r) => lineRef(r) === ref) : undefined) ?? rows30[index] ?? {}
  return { ...row30, ...row20 }
}

/** Match a `_2_0`/merged row to its product-master row by `Line_Item_ref`, else same index. */
function matchProductRow(
  productRows: Record<string, unknown>[],
  row20: Record<string, unknown>,
  index: number
): Record<string, unknown> {
  const ref = lineRef(row20)
  return (ref ? productRows.find((r) => lineRef(r) === ref) : undefined) ?? productRows[index] ?? {}
}

/** Prefer non-zero `Gross_Amount`, then `Total_Sale_Value`, then `Net_Selling_Amount`. */
function lineTotalFromRow(row: Record<string, unknown>): number {
  const F = WI_PROCESS_FEBRIC_ZOHO_FIELDS
  const gross = numFromString(row[F.itemGrossAmount])
  if (gross !== 0) return gross
  const total = numFromString(row[F.itemTotalSaleValue])
  if (total !== 0) return total
  return numFromString(row[F.itemNetSellingAmount])
}

/**
 * Product-cell header line: `Product Mesh : <Brand Selling Name>`.
 *
 * The Brand Selling Name field is normally `Brand_Selling_Name`, but on
 * `Category_1_MM_Database_WI` that field is mislabeled `Brand_Category` in
 * the API — `isCategory1Wi` tells this function to read `Brand_Category`
 * instead for rows sourced from that specific subform only. Every other
 * subform (Category 2 WI, Product Fitments) uses `Brand_Selling_Name` as-is.
 * Do NOT rename the Zoho field itself — this is a read-side interpretation only.
 */
function buildProductMeshHeader(
  isCategory1Wi: boolean,
  productRow: Record<string, unknown>,
  merged: Record<string, unknown>
): string {
  const F = WI_PROCESS_FEBRIC_ZOHO_FIELDS
  const field = isCategory1Wi ? F.itemBrandCategoryAsSellingName : F.itemBrandSellingName
  const brandSellingName = strVal(productRow[field]) || strVal(merged[field])
  return brandSellingName ? `Product Mesh : ${brandSellingName}` : ''
}

/**
 * Build the visible attribute list (Seam / Type / Length / Width / Sqm) for
 * the Product cell. Empty values are dropped so the column doesn't show
 * "Seam : " with a blank value. Length/Width get an " m" suffix to match
 * the PDF mockup's "6.508 m" formatting.
 */
function buildAttributes(
  merged: Record<string, unknown>,
  productRow: Record<string, unknown>
): Array<{ label: string; value: string }> {
  const F = WI_PROCESS_FEBRIC_ZOHO_FIELDS
  const pick = (field: string): string => {
    if (!field) return ''
    return strVal(merged[field]) || strVal(productRow[field])
  }
  const seam = pick(F.itemSeam)
  const type = pick(F.itemType)
  const length = pick(F.itemLength)
  const width = pick(F.itemWidth)
  const sqm = pick(F.itemSqm)
  const out: Array<{ label: string; value: string }> = []
  if (seam) out.push({ label: 'Seam', value: seam })
  if (type) out.push({ label: 'Type', value: type })
  if (length) out.push({ label: 'Length', value: `${length} m` })
  if (width) out.push({ label: 'Width', value: `${width} m` })
  if (sqm) out.push({ label: 'Sqm', value: sqm })
  return out
}

// ──────────────────────────────────────────────────────────────────────────
// Public builder — the ONLY export the component consumes for line items
// ──────────────────────────────────────────────────────────────────────────

/**
 * Build the WI Process Febric items-table rows from a raw Zoho quotation
 * record. Prefers the Category 1/2 WI triplet (matches this template's real
 * data); falls back to Product_Fitments2_0/Product_Fitments, then to the
 * transformed `QuotationLineItem[]`, when the WI subforms are empty.
 */
export function buildWiProcessFebricTableRows(
  raw: Record<string, unknown> | null | undefined,
  fallbackLineItems: QuotationLineItem[] = []
): WiProcessFebricTableRow[] {
  const F = WI_PROCESS_FEBRIC_ZOHO_FIELDS
  if (!raw) return fallbackFromLineItems(fallbackLineItems)

  const bundle = resolveWiCategoryBundle(raw)
  const isCategory1Wi = bundle.product === F.cat1Product
  const rows20 = subformRows(raw, bundle.line20)
  if (rows20.length > 0) {
    const rows30 = subformRows(raw, bundle.line30)
    const productRows = subformRows(raw, bundle.product)
    return rows20.map((row20, index) => {
      const merged = mergedLineRow(row20, rows30, index)
      const productRow = matchProductRow(productRows, row20, index)

      const header = buildProductMeshHeader(isCategory1Wi, productRow, merged)
      const hsnCode = strVal(merged[F.itemHsnCode]) || strVal(productRow[F.itemHsnCode])

      return {
        item: index + 1,
        productName: header,
        attributes: buildAttributes(merged, productRow),
        hsnCode,
        qty: strVal(merged[F.itemQty]),
        uom: strVal(merged[F.itemUomBilling]),
        unitPrice: numFromString(merged[F.itemSellingPrice]),
        totalPrice: lineTotalFromRow(merged),
      }
    })
  }

  // Fallback: Product Fitment subforms (used only when the WI triplet above has no rows).
  const fit20 = subformRows(raw, F.subformFitments20)
  const fitMain = subformRows(raw, F.subformFitmentsMain)
  const useFit20 = fit20.length > 0
  const fitRows = useFit20 ? fit20 : fitMain
  if (fitRows.length > 0) {
    return fitRows.map((row, index) => {
      const main = useFit20 ? matchProductRow(fitMain, row, index) : row
      const header = buildProductMeshHeader(false, main, row)
      const hsnCode = strVal(row[F.itemHsnCode]) || strVal(main[F.itemHsnCode])
      return {
        item: index + 1,
        productName: header,
        attributes: buildAttributes(row, main),
        hsnCode,
        qty: strVal(row[F.itemQty]) || strVal(row[F.itemPieces]) || strVal(main[F.itemQty]),
        uom: strVal(row[F.itemUomBilling]) || strVal(main[F.itemUomBilling]),
        unitPrice: numFromString(row[F.itemSellingPrice]) || numFromString(main[F.itemSellingPrice]),
        totalPrice: lineTotalFromRow(row) || lineTotalFromRow(main),
      }
    })
  }

  return fallbackFromLineItems(fallbackLineItems)
}

function fallbackFromLineItems(items: QuotationLineItem[]): WiProcessFebricTableRow[] {
  return items.map((item, index) => ({
    item: index + 1,
    productName: (item.product ?? '').trim(),
    attributes: [],
    hsnCode: (item.hsnCode ?? '').trim(),
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
 * Discount total: sum of each line's `Discount_Value` (else `Discount`)
 * across the active category's `_2_0` rows, plus the quotation-level
 * `Overall_Discount_Value` (else `Total_Discount`, else `Overall_Discount`)
 * scalar. Same precedence BVK/SLS use for their own WI-family discount rows.
 */
export function resolveWiProcessFebricChargeTotals(
  raw: Record<string, unknown> | null | undefined
): { packingTotal: number; freightTotal: number; discountTotal: number } {
  const F = WI_PROCESS_FEBRIC_ZOHO_FIELDS
  if (!raw) return { packingTotal: 0, freightTotal: 0, discountTotal: 0 }

  const bundle = resolveWiCategoryBundle(raw)
  const rows20 = subformRows(raw, bundle.line20)
  let lineDiscountSum = 0
  for (const row of rows20) {
    const dv = numFromString(row[F.itemDiscountValue])
    if (dv !== 0) {
      lineDiscountSum += dv
      continue
    }
    lineDiscountSum += numFromString(row[F.itemDiscountPercent])
  }
  const overallDiscount =
    numFromString(raw[F.overallDiscountValue]) ||
    numFromString(raw[F.totalDiscount]) ||
    numFromString(raw[F.overallDiscount])

  return {
    discountTotal: lineDiscountSum + overallDiscount,
    packingTotal: numFromString(raw[F.totalPackingCharges]),
    freightTotal: numFromString(raw[F.totalFreightCharges]),
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

/**
 * "Taxes and Duties" GST line: exactly one of `IGST` / `CGST` / `SGST` is
 * expected to be non-zero at a time (the other two are 0). These are NOT
 * root-level fields — `IGST`/`CGST` live on the first `_2_0` line-item row
 * of the active WI category bundle, `SGST` lives on the matching `_3_0`
 * row. Returns whichever one is > 0, checked in IGST → CGST → SGST order;
 * `null` when none are set (line is omitted entirely).
 */
export function resolveWiProcessFebricGstLine(
  raw: Record<string, unknown> | null | undefined
): { type: 'IGST' | 'CGST' | 'SGST'; rate: number } | null {
  if (!raw) return null
  const F = WI_PROCESS_FEBRIC_ZOHO_FIELDS
  const bundle = resolveWiCategoryBundle(raw)
  const row20 = subformRows(raw, bundle.line20)[0]
  const row30 = subformRows(raw, bundle.line30)[0]

  const igst = row20 ? numFromString(row20[F.igstRate]) : 0
  if (igst > 0) return { type: 'IGST', rate: igst }
  const cgst = row20 ? numFromString(row20[F.cgstRate]) : 0
  if (cgst > 0) return { type: 'CGST', rate: cgst }
  const sgst = row30 ? numFromString(row30[F.sgstRate]) : 0
  if (sgst > 0) return { type: 'SGST', rate: sgst }
  return null
}
