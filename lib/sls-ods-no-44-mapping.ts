/**
 * sls-ods-no-44 — ISOLATED Zoho field mapping for the Sales Order Detail
 * Sheet at /sales-order/sls-ods-no-44/[id].
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  DEVELOPER ISOLATION NOTE
 * ─────────────────────────────────────────────────────────────────────────
 * This file is a from-scratch mapping layer for sls-ods-no-44 ONLY. It does
 * NOT touch `app/components/sales-order/types.ts` or
 * `app/components/sales-order/OrderDetailSheetContent.tsx`, which the other
 * 6 Order Detail Sheet variants (bvk, sls-ods-44-hydrotech, sls-ods-no-44-p,
 * sls-ods-44-p-hydrotech, sls-ods-50-a, sls-ods-50-p) still depend on
 * unchanged. Consumed only by `SlsOdsNo44Content.tsx` and
 * `app/sales-order/sls-ods-no-44/[id]/page.tsx`.
 *
 * Data source: Zoho Creator report `Sales_Order_Report` (app
 * `machine-master2`, owner `bvkinfrasoftservicespvtltd`), fetched via
 * `/api/zoho-sales-order-report`.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  FIELD MAPPING — confirmed against real payload (record 238786000008248088,
 *  Template = "Category 1 WI") on 2026-08-18. Fields with no confident match
 *  in that payload are flagged inline — verify before trusting them blindly.
 * ─────────────────────────────────────────────────────────────────────────
 */

// ──────────────────────────────────────────────────────────────────────────
// Zoho API field name registry
// ──────────────────────────────────────────────────────────────────────────
export const SLS_ODS_NO_44_ZOHO_FIELDS = {
  name: 'Name',
  template: 'Template',
  currency: 'Currency',
  /**
   * ODS DATE — root `ODS_DATE` (confirmed field name; NOT `Created_Date_and_time`).
   * Shared by every form that shows this value: sls-ods-no-44's "ODS DATE" row,
   * sls-ods-no-44-p (same mapSlsOdsNo44 pipeline), and argo-multi-ao's "Date:" row.
   */
  odsDate: 'ODS_DATE',
  /** REMARKS section — root `Remarks` (distinct from `Workflow[0].Remarks`, which feeds Billing Description). */
  rootRemarks: 'Remarks',

  // Customer Name — no literal "Client Name" field on this report; closest
  // real match is the linked CRM account's business name.
  customerName: 'Bussiness_Account', // read via Account_Module.Bussiness_Account
  /**
   * Application (per-line column) — sourced from a SECOND Zoho report, NOT
   * this sales order record. Flow: read the sales order's linked
   * `Account_Module.ID`, search the `All_Account_Modules` report for that ID
   * (via /api/zoho-account-module-report), then read that matched record's
   * `application` field (confirmed lowercase — NOT `Application`). The same
   * resolved value is applied to every line item (one lookup for the whole
   * document, not per-line).
   */
  accountModuleId: 'ID',
  accountModuleApplication: 'application',

  // Billing (was "Invoice") address
  billingAddressName: 'Billing_Address_Name',
  billingStreet: 'Billing_Street',
  billingCity: 'Billing_City',
  billingState: 'Billing_State',
  billingPostalCode: 'Billing_Postal_Code',
  billingCountry: 'Billing_Country',
  billingGst: 'Billing_GST_No',

  // Shipping (was "Delivery") address
  shippingAddressName: 'Shipping_Address_Name',
  shippingStreet: 'Shipping_Street',
  shippingCity: 'Shipping_City',
  shippingState: 'Shipping_State',
  shippingPostalCode: 'Shipping_Postal_Code',
  shippingCountry: 'Shipping_Country',
  shippingGst: 'Shipping_GST_No',

  /**
   * Confirmed field name — column label is "Client PO No.". Per-line field
   * on the `_3_0` subform (Category_1/2_MM_Database_WI_3_0), NOT root-level
   * — each line item has its own value.
   */
  clientPoNo: 'Client_PO_No',
  /** Confirmed field name. Per-line, same `_3_0` subform as Client_PO_No. */
  poDate: 'PO_Date',
  /** Confirmed field name. Per-line, same `_3_0` subform as Client_PO_No. */
  qctNo: 'QCT_No',

  // Subform families (Category 1 / Category 2 WI triplet — same shape as quotations)
  cat1Product: 'Category_1_MM_Database_WI',
  cat1Line20: 'Category_1_MM_Database_WI_2_0',
  cat1Line30: 'Category_1_MM_Database_WI_3_0',
  cat2Product: 'Category_2_MM_Database_WI',
  cat2Line20: 'Category_2_MM_Database_WI_2_0',
  cat2Line30: 'Category_2_MM_Database_WI_3_0',

  lineItemRef: 'Line_Item_ref',

  // Per-line fields
  productGroup: 'Product_Group',
  productCode: 'Product_Code',
  /**
   * Billing Description = Brand Selling Name + Remarks (computed once per
   * document, not per line — see `resolveBillingDescription`).
   * Brand Selling Name is normally `Brand_Selling_Name` (confirmed correct
   * on Category_2_MM_Database_WI). EXCEPTION: on Category_1_MM_Database_WI
   * that field is mislabeled — the actual field link name there is
   * `Brand_Category`. Applies ONLY to Category_1_MM_Database_WI.
   */
  brandCategoryAsSellingName: 'Brand_Category',
  brandSellingName: 'Brand_Selling_Name',
  /** Remarks for Billing Description — root `Workflow[0].Remarks`, NOT the per-line WI_2_0/_3_0 Remarks. */
  workflowSubform: 'Workflow',
  workflowRemarks: 'Remarks',
  /** SAP No — read-only from Zoho, no manual entry. */
  sapNo: 'SAP_No',
  hsnCode: 'HSN_Code',
  ppcDate: 'PPC_Committed_Date',
  invoiceDimension1AsLength: 'Invoice_Dimension_1',
  invoiceDimension2AsWidth: 'Invoice_Dimension_2',
  sqm: 'SQM',
  qty: 'Qty',
  uomBilling: 'UOM_Billing',
  sellingPrice: 'Selling_Price',
  totalSaleValue: 'Total_Sale_Value',
  grossAmount: 'Gross_Amount',
  netSellingAmount: 'Net_Selling_Amount',

  // Totals
  totalIgst: 'Total_IGST',
  totalCgst: 'Total_CGST',
  totalSgst: 'Total_SGST',
  totalCostBeforeTax: 'Total_Cost_Before_Tax',
  overallGrandTotal: 'Overall_Grand_Total_incl_Accessories',

  // Terms — confirmed field names
  destination: 'Destination',
  packingType: 'Packing_Type',
  documentsRequired: 'Document_Required',
  insurance: 'Insurance',
  incoterms: 'Delivery_Terms',
  dispatchMode: 'Mode_of_Delivery',
  // ROAD PERMIT and FREIGHT : TO PAY / PAID have no Zoho field given yet —
  // rows render with a blank value until a field name is confirmed.
} as const

