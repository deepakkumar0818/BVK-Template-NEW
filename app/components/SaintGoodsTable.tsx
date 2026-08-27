'use client'

import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { QuotationData } from '@/lib/types'
import {
  formatCurrency,
  formatGoodsTableAmountChargeableInWords,
  formatPiecesInteger,
  parseOverallGrandTotalInclAccessories,
} from '@/lib/quotation-utils'
import { quotationScalarFieldPresent, resolveWmwChargeTotals } from '@/lib/wmw-subform-mapping'
import { groupChunkRowsByProductFormQuality } from '@/lib/goods-meta-grouping'
import { resolveGoodsSqmArea, sqmAreaFromSizeDisplayString } from '@/lib/goods-sqm-area'
import { GOODS_DESC_GRID_TEMPLATE_COLUMNS_WMW_BRANDED, goodsDescGridSizeSpanOneLine } from '@/lib/goods-desc-grid-styles'

const bd: CSSProperties = { border: '1px solid #000' }

const contentBdSides: CSSProperties = {
  borderLeft: '1px solid #000',
  borderRight: '1px solid #000',
  borderTop: 'none',
  borderBottom: 'none',
}

interface SaintGoodsTableProps {
  data: QuotationData
  rawQuotationData?: any
  shippingData?: any
  headerNode?: ReactNode
  footerNode?: ReactNode
}

/** Stays inside the Description column — avoids overlap into Quantity (fixed px + auto was overflowing). */
const descGridTdWrap: CSSProperties = {
  overflow: 'hidden',
  maxWidth: '100%',
  verticalAlign: 'top',
}

const descGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(2.25rem, 3rem) minmax(0, 1fr) minmax(0, 0.95fr) minmax(0, 1.1fr) minmax(0, 1fr)',
  columnGap: '6px',
  rowGap: '4px',
  alignItems: 'start',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  textAlign: 'left',
}

const descGridCell: CSSProperties = {
  minWidth: 0,
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
}

const metaGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '70px 10px auto',
  marginBottom: '2px',
  fontWeight: 'bold',
}

/** Same mesh rule as Bashundhara / Seamp */
function meshInchFromProductCode(productCode: string): string {
  const s = String(productCode ?? '').trim()
  if (!s) return ''
  const parts = s.split('.')
  if (parts.length < 5) return ''
  const tail = parts.slice(4).join('.')
  const m = tail.match(/\d+(?:\.\d+)?/)
  return m ? `${m[0]}/Inch` : ''
}

