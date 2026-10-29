/**
 * sls-ods-0254 — ISOLATED Zoho field mapping for the Secondary Sales Order
 * Detail Sheet at /sales-order/sls-ods-0254/[id].
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  DEVELOPER ISOLATION NOTE
 * ─────────────────────────────────────────────────────────────────────────
 * From-scratch mapping layer, sls-ods-0254 ONLY. Does NOT touch
 * `app/components/sales-order/types.ts` or
 * `app/components/sales-order/SecondarySalesOdsContent.tsx`. Consumed only
 * by `SlsOds0254Content.tsx` and `app/sales-order/sls-ods-0254/[id]/page.tsx`.
 *
 * Data source: Zoho Creator report `Sales_Order_Report` (same report as
 * sls-ods-no-44/-p/argo-multi-ao) via `/api/zoho-sales-order-report`.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  SCOPE — only what's been explicitly mapped so far. Everything else
 *  (Order Details box, RNA block, checklist, Credit Limit Exceeded box,
 *  Remarks, Qty Total, System Timestamp, "Wire" wire-detail column) is
 *  intentionally left on the static fixture until mapped.
 *
 *  Wire Details now covers BOTH the WI family (Category 1/2 WI) and the
 *  WMW family (Category 1/2 WMW) — see the field registry's WMW section
 *  for the confirmed field names. "Unit" and "Values (INR)" are mapped for
 *  WMW only (blank for WI, no field confirmed yet there); Type/Len/Wid
 *  have no confirmed WMW field yet and stay blank for WMW.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const SLS_ODS_0254_ZOHO_FIELDS = {
  name: 'Name', // O.D.S
  createdDateTime: 'Created_Date_and_time', // O.D.S Date
  customerName: 'Bussiness_Account', // Client — read via Account_Module.Bussiness_Account

  template: 'Template',
  cat1Product: 'Category_1_MM_Database_WI',
  cat1Line20: 'Category_1_MM_Database_WI_2_0',
  cat1Line30: 'Category_1_MM_Database_WI_3_0',
  cat2Product: 'Category_2_MM_Database_WI',
  cat2Line20: 'Category_2_MM_Database_WI_2_0',
  cat2Line30: 'Category_2_MM_Database_WI_3_0',
  lineItemRef: 'Line_Item_ref',

  // WMW family — confirmed against real payload (record 238786000009134294,
  // Template = "Category 2 WMW") on 2026-10-29. Ref field is `Last_item_ref`
  // (NOT `Line_Item_ref`). Most per-line fields share the same literal API
  // name as the WI family (Qty, List_Price, Selling_Price,
  // Sales_Desired_Date, Material_Code, HSN_Code — all confirmed present on
  // Category_2_MM_Database_WMW_2_0/_3_0 in that record), so no separate
  // field constants are needed for those. Confirmed NOT present anywhere in
  // that payload (left blank for WMW, same as "Wire"/"Unit"/"Values (INR)"
  // are already left blank for WI): End_Type (Type), Invoice_Dimension_1/2
  // (Len/Wid).
  cat1ProductWmw: 'Category_1_MM_Database_WMW',
  cat1Line20Wmw: 'Category_1_MM_Database_WMW_2_0',
  cat1Line30Wmw: 'Category_1_MM_Database_WMW_3_0',
  cat2ProductWmw: 'Category_2_MM_Database_WMW',
  cat2Line20Wmw: 'Category_2_MM_Database_WMW_2_0',
  cat2Line30Wmw: 'Category_2_MM_Database_WMW_3_0',
  /** WMW subform ref field — distinct from `lineItemRef` (WI). */
  wmwLineItemRef: 'Last_item_ref',
  /**
   * WMW-only overrides, confirmed by the user directly — read from the
   * MAIN PRODUCT ROW (Category_1/2_MM_Database_WMW[i]), not the `_2_0`
   * subform like the WI family's `qty`/`listPrice`:
   *   QTY   -> Pieces
   *   Unit  -> UOM_Billing
   *   Std   -> List_Price (same field name as WI's `listPrice`, but read
   *            from the product row instead of `_2_0`)
   */
  wmwPieces: 'Pieces',
  wmwUomBilling: 'UOM_Billing',
  /** Total SQM column — WMW only, `Total_SQM` on the main product row (confirmed against record 238786000009134334, Template "Category 1 WMW"). */
  wmwTotalSqm: 'Total_SQM',
  /** Values (INR) for WMW — `Cost_After_Tax` on the `_3_0` subform. */
  wmwCostAfterTax: 'Cost_After_Tax',

  productCode: 'Product_Code', // Product Description (new column, replaces Item Name + Item Code)
  endType: 'End_Type', // Type
  invoiceDimension1AsLength: 'Invoice_Dimension_1', // Len
  invoiceDimension2AsWidth: 'Invoice_Dimension_2', // Wid
  qty: 'Qty', // QTY
  listPrice: 'List_Price', // Std
  sellingPrice: 'Selling_Price', // Agreed AND Billed (same field, both columns)
  /**
   * Brand — same Category_1_MM_Database_WI exception documented for
   * WI Process Febric / sls-ods-no-44: that subform's Brand Selling Name is
   * mislabeled `Brand_Category` in the API. Other subforms use `Brand_Selling_Name`.
   */
  brandCategoryAsSellingName: 'Brand_Category',
  brandSellingName: 'Brand_Selling_Name',
  salesDesiredDate: 'Sales_Desired_Date', // D.Date (WI)
  /** D.Date for WMW — `PPC_Committed_Date` on the `_3_0` subform. ISOLATED to WMW — does NOT replace `salesDesiredDate` for WI. */
  wmwPpcCommittedDate: 'PPC_Committed_Date',
  materialCode: 'Material_Code', // Quality
  hsnCode: 'HSN_Code', // HSN Code

  paymentTerms: 'Term_of_Payment',
  paymentMode: 'Method_of_Payment',
  packingCharges: 'Total_Packing_Charges',
  insurance: 'Insurance',
  destination: 'Destination',
  /** Total Amount — root field, same regardless of WI/WMW family. */
  totalAmount: 'Total_Cost_After_Tax_Grand_Total',
  /**
   * Transporter — root `Transporter_Names`, a Zoho lookup field (object),
   * not a plain string. Read via `zc_display_value`, the generic
   * human-readable field every lookup object in this report exposes (same
   * shape as `Account_Module`) — UNCONFIRMED against a populated sample
   * (empty `{}` on every record checked so far); verify once a record
   * actually has a transporter set.
   */
  transporterNames: 'Transporter_Names',
  /** Freight Charges — root field. */
  freightCharges: 'Total_Freight_Charges',
  /** Remarks (under Total Amount) — root field. */
  rootRemarks: 'Remarks',
  /**
   * Freight : To Pay / Paid — root `Delivery_Terms`. Value is a long
   * descriptive string (e.g. "EXW - Ex Works (insert place of delivery)");
   * only the short code before the first "-" is wanted, uppercased. No
   * "-" present → show the value as-is.
   */
  deliveryTerms: 'Delivery_Terms',
  /** GST No (top info strip) — root field, same regardless of WI/WMW family. */
  billingGstNo: 'Billing_GST_No',
  /** Credit Limit (top info strip) — root field, same regardless of WI/WMW family. */
  creditLimit: 'Credit_Limit',
  /** "Current Order" in the Credit Limit Exceeded box — root field, same regardless of WI/WMW family. */
  currentOrder: 'Total_Cost_After_Tax_Grand_Total',
} as const

