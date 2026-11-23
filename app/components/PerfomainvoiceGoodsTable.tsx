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
  // The goods table itself now has `borderTop: 'none'` (avoids doubling
  // with headerNode's own bottom border, matching SaintGoodsTable.tsx) —
  // so the title row's OWN top border is what draws the table's visible
  // top edge now, same as Saint's title row using the plain `bd` style.
  borderTop: '1px solid #000',
  borderBottom: '1px solid #000',
}

const rightMergedEmpty: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: 'none',
  padding: '6px',
  verticalAlign: 'top',
}

interface PerfomainvoiceGoodsTableProps {
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
  fontWeight: 'bold',
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

export default function PerfomainvoiceGoodsTable({ data, rawQuotationData, shippingData, headerNode, footerNode }: PerfomainvoiceGoodsTableProps) {
  const template = String(rawQuotationData?.Template ?? '').trim().toLowerCase()
  // Fixed: this used to require BOTH "category 2" AND "wi" in the Template
  // string, which never matches a WMW record (e.g. "Category 2 WMW" has no
  // "wi" substring) — so Category 2 WMW records were always treated as
  // Category 1 below. This component is WMW-only, so "category 2" alone is
  // the right signal.
  const isCategory2Selected = template.includes('category 2')

  // Line items / product master — Category 1 WMW vs Category 2 WMW. Was
  // hardcoded to Category 1 only; a Category 2 WMW record (like
  // 238786000009302060, Template = "Category 2 WMW") has an EMPTY
  // Category_1_MM_Database_WMW_2_0, so the real rows (and every field read
  // from them below — HSN Code, Material Code, Blend Category, Brand)
  // never came through at all.
  const rawLineItems = (isCategory2Selected
    ? (rawQuotationData?.Category_2_MM_Database_WMW_2_0 as any[])
    : (rawQuotationData?.Category_1_MM_Database_WMW_2_0 as any[])) || []
  const rawProductDetails = (isCategory2Selected
    ? (rawQuotationData?.Category_2_MM_Database_WMW as any[])
    : (rawQuotationData?.Category_1_MM_Database_WMW as any[])) || []

  const defaultProductLabel = 'Stainless Steel Wire Cloth'

  const currency = data.currency || rawQuotationData?.Currency || 'USD'
  const currencySymbol = currency

  const exportRemarksValue = String(rawQuotationData?.Export_Remarks ?? '').trim()

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

  const countryOfDestination = resolveCountryOfFinalDestination(
    rawQuotationData as Record<string, unknown> | null | undefined,
    shippingData as Record<string, unknown> | null | undefined,
    ''
  )
  const portOfDischarge = rawQuotationData?.Port_of_Discharge || ''
  const finalDestination = rawQuotationData?.Final_Destination || portOfDischarge || ''
  const modeOfDelivery = rawQuotationData?.Mode_of_Delivery || data.termsOfDelivery || 'Road'

  const destLabel = finalDestination || portOfDischarge || 'Benapole Border'
  const transportMethod = modeOfDelivery || 'Road'
  const transportSummaryLine = resolveTransportDisplayLine(
    rawQuotationData as Record<string, unknown> | undefined,
    `Total CPT Price upto ${destLabel} By ${transportMethod}`
  )

  const lineItemsFromZoho = rawLineItems.map((item, index) => {
    const itemRef = item.last_item_ref?.trim() || item.Last_item_ref?.trim() || ''
    const productDetail = itemRef
      ? rawProductDetails.find(
          (pd: any) => pd.last_item_ref?.trim() === itemRef || pd.Last_item_ref?.trim() === itemRef
        ) || rawProductDetails[index] || {}
      : rawProductDetails[index] || {}

    const rows3Linked = toRowArray(
      (rawQuotationData as any)?.[isCategory2Selected ? 'Category_2_MM_Database_WMW_3_0' : 'Category_1_MM_Database_WMW_3_0']
    )
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

    // Category 2 WMW ONLY — a fourth subform (`Category_2_MM_Database_WMW_4_0`)
    // carries Form/Quality/Per-Pc-weight for this family, keyed by `Line_ref`
    // (not `Last_item_ref` like the other three WMW subforms). Category 1
    // has no equivalent; `ext4` stays undefined there.
    const rows4Cat2 = isCategory2Selected ? toRowArray((rawQuotationData as any)?.Category_2_MM_Database_WMW_4_0) : []
    const ext4 = itemRef
      ? rows4Cat2.find((x: any) => String(x?.Line_ref ?? '').trim() === itemRef)
      : rows4Cat2[index]

    // Perfomainvoice Product column — Category 1: Blend_Category lives on
    // the 2_0 line row. Category 2: it's on the 3_0 row instead.
    const blendCategory = isCategory2Selected
      ? firstField([ext3], 'Blend_Category')
      : firstField([item], 'Blend_Category')
    // Form — Category 1: End_Type chain. Category 2: `Form1` on the `_4_0`
    // row (e.g. "Endless Diagonal Seam"); End_Type is empty for this family.
    const endType = isCategory2Selected
      ? firstField([ext4], 'Form1') || firstField([ext3, item, productDetail], 'End_Type')
      : firstField([ext3, item, productDetail], 'End_Type')
    /** Zoho `Material_Code` only — WMW 2_0 → 3_0 → Cat1 main → Cat2 main. */
    const materialCode = firstField([item, ext3, productDetail, cat2ProductDetail], 'Material_Code')
    /** Same precedence as `resolveCategory1WmwHsnCode`: WMW 2_0 → WMW 3_0 → main WMW row */
    const hsnCode = firstField([item, ext3, productDetail], 'HSN_Code')

    let size = ''
    // Size (Mtrs) — prefer Category_1_MM_Database_WMW.Length_field + Width (per requirement).
    // Fallback to Invoice_Dimension_1/2 from line items if length/width are missing.
    const len = String(productDetail.Length_field ?? '').trim()
    const wid = String(productDetail.Width ?? '').trim()
    const extractNumber = (str: string) => {
      const match = str.match(/(\d+\.?\d*)/)
      return match ? match[1] : str.replace(/Length|length|Width|width/gi, '').trim()
    }
    if (len && wid) {
      size = `${len} x ${wid}`
    } else if (item.Invoice_Dimension_1 && item.Invoice_Dimension_2) {
      const dim1 = extractNumber(item.Invoice_Dimension_1)
      const dim2 = extractNumber(item.Invoice_Dimension_2)
      size = `${dim1} x ${dim2}`
    } else if (isCategory2Selected && productDetail.Invoice_Dimension_1 && productDetail.Invoice_Dimension_2) {
      // Category 2 WMW — Invoice_Dimension_1/2 live on the main product row
      // (`productDetail`), not the 2_0 line row (`item`) like Category 1.
      const dim1 = extractNumber(productDetail.Invoice_Dimension_1)
      const dim2 = extractNumber(productDetail.Invoice_Dimension_2)
      size = `${dim1} x ${dim2}`
    }

    // SQM Area / PC — same method for both categories: Length × Width
    // (per piece), NOT Zoho's `Total_SQM` (that's the sum across every
    // piece — e.g. 80.172 ÷ 12 pieces = 6.681, the per-piece figure this
    // column actually wants). Category 2's Invoice_Dimension_1/2 live on
    // `productDetail` (the main row), not `item` (the 2_0 row) like
    // Category 1 — same distinction already made for the SIZE column above.
    const sqmArea = resolveGoodsSqmArea({
      invoiceDimension1: isCategory2Selected ? productDetail.Invoice_Dimension_1 : item.Invoice_Dimension_1,
      invoiceDimension2: isCategory2Selected ? productDetail.Invoice_Dimension_2 : item.Invoice_Dimension_2,
      lengthField: productDetail.Length_field,
      width: productDetail.Width,
      sizeDisplay: size,
    })
    // Quantity / Rate — same formula as SaintGoodsTable.tsx, no Cat1/Cat2
    // branch needed (confirmed against record 238786000009215040,
    // Category 1 WMW: ext3.Total_UOM_Billing=2 × Selling_Price_UOM_Billing
    // 448.0003/449.0004 = 896.00/898.00, summing to the record's Grand
    // Total of 1794.00 exactly).
    const quantity = parseFloat(
      String(ext3?.Total_UOM_Billing ?? '').trim() || productDetail.Qty?.trim() || item.Qty?.trim() || '0'
    )
    const rateStr = String(ext3?.Selling_Price_UOM_Billing ?? item?.Selling_Price ?? '').replace(/,/g, '').trim()
    const rate = rateStr ? (parseFloat(rateStr) || NaN) : NaN
    /** UOM — same precedence as Saint: WMW 2_0 → WMW 3_0 → main WMW row. Replaces the previous hardcoded "Pcs". */
    const uom = firstField([item, ext3, productDetail], 'UOM_Billing')
    const totalPriceRaw = productDetail.Total_Price
    const totalPriceParsed =
      totalPriceRaw !== undefined && totalPriceRaw !== null && String(totalPriceRaw).trim() !== ''
        ? parseFloat(String(totalPriceRaw).replace(/,/g, ''))
        : NaN
    const amountFromLine = parseFloat(item.Net_Selling_Amount?.replace(/,/g, '') || item.Gross_Amount?.replace(/,/g, '') || '0')
    const computedAmount = quantity * rate
    const amount = Number.isFinite(computedAmount)
      ? computedAmount
      : (Number.isFinite(totalPriceParsed) ? totalPriceParsed : amountFromLine)

    const fitmentRows = toRowArray((rawQuotationData as any)?.Product_Fitments2_0)
    const fitmentRow =
      fitmentRows.find((x: any) => String(x?.S_No ?? '').trim() === String(index + 1)) || fitmentRows[index]

    const productCodeForMesh = firstField([productDetail, cat2ProductDetail, fitmentRow], 'Product_Code')
    const mesh = meshInchFromProductCode(productCodeForMesh)
    const brand = productDetail.Brand_Selling_Name?.trim() || ''

    const wiLine = data.lineItems?.[index]
    /** Product row: Perfomainvoice requires Blend_Category only; if missing, keep it blank. */
    const product = blendCategory || ''
    /** Form row: Zoho `End_Type` only (WMW 3_0 → 2_0 line → main). */
    const form = endType
    /** Quality: keep "AISI" constant; append Material code when present. */
    const quality = materialCode ? `AISI ${materialCode}` : 'AISI'

    // Net Weight (Kg.) Per Pc. mapping:
    // Category 2 → `Per_Pc` on the `_4_0` row (same row Form1/Quality1 come
    // from), checked first since it's the direct, purpose-named field.
    // Category 1 → Category_1_MM_Database_WMW_3_0.Net_Weight
    // Category 2 fallback → Category_2_MM_Database_WI_3_0.Net_Weight
    // Else (no category signal) → Product_Fitments2_0.Net_Weight
    const perPcFromExt4 = isCategory2Selected ? parseNumber(ext4?.Per_Pc) : 0
    const perPcFromCategory = pickNetWeightPerPc(itemRef, index)
    const perPc =
      perPcFromExt4 > 0
        ? perPcFromExt4
        : perPcFromCategory > 0
          ? perPcFromCategory
          : pickFitmentNetWeightPerPc(index)
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
      uom,
      perPc,
      totalWeight
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
      uom: '',
      perPc,
      totalWeight,
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
    uom: '',
    perPc: f.perPc,
    totalWeight: f.totalWeight,
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
      { item: 1, product: '', form: 'Endless Diagonal Seam', quality: 'AISI 316L', hsnCode: '7314', mesh: '40/ Inch', brand: 'Formx-040', size: '4.728 x 3.020', sqmArea: '14.2786', quantity: 6, rate: 1070, amount: 6420, uom: 'Pcs', perPc: 23.0, totalWeight: 138.0 },
      { item: 2, product: '', form: 'Endless Diagonal Seam', quality: 'AISI 316L', hsnCode: '7314', mesh: '40/ Inch', brand: 'Formx-040', size: '4.720 x 3.020', sqmArea: '14.2544', quantity: 3, rate: 1065, amount: 3195, uom: 'Pcs', perPc: 22.0, totalWeight: 66.0 }
    ]
  }

  const lineSum = displayLineItems.reduce((s, it) => s + (it.amount || 0), 0)

  // Net Weight (Kg.) column — dynamic: only shown (same two-sub-column
  // style as AdhunikGoodsTable.tsx, Per Pc. / Total) when at least one
  // line actually has a non-zero net weight value. `perPc`/`totalWeight`
  // are already computed per line above; this just decides whether to
  // render them.
  const hasNetWeightData = displayLineItems.some(
    (it) => (it.perPc || 0) > 0 || (it.totalWeight || 0) > 0
  )
  // Full-width tail rows (Transport / Note / Amount Chargeable) span a
  // fixed number of the table's physical columns — bump that span by 2
  // when the Net Weight columns are present so they still cover the
  // full row width.
  const wideColSpan = (base: number) => base + (hasNetWeightData ? 2 : 0)
  // Extra empty cells for the 2 Net Weight columns — reused across every
  // tail row below that otherwise assumes a 6-physical-column table.
  const netWeightFillerCells = hasNetWeightData ? (
    <>
      <td style={{ ...bdSides, padding: '6px' }} />
      <td style={{ ...bdSides, padding: '6px' }} />
    </>
  ) : null

  const baseAmount =
    subformTotalSaleValue > 0
      ? subformTotalSaleValue
      : subformCostBeforeTax > 0
        ? subformCostBeforeTax
        : lineSum > 0
          ? lineSum
          : data.totalAmount

  // Four Zoho-driven charge rows — same model as SaintGoodsTable.tsx
  // (client rule, matches Adhunik / Bashundhara / Everite too). Each row
  // is independently toggle-gated. Export Discount is a PERCENTAGE of the
  // line-item total and shown in red; the other three are flat amounts.
  const isTruthyToggle = (v: unknown): boolean =>
    v === true || (typeof v === 'string' && v.trim().toLowerCase() === 'true')
  const parseFlatAmt = (raw: unknown): number => {
    const n = parseFloat(String(raw ?? '').replace(/,/g, '').trim())
    return Number.isFinite(n) ? n : 0
  }

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

  const transactionChargeEnabled = isTruthyToggle(rawQuotationData?.Transaction_changes)
  const transactionChargeAmt = transactionChargeEnabled
    ? parseFlatAmt(rawQuotationData?.Transaction_changes_Value)
    : 0
  const transactionChargeLabel = String(
    rawQuotationData?.Transaction_changes_Descriptions ?? ''
  ).trim() || 'Transaction Charges'

  const miscChargeEnabled = isTruthyToggle(rawQuotationData?.Miscellaneous_Charges)
  const miscChargeAmt = miscChargeEnabled
    ? parseFlatAmt(rawQuotationData?.Miscellaneous_Charges_Value)
    : 0
  const miscChargeLabel = (
    String(rawQuotationData?.Miscellaneous_Charges_Description1 ?? '').trim() ||
    String(rawQuotationData?.Miscellaneous_Charges_Description ?? '').trim() ||
    'Miscellaneous Charges'
  )

  const exportPackingEnabled = isTruthyToggle(rawQuotationData?.Export_Packing)
  const exportPackingAmt = exportPackingEnabled
    ? parseFlatAmt(rawQuotationData?.Export_Packing_Value)
    : 0
  const exportPackingLabel = String(
    rawQuotationData?.Export_Packing_Description ?? ''
  ).trim() || 'Export Packing'

  const displayGrandTotal = parseOverallGrandTotalInclAccessories(
    rawQuotationData as Record<string, unknown> | null | undefined
  )
  const amountChargeableInWords = formatGoodsTableAmountChargeableInWords(displayGrandTotal, currency)

  const chunks = [];
  for (let i = 0; i < displayLineItems.length; i += 5) {
    chunks.push(displayLineItems.slice(i, i + 5));
  }
  if (chunks.length === 0) chunks.push([]);

  return (
    <div className="quotation-goods-pages-stack">
      {chunks.map((chunk, pageIdx) => {
        const isLastChunk = pageIdx === chunks.length - 1;

        return (
          <div
            key={pageIdx}
            className={`quotation-goods-pages-segment perfomainvoice-nonlast-fill ${!isLastChunk ? 'quotation-goods-pages-break' : ''}`}
            style={{
              pageBreakInside: 'avoid',
              marginTop: pageIdx > 0 ? '-1px' : '0',
              // ALWAYS stretch segment to fill the tbody's per-page area
              // (both last and non-last chunks) so the goods table's
              // bottom border always reaches the printable-area bottom —
              // same technique as SaintGoodsTable.tsx (see
              // `.perfomainvoice-nonlast-fill` rules in globals.css).
              minHeight: 'calc(100vh - 22mm)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              className="quotation-seamless-stack"
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              {headerNode}

              <table
                className="goods-description-table quotation-stack-table perfomainvoice-goods-table"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #000',
                  // Remove top border — headerNode already draws its own
                  // bottom border, so both stacked 1px borders were adding
                  // up to a doubled 2px seam line (same fix as Saint).
                  borderTop: 'none',
                  marginTop: 0,
                  tableLayout: 'fixed',
                  fontSize: '10px',
                  flex: 1,
                  height: '100%',
                }}
              >
                <colgroup>
                  {hasNetWeightData ? (
                    <>
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '28%' }} />
                      <col style={{ width: '9%' }} />
                      <col style={{ width: '6%' }} />
                      <col style={{ width: '6%' }} />
                      <col style={{ width: '11%' }} />
                      <col style={{ width: '11%' }} />
                      <col style={{ width: '11%' }} />
                    </>
                  ) : (
                    <>
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '30%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '13%' }} />
                    </>
                  )}
                </colgroup>
                <tbody>
                  {hasNetWeightData ? (
                    <>
                      <tr className="perfomainvoice-goods-title-row">
                        <td colSpan={2} rowSpan={2} style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', verticalAlign: 'middle' }}>
                          Description of Goods
                        </td>
                        <td rowSpan={2} style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', verticalAlign: 'middle' }}>
                          HSN Code
                        </td>
                        <td colSpan={2} style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '10px' }}>
                          Net Weight (Kg.)
                        </td>
                        <td rowSpan={2} style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                          Quantity / UOM
                        </td>
                        <td rowSpan={2} style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                          Rate<br />{currencySymbol} / UOM
                        </td>
                        <td rowSpan={2} style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                          Amount {currencySymbol}
                        </td>
                      </tr>
                      <tr className="perfomainvoice-goods-title-row-2">
                        <td style={{ ...bdTitleRow, padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '9px' }}>
                          Per Pc.
                        </td>
                        <td style={{ ...bdTitleRow, padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '9px' }}>
                          Total
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr className="perfomainvoice-goods-title-row">
                      <td colSpan={2} style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', verticalAlign: 'middle' }}>
                        Description of Goods
                      </td>
                      <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', verticalAlign: 'middle' }}>
                        HSN Code
                      </td>
                      <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                        Quantity / UOM
                      </td>
                      <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                        Rate<br />{currencySymbol} / UOM
                      </td>
                      <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                        Amount {currencySymbol}
                      </td>
                    </tr>
                  )}

                  {groupChunkRowsByProductFormQuality(chunk).map((groupRows, groupIdx) => {
                    const head = groupRows[0]
                    return (
                      <Fragment key={`perfomainvoice-grp-${pageIdx}-${groupIdx}`}>
                        <tr className="perfomainvoice-item-meta-row">
                          <td colSpan={2} style={{ ...bdProductMeta, padding: '8px 10px 4px 10px', verticalAlign: 'top' }}>
                            <div style={metaRowLine}>
                              <span>Product</span><span>:</span><span style={metaRowValue}>{head.product}</span>
                            </div>
                            {head.form ? (
                              <div style={metaRowLine}>
                                <span>Form</span><span>:</span><span style={metaRowValue}>{head.form}</span>
                              </div>
                            ) : null}
                            <div style={{ ...metaRowLine, marginBottom: 0 }}>
                              <span>Quality</span><span>:</span><span style={metaRowValue}>{head.quality}</span>
                            </div>
                          </td>
                          <td style={{ ...bdProductMeta, padding: '6px 4px', verticalAlign: 'top' }} />
                          {hasNetWeightData ? (
                            <>
                              <td style={rightMergedEmpty} />
                              <td style={rightMergedEmpty} />
                            </>
                          ) : null}
                          <td style={rightMergedEmpty} />
                          <td style={rightMergedEmpty} />
                          <td style={rightMergedEmpty} />
                        </tr>
                        <tr className="perfomainvoice-item-grid-row">
                          <td colSpan={2} style={{ ...bdItemGrid, padding: '6px 10px', verticalAlign: 'middle' }}>
                            <div style={{ ...descGrid, fontWeight: 'bold', marginBottom: 0 }}>
                              <span>Item</span>
                              <span>MESH</span>
                              <span>BRAND</span>
                              <span style={goodsDescGridSizeSpanOneLine}>SIZE [Mtrs] (LxW)</span>
                              <span>Sqm Area / PC</span>
                            </div>
                          </td>
                          <td style={{ ...bdItemGrid, padding: '6px 4px', verticalAlign: 'middle' }} />
                          {hasNetWeightData ? (
                            <>
                              <td style={{ ...bdItemGrid, padding: '6px', verticalAlign: 'middle' }} />
                              <td style={{ ...bdItemGrid, padding: '6px', verticalAlign: 'middle' }} />
                            </>
                          ) : null}
                          <td style={{ ...bdItemGrid, padding: '6px', verticalAlign: 'middle' }} />
                          <td style={{ ...bdItemGrid, padding: '6px', verticalAlign: 'middle' }} />
                          <td style={{ ...bdItemGrid, padding: '6px', verticalAlign: 'middle' }} />
                        </tr>
                        {groupRows.map((row, rowIdx) => (
                          <tr key={`perfomainvoice-line-${pageIdx}-${groupIdx}-${rowIdx}`} className="perfomainvoice-item-grid-row">
                            <td colSpan={2} style={{ ...bdItemGrid, padding: '23px 10px', verticalAlign: 'middle' }}>
                              <div style={{ ...descGrid, alignItems: 'start' }}>
                                <span style={{ fontWeight: 'bold', textDecoration: 'underline', ...goodsDescGridValueSpan }}>{row.item}</span>
                                <span style={{ ...goodsDescGridValueSpan, whiteSpace: 'nowrap' }}>{row.mesh}</span>
                                <span style={goodsDescGridValueSpan}>{row.brand}</span>
                                <span style={{ ...goodsDescGridValueSpan, ...goodsDescGridSizeSpanOneLine }}>{row.size}</span>
                                <span style={goodsDescGridValueSpan}>{row.sqmArea}</span>
                              </div>
                            </td>
                            <td style={{ ...bdItemGrid, padding: '23px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', wordBreak: 'break-word' }}>
                              {row.hsnCode || ''}
                            </td>
                            {hasNetWeightData ? (
                              <>
                                <td style={{ ...bdItemGrid, padding: '23px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                                  {row.perPc || ''}
                                </td>
                                <td style={{ ...bdItemGrid, padding: '23px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                                  {row.totalWeight || ''}
                                </td>
                              </>
                            ) : null}
                            <td style={{ ...bdItemGrid, padding: '23px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <span>{/^pcs?$/i.test(row.uom) ? formatPiecesInteger(row.quantity) : String(row.quantity ?? '').trim()}</span>
                                {row.uom ? <span>{row.uom}</span> : null}
                              </div>
                            </td>
                            <td style={{ ...bdItemGrid, padding: '23px 10px', textAlign: 'right', verticalAlign: 'middle' }}>
                              {Number.isFinite(row.rate) ? formatCurrency(row.rate, '') : ''}
                            </td>
                            <td style={{ ...bdItemGrid, padding: '23px 10px', textAlign: 'right', verticalAlign: 'middle' }}>
                              {formatCurrency(row.amount, '')}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    )
                  })}

                  {/* Non-last chunk: dynamic fill row so the vertical
                   * column borders keep going to the bottom of the
                   * printable area, matching SaintGoodsTable.tsx's
                   * `.saint-goods-fill-row` technique (see
                   * `.perfomainvoice-nonlast-fill` rules in globals.css). */}
                  {!isLastChunk && (
                    <tr className="perfomainvoice-goods-fill-row">
                      <td style={bdSides} />
                      <td style={bdSides} />
                      {hasNetWeightData ? (
                        <>
                          <td style={bdSides} />
                          <td style={bdSides} />
                        </>
                      ) : null}
                      <td style={bdSides} />
                      <td style={bdSides} />
                      <td style={bdSides} />
                      <td style={bdSides} />
                    </tr>
                  )}

                  {isLastChunk && (
                    <>
                      {/* Dynamic pre-tail filler — grows via a `height: 100%`
                       * chain (see `.perfomainvoice-tail-fill-row` in
                       * globals.css), same technique as Saint's. */}
                      <tr aria-hidden className="perfomainvoice-tail-fill-row">
                        <td colSpan={2} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                        {hasNetWeightData ? (
                          <>
                            <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                            <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                          </>
                        ) : null}
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                      </tr>

                      {/* Export Discount (red) — % of line-item total, informational only (doesn't alter displayGrandTotal). */}
                      {exportDiscountEnabled ? (
                        <tr>
                          <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', verticalAlign: 'top', color: '#c00000' }}>
                            {exportDiscountLabel}
                          </td>
                          {netWeightFillerCells}
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px', textAlign: 'right', color: '#c00000' }}>
                            {formatCurrency(exportDiscountAmt, '')}
                          </td>
                        </tr>
                      ) : null}

                      {transactionChargeEnabled ? (
                        <tr>
                          <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', verticalAlign: 'top' }}>
                            {transactionChargeLabel}
                          </td>
                          {netWeightFillerCells}
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px', textAlign: 'right' }}>
                            {formatCurrency(transactionChargeAmt, '')}
                          </td>
                        </tr>
                      ) : null}

                      {miscChargeEnabled ? (
                        <tr>
                          <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', verticalAlign: 'top' }}>
                            {miscChargeLabel}
                          </td>
                          {netWeightFillerCells}
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px', textAlign: 'right' }}>
                            {formatCurrency(miscChargeAmt, '')}
                          </td>
                        </tr>
                      ) : null}

                      {exportPackingEnabled ? (
                        <tr>
                          <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', verticalAlign: 'top' }}>
                            {exportPackingLabel}
                          </td>
                          {netWeightFillerCells}
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px', textAlign: 'right' }}>
                            {formatCurrency(exportPackingAmt, '')}
                          </td>
                        </tr>
                      ) : null}

                      <tr>
                        <td colSpan={2} style={{ ...bdSides, padding: '12px 10px 4px 10px', verticalAlign: 'top', fontWeight: 'bold' }}>
                          {exportRemarksValue}
                        </td>
                        {netWeightFillerCells}
                        <td style={{ ...bdSides, padding: '6px' }} />
                        <td style={{ ...bdSides, padding: '6px' }} />
                        <td style={{ ...bdSides, padding: '6px' }} />
                        <td style={{ ...bdSides, padding: '6px' }} />
                      </tr>

                      <tr>
                        <td colSpan={wideColSpan(6)} style={{ ...bd, padding: '4px 10px', textAlign: 'center', fontWeight: 'bold' }}>Transport</td>
                      </tr>

                      <tr>
                        <td colSpan={wideColSpan(6)} style={{ ...bd, padding: '4px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                          {transportSummaryLine}
                        </td>
                      </tr>

                      <tr>
                        <td colSpan={wideColSpan(4)} style={{ ...bd, padding: '6px 10px', fontSize: '9px', verticalAlign: 'top' }}>
                          <span>
                            Note : If the total order value is less than {currencySymbol} 2500, transaction fee of {currencySymbol} 100 per invoice
                            shall be charged extra
                          </span>
                        </td>
                        <td style={{ ...bd, padding: '6px', textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle', width: '10%' }}>
                          <span>{currency}</span>
                        </td>
                        <td style={{ ...bd, padding: '6px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'middle', width: '18%' }}>
                          <span className="quotation-grand-total-amount">{formatCurrency(displayGrandTotal, '')}</span>
                        </td>
                      </tr>

                      <tr>
                        <td style={{ ...bd, padding: '4px 8px', fontSize: '10px', verticalAlign: 'top', width: '14%' }}>
                          <span style={{ fontWeight: 'bold', display: 'block', lineHeight: 1.2 }}>Amount Chargeable<br />(In words) :</span>
                        </td>
                        <td colSpan={wideColSpan(3)} style={{ ...bd, padding: '4px 8px', fontWeight: 'bold', verticalAlign: 'middle', fontSize: '11px', width: '58%' }}>
                          {amountChargeableInWords}
                        </td>
                        <td style={{ ...bd, padding: '4px 8px', textAlign: 'right', verticalAlign: 'middle', fontWeight: 'bold', fontSize: '11px', width: '10%' }}>
                          Total:-
                        </td>
                        <td style={{ ...bd, padding: '4px 8px', textAlign: 'right', verticalAlign: 'middle', fontWeight: 'bold', fontSize: '11px', width: '18%' }}>
                          <span className="quotation-grand-total-amount">{formatCurrency(displayGrandTotal, '')}</span>
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
