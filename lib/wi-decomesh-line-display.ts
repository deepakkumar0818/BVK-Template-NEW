/**
 * WI Decomesh — ISOLATED subform helpers, Zoho field mapping, and line-item
 * builder for the "WI Decomesh" quotation template.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  DEVELOPER ISOLATION NOTE
 * ─────────────────────────────────────────────────────────────────────────
 * This file is a DELIBERATE fork of the shared line-display helpers. It
 * exists so a developer can change the WI Decomesh template's data
 * mappings — Zoho field names, row shape, charge totals — without ever
 * touching a file that any other template imports.
 *
 * Rules of engagement:
 *   • Do NOT re-share helpers from this file with other templates.
 *   • Do NOT import SLS/BVK/GKD/WI-Process-Febric-specific helpers here.
 *   • Change Zoho API field names ONLY inside `WI_DECOMESH_ZOHO_FIELDS` —
 *     every consumer in this file reads through that constant so a rename
 *     is a single-line change.
 *   • Everything else (subform readers, family resolver) is a local copy
 *     owned by this template. Modify freely.
 */

import type { QuotationLineItem } from './types'

// ──────────────────────────────────────────────────────────────────────────
// Zoho API field name registry (WI Decomesh ONLY)
// ──────────────────────────────────────────────────────────────────────────
/**
 * Single source of truth for every Zoho Creator API field the WI Decomesh
 * template reads. Change a name here and every consumer in this file picks
 * it up — no scattered string literals.
 */
export const WI_DECOMESH_ZOHO_FIELDS = {
  // Root-level quotation fields
  quotationName: 'Name',
  quotationCreatedDate: 'Created_Date_and_time',
  currency: 'Currency',
  template: 'Template',
  rootRemarks: 'Remarks',
  quotationReference: 'Quotation_Reference',
  insideQuotationText: 'Inside_Quotation_Text',
  pleaseNote: 'Please_Note',
  packing: 'Packing',
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

  // Subform names — the five product families this template supports
  subformCat1WiMain: 'Category_1_MM_Database_WI',
  subformCat1WiTwoZero: 'Category_1_MM_Database_WI_2_0',
  subformCat2WiMain: 'Category_2_MM_Database_WI',
  subformCat2WiTwoZero: 'Category_2_MM_Database_WI_2_0',
  subformCat1WmwMain: 'Category_1_MM_Database_WMW',
  subformCat1WmwTwoZero: 'Category_1_MM_Database_WMW_2_0',
  subformCat2WmwMain: 'Category_2_MM_Database_WMW',
  subformCat2WmwTwoZero: 'Category_2_MM_Database_WMW_2_0',
  subformFitmentsMain: 'Product_Fitments',
  subformFitmentsTwoZero: 'Product_Fitments2_0',

  // Per-row (subform) fields used in each Item block
  itemBrandCategory: 'Brand_Category',   // Cat_1_WI mesh-type source
  itemBrandSellingName: 'Brand_Selling_Name', // other families' mesh-type source
  itemMaterialCode: 'Material_Code',     // Material line
  itemInvoiceDimension1: 'Invoice_Dimension_1', // "Sizes : W mm x L mm"
  itemInvoiceDimension2: 'Invoice_Dimension_2',
  itemSupplyDimension1: 'Supply_Dimension_1',
  itemSupplyDimension2: 'Supply_Dimension_2',
  itemSqm: 'SQM',                        // Total quantity line (with " m²" suffix)
  itemQty: 'Qty',                        // Quantity numeric
  itemPieces: 'Pieces',                  // Fitments fallback
  itemUomBilling: 'UOM_Billing',         // Quantity unit label ("Panel")
  itemRemarks: 'Remarks',                // "Our price includes:" per-item body
  itemSellingPrice: 'Selling_Price',
  itemTotalSaleValue: 'Total_Sale_Value',
  itemNetSellingAmount: 'Net_Selling_Amount',
  itemGrossAmount: 'Gross_Amount',
} as const

// ──────────────────────────────────────────────────────────────────────────
// Row shape returned by the builder (WI Decomesh ONLY)
// ──────────────────────────────────────────────────────────────────────────
/**
 * Row shape for WI Decomesh. Each row is rendered as its own "Item No-N"
 * block, so we hand the component every attribute pre-computed rather than
 * relying on the JSX to poke around inside subforms.
 */
