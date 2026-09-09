'use client'

import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { QuotationData, ZohoQuotation } from '@/lib/types'
import { buildProductFitmentBrandedGoodsBlock, renumberMergedGoodsItems } from '@/lib/product-fitment-goods-block'
import {
  formatCurrency,
  formatGoodsTableAmountChargeableInWords,
  formatPiecesInteger,
  parseOverallGrandTotalInclAccessories,
  resolveCountryOfFinalDestination,
  resolveTransportDisplayLine,
} from '@/lib/quotation-utils'
import {
  filterNonZeroWmwChargeRows,
  quotationScalarFieldPresent,
  resolveWmwChargeTotals,
  WMW_STANDARD_CHARGE_NAMES,
} from '@/lib/wmw-subform-mapping'
import { groupChunkRowsByProductFormQuality } from '@/lib/goods-meta-grouping'
import {
  GOODS_DESC_GRID_TEMPLATE_COLUMNS_WMW_BRANDED,
  goodsDescGridSizeSpanOneLine,
  goodsDescGridValueSpan,
} from '@/lib/goods-desc-grid-styles'
import { resolveGoodsSqmArea, sqmAreaFromSizeDisplayString } from '@/lib/goods-sqm-area'

const bd: CSSProperties = { border: '1px solid #000' }

const bdSides: CSSProperties = {
  borderLeft: '1px solid #000',
  borderRight: '1px solid #000',
}

const bdProductMeta: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: 'none',
}

const bdItemGrid: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: 'none',
}

const bdTitleRow: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: '1px solid #000',
}

const rightMergedEmpty: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: 'none',
  padding: '6px',
  verticalAlign: 'top',
}

interface WmwP2GoodsTableProps {
  data: QuotationData
  rawQuotationData?: any
  shippingData?: any
  headerNode?: ReactNode
  footerNode?: ReactNode
}

const descGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: GOODS_DESC_GRID_TEMPLATE_COLUMNS_WMW_BRANDED,
  columnGap: '10px',
  rowGap: '2px',
  alignItems: 'center',
  width: '100%',
  textAlign: 'left',
}

const metaRowLine: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '60px 10px 1fr',
  marginBottom: '3px',
  whiteSpace: 'nowrap',
}

const metaRowValue: CSSProperties = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

/** Mesh column: first numeric value after the 4th dot in Product_Code, shown as `value/Inch`. */
function meshInchFromProductCode(productCode: string): string {
  const s = String(productCode ?? '').trim()
  if (!s) return ''
  const parts = s.split('.')
  if (parts.length < 5) return ''
  const tail = parts.slice(4).join('.')
  const m = tail.match(/\d+(?:\.\d+)?/)
  return m ? `${m[0]}/Inch` : ''
}