const F = SLS_ODS_NO_44_ZOHO_FIELDS

// ──────────────────────────────────────────────────────────────────────────
// View model consumed by SlsOdsNo44Content.tsx
// ──────────────────────────────────────────────────────────────────────────
export interface SlsOdsNo44Line {
  productCode: string
  application: string
  billingDescription: string
  /** Read-only from Zoho — no manual entry / editable control for this field. */
  sapNo: string
  hsnCode: string
  ppcDate: string
  length: string
  width: string
  totalSqm: string
  qty: string
  uom: string
  price: string
  totalValue: string
  clientPoNo: string
  poDate: string
  qctNo: string
}

export interface SlsOdsNo44Data {
  /** Document control number — STATIC, never derived from Revision Number or any Zoho field. */
  docNo: string
  /** Revision Number — STATIC and independent of Document No. (changing one must never change the other). */
  docRev: string
  pageNo: string
  issueNo: string
  issueDate: string
  odsNo: string
  odsDate: string
  customerName: string
  productGroup: string
  billingAddressLines: string[]
  shippingAddressLines: string[]
  lines: SlsOdsNo44Line[]
  gstLabel: string
  gstAmount: string
  totalValue: string
  destination: string
  packingType: string
  documentsRequired: string
  insurance: string
  incoterms: string
  dispatchMode: string
  /** No Zoho field given yet — always blank until one is confirmed. */
  roadPermit: string
  /** No Zoho field given yet — always blank until one is confirmed. */
  freight: string
  remarks: string
  signerName: string
}

// ──────────────────────────────────────────────────────────────────────────
// Fixed document-control constants — this is a standardized company form,
// not per-record Zoho data. Document No. and Revision Number are two
// independent constants on purpose: editing one can never affect the other.
// ──────────────────────────────────────────────────────────────────────────
const DOCUMENT_NO = 'SALES-ODS-F-001'
const REVISION_NUMBER = '0'
const PAGE_NO = '1 of 1'
const ISSUE_NO = '2'
const ISSUE_DATE = '01.09.2019'

