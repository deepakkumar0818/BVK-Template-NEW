'use client'

import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { QuotationData } from '@/lib/types'
import { formatCurrency, numberToWords } from '@/lib/quotation-utils'
import { quotationScalarFieldPresent, resolveWmwChargeTotals } from '@/lib/wmw-subform-mapping'

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
  const rawLineItems = (rawQuotationData?.Category_1_MM_Database_WMW_2_0 as any[]) || []
  const rawProductDetails = (rawQuotationData?.Category_1_MM_Database_WMW as any[]) || []

  const currency = data.currency || rawQuotationData?.Currency || 'EUR'
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
  const freightChargeAmt = chargeTotalsResolved.freightTotal
  const packingChargeAmt = chargeTotalsResolved.packingTotal
  const seamChargeAmt = chargeTotalsResolved.seamTotal
  const otherChargesAmt = quotationScalarFieldPresent(rawQuotationData?.Other_Charges)
    ? parseFloat(String(rawQuotationData?.Other_Charges).replace(/,/g, '').trim()) || 0
    : 0
  const chargesSum = freightChargeAmt + packingChargeAmt + seamChargeAmt + otherChargesAmt

  const modeOfDelivery = rawQuotationData?.Mode_of_Delivery || data.termsOfDelivery || 'Air'

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

    const blendCategory = firstField([item], 'Blend_Category')
    const endType = firstField([ext3, item, productDetail], 'End_Type')
    const materialCode =
      firstField([wi20Line], 'Material_Code') || firstField([wi20Line], 'Material')

    const parseDimNumber = (value: unknown): number => {
      const s = String(value ?? '').trim()
      if (!s) return 0
      const match = s.match(/(\d+(\.\d+)?)/)
      const n = match ? parseFloat(match[1]) : NaN
      return Number.isFinite(n) ? n : 0
    }

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

    const lenNum = parseDimNumber(productDetail.Length_field)
    const widNum = parseDimNumber(productDetail.Width)
    const computedSqmArea = lenNum > 0 && widNum > 0 ? lenNum * widNum : 0
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
    const form = endType || productDetail.Supply_Form?.trim() || wiLine?.form?.trim() || ''
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
      sqmArea: item.subQty || '',
      quantity,
      rate,
      amount,
      uom: 'Roll',
      perPc,
      totalWeight,
      remarks: String((item as { remarks?: string }).remarks ?? '').trim(),
      hsnCode: item.hsnCode?.trim() || '',
    }
  })

  const displayLineItems = lineItemsFromZoho.length > 0 ? lineItemsFromZoho : lineItemsFallback

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
  const currencyWords =
    currency === 'USD' ? 'US Dollars' : currency === 'INR' ? 'Indian Rupees' : currency === 'EUR' ? 'Euro' : currency

  const renderQtyUomCell = (qty: unknown, uom: unknown) => {
    const qtyText = String(qty ?? '').trim()
    const uomText = String(uom ?? '').trim()
    return (
      <div className="quotation-qty-uom-cell">
        <div className="quotation-qty-value">{qtyText || '\u00A0'}</div>
        {uomText ? <div className="quotation-qty-uom">{uomText}</div> : null}
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
            <colgroup>
              <col style={{ width: '44%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td style={{ ...bd, padding: '12px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                  Description of Goods
                </td>
                <td style={{ ...bd, padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', verticalAlign: 'middle' }}>
                  HSN Code
                </td>
                <td style={{ ...bd, padding: '6px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                  <div style={{ marginBottom: '4px' }}>Quantity</div>
                  <div>UOM</div>
                </td>
                <td style={{ ...bd, padding: '6px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                  <div style={{ marginBottom: '4px' }}>Rate</div>
                  <div style={{ fontSize: '10px' }}>{currencySymbol} / UOM</div>
                </td>
                <td style={{ ...bd, padding: '6px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                  <div style={{ marginBottom: '4px' }}>Amount</div>
                  <div>{currencySymbol}</div>
                </td>
              </tr>

              {displayLineItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...contentBdSides, padding: '8px 10px', textAlign: 'center' }}>
                    No line items
                  </td>
                </tr>
              ) : (
                displayLineItems.map((row, idx) => (
                  <Fragment key={`saint-line-${row.item}-${idx}`}>
                    <tr>
                      <td style={{ ...contentBdSides, padding: '8px 10px 0px 10px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>
                          {idx === 0 ? 'Trial Batch' : row.product || `Item ${row.item}`}
                        </div>
                        <div style={{ ...metaGrid }}>
                          <span>Product</span>
                          <span>:</span>
                          <span>{row.product || '\u00A0'}</span>
                        </div>
                        <div style={{ ...metaGrid }}>
                          <span>Form</span>
                          <span>:</span>
                          <span>{row.form || '\u00A0'}</span>
                        </div>
                        <div style={{ ...metaGrid, marginBottom: idx === displayLineItems.length - 1 ? '16px' : '8px' }}>
                          <span>Quality</span>
                          <span>:</span>
                          <span>{row.quality || '\u00A0'}</span>
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
                          <span style={{ ...descGridCell, lineHeight: 1.25 }}>Size [m] (L x W)</span>
                          <span style={{ ...descGridCell, lineHeight: 1.25, textAlign: 'right' }}>Sqm Area / PC</span>
                        </div>
                      </td>
                      <td style={contentBdSides} />
                      <td style={contentBdSides} />
                      <td style={contentBdSides} />
                      <td style={contentBdSides} />
                    </tr>
                    <tr>
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
                            <span style={{ ...descGridCell, gridColumn: 4, gridRow: 1 }}>{row.size || '\u00A0'}</span>
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
                            <span style={descGridCell}>{row.size || '\u00A0'}</span>
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
                      </td>
                      <td style={{ ...contentBdSides, padding: '4px 10px', textAlign: 'right', verticalAlign: 'top' }}>
                        {Number.isFinite(row.rate) ? formatCurrency(row.rate, currency) : ''}
                      </td>
                      <td style={{ ...contentBdSides, padding: '4px 10px', textAlign: 'right', verticalAlign: 'top' }}>
                        {formatCurrency(row.amount, currency)}
                      </td>
                    </tr>
                  </Fragment>
                ))
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
                <td style={{ ...bd, padding: '4px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(baseAmount, currency)}
                </td>
              </tr>

              <tr>
                <td style={{ ...bd, padding: '10px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'middle' }}>
                  Add : DAP by Air
                </td>
                <td style={bd} />
                <td style={{ ...bd, padding: '6px 8px', verticalAlign: 'middle' }}>
                  {renderQtyUomCell(primaryQty > 0 ? primaryQty : '', primaryLine?.uom || 'Rolls')}
                </td>
                <td style={{ ...bd, padding: '6px 10px', textAlign: 'right', verticalAlign: 'middle' }}>
                  {dapChargesTotal > 0 && primaryQty > 0 ? formatCurrency(dapRate, currency) : ''}
                </td>
                <td style={{ ...bd, padding: '6px 10px', textAlign: 'right', verticalAlign: 'middle' }}>
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
                  <div>
                    Total DAP Price upto Saint-Gobain, Willich - by {modeOfDelivery} &amp; Then Road
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '12px' }}>( Transport Time Estimated between 13 - 16 days )</div>
                </td>
                <td style={bd} />
                <td colSpan={2} style={bd} />
                <td style={bd} />
              </tr>

              <tr>
                <td style={{ ...bd, padding: '6px 10px', fontSize: '10px' }}>
                  Note : If the total order value is less than {currencySymbol} 2500, transaction fee of {currencySymbol} 100 per
                  invoice shall be charged extra
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
                        {currencyWords} {amountInWords} Only
                      </span>
                      <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Total:-</span>
                    </div>
                  </div>
                </td>
                <td
                  style={{
                    ...bd,
                    padding: '8px 10px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    verticalAlign: 'middle',
                  }}
                >
                  <span className="quotation-grand-total-amount">{formatCurrency(displayGrandTotal, currency)}</span>
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
