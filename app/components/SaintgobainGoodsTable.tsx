'use client'

import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { QuotationData } from '@/lib/types'
import { formatCurrency, numberToWords } from '@/lib/quotation-utils'
import {
  filterNonZeroWmwChargeRows,
  quotationScalarFieldPresent,
  resolveWmwChargeTotals,
  WMW_STANDARD_CHARGE_NAMES,
} from '@/lib/wmw-subform-mapping'

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

/** Filler cells under HSN / Qty / Rate / Amount — same grid as line items; no extra horizontals. */
const bashundharaWeightBandFillerTd: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: 'none',
  padding: '6px',
  verticalAlign: 'middle',
}

interface SaintgobainGoodsTableProps {
  data: QuotationData
  rawQuotationData?: any
  /** Optional; reserved for parity with other templates if shipping fields are needed later. */
  shippingData?: any
  headerNode?: ReactNode
  footerNode?: ReactNode
}

const descGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
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

export default function SaintgobainGoodsTable({ data, rawQuotationData, headerNode, footerNode }: SaintgobainGoodsTableProps) {
  const rawLineItems = (rawQuotationData?.Category_1_MM_Database_WMW_2_0 as any[]) || []
  const rawProductDetails = (rawQuotationData?.Category_1_MM_Database_WMW as any[]) || []

  const currency = data.currency || rawQuotationData?.Currency || 'USD'
  const currencySymbol = currency

  const template = String(rawQuotationData?.Template ?? '').trim().toLowerCase()
  const isCategory2Selected = template.includes('category 2') && template.includes('wi')

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

  const transaction = quotationScalarFieldPresent(rawQuotationData?.Transaction_Charges)
    ? parseFloat(String(rawQuotationData?.Transaction_Charges).replace(/,/g, '')) || 0
    : 0

  const chargeTotalsResolved = resolveWmwChargeTotals(rawQuotationData)
  const freightChargeAmt = chargeTotalsResolved.freightTotal
  const packingChargeAmt = chargeTotalsResolved.packingTotal
  const seamChargeAmt = chargeTotalsResolved.seamTotal
  const otherChargesAmt = quotationScalarFieldPresent(rawQuotationData?.Other_Charges)
    ? parseFloat(String(rawQuotationData?.Other_Charges).replace(/,/g, '').trim()) || 0
    : 0
  const typeOfOtherCharges = String(rawQuotationData?.Type_of_Other_Charges ?? '').trim()
  const otherChargesLabel = typeOfOtherCharges ? `Other Charges (${typeOfOtherCharges})` : 'Other Charges'
  const chargesSum = freightChargeAmt + packingChargeAmt + seamChargeAmt + otherChargesAmt

  const bashundharaChargeRows: readonly [string, number][] = filterNonZeroWmwChargeRows([
    [WMW_STANDARD_CHARGE_NAMES.FREIGHT, freightChargeAmt],
    [WMW_STANDARD_CHARGE_NAMES.PACKING, packingChargeAmt],
    [WMW_STANDARD_CHARGE_NAMES.SEAM, seamChargeAmt],
    [otherChargesLabel, otherChargesAmt],
  ])

  const portOfDischarge = rawQuotationData?.Port_of_Discharge || ''
  const finalDestination = rawQuotationData?.Final_Destination || portOfDischarge || ''
  const modeOfDelivery = rawQuotationData?.Mode_of_Delivery || data.termsOfDelivery || 'Road'

  const destLabel = finalDestination || portOfDischarge || 'Benapole'
  const transportMethod = modeOfDelivery || 'Road'

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

    const wi20Rows = toRowArray((rawQuotationData as any)?.Category_1_MM_Database_WI_2_0)
    const lineItemRef = String(index + 1)
    const wi20Line =
      (itemRef
        ? wi20Rows.find(
            (x: any) => String(x?.last_item_ref ?? x?.Last_item_ref ?? '').trim() === itemRef
          )
        : undefined) ||
      wi20Rows.find((x: any) => String(x?.Line_Item_ref ?? '').trim() === lineItemRef) ||
      wi20Rows[index]

    const rows3Cat2Linked = toRowArray((rawQuotationData as any)?.Category_2_MM_Database_WMW_3_0)
    const ext3Cat2 =
      (itemRef
        ? rows3Cat2Linked.find(
            (x: any) => String(x?.last_item_ref ?? x?.Last_item_ref ?? '').trim() === itemRef
          )
        : undefined) ||
      rows3Cat2Linked.find((x: any) => String(x?.Line_Item_ref ?? '').trim() === lineItemRef) ||
      rows3Cat2Linked[index]

    /** Delivery: WMW 3.0 linked row — Cat 1 vs Cat 2 by template (API `delivery` / `Delivery`). */
    const delivery = isCategory2Selected
      ? firstField([ext3Cat2], 'delivery') || firstField([ext3Cat2], 'Delivery')
      : firstField([ext3], 'delivery') || firstField([ext3], 'Delivery')

    // Saintgobain: same as Seamp — product from WMW 2.0 Blend_Category only.
    const blendCategory = firstField([item], 'Blend_Category')
    const endType = firstField([ext3, item, productDetail], 'End_Type')
    const materialCode =
      firstField([wi20Line], 'Material_Code') || firstField([wi20Line], 'Material')
    /** Same precedence as `resolveCategory1WmwHsnCode`: WMW 2_0 → WMW 3_0 → main WMW row */
    const hsnCode = firstField([item, ext3, productDetail], 'HSN_Code')

    const parseDimNumber = (value: unknown): number => {
      const s = String(value ?? '').trim()
      if (!s) return 0
      const match = s.match(/(\d+(\.\d+)?)/)
      const n = match ? parseFloat(match[1]) : NaN
      return Number.isFinite(n) ? n : 0
    }

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

    const lenNum = parseDimNumber(productDetail.Length_field)
    const widNum = parseDimNumber(productDetail.Width)
    const computedSqmArea = lenNum > 0 && widNum > 0 ? (lenNum * widNum) : 0
    const sqmArea =
      computedSqmArea > 0
        ? computedSqmArea.toFixed(4)
        : (productDetail.Total_SQM?.trim() || productDetail.SQM?.trim() || '')
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

    const cat2WmwMainRows = toRowArray((rawQuotationData as any)?.Category_2_MM_Database_WMW)
    const cat2ProductDetail = itemRef
      ? cat2WmwMainRows.find(
          (pd: any) => pd.last_item_ref?.trim() === itemRef || pd.Last_item_ref?.trim() === itemRef
        ) || cat2WmwMainRows[index] || {}
      : cat2WmwMainRows[index] || {}

    const fitmentRows = toRowArray((rawQuotationData as any)?.Product_Fitments2_0)
    const fitmentRow =
      fitmentRows.find((x: any) => String(x?.S_No ?? '').trim() === String(index + 1)) || fitmentRows[index]

    const productCodeForMesh = firstField([productDetail, cat2ProductDetail, fitmentRow], 'Product_Code')
    const mesh = meshInchFromProductCode(productCodeForMesh)
    const brand = productDetail.Brand_Selling_Name?.trim() || ''

    const wiLine = data.lineItems?.[index]
    /** Product row: Blend_Category only; if missing, keep it blank. */
    const product = blendCategory || ''
    /** Form row: End_Type from subform join; then Supply_Form / transformed line. */
    const form = endType || productDetail.Supply_Form?.trim() || wiLine?.form?.trim() || ''
    /** Quality: keep "AISI" constant; append Material code when present. */
    const quality = materialCode ? `AISI ${materialCode}` : 'AISI'

    // Net Weight (Kg.) Per Pc. mapping:
    // Category 1 → Category_1_MM_Database_WMW_3_0.Net_Weight
    // Category 2 → Category_2_MM_Database_WI_3_0.Net_Weight
    // Else (no category signal) → Product_Fitments2_0.Net_Weight
    const perPcFromCategory = pickNetWeightPerPc(itemRef, index)
    const perPc =
      perPcFromCategory > 0
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
      delivery,
      rate,
      amount,
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
      sqmArea: item.subQty || '',
      quantity,
      delivery: item.delivery?.trim() || '',
      rate,
      amount,
      perPc,
      totalWeight,
    }
  })

  const displayLineItems = lineItemsFromZoho.length > 0 ? lineItemsFromZoho : lineItemsFallback

  const lineSum = displayLineItems.reduce((s, it) => s + (it.amount || 0), 0)

  const baseAmount =
    subformTotalSaleValue > 0
      ? subformTotalSaleValue
      : subformCostBeforeTax > 0
        ? subformCostBeforeTax
        : lineSum > 0
          ? lineSum
          : data.totalAmount

  const totalWithCharges = baseAmount + chargesSum + transaction
  const overallGrandRaw = rawQuotationData?.Overall_Grand_Total_incl_Accessories
  const overallGrandParsed =
    overallGrandRaw !== undefined &&
    overallGrandRaw !== null &&
    String(overallGrandRaw).trim() !== ''
      ? parseFloat(String(overallGrandRaw).replace(/,/g, ''))
      : NaN
  const displayGrandTotal = Number.isFinite(overallGrandParsed) ? overallGrandParsed : totalWithCharges
  const amountInWords = numberToWords(displayGrandTotal)
  const currencyWords = currency === 'USD' ? 'US Dollars' : currency === 'INR' ? 'Indian Rupees' : currency

  const bashundharaWeightTolerance = ' (± 5%)'
  const formatSaintgobainKgDisplay = (raw: unknown): string => {
    const t = String(raw ?? '').trim()
    if (!t) return ''
    const n = parseFloat(t.replace(/,/g, ''))
    if (!Number.isFinite(n)) return `${t} Kgs.`
    const out = Number.isInteger(n) ? String(n) : n.toFixed(2)
    return `${out} Kgs.`
  }

  const netWeightPerPcsRaw = rawQuotationData?.Net_Weight_Per_Pcs
  const totalNetWeightRaw = rawQuotationData?.Total_Net_Weight
  const grossWeightForBand = quotationScalarFieldPresent(rawQuotationData?.Gross_Weight)
    ? rawQuotationData?.Gross_Weight
    : rawQuotationData?.Total_Gross_Weight

  const bashundharaWeightLines: { label: string; valueDisplay: string }[] = []
  if (quotationScalarFieldPresent(netWeightPerPcsRaw)) {
    bashundharaWeightLines.push({
      label: 'Net Weight (Per Pcs.)',
      valueDisplay: formatSaintgobainKgDisplay(netWeightPerPcsRaw),
    })
  }
  if (quotationScalarFieldPresent(totalNetWeightRaw)) {
    bashundharaWeightLines.push({
      label: 'Total Net Weight',
      valueDisplay: formatSaintgobainKgDisplay(totalNetWeightRaw),
    })
  }
  if (quotationScalarFieldPresent(grossWeightForBand)) {
    bashundharaWeightLines.push({
      label: 'Total Gross Weight',
      valueDisplay: formatSaintgobainKgDisplay(grossWeightForBand),
    })
  }
  const showSaintgobainWeightBand = bashundharaWeightLines.length > 0

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
            className={`quotation-goods-pages-segment ${!isLastChunk ? 'quotation-goods-pages-break' : ''}`}
            style={{ pageBreakInside: 'avoid', marginTop: pageIdx > 0 ? '-1px' : '0' }}
          >
            <div className="quotation-seamless-stack">
              {headerNode}
              
              <table
                className="goods-description-table quotation-stack-table bashundhara-goods-table"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #000',
                  marginTop: 0,
                  tableLayout: 'fixed',
                  fontSize: '10px',
                }}
              >
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '28%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '19%' }} />
                </colgroup>
                <tbody>
                  <tr className="bashundhara-goods-title-row">
                    <td colSpan={2} style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', verticalAlign: 'middle' }}>
                      Description of Goods
                    </td>
                    <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', verticalAlign: 'middle' }}>
                      HSN Code
                    </td>
                    <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                      Quantity<br />UOM
                    </td>
                    <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                      Rate<br />{currencySymbol === 'USD' ? 'USD / UOM' : `${currencySymbol} / UOM`}
                    </td>
                    <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                      Amount<br />{currencySymbol}
                    </td>
                  </tr>

                  {chunk.map((row, index) => (
                    <Fragment key={`bashundhara-line-${pageIdx}-${index}`}>
                      <tr className="bashundhara-item-meta-row">
                        <td colSpan={2} style={{ ...bdProductMeta, padding: '8px 10px 4px 10px', verticalAlign: 'top' }}>
                          <div style={metaRowLine}>
                            <span>Product</span><span>:</span><span style={metaRowValue}>{row.product}</span>
                          </div>
                          {row.form ? (
                            <div style={metaRowLine}>
                              <span>Form</span><span>:</span><span style={metaRowValue}>{row.form}</span>
                            </div>
                          ) : null}
                          <div style={{ ...metaRowLine, marginBottom: 0 }}>
                            <span>Quality</span><span>:</span><span style={metaRowValue}>{row.quality}</span>
                          </div>
                        </td>
                        <td style={{ ...bdProductMeta, padding: '6px 4px', verticalAlign: 'top' }} />
                        <td style={rightMergedEmpty} />
                        <td style={rightMergedEmpty} />
                        <td style={rightMergedEmpty} />
                      </tr>
                      <tr className="bashundhara-item-grid-row">
                        <td colSpan={2} style={{ ...bdItemGrid, padding: '6px 10px', verticalAlign: 'middle' }}>
                          <div style={{ ...descGrid, fontWeight: 'bold', marginBottom: '6px' }}>
                            <span>Item</span>
                            <span>MESH</span>
                            <span>BRAND</span>
                            <span>SIZE [Mtrs] (LxW)</span>
                            <span>Sqm Area / PC</span>
                          </div>
                          <div style={descGrid}>
                            <span style={{ fontWeight: 'bold', textDecoration: 'underline', whiteSpace: 'nowrap' }}>{row.item}</span>
                            <span style={{ whiteSpace: 'nowrap' }}>{row.mesh}</span>
                            <span style={{ whiteSpace: 'nowrap' }}>{row.brand}</span>
                            <span style={{ whiteSpace: 'nowrap' }}>{row.size}</span>
                            <span style={{ whiteSpace: 'nowrap' }}>{row.sqmArea}</span>
                          </div>
                        </td>
                        <td style={{ ...bdItemGrid, padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', wordBreak: 'break-word' }}>
                          {row.hsnCode || ''}
                        </td>
                        <td style={{ ...bdItemGrid, padding: '6px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <span>{row.quantity}</span>
                            <span>Pcs</span>
                          </div>
                        </td>
                        <td style={{ ...bdItemGrid, padding: '6px', textAlign: 'right', verticalAlign: 'middle' }}>
                          {Number.isFinite(row.rate) ? formatCurrency(row.rate, currency) : ''}
                        </td>
                        <td style={{ ...bdItemGrid, padding: '6px', textAlign: 'right', verticalAlign: 'middle' }}>
                          {formatCurrency(row.amount, currency)}
                        </td>
                      </tr>
                    </Fragment>
                  ))}

                  {isLastChunk && (
                    <>
                      {showSaintgobainWeightBand ? (
                        <tr className="bashundhara-weight-summary-row">
                          <td
                            colSpan={2}
                            style={{
                              ...bdSides,
                              borderTop: 'none',
                              borderBottom: 'none',
                              padding: '8px 10px',
                              verticalAlign: 'middle',
                              textAlign: 'center',
                              fontSize: '10px',
                              lineHeight: 1.55,
                            }}
                          >
                            {bashundharaWeightLines.map((line, wIdx) => (
                              <div
                                key={line.label}
                                style={{
                                  marginBottom: wIdx < bashundharaWeightLines.length - 1 ? '8px' : 0,
                                  fontWeight: 'bold',
                                }}
                              >
                                <span style={{ textDecoration: 'underline' }}>{line.label}</span>
                                <span>: </span>
                                <span>{line.valueDisplay}</span>
                                <span>{bashundharaWeightTolerance}</span>
                              </div>
                            ))}
                          </td>
                          {Array.from({ length: 4 }, (_, i) => (
                            <td key={`bashundhara-weight-filler-${i}`} style={bashundharaWeightBandFillerTd} aria-hidden>
                              {'\u00A0'}
                            </td>
                          ))}
                        </tr>
                      ) : null}

                      {bashundharaChargeRows.map(([chargeLabel, chargeAmt], chargeIdx) => (
                        <tr key={`bashundhara-charge-${chargeIdx}`}>
                          <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', verticalAlign: 'top' }}>
                            {chargeLabel}
                          </td>
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px' }} />
                          <td style={{ ...bdSides, padding: '6px', textAlign: 'right' }}>
                            {formatCurrency(chargeAmt, currency)}
                          </td>
                        </tr>
                      ))}

                      <tr>
                        <td colSpan={6} style={{ ...bd, padding: '4px 10px', textAlign: 'center', fontWeight: 'bold' }}>Transport</td>
                      </tr>

                      <tr>
                        <td colSpan={6} style={{ ...bd, padding: '4px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                          Total CFR Price upto {destLabel} By {transportMethod}
                        </td>
                      </tr>

                      <tr>
                        <td colSpan={4} style={{ ...bd, padding: '6px 10px', fontSize: '9px', verticalAlign: 'top' }}>
                          <span>
                            Note : If the total order value is less than {currencySymbol} 2500, transaction fee of {currencySymbol} 100 per invoice
                            shall be charged extra
                          </span>
                        </td>
                        <td style={{ ...bd, padding: '6px', textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle', width: '10%' }}>
                          <span>{currency}</span>
                        </td>
                        <td style={{ ...bd, padding: '6px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'middle', width: '18%' }}>
                          <span className="quotation-grand-total-amount">{formatCurrency(displayGrandTotal, currency)}</span>
                        </td>
                      </tr>

                      <tr>
                        <td style={{ ...bd, padding: '4px 8px', fontSize: '10px', verticalAlign: 'top', width: '14%' }}>
                          <span style={{ fontWeight: 'bold', display: 'block', lineHeight: 1.2 }}>Amount Chargeable<br />(In words) :</span>
                        </td>
                        <td colSpan={3} style={{ ...bd, padding: '4px 8px', fontWeight: 'bold', verticalAlign: 'middle', fontSize: '11px', width: '58%' }}>
                          {currencyWords} {amountInWords} Only
                        </td>
                        <td style={{ ...bd, padding: '4px 8px', textAlign: 'right', verticalAlign: 'middle', fontWeight: 'bold', fontSize: '11px', width: '10%' }}>
                          Total:-
                        </td>
                        <td style={{ ...bd, padding: '4px 8px', textAlign: 'right', verticalAlign: 'middle', fontWeight: 'bold', fontSize: '11px', width: '18%' }}>
                          <span className="quotation-grand-total-amount">{formatCurrency(displayGrandTotal, currency)}</span>
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