// ──────────────────────────────────────────────────────────────────────────
// Helpers
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

function subformRows(raw: Record<string, unknown> | null | undefined, key: string): Record<string, unknown>[] {
  const v = raw?.[key]
  if (v == null) return []
  if (Array.isArray(v)) return v.filter((r) => r != null && typeof r === 'object') as Record<string, unknown>[]
  if (typeof v === 'object') return [v as Record<string, unknown>]
  return []
}

function lineRef(row: Record<string, unknown>): string {
  return strVal(row[F.lineItemRef])
}

function resolveCategoryBundle(raw: Record<string, unknown> | null | undefined): {
  product: string
  line20: string
  line30: string
} {
  const t = strVal(raw?.[F.template]).toLowerCase()
  if (t.includes('category 2')) {
    return { product: F.cat2Product, line20: F.cat2Line20, line30: F.cat2Line30 }
  }
  return { product: F.cat1Product, line20: F.cat1Line20, line30: F.cat1Line30 }
}

function mergedLineRow(row20: Record<string, unknown>, rows30: Record<string, unknown>[], index: number): Record<string, unknown> {
  const ref = lineRef(row20)
  const row30 = (ref ? rows30.find((r) => lineRef(r) === ref) : undefined) ?? rows30[index] ?? {}
  return { ...row30, ...row20 }
}

function matchProductRow(productRows: Record<string, unknown>[], row20: Record<string, unknown>, index: number): Record<string, unknown> {
  const ref = lineRef(row20)
  return (ref ? productRows.find((r) => lineRef(r) === ref) : undefined) ?? productRows[index] ?? {}
}

function lineTotalFromRow(row: Record<string, unknown>): number {
  const gross = numFromString(row[F.grossAmount])
  if (gross !== 0) return gross
  const total = numFromString(row[F.totalSaleValue])
  if (total !== 0) return total
  return numFromString(row[F.netSellingAmount])
}

function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Drops the time portion from Zoho's "DD-Mon-YYYY HH:MM:SS" date-time fields (e.g. Created_Date_and_time). */
function dateOnly(v: string): string {
  return v.split(' ')[0] ?? v
}

function joinAddressLines(name: string, street: string, city: string, state: string, postal: string, country: string): string[] {
  const lines: string[] = []
  if (name) lines.push(name)
  if (street) lines.push(street)
  const cityStatePostal = [city, state, postal].filter(Boolean).join(', ')
  if (cityStatePostal) lines.push(cityStatePostal)
  if (country) lines.push(country)
  return lines
}

// ──────────────────────────────────────────────────────────────────────────
// Account Module lookup helpers (Application column — see field registry note)
// ──────────────────────────────────────────────────────────────────────────

/** The sales order's linked Account_Module.ID — search /api/zoho-account-module-report with this. */
export function accountModuleIdFromSalesOrder(raw: Record<string, unknown> | null | undefined): string {
  const accountModule = (raw?.Account_Module ?? {}) as Record<string, unknown>
  return strVal(accountModule[F.accountModuleId])
}

/** Reads `Application` off the matched All_Account_Modules record. */
export function applicationFromAccountModuleRecord(record: Record<string, unknown> | null | undefined): string {
  return strVal(record?.[F.accountModuleApplication])
}

// ──────────────────────────────────────────────────────────────────────────
// Public transform
// ──────────────────────────────────────────────────────────────────────────
/**
 * @param application Resolved once via `accountModuleIdFromSalesOrder` +
 * `applicationFromAccountModuleRecord` (a separate Zoho report lookup) and
 * applied to every line item — Application is not a per-line field.
 */