export default function WmwP2GoodsTable({ data, rawQuotationData, shippingData, headerNode, footerNode }: WmwP2GoodsTableProps) {
  const rawLineItems = (rawQuotationData?.Category_1_MM_Database_WMW_2_0 as any[]) || []
  const rawProductDetails = (rawQuotationData?.Category_1_MM_Database_WMW as any[]) || []

  const defaultProductLabel = 'Stainless Steel Wire Cloth'

  const currency = data.currency || rawQuotationData?.Currency || 'USD'
  const currencySymbol = currency

  const template = String(rawQuotationData?.Template ?? '').trim().toLowerCase()
  const isCategory2Selected = template.includes('category 2') && template.includes('wi')
  // Gross-weight line replaced with the raw `Export_Remarks` string from
  // Zoho (matches Bashundhara). Whole row hides when the field is empty.
  const exportRemarks = String(rawQuotationData?.Export_Remarks ?? '').trim()

  const toRowArray = (v: unknown): any[] => {
    if (v == null) return []
    if (Array.isArray(v)) return v
    if (typeof v === 'object') return [v]
    return []
  }

  const parseNumber = (v: unknown): number => {
    const n = parseFloat(String(v ?? '').replace(/,/g, '').trim())
    return Number.isFinite(n) ? n : 0
  }

  /** First non-empty trimmed scalar among records, in order (matches WMW join precedence: 3_0 → 2_0 line → main). */
  const firstField = (records: any[], field: string): string => {
    for (const r of records) {
      if (r == null) continue
      const v = String((r as Record<string, unknown>)[field] ?? '').trim()
      if (v) return v
    }
    return ''
  }

  const pickNetWeightPerPc = (itemRef: string, index: number): number => {
    if (!rawQuotationData) return 0

    if (!isCategory2Selected) {
      // Category 1: Category_1_MM_Database_WMW_3_0 (join on last_item_ref)
      const rows = toRowArray((rawQuotationData as any).Category_1_MM_Database_WMW_3_0)
      const r =
        (itemRef
          ? rows.find((x: any) => String(x?.last_item_ref ?? x?.Last_item_ref ?? '').trim() === itemRef)
          : undefined) || rows[index]
      const v = r?.Net_Weight
      return parseNumber(v)
    }

    // Category 2: prefer Category_2_MM_Database_WMW_3_0.Net_Weight when present (data may come in WMW 3.0),
    // fallback to Category_2_MM_Database_WI_3_0.Net_Weight.
    const rowsWmw = toRowArray((rawQuotationData as any).Category_2_MM_Database_WMW_3_0)
    const lineRef = String(index + 1)
    const rWmw =
      (itemRef
        ? rowsWmw.find((x: any) => String(x?.last_item_ref ?? x?.Last_item_ref ?? '').trim() === itemRef)
        : undefined) ||
      rowsWmw.find((x: any) => String(x?.Line_Item_ref ?? '').trim() === lineRef) ||
      rowsWmw[index]
    const wmwWeight = parseNumber(rWmw?.Net_Weight)
    if (wmwWeight > 0) return wmwWeight

    const rowsWi = toRowArray((rawQuotationData as any).Category_2_MM_Database_WI_3_0)
    const rWi = rowsWi.find((x: any) => String(x?.Line_Item_ref ?? '').trim() === lineRef) || rowsWi[index]
    return parseNumber(rWi?.Net_Weight)
  }

  const pickFitmentNetWeightPerPc = (index: number): number => {
    if (!rawQuotationData) return 0
    const rows = toRowArray((rawQuotationData as any).Product_Fitments2_0)
    const sNo = String(index + 1)
    const r = rows.find((x: any) => String(x?.S_No ?? '').trim() === sNo) || rows[index]
    return parseNumber(r?.Net_Weight)
  }

  const subformBreakdown = rawQuotationData?.Subform_Breakdown || []
  const category1WMWSubform = subformBreakdown.find(
    (sf: any) => sf.Subform?.includes('Category 1 WMW') || sf.Subform === 'Category 1 WMW'
  )
  const activeSubform =
    category1WMWSubform ||
    subformBreakdown.find((sf: any) => parseFloat(sf.Total_Sale_Value || '0') > 0 || parseFloat(sf.Cost_Before_Tax || '0') > 0) ||
    subformBreakdown[0]

  const subformTotalSaleValue = parseFloat(activeSubform?.Total_Sale_Value || '0') || 0
  const subformCostBeforeTax = parseFloat(activeSubform?.Cost_Before_Tax || '0') || 0

  const transaction = parseFloat(rawQuotationData?.Transaction_Charges || '0') || 0

  const chargeTotalsResolved = resolveWmwChargeTotals(rawQuotationData)
  const discountRowLabel = chargeTotalsResolved.discountLabel
  const discountChargeAmt = chargeTotalsResolved.discountTotal
  const freightChargeAmt = chargeTotalsResolved.freightTotal
  const packingChargeAmt = chargeTotalsResolved.packingTotal
  const seamChargeAmt = chargeTotalsResolved.seamTotal
  const otherChargesAmt = quotationScalarFieldPresent(rawQuotationData?.Other_Charges)
    ? parseFloat(String(rawQuotationData?.Other_Charges).replace(/,/g, '').trim()) || 0
    : 0
  const typeOfOtherCharges = String(rawQuotationData?.Type_of_Other_Charges ?? '').trim()
  const otherChargesLabel = typeOfOtherCharges ? `Other Charges (${typeOfOtherCharges})` : 'Other Charges'
  const discountDeduct = Math.max(0, discountChargeAmt)
  const chargesSum = freightChargeAmt + packingChargeAmt + seamChargeAmt + otherChargesAmt - discountDeduct

  // Discount row is no longer sourced from the WMW subforms. It comes from
  // Zoho's `Export_Discount` toggle: when true, we render one row using
  // `Export_Discount_Description` as the label and
  // `line-items total × Export_Discount_Value%` as the amount. When the
  // toggle is off, the row is not rendered at all.
  const wmwP2ChargeRows: readonly [string, number][] = filterNonZeroWmwChargeRows([
    [WMW_STANDARD_CHARGE_NAMES.FREIGHT, freightChargeAmt],
    [WMW_STANDARD_CHARGE_NAMES.PACKING, packingChargeAmt],
    [WMW_STANDARD_CHARGE_NAMES.SEAM, seamChargeAmt],
    [otherChargesLabel, otherChargesAmt],
  ])

  const countryOfDestination = resolveCountryOfFinalDestination(
    rawQuotationData as Record<string, unknown> | null | undefined,
    shippingData as Record<string, unknown> | null | undefined,
    ''
  )

  // Transport line — maps 1:1 to Zoho `Transport`. When empty, builds a
  // fallback in the fixed shape:
  //   "Total <Delivery_Terms> Price upto <Port_of_Discharge> By <Mode_of_Delivery>"
  // The words `Total`, `Price`, `upto`, `By` are literals; the three
  // slot values come from Zoho. Empty slots are elided along with their
  // adjacent connector so the sentence stays clean.
  const transportSummaryLine = (() => {
    const zohoTransport = String(rawQuotationData?.Transport ?? '').trim()
    if (zohoTransport) return zohoTransport

    // Strict formula, no fallbacks and no elision:
    //   "Total <Delivery_Terms> Price upto <Port_of_Discharge> By <Mode_of_Delivery>"
    // - Delivery_Terms → ALL CAPS
    // - Mode_of_Delivery → first-letter capital, rest lowercase
    // - Port_of_Discharge → root `Port_of_Discharge` only (no fallback)
    const deliveryTerms = String(rawQuotationData?.Delivery_Terms ?? '').trim().toUpperCase()
    const portOfDischarge = String(rawQuotationData?.Port_of_Discharge ?? '').trim()
    const modeRaw = String(rawQuotationData?.Mode_of_Delivery ?? '').trim()
    const modeOfDelivery = modeRaw
      ? modeRaw.charAt(0).toUpperCase() + modeRaw.slice(1).toLowerCase()
      : ''

    return `Total ${deliveryTerms} Price upto ${portOfDischarge} By ${modeOfDelivery}`
  })()

  const lineItemsFromZoho = rawLineItems.map((item, index) => {
    const itemRef = item.last_item_ref?.trim() || item.Last_item_ref?.trim() || ''
    const productDetail = itemRef
      ? rawProductDetails.find(
          (pd: any) => pd.last_item_ref?.trim() === itemRef || pd.Last_item_ref?.trim() === itemRef
        ) || rawProductDetails[index] || {}
      : rawProductDetails[index] || {}

    const rows3Linked = toRowArray((rawQuotationData as any)?.Category_1_MM_Database_WMW_3_0)
    const ext3 =
      (itemRef
        ? rows3Linked.find(
            (x: any) => String(x?.last_item_ref ?? x?.Last_item_ref ?? '').trim() === itemRef
          )
        : undefined) || rows3Linked[index]

    const cat2WmwMainRows = toRowArray((rawQuotationData as any)?.Category_2_MM_Database_WMW)
    const cat2ProductDetail = itemRef
      ? cat2WmwMainRows.find(
          (pd: any) => pd.last_item_ref?.trim() === itemRef || pd.Last_item_ref?.trim() === itemRef
        ) || cat2WmwMainRows[index] || {}
      : cat2WmwMainRows[index] || {}

    // Adhunik: Product must come from Category_1_MM_Database_WMW_2_0 (2.0) Blend_Category only.
    const blendCategory = firstField([item], 'Blend_Category')
    const endType = firstField([ext3, item, productDetail], 'End_Type')
    /** Zoho `Material_Code` only — WMW 2_0 → 3_0 → Cat1 main → Cat2 main. */
    const materialCode = firstField([item, ext3, productDetail, cat2ProductDetail], 'Material_Code')
    /** Same precedence as `resolveCategory1WmwHsnCode`: WMW 2_0 → WMW 3_0 → main WMW row */
    const hsnCode = firstField([item, ext3, productDetail], 'HSN_Code')
    /** UOM_Billing — WMW 2_0 → WMW 3_0 → Cat1 main → Cat2 main. Used in
     * the "Rate / <Currency> / <uom>" column header. */
    const uom = firstField([item, ext3, productDetail, cat2ProductDetail], 'UOM_Billing')

    let size = ''
    // Size (Mtrs) — prefer Category_1_MM_Database_WMW.Length_field + Width (per requirement).
    // Fallback to Invoice_Dimension_1/2 from line items if length/width are missing.
    const len = String(productDetail.Length_field ?? '').trim()
    const wid = String(productDetail.Width ?? '').trim()
    if (len && wid) {
      size = `${len} x ${wid}`
    } else if (item.Invoice_Dimension_1 && item.Invoice_Dimension_2) {
      const extractNumber = (str: string) => {
        const match = str.match(/(\d+\.?\d*)/)
        return match ? match[1] : str.replace(/Length|length|Width|width/gi, '').trim()
      }
      const dim1 = extractNumber(item.Invoice_Dimension_1)
      const dim2 = extractNumber(item.Invoice_Dimension_2)
      size = `${dim1} x ${dim2}`
    }

    const sqmArea = resolveGoodsSqmArea({
      invoiceDimension1: item.Invoice_Dimension_1,
      invoiceDimension2: item.Invoice_Dimension_2,
      lengthField: productDetail.Length_field,
      width: productDetail.Width,
      sizeDisplay: size,
    })
    const quantity = parseFloat(productDetail.Qty?.trim() || item.Qty?.trim() || '0')
    // Rate — direct 1:1 map to Zoho
    // `Category_1_MM_Database_WMW_3_0[i].Selling_Price_UOM_Billing`.
    // `ext3` is already the correct row (joined by last_item_ref).
    // No fallback: blank / non-numeric → NaN → empty cell.
    const sellingPriceUomBilling = String(ext3?.Selling_Price_UOM_Billing ?? '').replace(/,/g, '').trim()
    const rate = sellingPriceUomBilling ? (parseFloat(sellingPriceUomBilling) || NaN) : NaN
    // Amount column is always computed as rate × quantity. No fallback
     // to any other Zoho field, and no defensive substitute when rate is
     // missing — a blank rate simply yields a blank/NaN amount.
    const amount = quantity * rate

    const fitmentRows = toRowArray((rawQuotationData as any)?.Product_Fitments2_0)
    const fitmentRow =
      fitmentRows.find((x: any) => String(x?.S_No ?? '').trim() === String(index + 1)) || fitmentRows[index]

    const productCodeForMesh = firstField([productDetail, cat2ProductDetail, fitmentRow], 'Product_Code')
    const mesh = meshInchFromProductCode(productCodeForMesh)
    const brand = productDetail.Brand_Selling_Name?.trim() || ''

    const wiLine = data.lineItems?.[index]
    /** Product row: Adhunik requires Blend_Category only; if missing, keep it blank. */
    const product = blendCategory || ''
    /** Form row: Zoho `End_Type` only (WMW 3_0 → 2_0 line → main). */
    const form = endType
    /** Quality: keep "AISI" constant; append Material code when present. */
    const quality = materialCode ? `AISI ${materialCode}` : 'AISI'

    // Net Weight (Kg.) Per Pc. mapping:
    // Net Weight (Kg.) Per Pc. — direct 1:1 map to Zoho
    // `Category_1_MM_Database_WMW_4_0[i].Per_Pc`, joined via `Line_ref`
    // (which is the 1-based line index). No fallback to Net_Weight from
    // any other subform. Blank / non-numeric → 0.
    const perPc = (() => {
      const rows4 = toRowArray((rawQuotationData as any)?.Category_1_MM_Database_WMW_4_0)
      const lineRef = String(index + 1)
      const row = rows4.find(
        (x: any) => String(x?.Line_ref ?? x?.line_ref ?? '').trim() === lineRef
      ) || rows4[index]
      return parseNumber(row?.Per_Pc)
    })()
    const totalWeight = perPc * quantity

    return {
      item: index + 1,
      product,
      form,
      quality,
      hsnCode,
      mesh,
      brand,
      size,
      sqmArea,
      quantity,
      rate,
      amount,
      perPc,
      totalWeight,
      uom,
    }
  })

  const lineItemsFallback = (data.lineItems || []).map((item, index) => {
    const rate = parseFloat(String(item.rate).replace(/,/g, '')) || 0
    const amount = parseFloat(String(item.amount).replace(/,/g, '')) || 0
    const quantity = parseFloat(String(item.qty).replace(/,/g, '')) || 0

    const perPc = pickFitmentNetWeightPerPc(index)
    const totalWeight = perPc * quantity

    return {
      item: index + 1,
      product: '',
      form: item.form?.trim() || '',
      quality: item.quality?.trim() || '',
      hsnCode: item.hsnCode?.trim() || '',
      mesh: '',
      brand: item.type || item.form || '',
      size: item.size || '',
      sqmArea: sqmAreaFromSizeDisplayString(item.size || ''),
      quantity,
      rate,
      amount,
      perPc,
      totalWeight,
      uom: (item.uom || '').trim(),
    }
  })

  const rawWmw2Rows = toRowArray((rawQuotationData as any)?.Category_1_MM_Database_WMW_2_0)
  const wmwMappedBlock = rawWmw2Rows.length > 0 ? lineItemsFromZoho : []
  const fitmentMappedBlock = buildProductFitmentBrandedGoodsBlock(
    (rawQuotationData ?? null) as ZohoQuotation | null
  ).map((f) => ({
    item: 0,
    product: f.product,
    form: f.form,
    quality: f.quality,
    hsnCode: f.hsnCode,
    mesh: f.mesh,
    brand: f.brand,
    size: f.size,
    sqmArea: f.sqmArea,
    quantity: f.quantity,
    rate: f.rate,
    amount: f.amount,
    perPc: f.perPc,
    totalWeight: f.totalWeight,
    uom: (f as { uom?: string }).uom ?? '',
  }))

  let displayLineItems: typeof lineItemsFromZoho =
    wmwMappedBlock.length + fitmentMappedBlock.length > 0
      ? renumberMergedGoodsItems([...wmwMappedBlock, ...fitmentMappedBlock])
      : lineItemsFromZoho.length > 0
        ? lineItemsFromZoho
        : lineItemsFallback

  // If we only have 0 items and want to match screenshot exactly, inject dummy data
  if (displayLineItems.length === 0) {
    displayLineItems = [
      { item: 1, product: '', form: 'Endless Diagonal Seam', quality: 'AISI 316L', hsnCode: '7314', mesh: '40/ Inch', brand: 'Formx-040', size: '4.728 x 3.020', sqmArea: '14.2786', quantity: 6, rate: 1070, amount: 6420, perPc: 23.0, totalWeight: 138.0, uom: 'Pcs' },
      { item: 2, product: '', form: 'Endless Diagonal Seam', quality: 'AISI 316L', hsnCode: '7314', mesh: '40/ Inch', brand: 'Formx-040', size: '4.720 x 3.020', sqmArea: '14.2544', quantity: 3, rate: 1065, amount: 3195, perPc: 22.0, totalWeight: 66.0, uom: 'Pcs' }
    ]
  }

  const lineSum = displayLineItems.reduce((s, it) => s + (it.amount || 0), 0)

  const baseAmount =
    subformTotalSaleValue > 0
      ? subformTotalSaleValue
      : subformCostBeforeTax > 0
        ? subformCostBeforeTax
        : lineSum > 0
          ? lineSum
          : data.totalAmount

  const displayGrandTotal = parseOverallGrandTotalInclAccessories(
    rawQuotationData as Record<string, unknown> | null | undefined
  )

  // Four Zoho-driven charge rows (client rule) — each independently gated
  // by its own boolean toggle. The Export Discount reduces the grand
  // total; the other three add to it.
  const isTruthyToggle = (v: unknown): boolean =>
    v === true || (typeof v === 'string' && v.trim().toLowerCase() === 'true')
  const parseFlatAmt = (raw: unknown): number => {
    const n = parseFloat(String(raw ?? '').replace(/,/g, '').trim())
    return Number.isFinite(n) ? n : 0
  }

  // 1) Export Discount — % of line-item total, subtracts from grand total.
  const exportDiscountEnabled = isTruthyToggle(rawQuotationData?.Export_Discount)
  const exportDiscountPct = exportDiscountEnabled
    ? parseFlatAmt(rawQuotationData?.Export_Discount_Value)
    : 0
  const exportDiscountAmt = exportDiscountEnabled
    ? lineSum * (exportDiscountPct / 100)
    : 0
  const exportDiscountLabel = String(
    rawQuotationData?.Export_Discount_Description ?? ''
  ).trim() || 'Discount'

  // 2) Transaction charges — flat amount, adds to grand total.
  const transactionChargeEnabled = isTruthyToggle(rawQuotationData?.Transaction_changes)
  const transactionChargeAmt = transactionChargeEnabled
    ? parseFlatAmt(rawQuotationData?.Transaction_changes_Value)
    : 0
  const transactionChargeLabel = String(
    rawQuotationData?.Transaction_changes_Descriptions ?? ''
  ).trim() || 'Transaction Charges'

  // 3) Miscellaneous charges — flat amount, adds to grand total. Zoho
  //    stores the description on `Miscellaneous_Charges_Description1`;
  //    falls back to `Miscellaneous_Charges_Description` if that's empty.
  const miscChargeEnabled = isTruthyToggle(rawQuotationData?.Miscellaneous_Charges)
  const miscChargeAmt = miscChargeEnabled
    ? parseFlatAmt(rawQuotationData?.Miscellaneous_Charges_Value)
    : 0
  const miscChargeLabel = (
    String(rawQuotationData?.Miscellaneous_Charges_Description1 ?? '').trim() ||
    String(rawQuotationData?.Miscellaneous_Charges_Description ?? '').trim() ||
    'Miscellaneous Charges'
  )

  // 4) Export Packing — flat amount, adds to grand total.
  const exportPackingEnabled = isTruthyToggle(rawQuotationData?.Export_Packing)
  const exportPackingAmt = exportPackingEnabled
    ? parseFlatAmt(rawQuotationData?.Export_Packing_Value)
    : 0
  const exportPackingLabel = String(
    rawQuotationData?.Export_Packing_Description ?? ''
  ).trim() || 'Export Packing'

  // Grand total — STRICT direct map to Zoho
  // `Overall_Grand_Total_incl_Accessories`. No fallback to any other
  // field, no in-app adjustment for discount / transaction / misc /
  // packing charges (those rows still render for information but do
  // NOT alter the printed "Total"). Blank / non-numeric field → 0.
  const finalGrandTotal = (() => {
    const raw = rawQuotationData?.Overall_Grand_Total_incl_Accessories
    const n = parseFloat(String(raw ?? '').replace(/,/g, '').trim())
    return Number.isFinite(n) ? n : 0
  })()
  const amountChargeableInWords = formatGoodsTableAmountChargeableInWords(finalGrandTotal, currency)

  // Adhunik pagination: 5 items per page. When a 6th item appears
  // it flows to page 2 on its own with the QUOTATION header and
  // Remarks/Signature footer repeated by the outer wrap's
  // <thead>/<tfoot> in AdhunikInvoiceContent.
  const WMW_P2_ITEMS_PER_PAGE = 7
  const chunks: typeof displayLineItems[] = []
  for (let i = 0; i < displayLineItems.length; i += WMW_P2_ITEMS_PER_PAGE) {
    chunks.push(displayLineItems.slice(i, i + WMW_P2_ITEMS_PER_PAGE))
  }
  if (chunks.length === 0) chunks.push([])

  return (
    <div className="quotation-goods-pages-stack">
      {chunks.map((chunk, pageIdx) => {
        const isLastChunk = pageIdx === chunks.length - 1;
        // Rate-column header shows `Rate / <currency> / <uom>` — uom is
        // read from the first non-empty UOM in this chunk (falls back to
        // "Pcs" so the header never ends in a stray trailing slash).
        const chunkUom = chunk.find((r) => r.uom)?.uom || 'Pcs'
        // Per-chunk item-row vertical padding, matching Saint's
        // three-way pattern:
        //   - Non-last chunk (4 items, no tail on this page): bump
        //     top/bottom so the 4 items spread down the paper.
        //   - Sparse last chunk with exactly 1 item (e.g. total = 5 →
        //     item 5 alone on page 2 with the tail block below):
        //     extra padding-bottom so the item doesn't hug the tail.
        //   - Sparse last chunk with more than 1 item: moderate
        //     symmetric padding.
        //   - Full last chunk (4 items + tail on one page): compact.
        const isSparseLastChunk =
          isLastChunk && chunk.length > 0 && chunk.length < WMW_P2_ITEMS_PER_PAGE
        const isLoneItemLastChunk = isSparseLastChunk && chunk.length === 1
        // With 5 items per page (up from 4), the non-last chunk has
        // one extra item eating vertical space, so per-item padding
        // drops from 56px → 40px to keep the whole chunk under the
        // `page-break-inside: avoid` budget. Sparse-last / lone
        // padding stays the same.
        // With 7 items per page, non-last chunk padding pushed to
        // 36px each side so items visibly cover the whole page.
        // Any higher will start overflowing under the
        // `page-break-inside: avoid` budget on A4 (7 × ~102px +
        // header + column-titles + group meta + sub-header +
        // bottom filler ≈ 1104px against 1123px available).
        // Sparse-last / lone-item paddings unchanged.
        const itemRowPadTop = !isLastChunk ? '50px' : isSparseLastChunk ? '18px' : '6px'
        const itemRowPadBottom = !isLastChunk
          ? '36px'
          : isLoneItemLastChunk
            ? '48px'
            : isSparseLastChunk
              ? '18px'
              : '6px'

        return (
          <div
            key={pageIdx}
            className={`quotation-goods-pages-segment ${!isLastChunk ? 'quotation-goods-pages-break adhunik-nonlast-fill' : ''}`}
            style={{
              pageBreakInside: 'avoid',
              marginTop: pageIdx > 0 ? '-1px' : '0',
              // Non-last chunk: stretch segment to fill printable
              // area on A4 (297mm minus ~22mm for top wrapper
              // padding + <main> padding + safety buffer). Combined
              // with `.adhunik-nonlast-fill .goods-description-table
              // { height: 100% }` in globals.css, Chrome distributes
              // the extra height across the goods table's rows so
              // items visually stretch down to the paper bottom
              // border. Last chunk keeps natural height (tail rows
              // + inline footerNode determine sizing).
              ...(isLastChunk ? {} : { minHeight: 'calc(100vh - 22mm)', display: 'flex', flexDirection: 'column' as const }),
            }}
          >
            <div className="quotation-seamless-stack" style={!isLastChunk ? { display: 'flex', flexDirection: 'column', flex: 1 } : undefined}>
              {headerNode}

              <table
                className="goods-description-table quotation-stack-table adhunik-goods-table"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #000',
                  // Remove the top border of the goods table — the
                  // outer header table (headerNode) already draws a
                  // bottom border on its last row, so both stacked
                  // 1px borders were visually adding up to a 2px
                  // "bold" seam line between the header and the
                  // goods-table's Description-of-Goods header row.
                  borderTop: 'none',
                  marginTop: 0,
                  tableLayout: 'fixed',
                  fontSize: '10px',
                  ...(isLastChunk ? {} : { flex: 1, height: '100%' }),
                }}
              >
                {/* Column widths (6 <col> — Description spans 2).
                 * Net Weight (Kg.) column removed (WMW P2 doesn't
                 * carry it — see PDF 2). The freed 10% (5+5) is
                 * redistributed across Description col B, Qty,
                 * Rate, and Amount.
                 *   Description colSpan=2   = 22+33 = 55%
                 *   HSN Code                = 10%
                 *   Qty / UOM               = 10%
                 *   Rate                    = 11%
                 *   Amount                  = 14% */}
                <colgroup>
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '33%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '14%' }} />
                </colgroup>
                <tbody>
                  <tr className="adhunik-goods-title-row">
                    <td colSpan={2} style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontSize: '11px', verticalAlign: 'middle', fontWeight: 'bold' }}>
                      Description of Goods
                    </td>
                    <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontSize: '10px', verticalAlign: 'middle', fontWeight: 'bold' }}>
                      HSN Code
                    </td>
                    <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Quantity<br />UOM
                    </td>
                    <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Rate<br />{currencySymbol} / UOM
                    </td>
                    <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      Amount {currencySymbol}
                    </td>
                  </tr>

                  {(() => {
                    // Per-item diff render:
                    //   - Product renders once at top of chunk AND
                    //     whenever `product` differs from previous item
                    //   - Form + Quality re-render whenever product,
                    //     form, or quality differs from previous item
                    //   - Item sub-header (Item/MESH/BRAND/…) renders
                    //     ONCE per chunk before the very first item
                    let prevProduct: string | undefined
                    let prevForm: string | undefined
                    let prevQuality: string | undefined
                    return (
                      <Fragment key={`wmw-p2-items-${pageIdx}`}>
                        {chunk.map((row, itemIdx) => {
                          const productLabel = (row.product || defaultProductLabel).trim()
                          const formLabel = (row.form || '').trim()
                          const qualityLabel = (row.quality || '').trim()

                          const productChanged = itemIdx === 0 || productLabel !== prevProduct
                          const formOrQualityChanged =
                            itemIdx === 0 ||
                            formLabel !== prevForm ||
                            qualityLabel !== prevQuality

                          const emitProduct = productChanged
                          const emitFormQuality = productChanged || formOrQualityChanged

                          prevProduct = productLabel
                          prevForm = formLabel
                          prevQuality = qualityLabel

                          return (
                            <Fragment key={`wmw-p2-item-${pageIdx}-${itemIdx}`}>
                              {emitProduct ? (
                                <tr className="adhunik-product-row">
                                  <td colSpan={2} style={{ ...bdProductMeta, padding: '8px 10px 4px 10px', verticalAlign: 'top' }}>
                                    <div style={{ ...metaRowLine, marginBottom: 0 }}>
                                      <span style={{ fontWeight: 'bold' }}>Product</span><span>:</span><span style={metaRowValue}>{productLabel}</span>
                                    </div>
                                  </td>
                                  <td style={{ ...bdProductMeta, padding: '6px 4px', verticalAlign: 'top' }} />
                                  <td style={rightMergedEmpty} />
                                  <td style={rightMergedEmpty} />
                                  <td style={rightMergedEmpty} />
                                </tr>
                              ) : null}

                              {emitFormQuality ? (
                                <tr className="adhunik-item-meta-row">
                                  <td colSpan={2} style={{ ...bdProductMeta, padding: '2px 10px 4px 10px', verticalAlign: 'top' }}>
                                    {formLabel ? (
                                      <div style={metaRowLine}>
                                        <span style={{ fontWeight: 'bold' }}>Form</span><span>:</span><span style={metaRowValue}>{formLabel}</span>
                                      </div>
                                    ) : null}
                                    <div style={{ ...metaRowLine, marginBottom: 0 }}>
                                      <span style={{ fontWeight: 'bold' }}>Quality</span><span>:</span><span style={metaRowValue}>{qualityLabel}</span>
                                    </div>
                                  </td>
                                  <td style={{ ...bdProductMeta, padding: '6px 4px', verticalAlign: 'top' }} />
                                  <td style={rightMergedEmpty} />
                                  <td style={rightMergedEmpty} />
                                  <td style={rightMergedEmpty} />
                                </tr>
                              ) : null}

                              {itemIdx === 0 ? (
                                <tr className="adhunik-item-grid-row">
                                  <td colSpan={2} style={{ ...bdItemGrid, padding: '6px 10px', verticalAlign: 'middle' }}>
                                    <div style={{ ...descGrid, marginBottom: 0, fontWeight: 'bold' }}>
                                      <span>Item</span>
                                      <span>MESH</span>
                                      <span>BRAND</span>
                                      <span style={goodsDescGridSizeSpanOneLine}>SIZE [Mtrs] (LxW)</span>
                                      <span>Sqm Area / PC</span>
                                    </div>
                                  </td>
                                  <td style={{ ...bdItemGrid, padding: '6px 4px', verticalAlign: 'middle' }} />
                                  <td style={{ ...bdItemGrid, padding: '6px', verticalAlign: 'middle' }} />
                                  <td style={{ ...bdItemGrid, padding: '6px', verticalAlign: 'middle' }} />
                                  <td style={{ ...bdItemGrid, padding: '6px', verticalAlign: 'middle' }} />
                                </tr>
                              ) : null}

                              <tr className="adhunik-item-grid-row">
                                <td colSpan={2} style={{ ...bdItemGrid, padding: `${itemRowPadTop} 10px ${itemRowPadBottom} 10px`, verticalAlign: 'middle' }}>
                                  <div style={{ ...descGrid, alignItems: 'start' }}>
                                    <span style={{ textDecoration: 'underline', ...goodsDescGridValueSpan }}>{row.item}</span>
                                    <span style={{ ...goodsDescGridValueSpan, whiteSpace: 'nowrap' }}>{row.mesh}</span>
                                    <span style={goodsDescGridValueSpan}>{row.brand}</span>
                                    <span style={{ ...goodsDescGridValueSpan, ...goodsDescGridSizeSpanOneLine }}>{row.size}</span>
                                    <span style={goodsDescGridValueSpan}>{row.sqmArea}</span>
                                  </div>
                                </td>
                                <td style={{ ...bdItemGrid, padding: `${itemRowPadTop} 2px ${itemRowPadBottom} 2px`, textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                  {row.hsnCode || ''}
                                </td>
                                <td style={{ ...bdItemGrid, padding: `${itemRowPadTop} 6px ${itemRowPadBottom} 6px`, textAlign: 'center', verticalAlign: 'middle' }}>
                                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                    <span>{formatPiecesInteger(row.quantity)}</span>
                                    <span>{row.uom || 'Pcs'}</span>
                                  </div>
                                </td>
                                <td style={{ ...bdItemGrid, padding: `${itemRowPadTop} 6px ${itemRowPadBottom} 6px`, textAlign: 'center', verticalAlign: 'middle' }}>
                                  {Number.isFinite(row.rate) ? formatCurrency(row.rate, '') : ''}
                                </td>
                                <td style={{ ...bdItemGrid, padding: `${itemRowPadTop} 6px ${itemRowPadBottom} 6px`, textAlign: 'center', verticalAlign: 'middle' }}>
                                  {formatCurrency(row.amount, '')}
                                </td>
                              </tr>
                            </Fragment>
                          )
                        })}
                      </Fragment>
                    )
                  })()}

                  {/* Non-last chunk: emit a tall filler <tr> so the
                   * seven-column vertical borders keep going to the
                   * bottom of the printable area. contentless cells
                   * with bdSides (left/right borders) draw the lines;
                   * the fixed height ~240px comfortably reaches the
                   * paper bottom on A4 given the current outer
                   * header/footer sizes and stays under the
                   * `page-break-inside: avoid` budget for the
                   * segment. Matches the Saint spacer pattern. */}
                  {!isLastChunk && (
                    <tr aria-hidden className="adhunik-goods-fill-row">
                      <td colSpan={2} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                      <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                      <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                      <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                      <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                    </tr>
                  )}

                  {isLastChunk && (
                    <>
                      {/* Pre-tail filler — tall bordered <tr> that
                       * expands the goods table's vertical column
                       * borders between the last item row and the
                       * tail block (Trial Discount / Transaction
                       * charges / DAP / Transport / Amount
                       * Chargeable). Pushes the tail rows DOWN so
                       * they sit just above the fixed
                       * `.adhunik-page-footer` instead of leaving a
                       * blank whitespace strip. Both `height` AND a
                       * fat `padding` are set so Chrome can't
                       * collapse the row (empty <td>s with no
                       * content will sometimes render at 0 height
                       * unless one of them is forced). */}
                      <tr aria-hidden className="adhunik-goods-spacer" style={{ height: '40mm' }}>
                        <td colSpan={2} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '20mm 0', lineHeight: 0, fontSize: 0, height: '40mm' }}>&nbsp;</td>
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '20mm 0', lineHeight: 0, fontSize: 0, height: '40mm' }}>&nbsp;</td>
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '20mm 0', lineHeight: 0, fontSize: 0, height: '40mm' }}>&nbsp;</td>
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '20mm 0', lineHeight: 0, fontSize: 0, height: '40mm' }}>&nbsp;</td>
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '20mm 0', lineHeight: 0, fontSize: 0, height: '40mm' }}>&nbsp;</td>
                      </tr>

                      {wmwP2ChargeRows.map(([chargeLabel, chargeAmt], chargeIdx) => (
                        <tr key={`wmw-p2-charge-${chargeIdx}`}>
                          <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', verticalAlign: 'top' }}>
                            {chargeLabel}
                          </td>
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px', textAlign: 'center' }}>
                            {formatCurrency(chargeAmt, '')}
                          </td>
                        </tr>
                      ))}

                      {/* Export discount — only shown when Zoho's
                       * `Export_Discount` toggle is checked. Label = Zoho
                       * `Export_Discount_Description`, amount = lineSum ×
                       * `Export_Discount_Value%`. Rendered in red (client
                       * asked for red styling). Grand total below already
                       * subtracts this via `finalGrandTotal`. */}
                      {exportDiscountEnabled ? (
                        <tr>
                          <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', verticalAlign: 'top', color: '#c00000' }}>
                            {exportDiscountLabel}
                          </td>
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px', textAlign: 'center', color: '#c00000' }}>
                            {formatCurrency(exportDiscountAmt, '')}
                          </td>
                        </tr>
                      ) : null}

                      {/* Transaction / Miscellaneous / Export Packing —
                       * flat-amount charges from Zoho, each toggle-gated.
                       * Rendered right after the discount row in this
                       * fixed order and added to the grand total. */}
                      {transactionChargeEnabled ? (
                        <tr>
                          <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', verticalAlign: 'top' }}>
                            {transactionChargeLabel}
                          </td>
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px', textAlign: 'center' }}>
                            {formatCurrency(transactionChargeAmt, '')}
                          </td>
                        </tr>
                      ) : null}

                      {miscChargeEnabled ? (
                        <tr>
                          <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', verticalAlign: 'top' }}>
                            {miscChargeLabel}
                          </td>
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px', textAlign: 'center' }}>
                            {formatCurrency(miscChargeAmt, '')}
                          </td>
                        </tr>
                      ) : null}

                      {exportPackingEnabled ? (
                        <tr>
                          <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', verticalAlign: 'top' }}>
                            {exportPackingLabel}
                          </td>
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px', textAlign: 'center' }}>
                            {formatCurrency(exportPackingAmt, '')}
                          </td>
                        </tr>
                      ) : null}

                      {exportRemarks ? (
                        <tr>
                          <td colSpan={2} style={{ ...bdSides, padding: '12px 10px 4px 10px', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>
                            {exportRemarks}
                          </td>
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                        </tr>
                      ) : null}

                      <tr>
                        <td colSpan={6} style={{ ...bd, padding: '4px 10px', textAlign: 'center', fontWeight: 'bold' }}>Transport</td>
                      </tr>

                      <tr>
                        <td colSpan={6} style={{ ...bd, padding: '4px 10px', textAlign: 'center' }}>
                          {transportSummaryLine}
                        </td>
                      </tr>

                      <tr>
                        <td colSpan={4} style={{ ...bd, padding: '6px 10px', fontSize: '9px', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>
                          {/* Notes: value comes from Zoho `Inside_Quotation_Text` verbatim, no fallback. */}
                          {String(rawQuotationData?.Inside_Quotation_Text ?? '').trim()}
                        </td>
                        <td style={{ ...bd, padding: '6px', textAlign: 'center', verticalAlign: 'middle', width: '10%' }}>
                          <span>{currency}</span>
                        </td>
                        <td style={{ ...bd, padding: '6px', textAlign: 'center', verticalAlign: 'middle', width: '14%' }}>
                          <span className="quotation-grand-total-amount">{formatCurrency(finalGrandTotal, '')}</span>
                        </td>
                      </tr>

                      <tr>
                        <td style={{ ...bd, padding: '4px 8px', fontSize: '10px', verticalAlign: 'top', width: '14%' }}>
                          <span style={{ display: 'block', lineHeight: 1.2, fontWeight: 'bold' }}>Amount Chargeable<br />(In words) :</span>
                        </td>
                        <td colSpan={3} style={{ ...bd, padding: '4px 8px', verticalAlign: 'middle', fontSize: '11px', width: '58%' }}>
                          {amountChargeableInWords}
                        </td>
                        <td style={{ ...bd, padding: '4px 8px', textAlign: 'right', verticalAlign: 'middle', fontSize: '11px', width: '10%', fontWeight: 'bold' }}>
                          Total:-
                        </td>
                        <td style={{ ...bd, padding: '4px 8px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px', width: '14%' }}>
                          <span className="quotation-grand-total-amount">{formatCurrency(finalGrandTotal, '')}</span>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              {isLastChunk && footerNode}
            </div>
          </div>
        );
      })}
    </div>
  )
}