export interface WiDecomeshTableRow {
  /** 1-based item number rendered as "Item No-1", "Item No-2", … */
  item: number
  /** "Mesh Type" line — Brand_Category for Cat_1_WI family, Brand_Selling_Name otherwise. No fallback. */
  meshType: string
  /** "Material" line — Material_Code on the `_2_0` row (falls back to the main row). */
  material: string
  /** "Sizes" line — "<dim1> mm x <dim2> mm" from the `_2_0` row's Invoice_Dimension_1 / _2 (falls back to Supply_Dimension_1 / _2). Empty when neither pair has data. */
  sizes: string
  /** "Quantity" line — "<Qty> <UOM_Billing>". */
  quantity: string
  /** "Total quantity" line — "<SQM> m²" when SQM has a value. */
  totalQuantity: string
  /** Numeric "Total Price". */
  totalPrice: number
  /** "Our price includes:" body — verbatim `Remarks` value, pre-wrap preserved by the caller. */
  remarks: string
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
  if (Array.isArray(v)) return v.filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
  if (typeof v === 'object') return [v as Record<string, unknown>]
  return []
}

/**
 * Family bundle carrying the three subform keys and the flag that toggles the
 * Cat_1_WI-special product-name source. Local — do not export.
 */
type FamilyBundle = {
  mainKey: string
  twoZeroKey: string
  isCat1Wi: boolean
  isFitments: boolean
}

/** Resolve the product family from the record's `Template` field. */
function resolveFamily(templateField: string): FamilyBundle {
  const F = WI_DECOMESH_ZOHO_FIELDS
  const t = templateField.trim().toLowerCase()
  if (t.includes('product fitment')) {
    return {
      mainKey: F.subformFitmentsMain,
      twoZeroKey: F.subformFitmentsTwoZero,
      isCat1Wi: false,
      isFitments: true,
    }
  }
  if (t.includes('category 2 mm database wmw') || t.includes('category 2 wmw')) {
    return {
      mainKey: F.subformCat2WmwMain,
      twoZeroKey: F.subformCat2WmwTwoZero,
      isCat1Wi: false,
      isFitments: false,
    }
  }
  if (t.includes('category 1 mm database wmw') || t.includes('category 1 wmw')) {
    return {
      mainKey: F.subformCat1WmwMain,
      twoZeroKey: F.subformCat1WmwTwoZero,
      isCat1Wi: false,
      isFitments: false,
    }
  }
  if (t.includes('category 2 mm database wi') || t.includes('category 2 wi')) {
    return {
      mainKey: F.subformCat2WiMain,
      twoZeroKey: F.subformCat2WiTwoZero,
      isCat1Wi: false,
      isFitments: false,
    }
  }
  // Default: Cat_1_WI
  return {
    mainKey: F.subformCat1WiMain,
    twoZeroKey: F.subformCat1WiTwoZero,
    isCat1Wi: true,
    isFitments: false,
  }
}

/** Match a row from `others` to the given row by `Line_Item_ref`, falling back to same-index. */
function matchByRef(
  others: Record<string, unknown>[],
  ref: string,
  index: number
): Record<string, unknown> | undefined {
  if (ref) {
    const found = others.find((r) => strVal(r.Line_Item_ref) === ref)
    if (found) return found
  }
  return others[index]
}

function buildSizes(row20: Record<string, unknown>, mainRow: Record<string, unknown> | undefined): string {
  const F = WI_DECOMESH_ZOHO_FIELDS
  const pick = (primary: string, alt: string): string => {
    const fromRow = strVal(row20[primary]) || strVal(row20[alt])
    if (fromRow) return fromRow
    if (!mainRow) return ''
    return strVal(mainRow[primary]) || strVal(mainRow[alt])
  }
  const dim1 = pick(F.itemInvoiceDimension1, F.itemSupplyDimension1)
  const dim2 = pick(F.itemInvoiceDimension2, F.itemSupplyDimension2)
  if (!dim1 && !dim2) return ''
  if (!dim2) return `${dim1} mm`
  if (!dim1) return `${dim2} mm`
  return `${dim1} mm x ${dim2} mm`
}

function buildQuantity(row20: Record<string, unknown>, mainRow: Record<string, unknown> | undefined): string {
  const F = WI_DECOMESH_ZOHO_FIELDS
  const qty = strVal(row20[F.itemQty]) || strVal(row20[F.itemPieces]) ||
    (mainRow ? strVal(mainRow[F.itemQty]) || strVal(mainRow[F.itemPieces]) : '')
  if (!qty) return ''
  const uom = strVal(row20[F.itemUomBilling]) || (mainRow ? strVal(mainRow[F.itemUomBilling]) : '')
  return uom ? `${qty} ${uom}` : qty
}