export function mapSlsOdsNo44(
  raw: Record<string, unknown> | null | undefined,
  application: string = ''
): SlsOdsNo44Data {
  if (!raw) {
    return {
      docNo: DOCUMENT_NO,
      docRev: REVISION_NUMBER,
      pageNo: PAGE_NO,
      issueNo: ISSUE_NO,
      issueDate: ISSUE_DATE,
      odsNo: '',
      odsDate: '',
      customerName: '',
      productGroup: '',
      billingAddressLines: [],
      shippingAddressLines: [],
      lines: [],
      gstLabel: 'GST',
      gstAmount: '',
      totalValue: '',
      destination: '',
      packingType: '',
      documentsRequired: '',
      insurance: '',
      incoterms: '',
      dispatchMode: '',
      roadPermit: '',
      freight: '',
      remarks: '',
      signerName: '',
    }
  }

  const accountModule = (raw.Account_Module ?? {}) as Record<string, unknown>
  const customerName = strVal(accountModule[F.customerName])

  const bundle = resolveCategoryBundle(raw)
  const isCategory1Wi = bundle.product === F.cat1Product
  const rows20 = subformRows(raw, bundle.line20)
  const rows30 = subformRows(raw, bundle.line30)
  const productRows = subformRows(raw, bundle.product)

  const productGroup = strVal(productRows[0]?.[F.productGroup])

  // Billing Description = Brand Selling Name + Remarks, computed ONCE for the
  // whole document (both source fields — Workflow[0].Remarks and the first
  // product row's brand field — are document-level, not per-line) and
  // applied to every line.
  const brandField = isCategory1Wi ? F.brandCategoryAsSellingName : F.brandSellingName
  const brandSellingName = strVal(productRows[0]?.[brandField])
  const workflowRows = subformRows(raw, F.workflowSubform)
  const workflowRemarks = strVal(workflowRows[0]?.[F.workflowRemarks])
  const billingDescription = [brandSellingName, workflowRemarks].filter(Boolean).join(' | ')

  const lines: SlsOdsNo44Line[] = rows20.map((row20, index) => {
    const merged = mergedLineRow(row20, rows30, index)
    const productRow = matchProductRow(productRows, row20, index)

    return {
      productCode: strVal(productRow[F.productCode]),
      application,
      billingDescription,
      sapNo: strVal(merged[F.sapNo]) || strVal(productRow[F.sapNo]),
      hsnCode: strVal(merged[F.hsnCode]) || strVal(productRow[F.hsnCode]),
      ppcDate: strVal(merged[F.ppcDate]),
      length: strVal(merged[F.invoiceDimension1AsLength]),
      width: strVal(merged[F.invoiceDimension2AsWidth]),
      totalSqm: strVal(merged[F.sqm]),
      qty: strVal(merged[F.qty]),
      uom: strVal(merged[F.uomBilling]),
      price: strVal(merged[F.sellingPrice]),
      totalValue: formatMoney(lineTotalFromRow(merged)),
      // Client_PO_No / PO_Date / QCT_No are per-line fields on the `_3_0`
      // subform (confirmed: each of the 5 sample rows has a distinct value —
      // PO19001..PO19005 / QCT-001..QCT-005), NOT root-level fields.
      clientPoNo: strVal(merged[F.clientPoNo]),
      poDate: strVal(merged[F.poDate]),
      qctNo: strVal(merged[F.qctNo]),
    }
  })

  const billingAddressLines = joinAddressLines(
    strVal(raw[F.billingAddressName]),
    strVal(raw[F.billingStreet]),
    strVal(raw[F.billingCity]),
    strVal(raw[F.billingState]),
    strVal(raw[F.billingPostalCode]),
    strVal(raw[F.billingCountry])
  )
  const shippingAddressLines = joinAddressLines(
    strVal(raw[F.shippingAddressName]),
    strVal(raw[F.shippingStreet]),
    strVal(raw[F.shippingCity]),
    strVal(raw[F.shippingState]),
    strVal(raw[F.shippingPostalCode]),
    strVal(raw[F.shippingCountry])
  )

  const igst = numFromString(raw[F.totalIgst])
  const cgst = numFromString(raw[F.totalCgst])
  const sgst = numFromString(raw[F.totalSgst])
  const gstAmount = igst || cgst + sgst
  const gstLabel = igst ? 'IGST' : cgst || sgst ? 'CGST + SGST' : 'GST'

  return {
    docNo: DOCUMENT_NO,
    docRev: REVISION_NUMBER,
    pageNo: PAGE_NO,
    issueNo: ISSUE_NO,
    issueDate: ISSUE_DATE,
    odsNo: strVal(raw[F.name]),
    odsDate: dateOnly(strVal(raw[F.odsDate])),
    customerName,
    productGroup,
    billingAddressLines,
    shippingAddressLines,
    lines,
    gstLabel,
    gstAmount: formatMoney(gstAmount),
    totalValue: formatMoney(numFromString(raw[F.overallGrandTotal])),
    destination: strVal(raw[F.destination]),
    packingType: strVal(raw[F.packingType]),
    documentsRequired: strVal(raw[F.documentsRequired]),
    insurance: strVal(raw[F.insurance]),
    incoterms: strVal(raw[F.incoterms]),
    dispatchMode: strVal(raw[F.dispatchMode]),
    roadPermit: '',
    freight: '',
    remarks: strVal(raw[F.rootRemarks]),
    signerName: '',
  }
}
