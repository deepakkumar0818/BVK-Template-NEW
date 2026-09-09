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
 *  Remarks, Total Amount, Qty Total, System Timestamp, "Wire" and "Unit"
 *  wire-detail columns) is intentionally left on the static fixture until
 *  mapped.
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
  salesDesiredDate: 'Sales_Desired_Date', // D.Date
  materialCode: 'Material_Code', // Quality
  hsnCode: 'HSN_Code', // HSN Code

  paymentTerms: 'Term_of_Payment',
  paymentMode: 'Method_of_Payment',
  packingCharges: 'Total_Packing_Charges',
  insurance: 'Insurance',
  destination: 'Destination',
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
  /** Not mapped yet. */
  unit: string
  priceStd: string
  priceAgreed: string
  priceBilled: string
  brand: string
  dDate: string
  quality: string
  /** Not mapped yet. */
  valuesInr: string
  hsnCode: string
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
    }
  }

  const accountModule = (raw.Account_Module ?? {}) as Record<string, unknown>
  const clientName = strVal(accountModule[F.customerName])

  const bundle = resolveCategoryBundle(raw)
  const isCategory1Wi = bundle.product === F.cat1Product
  const rows20 = subformRows(raw, bundle.line20)
  const rows30 = subformRows(raw, bundle.line30)
  const productRows = subformRows(raw, bundle.product)
  const brandField = isCategory1Wi ? F.brandCategoryAsSellingName : F.brandSellingName

  const wireDetails: Sls0254WireRow[] = rows20.map((row20, index) => {
    const merged = mergedLineRow(row20, rows30, index)
    const productRow = matchProductRow(productRows, row20, index)

    return {
      sno: String(index + 1),
      productDescription: strVal(productRow[F.productCode]),
      wire: '',
      type: strVal(merged[F.endType]) || strVal(productRow[F.endType]),
      len: strVal(merged[F.invoiceDimension1AsLength]),
      wid: strVal(merged[F.invoiceDimension2AsWidth]),
      qty: strVal(merged[F.qty]),
      unit: '',
      priceStd: strVal(merged[F.listPrice]),
      priceAgreed: strVal(merged[F.sellingPrice]),
      priceBilled: strVal(merged[F.sellingPrice]),
      brand: strVal(productRow[brandField]) || strVal(merged[brandField]),
      dDate: strVal(merged[F.salesDesiredDate]),
      quality: strVal(merged[F.materialCode]),
      valuesInr: '',
      hsnCode: strVal(merged[F.hsnCode]),
    }
  })

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
  }
}