function buildTotalQuantity(row20: Record<string, unknown>): string {
  const F = WI_DECOMESH_ZOHO_FIELDS
  const sqm = strVal(row20[F.itemSqm])
  if (!sqm) return ''
  return `${sqm} m²`
}

function totalPriceFromRow(row20: Record<string, unknown>, mainRow: Record<string, unknown> | undefined): number {
  const F = WI_DECOMESH_ZOHO_FIELDS
  const fromRow =
    numFromString(row20[F.itemNetSellingAmount]) ||
    numFromString(row20[F.itemTotalSaleValue]) ||
    numFromString(row20[F.itemGrossAmount])
  if (fromRow) return fromRow
  if (!mainRow) return 0
  return (
    numFromString(mainRow[F.itemNetSellingAmount]) ||
    numFromString(mainRow[F.itemTotalSaleValue]) ||
    numFromString(mainRow[F.itemGrossAmount])
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Public builder — the only export the component consumes for line items
// ──────────────────────────────────────────────────────────────────────────

/**
 * Build the WI Decomesh per-item blocks from a raw Zoho quotation record.
 * Resolves the family from the record's `Template` field, then reads the
 * matching main + `_2_0` subforms and joins them by `Line_Item_ref`.
 *
 * Empty when the resolved subform has no rows (falls back to
 * `fallbackLineItems` in that case, minimally shaped).
 */
export function buildWiDecomeshTableRows(
  raw: Record<string, unknown> | null | undefined,
  fallbackLineItems: QuotationLineItem[] = []
): WiDecomeshTableRow[] {
  const F = WI_DECOMESH_ZOHO_FIELDS
  if (!raw) return fallbackFromLineItems(fallbackLineItems)
  const template = strVal(raw[F.template])
  const bundle = resolveFamily(template)
  const twoZeroRows = subformRows(raw, bundle.twoZeroKey)
  const mainRows = subformRows(raw, bundle.mainKey)
  const rows = twoZeroRows.length > 0 ? twoZeroRows : mainRows
  if (rows.length === 0) return fallbackFromLineItems(fallbackLineItems)
  return rows.map((row, index) => {
    const ref = strVal(row.Line_Item_ref)
    const otherPool = twoZeroRows.length > 0 ? mainRows : twoZeroRows
    const otherRow = matchByRef(otherPool, ref, index)
    // For a two-zero-primary record: `row` is the _2_0 row, `otherRow` is the main row.
    // For a main-primary record (no _2_0): `row` is the main row, no other.
    const row20 = twoZeroRows.length > 0 ? row : (otherRow ?? row)
    const mainRow = twoZeroRows.length > 0 ? otherRow : row
    // Mesh Type — Brand_Category for Cat_1_WI family, Brand_Selling_Name for the rest.
    const meshType = bundle.isCat1Wi
      ? strVal(mainRow?.[F.itemBrandCategory])
      : strVal(mainRow?.[F.itemBrandSellingName]) || strVal(row20?.[F.itemBrandSellingName])
    const material = strVal(row20?.[F.itemMaterialCode]) || strVal(mainRow?.[F.itemMaterialCode])
    const sizes = buildSizes(row20 ?? {}, mainRow)
    const quantity = buildQuantity(row20 ?? {}, mainRow)
    const totalQuantity = buildTotalQuantity(row20 ?? {})
    const totalPrice = totalPriceFromRow(row20 ?? {}, mainRow)
    const remarks = strVal(row20?.[F.itemRemarks]) || strVal(mainRow?.[F.itemRemarks])
    return {
      item: index + 1,
      meshType,
      material,
      sizes,
      quantity,
      totalQuantity,
      totalPrice,
      remarks,
    }
  })
}

function fallbackFromLineItems(items: QuotationLineItem[]): WiDecomeshTableRow[] {
  return items.map((item, index) => ({
    item: index + 1,
    meshType: (item.product ?? '').trim(),
    material: (item.quality ?? '').trim(),
    sizes: '',
    quantity: `${(item.qty ?? '').trim()}${item.uom ? ` ${item.uom}` : ''}`.trim(),
    totalQuantity: '',
    totalPrice: numFromString(item.amount),
    remarks: '',
  }))
}