export default function SaintGoodsTable({ data, rawQuotationData, headerNode, footerNode }: SaintGoodsTableProps) {
  const currency = data.currency || rawQuotationData?.Currency || 'EUR'
  const currencySymbol = currency

  const template = String(rawQuotationData?.Template ?? '').trim().toLowerCase()
  const isCategory2Selected = template.includes('category 2') && template.includes('wi')

  // WMW category switch — records tagged "Category 2 WMW" store their
  // line items in Category_2_MM_Database_WMW_* subforms. Every per-line
  // read below (line-item driver, product-master rows, 3.0 extras,
  // 4.0 extras with Remarks1/Remarks2) is keyed off this flag so
  // remarks under Quantity / Rate work in either category.
  const isCat2Wmw = template.includes('category 2') && template.includes('wmw')
  const rawLineItems = isCat2Wmw
    ? ((rawQuotationData?.Category_2_MM_Database_WMW_2_0 as any[]) || [])
    : ((rawQuotationData?.Category_1_MM_Database_WMW_2_0 as any[]) || [])
  const rawProductDetails = isCat2Wmw
    ? ((rawQuotationData?.Category_2_MM_Database_WMW as any[]) || [])
    : ((rawQuotationData?.Category_1_MM_Database_WMW as any[]) || [])

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
      const rows = toRowArray((rawQuotationData as any).Category_1_MM_Database_WMW_3_0)
      const r =
        (itemRef
          ? rows.find((x: any) => String(x?.last_item_ref ?? x?.Last_item_ref ?? '').trim() === itemRef)
          : undefined) || rows[index]
      return parseNumber(r?.Net_Weight)
    }
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

  const transaction = quotationScalarFieldPresent(rawQuotationData?.Transaction_Charges)
    ? parseFloat(String(rawQuotationData?.Transaction_Charges).replace(/,/g, '')) || 0
    : 0

  const chargeTotalsResolved = resolveWmwChargeTotals(rawQuotationData)
  const discountChargeAmt = chargeTotalsResolved.discountTotal
  const discountRowLabel = chargeTotalsResolved.discountLabel
  const freightChargeAmt = chargeTotalsResolved.freightTotal
  const packingChargeAmt = chargeTotalsResolved.packingTotal
  const seamChargeAmt = chargeTotalsResolved.seamTotal
  const otherChargesAmt = quotationScalarFieldPresent(rawQuotationData?.Other_Charges)
    ? parseFloat(String(rawQuotationData?.Other_Charges).replace(/,/g, '').trim()) || 0
    : 0
  const discountDeduct = Math.max(0, discountChargeAmt)
  const chargesSum = freightChargeAmt + packingChargeAmt + seamChargeAmt + otherChargesAmt - discountDeduct

  // Transport line — maps 1:1 to Zoho `Transport`, no fallback.
  const saintTransportSummaryLine = String(rawQuotationData?.Transport ?? '').trim()

  const lineItemsFromZoho = rawLineItems.map((item, index) => {
    const itemRef = item.last_item_ref?.trim() || item.Last_item_ref?.trim() || ''
    const productDetail = itemRef
      ? rawProductDetails.find(
          (pd: any) => pd.last_item_ref?.trim() === itemRef || pd.Last_item_ref?.trim() === itemRef
        ) || rawProductDetails[index] || {}
      : rawProductDetails[index] || {}

    const rows3Linked = toRowArray(
      isCat2Wmw
        ? (rawQuotationData as any)?.Category_2_MM_Database_WMW_3_0
        : (rawQuotationData as any)?.Category_1_MM_Database_WMW_3_0
    )
    const ext3 =
      (itemRef
        ? rows3Linked.find(
            (x: any) => String(x?.last_item_ref ?? x?.Last_item_ref ?? '').trim() === itemRef
          )
        : undefined) || rows3Linked[index]

    // 4.0 extras — per-line `Remarks1` (under Quantity) and `Remarks2`
    // (under Rate). Joined via `Line_ref` first (that's the natural key
    // on the WMW_4_0 subform); falls back to `last_item_ref` or the
    // array index if `Line_ref` isn't present on the row.
    const rows4Linked = toRowArray(
      isCat2Wmw
        ? (rawQuotationData as any)?.Category_2_MM_Database_WMW_4_0
        : (rawQuotationData as any)?.Category_1_MM_Database_WMW_4_0
    )
    const lineRefStr = String(index + 1)
    const ext4 =
      rows4Linked.find((x: any) => String(x?.Line_ref ?? '').trim() === lineRefStr) ||
      (itemRef
        ? rows4Linked.find(
            (x: any) => String(x?.last_item_ref ?? x?.Last_item_ref ?? '').trim() === itemRef
          )
        : undefined) ||
      rows4Linked[index]
    const remarks1 = String(ext4?.Remarks1 ?? '').trim()
    const remarks2 = String(ext4?.Remarks2 ?? '').trim()

    const lineItemRef = String(index + 1)
    const rows3Cat2Linked = toRowArray((rawQuotationData as any)?.Category_2_MM_Database_WMW_3_0)
    const ext3Cat2 =
      (itemRef
        ? rows3Cat2Linked.find(
            (x: any) => String(x?.last_item_ref ?? x?.Last_item_ref ?? '').trim() === itemRef
          )
        : undefined) ||
      rows3Cat2Linked.find((x: any) => String(x?.Line_Item_ref ?? '').trim() === lineItemRef) ||
      rows3Cat2Linked[index]

    const cat2WmwMainRows = toRowArray((rawQuotationData as any)?.Category_2_MM_Database_WMW)
    const cat2ProductDetail = itemRef
      ? cat2WmwMainRows.find(
          (pd: any) => pd.last_item_ref?.trim() === itemRef || pd.Last_item_ref?.trim() === itemRef
        ) || cat2WmwMainRows[index] || {}
      : cat2WmwMainRows[index] || {}

    const blendCategory = firstField([item], 'Blend_Category')
    const endType = firstField([ext3, item, productDetail], 'End_Type')
    /** Zoho `Material_Code` only — same row precedence as HSN on this template. */
    const materialCode = firstField([item, ext3, ext3Cat2, productDetail, cat2ProductDetail], 'Material_Code')

    let size = ''
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
    const rateStr = item.Selling_Price?.replace(/,/g, '') || ''
    const rate = rateStr ? (parseFloat(rateStr) || 0) : NaN
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

    /** Same precedence as Bashundhara / Seamp: WMW 2_0 → WMW 3_0 (Cat1 & Cat2) → main WMW rows */
    const hsnCode = firstField([item, ext3, ext3Cat2, productDetail, cat2ProductDetail], 'HSN_Code')

    const fitmentRows = toRowArray((rawQuotationData as any)?.Product_Fitments2_0)
    const fitmentRow =
      fitmentRows.find((x: any) => String(x?.S_No ?? '').trim() === String(index + 1)) || fitmentRows[index]

    const productCodeForMesh = firstField([productDetail, cat2ProductDetail, fitmentRow], 'Product_Code')
    const mesh = meshInchFromProductCode(productCodeForMesh)
    const brand = productDetail.Brand_Selling_Name?.trim() || ''

    /** Line-level Remarks from WMW subforms (2_0 → 3_0 → main WMW → Cat2 WMW). */
    const lineRemarks =
      firstField([item, ext3, productDetail, cat2ProductDetail], 'Remarks') ||
      firstField([item, ext3, productDetail, cat2ProductDetail], 'remarks')

    const wiLine = data.lineItems?.[index]
    const product = blendCategory || ''
    /** Form row: Zoho `End_Type` only (WMW 3_0 → 2_0 line → main). */
    const form = endType
    const quality = materialCode ? `AISI ${materialCode}` : 'AISI'
    const uom =
      String(productDetail.UOM ?? productDetail.uom ?? '').trim() ||
      String(productDetail.Supply_Form ?? '')
        .trim()
        .split(/\s+/)[0] ||
      'Roll'

    const perPcFromCategory = pickNetWeightPerPc(itemRef, index)
    const perPc =
      perPcFromCategory > 0 ? perPcFromCategory : pickFitmentNetWeightPerPc(index)
    const totalWeight = perPc * quantity

    return {
      item: index + 1,
      product,
      form,
      quality,
      mesh,
      brand,
      size,
      sqmArea,
      quantity,
      rate,
      amount,
      uom,
      perPc,
      totalWeight,
      remarks: lineRemarks,
      hsnCode,
      remarks1,
      remarks2,
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
      mesh: '',
      brand: item.type || item.form || '',
      size: item.size || '',
      sqmArea: sqmAreaFromSizeDisplayString(item.size || ''),
      quantity,
      rate,
      amount,
      uom: 'Roll',
      perPc,
      totalWeight,
      remarks: String((item as { remarks?: string }).remarks ?? '').trim(),
      hsnCode: item.hsnCode?.trim() || '',
      remarks1: '',
      remarks2: '',
    }
  })

  const displayLineItems = lineItemsFromZoho.length > 0 ? lineItemsFromZoho : lineItemsFallback
  const groupedSaintLineItems = groupChunkRowsByProductFormQuality(displayLineItems)

  const lineSum = displayLineItems.reduce((s, it) => s + (it.amount || 0), 0)

  const totalCostAfterTaxGrandRaw = rawQuotationData?.Total_Cost_After_Tax_Grand_Total
  const totalCostAfterTaxGrandParsed =
    totalCostAfterTaxGrandRaw != null && String(totalCostAfterTaxGrandRaw).trim() !== ''
      ? parseFloat(String(totalCostAfterTaxGrandRaw).replace(/,/g, ''))
      : NaN

  const baseAmountFallback =
    subformTotalSaleValue > 0
      ? subformTotalSaleValue
      : subformCostBeforeTax > 0
        ? subformCostBeforeTax
        : lineSum > 0
          ? lineSum
          : data.totalAmount

  /** Total Ex-Works Price: Zoho `Total_Cost_After_Tax_Grand_Total` when set; else Subform_Breakdown / line sum / transformed total */
  const baseAmount = Number.isFinite(totalCostAfterTaxGrandParsed)
    ? totalCostAfterTaxGrandParsed
    : baseAmountFallback

  const dapChargesTotal = chargesSum + transaction
  const primaryLine = displayLineItems[0]
  const primaryQty = primaryLine?.quantity ?? 0
  const dapRate =
    primaryQty > 0 && dapChargesTotal > 0 ? dapChargesTotal / primaryQty : dapChargesTotal

  const displayGrandTotal = parseOverallGrandTotalInclAccessories(
    rawQuotationData as Record<string, unknown> | null | undefined
  )

  // Four Zoho-driven charge rows (client rule — matches the treatment
  // now used in Adhunik / Bashundhara / Everite). Each row is
  // independently toggle-gated. Export Discount subtracts from the
  // grand total; the other three add to it.
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

  const finalGrandTotal =
    displayGrandTotal
    - exportDiscountAmt
    + transactionChargeAmt
    + miscChargeAmt
    + exportPackingAmt
  const amountChargeableInWords = formatGoodsTableAmountChargeableInWords(finalGrandTotal, currency)

  const renderQtyUomCell = (qty: unknown, uom: unknown) => {
    const uomText = String(uom ?? '').trim()
    const qtyText = /^pcs?$/i.test(uomText)
      ? formatPiecesInteger(qty)
      : String(qty ?? '').trim()
    // Value + UOM on the same line \u2014 e.g. `12 Roll` \u2014 instead of the
    // previous stacked layout.
    return (
      <div className="quotation-qty-uom-cell" style={{ display: 'inline-flex', flexDirection: 'row', gap: '4px', justifyContent: 'center', alignItems: 'baseline' }}>
        <span className="quotation-qty-value">{qtyText || '\u00A0'}</span>
        {uomText ? <span className="quotation-qty-uom">{uomText}</span> : null}
      </div>
    )
  }

  return (
    <div className="quotation-goods-pages-stack">
      <div className="quotation-goods-pages-segment" style={{ pageBreakInside: 'avoid', marginTop: '0' }}>
        <div className="quotation-seamless-stack">
          {headerNode}

          <table
            className="goods-description-table quotation-stack-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #000',
              marginTop: 0,
              tableLayout: 'fixed',
              fontSize: '11px',
            }}
          >
            {/* Column widths mirror Everite. Everite splits its Description
             * of Goods across two <col> (22% + 28%); here it's a single
             * column, so those two are combined to 50%. The remaining four
             * columns (HSN 12% / Qty 13% / Rate 12% / Amount 13%) match
             * Everite exactly. */}
            <colgroup>
              <col style={{ width: '50%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '13%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td style={{ ...bd, padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  Description of Goods
                </td>
                <td style={{ ...bd, padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  HSN Code
                </td>
                <td style={{ ...bd, padding: '6px 10px', textAlign: 'center', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  Quantity / UOM
                </td>
                <td style={{ ...bd, padding: '6px 10px', textAlign: 'center', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  Rate / {currencySymbol}
                </td>
                <td style={{ ...bd, padding: '6px 10px', textAlign: 'center', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  Amount {currencySymbol}
                </td>
              </tr>

              {displayLineItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...contentBdSides, padding: '8px 10px', textAlign: 'center' }}>
                    No line items
                  </td>
                </tr>
              ) : (
                groupedSaintLineItems.map((groupRows, groupIdx) => {
                  const head = groupRows[0]
                  const isLastGroup = groupIdx === groupedSaintLineItems.length - 1
                  return (
                    <Fragment key={`saint-grp-${groupIdx}`}>
                      <tr>
                        <td style={{ ...contentBdSides, padding: '8px 10px 0px 10px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>
                            {groupIdx === 0 ? 'Trial Batch' : head.product || `Item ${head.item}`}
                          </div>
                          <div style={{ ...metaGrid }}>
                            <span>Product</span>
                            <span>:</span>
                            <span>{head.product || '\u00A0'}</span>
                          </div>
                          <div style={{ ...metaGrid }}>
                            <span>Form</span>
                            <span>:</span>
                            <span>{head.form || '\u00A0'}</span>
                          </div>
                          <div style={{ ...metaGrid, marginBottom: isLastGroup ? '16px' : '8px' }}>
                            <span>Quality</span>
                            <span>:</span>
                            <span>{head.quality || '\u00A0'}</span>
                          </div>
                        </td>
                        <td style={contentBdSides} />
                        <td style={contentBdSides} />
                        <td style={contentBdSides} />
                        <td style={contentBdSides} />
                      </tr>
                      <tr>
                        <td style={{ ...contentBdSides, ...descGridTdWrap, padding: '0px 10px 6px 10px' }}>
                          <div style={{ ...descGrid, fontWeight: 'bold', fontSize: '10px' }}>
                            <span style={{ ...descGridCell, textAlign: 'center' }}>Item</span>
                            <span style={descGridCell}>Mesh</span>
                            <span style={descGridCell}>Brand</span>
                            <span style={{ ...descGridCell, ...goodsDescGridSizeSpanOneLine, lineHeight: 1.25 }}>
                              Size [m] (L x W)
                            </span>
                            <span style={{ ...descGridCell, lineHeight: 1.25, textAlign: 'right' }}>Sqm Area / PC</span>
                          </div>
                        </td>
                        <td style={contentBdSides} />
                        <td style={contentBdSides} />
                        <td style={contentBdSides} />
                        <td style={contentBdSides} />
                      </tr>
                      {groupRows.map((row, rowIdx) => (
                        <tr key={`saint-line-${groupIdx}-${rowIdx}`}>
                          <td style={{ ...contentBdSides, ...descGridTdWrap, padding: '4px 10px' }}>
                              {quotationScalarFieldPresent(row.remarks) ? (
                                <div
                                  style={{
                                    ...descGrid,
                                    fontSize: '11px',
                                    gridTemplateRows: 'auto auto',
                                    rowGap: '4px',
                                  }}
                                >
                                  <span
                                    style={{
                                      ...descGridCell,
                                      gridColumn: 1,
                                      gridRow: 1,
                                      textAlign: 'center',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    {row.item}
                                  </span>
                                  <span
                                    style={{
                                      ...descGridCell,
                                      gridColumn: 2,
                                      gridRow: 1,
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    {row.mesh || '\u00A0'}
                                  </span>
                                  <span
                                    style={{
                                      ...descGridCell,
                                      gridColumn: 3,
                                      gridRow: 1,
                                      fontWeight: 'bold',
                                      fontSize: '13px',
                                    }}
                                  >
                                    {row.brand || '\u00A0'}
                                  </span>
                                  <span style={{ ...descGridCell, ...goodsDescGridSizeSpanOneLine, gridColumn: 4, gridRow: 1 }}>
                                    {row.size || '\u00A0'}
                                  </span>
                                  <span
                                    style={{
                                      ...descGridCell,
                                      gridColumn: 5,
                                      gridRow: 1,
                                      textAlign: 'right',
                                    }}
                                  >
                                    {row.sqmArea || '\u00A0'}
                                  </span>
                                  <div
                                    style={{
                                      gridColumn: '2 / 5',
                                      gridRow: 2,
                                      minWidth: 0,
                                      fontSize: '10px',
                                      fontWeight: 'normal',
                                      lineHeight: 1.45,
                                      textAlign: 'left',
                                      whiteSpace: 'pre-wrap',
                                      overflowWrap: 'break-word',
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    {String(row.remarks).trim()}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ ...descGrid, fontSize: '11px' }}>
                                  <span style={{ ...descGridCell, textAlign: 'center', fontWeight: 'bold' }}>{row.item}</span>
                                  <span style={{ ...descGridCell, fontWeight: 'bold' }}>{row.mesh || '\u00A0'}</span>
                                  <span style={{ ...descGridCell, fontWeight: 'bold', fontSize: '13px' }}>{row.brand || '\u00A0'}</span>
                                  <span style={{ ...descGridCell, ...goodsDescGridSizeSpanOneLine }}>{row.size || '\u00A0'}</span>
                                  <span style={{ ...descGridCell, textAlign: 'right' }}>{row.sqmArea || '\u00A0'}</span>
                                </div>
                              )}
                            </td>
                            <td
                              style={{
                                ...contentBdSides,
                                padding: '4px 8px',
                                textAlign: 'center',
                                verticalAlign: 'top',
                                fontWeight: 'bold',
                                fontSize: '11px',
                                lineHeight: 1.35,
                                wordBreak: 'break-word',
                              }}
                            >
                              {row.hsnCode || ''}
                            </td>
                            <td style={{ ...contentBdSides, padding: '4px 8px', verticalAlign: 'top' }}>
                              {renderQtyUomCell(row.quantity || '', row.uom)}
                              {row.remarks1 ? (
                                <div style={{ whiteSpace: 'pre-wrap', fontSize: '9px', marginTop: '2px', textAlign: 'center' }}>{row.remarks1}</div>
                              ) : null}
                            </td>
                            <td style={{ ...contentBdSides, padding: '4px 10px', textAlign: 'center', verticalAlign: 'top' }}>
                              <div>{Number.isFinite(row.rate) ? formatCurrency(row.rate, currency) : ''}</div>
                              {row.remarks2 ? (
                                <div style={{ whiteSpace: 'pre-wrap', fontSize: '9px', marginTop: '2px' }}>{row.remarks2}</div>
                              ) : null}
                            </td>
                            <td style={{ ...contentBdSides, padding: '4px 10px', textAlign: 'center', verticalAlign: 'top' }}>
                              {formatCurrency(row.amount, currency)}
                            </td>
                        </tr>
                      ))}
                    </Fragment>
                  )
                })
              )}

              <tr>
                <td style={{ ...contentBdSides, height: '16px' }} />
                <td style={contentBdSides} />
                <td style={contentBdSides} />
                <td style={contentBdSides} />
                <td style={contentBdSides} />
              </tr>

              <tr>
                <td colSpan={4} style={{ ...bd, padding: '4px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                  Total Ex-Works Price
                </td>
                <td style={{ ...bd, padding: '4px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                  {formatCurrency(baseAmount, currency)}
                </td>
              </tr>

              {/* Export Discount (red) — % of line-item total, subtracts from grand total. */}
              {exportDiscountEnabled ? (
                <tr>
                  <td colSpan={4} style={{ ...bd, padding: '4px 10px', textAlign: 'right', fontWeight: 'bold', color: '#c00000' }}>
                    {exportDiscountLabel}
                  </td>
                  <td style={{ ...bd, padding: '4px 10px', textAlign: 'center', fontWeight: 'bold', color: '#c00000' }}>
                    {formatCurrency(exportDiscountAmt, currency)}
                  </td>
                </tr>
              ) : null}

              {/* Transaction / Miscellaneous / Export Packing — flat-amount
               * charges, each toggle-gated. Added to the grand total via
               * `finalGrandTotal` above. */}
              {transactionChargeEnabled ? (
                <tr>
                  <td colSpan={4} style={{ ...bd, padding: '4px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                    {transactionChargeLabel}
                  </td>
                  <td style={{ ...bd, padding: '4px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                    {formatCurrency(transactionChargeAmt, currency)}
                  </td>
                </tr>
              ) : null}

              {miscChargeEnabled ? (
                <tr>
                  <td colSpan={4} style={{ ...bd, padding: '4px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                    {miscChargeLabel}
                  </td>
                  <td style={{ ...bd, padding: '4px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                    {formatCurrency(miscChargeAmt, currency)}
                  </td>
                </tr>
              ) : null}

              {exportPackingEnabled ? (
                <tr>
                  <td colSpan={4} style={{ ...bd, padding: '4px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                    {exportPackingLabel}
                  </td>
                  <td style={{ ...bd, padding: '4px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                    {formatCurrency(exportPackingAmt, currency)}
                  </td>
                </tr>
              ) : null}

              <tr>
                <td style={{ ...bd, padding: '10px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'middle' }}>
                  Add : DAP by Air
                </td>
                <td style={bd} />
                <td style={{ ...bd, padding: '6px 8px', verticalAlign: 'middle' }}>
                  {renderQtyUomCell(primaryQty > 0 ? primaryQty : '', primaryLine?.uom || 'Rolls')}
                </td>
                <td style={{ ...bd, padding: '6px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                  {dapChargesTotal > 0 && primaryQty > 0 ? formatCurrency(dapRate, currency) : ''}
                </td>
                <td style={{ ...bd, padding: '6px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                  {formatCurrency(dapChargesTotal, currency)}
                </td>
              </tr>

              <tr>
                <td style={{ ...bd, padding: '4px 10px', textAlign: 'center', fontWeight: 'bold' }}>Transport</td>
                <td style={bd} />
                <td colSpan={2} style={bd} />
                <td style={bd} />
              </tr>

              <tr>
                <td style={{ ...bd, padding: '16px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                  <div>{saintTransportSummaryLine}</div>
                  <div style={{ marginTop: '6px', fontSize: '12px' }}>( Transport Time Estimated between 13 - 16 days )</div>
                </td>
                <td style={bd} />
                <td colSpan={2} style={bd} />
                <td style={bd} />
              </tr>

              <tr>
                <td style={{ ...bd, padding: '6px 10px', fontSize: '10px', whiteSpace: 'pre-wrap' }}>
                  {/* Notes: value comes from Zoho `Inside_Quotation_Text` verbatim, no fallback. */}
                  {String(rawQuotationData?.Inside_Quotation_Text ?? '').trim()}
                </td>
                <td style={bd} />
                <td colSpan={2} style={{ ...bd, padding: '6px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                  {currencySymbol}
                </td>
                <td style={bd} />
              </tr>

              <tr>
                <td colSpan={4} style={{ border: '1px solid #000', padding: 0 }}>
                  <div style={{ display: 'flex', width: '100%', minHeight: '44px' }}>
                    <div
                      style={{
                        width: '150px',
                        borderRight: '1px solid #000',
                        padding: '6px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 'bold', fontSize: '10px', lineHeight: 1.2 }}>Amount Chargeable</span>
                      <span style={{ fontWeight: 'bold', fontSize: '10px', lineHeight: 1.2 }}>(In words) :</span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 'bold', fontSize: '12px' }}>
                        {amountChargeableInWords}
                      </span>
                      <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Total:-</span>
                    </div>
                  </div>
                </td>
                <td
                  style={{
                    ...bd,
                    padding: '8px 10px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    verticalAlign: 'middle',
                  }}
                >
                  <span className="quotation-grand-total-amount">{formatCurrency(finalGrandTotal, currency)}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {footerNode}
        </div>
      </div>
    </div>
  )
}