const F = SLS_ODS_0254_ZOHO_FIELDS

export interface Sls0254WireRow {
  sno: string
  /** Replaces the old Item Name + Item Code columns. */
  productDescription: string
  /** Not mapped yet. */
  wire: string
  type: string
  len: string
  wid: string
  qty: string
  /** WMW only — `UOM_Billing` on the main product row. Blank for WI (no field yet). */
  unit: string
  priceStd: string
  priceAgreed: string
  priceBilled: string
  brand: string
  dDate: string
  quality: string
  /** WMW only — `Cost_After_Tax` on the `_3_0` subform. Blank for WI (no field yet). */
  valuesInr: string
  hsnCode: string
  /** WMW only — `Total_SQM` on the main product row. Blank for WI (no field yet). */
  totalSqm: string
}

export interface Sls0254Data {
  odsNo: string
  odsDate: string
  clientName: string
  wireDetails: Sls0254WireRow[]
  paymentTerms: string
  paymentMode: string
  packingCharges: string
  insurance: string
  destination: string
  totalAmount: string
  /** Sum of every line's Total SQM (WMW only — WI lines contribute 0, since Total SQM has no WI field yet). */
  qtyTotal: string
  transporter: string
  freightCharges: string
  /** Remarks shown under Total Amount — root `Remarks`. */
  remarks: string
  /** "Freight : To Pay / Paid" — short code before the first "-" in `Delivery_Terms`, uppercased. */
  freightToPayPaid: string
  /** GST No (top info strip) — root `Billing_GST_No`. */
  gstNo: string
  /** Credit Limit (top info strip) — root `Credit_Limit`. */
  creditLimit: string
  /** "Current Order" in the Credit Limit Exceeded box — root `Total_Cost_Before_Tax`. */
  currentOrder: string
}

function strVal(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}

function subformRows(raw: Record<string, unknown> | null | undefined, key: string): Record<string, unknown>[] {
  const v = raw?.[key]
  if (v == null) return []
  if (Array.isArray(v)) return v.filter((r) => r != null && typeof r === 'object') as Record<string, unknown>[]
  if (typeof v === 'object') return [v as Record<string, unknown>]
  return []
}

/** Checks both WI (`Line_Item_ref`) and WMW (`Last_item_ref`) ref field names — a row only ever has one of the two. */
function lineRef(row: Record<string, unknown>): string {
  return strVal(row[F.lineItemRef] ?? row[F.wmwLineItemRef])
}

function resolveCategoryBundle(raw: Record<string, unknown> | null | undefined): {
  product: string
  line20: string
  line30: string
  isWmw: boolean
  isCategory1: boolean
} {
  const t = strVal(raw?.[F.template]).toLowerCase()
  const isWmw = t.includes('wmw')
  const isCategory1 = !t.includes('category 2')
  if (isWmw) {
    return isCategory1
      ? { product: F.cat1ProductWmw, line20: F.cat1Line20Wmw, line30: F.cat1Line30Wmw, isWmw: true, isCategory1: true }
      : { product: F.cat2ProductWmw, line20: F.cat2Line20Wmw, line30: F.cat2Line30Wmw, isWmw: true, isCategory1: false }
  }
  return isCategory1
    ? { product: F.cat1Product, line20: F.cat1Line20, line30: F.cat1Line30, isWmw: false, isCategory1: true }
    : { product: F.cat2Product, line20: F.cat2Line20, line30: F.cat2Line30, isWmw: false, isCategory1: false }
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

/**
 * Maps only the fields specified so far. `raw` is the raw Zoho
 * Sales_Order_Report record; returns undefined-safe strings throughout.
 */
export function mapSls0254(raw: Record<string, unknown> | null | undefined): Sls0254Data {
  if (!raw) {
    return {
      odsNo: '',
      odsDate: '',
      clientName: '',
      wireDetails: [],
      paymentTerms: '',
      paymentMode: '',
      packingCharges: '',
      insurance: '',
      destination: '',
      totalAmount: '',
      qtyTotal: '',
      transporter: '',
      freightCharges: '',
      remarks: '',
      freightToPayPaid: '',
      gstNo: '',
      creditLimit: '',
      currentOrder: '',
    }
  }

  const accountModule = (raw.Account_Module ?? {}) as Record<string, unknown>
  const clientName = strVal(accountModule[F.customerName])
  const transporterNames = (raw[F.transporterNames] ?? {}) as Record<string, unknown>
  const transporter = strVal(transporterNames.zc_display_value)

  const deliveryTermsRaw = strVal(raw[F.deliveryTerms])
  const deliveryTermsDashIdx = deliveryTermsRaw.indexOf('-')
  const freightToPayPaid = (
    deliveryTermsDashIdx >= 0 ? deliveryTermsRaw.slice(0, deliveryTermsDashIdx) : deliveryTermsRaw
  ).trim()
  const freightToPayPaidFinal = deliveryTermsDashIdx >= 0 ? freightToPayPaid.toUpperCase() : freightToPayPaid

  const bundle = resolveCategoryBundle(raw)
  const rows20 = subformRows(raw, bundle.line20)
  const rows30 = subformRows(raw, bundle.line30)
  const productRows = subformRows(raw, bundle.product)
  // Category 1 WI's Brand Selling Name is mislabeled `Brand_Category` in
  // the API — that exception applies ONLY to Category 1 WI, not WMW.
  const brandField = !bundle.isWmw && bundle.isCategory1 ? F.brandCategoryAsSellingName : F.brandSellingName

  const wireDetails: Sls0254WireRow[] = rows20.map((row20, index) => {
    const merged = mergedLineRow(row20, rows30, index)
    const productRow = matchProductRow(productRows, row20, index)

    return {
      sno: String(index + 1),
      // Product_Code on the main product row — same field/source for both
      // WI and WMW (WMW confirmed against record 238786000009134334).
      productDescription: strVal(productRow[F.productCode]),
      wire: '',
      type: strVal(merged[F.endType]) || strVal(productRow[F.endType]),
      len: strVal(merged[F.invoiceDimension1AsLength]),
      wid: strVal(merged[F.invoiceDimension2AsWidth]),
      // QTY/Unit/Std — WMW reads these off the MAIN PRODUCT ROW
      // (Pieces/UOM_Billing/List_Price), confirmed by spec; WI keeps its
      // existing `_2_0`-based Qty/List_Price (Unit has no WI field yet).
      qty: bundle.isWmw ? strVal(productRow[F.wmwPieces]) : strVal(merged[F.qty]),
      unit: bundle.isWmw ? strVal(productRow[F.wmwUomBilling]) : '',
      priceStd: bundle.isWmw ? strVal(productRow[F.listPrice]) : strVal(merged[F.listPrice]),
      priceAgreed: strVal(merged[F.sellingPrice]),
      priceBilled: strVal(merged[F.sellingPrice]),
      brand: strVal(productRow[brandField]) || strVal(merged[brandField]),
      dDate: bundle.isWmw ? strVal(merged[F.wmwPpcCommittedDate]) : strVal(merged[F.salesDesiredDate]),
      quality: strVal(merged[F.materialCode]),
      // Values (INR) — WMW only, from the `_3_0` subform.
      valuesInr: bundle.isWmw ? strVal(merged[F.wmwCostAfterTax]) : '',
      hsnCode: strVal(merged[F.hsnCode]),
      // Total SQM — WMW only, from the main product row.
      totalSqm: bundle.isWmw ? strVal(productRow[F.wmwTotalSqm]) : '',
    }
  })

  // Qty Total — sum of every line's Total SQM (WI lines contribute 0, since
  // Total SQM has no confirmed WI field yet). Rounded to 4 decimals to
  // avoid floating-point artifacts, trailing zeros stripped.
  const qtyTotalSum = wireDetails.reduce((sum, row) => {
    const n = parseFloat(row.totalSqm)
    return sum + (Number.isFinite(n) ? n : 0)
  }, 0)
  const qtyTotal = qtyTotalSum ? String(Number(qtyTotalSum.toFixed(4))) : ''

  return {
    odsNo: strVal(raw[F.name]),
    odsDate: strVal(raw[F.createdDateTime]).split(' ')[0] ?? '',
    clientName,
    wireDetails,
    paymentTerms: strVal(raw[F.paymentTerms]),
    paymentMode: strVal(raw[F.paymentMode]),
    packingCharges: strVal(raw[F.packingCharges]),
    insurance: strVal(raw[F.insurance]),
    destination: strVal(raw[F.destination]),
    qtyTotal,
    totalAmount: strVal(raw[F.totalAmount]),
    transporter,
    freightCharges: strVal(raw[F.freightCharges]),
    remarks: strVal(raw[F.rootRemarks]),
    freightToPayPaid: freightToPayPaidFinal,
    gstNo: strVal(raw[F.billingGstNo]),
    creditLimit: strVal(raw[F.creditLimit]),
    currentOrder: strVal(raw[F.currentOrder]),
  }
}
