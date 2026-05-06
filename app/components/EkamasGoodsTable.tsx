'use client'

import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { QuotationData, ZohoQuotation } from '@/lib/types'
import { formatCurrency, numberToWords, resolveQuotationValidity, meshInchFromProductCode } from '@/lib/quotation-utils'
import { endTypeDisplayFromRecords } from '@/lib/goods-description-form'
import { buildProductFitmentBrandedGoodsBlock, renumberMergedGoodsItems } from '@/lib/product-fitment-goods-block'
import { resolveWmwChargeTotals } from '@/lib/wmw-subform-mapping'
import { groupChunkRowsByProductFormQuality } from '@/lib/goods-meta-grouping'
import { goodsDescGridValueSpan } from '@/lib/goods-desc-grid-styles'

const bd: CSSProperties = { border: '1px solid #000' }

const bdSides: CSSProperties = {
  borderLeft: '1px solid #000',
  borderRight: '1px solid #000',
}

const bdProductBlock: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: 'none',
  padding: '8px 10px',
  verticalAlign: 'top',
}

const bdTitleRow: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: '1px solid #000',
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

/** HSN / Qty / Rate / Amount cells — aligned with description value rows (group sub-header is a separate table row). */
const ekamasRightValueCell: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: 'none',
  padding: '10px 6px',
  paddingTop: '46px',
  textAlign: 'center',
  verticalAlign: 'top',
  fontWeight: 'bold',
}

const ekamasRightPlaceholderCell: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: 'none',
  padding: '10px 6px',
  textAlign: 'center',
  verticalAlign: 'top',
  fontWeight: 'bold',
}

interface EkamasGoodsTableProps {
  data: QuotationData
  rawQuotationData?: Record<string, unknown> | null
  headerNode?: ReactNode
  /** Shown on Signature & Date line (e.g. 6-Feb-24) */
  signatureDate?: string
}

interface EkamasDisplayRow {
  item: number
  product: string
  form: string
  quality: string
  /** Same precedence as Adhunik/Everite: WMW 2_0 → WMW 3_0 → main product (`HSN_Code`). */
  hsnCode: string
  mesh: string
  brand: string
  size: string
  sqmArea: string
  quantity: number
  rate: number
  amount: number
  /** Per-line kg (Net_Weight_Per_Pcs × Qty); summed for document total when Zoho has no Total_Gross_Weight */
  lineGrossKg: number
}

export default function EkamasGoodsTable({
  data,
  rawQuotationData,
  headerNode,
  signatureDate = '',
}: EkamasGoodsTableProps) {
  const defaultProductLabel = 'Stainless Steel Wire Cloth'

  const toRowArray = (v: unknown): any[] => {
    if (v == null) return []
    if (Array.isArray(v)) return v
    if (typeof v === 'object') return [v]
    return []
  }

  /** Category 1 WMW lines take precedence when present; otherwise Category 2 WMW (e.g. Template "Category 2 WMW"). */
  const cat1Wmw20 = toRowArray(rawQuotationData?.Category_1_MM_Database_WMW_2_0)
  const cat2Wmw20 = toRowArray(rawQuotationData?.Category_2_MM_Database_WMW_2_0)
  const useCat1WmwBundle = cat1Wmw20.length > 0
  const rawLineItems = (useCat1WmwBundle ? cat1Wmw20 : cat2Wmw20) as Record<string, string>[]

  const cat1WmwMainRows = toRowArray(rawQuotationData?.Category_1_MM_Database_WMW)
  const cat2WmwMainRows = toRowArray(rawQuotationData?.Category_2_MM_Database_WMW)
  const rawProductDetails = (useCat1WmwBundle ? cat1WmwMainRows : cat2WmwMainRows) as Record<string, string>[]

  const firstField = (records: unknown[], field: string): string => {
    for (const r of records) {
      if (r == null || typeof r !== 'object') continue
      const s = String((r as Record<string, unknown>)[field] ?? '').trim()
      if (s) return s
    }
    return ''
  }

  const currency = data.currency || (rawQuotationData?.Currency as string) || 'USD'
  const currencySymbol = currency

  const subformBreakdown = (rawQuotationData?.Subform_Breakdown as Record<string, string>[]) || []
  const category1WMWSubform = subformBreakdown.find(
    (sf) => sf.Subform?.includes('Category 1 WMW') || sf.Subform === 'Category 1 WMW'
  )
  const activeSubform =
    category1WMWSubform ||
    subformBreakdown.find((sf) => parseFloat(sf.Total_Sale_Value || '0') > 0 || parseFloat(sf.Cost_Before_Tax || '0') > 0) ||
    subformBreakdown[0]

  const subformTotalSaleValue = parseFloat(activeSubform?.Total_Sale_Value || '0') || 0
  const subformCostBeforeTax = parseFloat(activeSubform?.Cost_Before_Tax || '0') || 0

  const packingFreight = parseFloat(String(rawQuotationData?.Packing_Freight || '0')) || 0
  const transaction = parseFloat(String(rawQuotationData?.Transaction_Charges || '0')) || 0
  const { discountTotal: overallDiscountAmt, discountLabel: overallDiscountLabel } = resolveWmwChargeTotals(
    (rawQuotationData ?? null) as ZohoQuotation | null
  )
  const discountDeduct = Math.max(0, overallDiscountAmt)

  const portOfDischarge = String(rawQuotationData?.Port_of_Discharge || '')
  const finalDestination = String(rawQuotationData?.Final_Destination || portOfDischarge || '')
  const modeOfDelivery =
    String(rawQuotationData?.Mode_of_Delivery || data.termsOfDelivery || 'Sea')

  const destPortLabel = portOfDischarge || finalDestination || 'Surabaya'
  const transportLabel = modeOfDelivery || 'Sea'

  const defaultWarranty =
    'Warranty: 3 Months from date of received goods against manufacturing defects only.'
  const defaultPacking =
    'Packing: One corrugated box, box size as per standard export packing suitable for sea shipment.'
  const grossFromRaw = rawQuotationData?.Total_Gross_Weight as string | undefined

  const lineItemsFromZoho: EkamasDisplayRow[] = rawLineItems.map((item, index) => {
    const itemRef = item.last_item_ref?.trim() || item.Last_item_ref?.trim() || ''
    const productDetail = itemRef
      ? rawProductDetails.find(
          (pd) => pd.last_item_ref?.trim() === itemRef || pd.Last_item_ref?.trim() === itemRef
        ) || rawProductDetails[index] || {}
      : rawProductDetails[index] || {}

    const wmw30Key = useCat1WmwBundle ? 'Category_1_MM_Database_WMW_3_0' : 'Category_2_MM_Database_WMW_3_0'
    const rows3Linked = toRowArray((rawQuotationData as Record<string, unknown> | null)?.[wmw30Key])
    const ext3 =
      (itemRef
        ? rows3Linked.find(
            (x: Record<string, unknown>) =>
              String(x?.last_item_ref ?? x?.Last_item_ref ?? '').trim() === itemRef
          )
        : undefined) || rows3Linked[index]

    let size = ''
    if (item.Invoice_Dimension_1 && item.Invoice_Dimension_2) {
      const extractNumber = (str: string) => {
        const match = str.match(/(\d+\.?\d*)/)
        return match ? match[1] : str.replace(/Length|length|Width|width/gi, '').trim()
      }
      const dim1 = extractNumber(item.Invoice_Dimension_1)
      const dim2 = extractNumber(item.Invoice_Dimension_2)
      size = `${dim1} x ${dim2}`
    } else {
      const len = String(productDetail.Length_field ?? productDetail.Supply_Dimension_1 ?? '').trim()
      const wid = String(productDetail.Width ?? productDetail.Supply_Dimension_2 ?? '').trim()
      if (len && wid) size = `${len} x ${wid}`
    }

    const sqmArea = productDetail.Total_SQM?.trim() || productDetail.SQM?.trim() || ''
    const quantity = parseFloat(productDetail.Qty?.trim() || item.Qty?.trim() || '0')
    const rateStr = item.Selling_Price?.replace(/,/g, '') || ''
    const rate = rateStr ? (parseFloat(rateStr) || 0) : NaN
    const amountFromLine = parseFloat(item.Net_Selling_Amount?.replace(/,/g, '') || item.Gross_Amount?.replace(/,/g, '') || '0')
    const computedAmount = quantity * rate
    const amount = Number.isFinite(computedAmount) ? computedAmount : amountFromLine

    const cat2ProductDetail = itemRef
      ? cat2WmwMainRows.find(
          (pd: Record<string, unknown>) =>
            String(pd.last_item_ref ?? pd.Last_item_ref ?? '').trim() === itemRef
        ) || cat2WmwMainRows[index] || {}
      : cat2WmwMainRows[index] || {}
    const cat1ProductDetail = itemRef
      ? cat1WmwMainRows.find(
          (pd: Record<string, unknown>) =>
            String(pd.last_item_ref ?? pd.Last_item_ref ?? '').trim() === itemRef
        ) || cat1WmwMainRows[index] || {}
      : cat1WmwMainRows[index] || {}

    const fitmentRows = toRowArray((rawQuotationData as Record<string, unknown> | null)?.Product_Fitments2_0)
    const fitmentRow =
      fitmentRows.find(
        (x: Record<string, unknown>) => String(x?.S_No ?? '').trim() === String(index + 1)
      ) || fitmentRows[index]

    /** MESH: same as other WMW goods tables — first non-empty `Product_Code` across main / Cat2 / Cat1 / fitment rows. */
    const productCodeForMesh = firstField(
      [productDetail, cat2ProductDetail, cat1ProductDetail, fitmentRow],
      'Product_Code'
    )
    const mesh = meshInchFromProductCode(productCodeForMesh)
    const brand = productDetail.Brand_Selling_Name?.trim() || ''

    /** Same as Adhunik / Everite: `HSN_Code` on WMW 2_0 → 3_0 → main. */
    const hsnCode = firstField([item, ext3, productDetail], 'HSN_Code')

    const wiLine = data.lineItems?.[index]
    /** Product column: Zoho Blend_Category (WMW product / 2.0 line), then name fields / transformed line */
    const product =
      String(productDetail.Blend_Category ?? '').trim() ||
      String(item.Blend_Category ?? '').trim() ||
      productDetail.Product_Name?.trim() ||
      productDetail.Product_Master?.trim() ||
      wiLine?.product?.trim() ||
      defaultProductLabel
    /** Form column: Zoho `End_Type` only (WMW 3_0 → 2_0 line → main). */
    const form = endTypeDisplayFromRecords(ext3 as Record<string, unknown>, item as Record<string, unknown>, productDetail as Record<string, unknown>)
    const quality = wiLine?.quality?.trim() || ''

    const perPc = parseFloat(productDetail.Net_Weight_Per_Pcs || '0') || (index === 0 ? 50 : 50)
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
      lineGrossKg: totalWeight,
    }
  })

  const lineItemsFallback: EkamasDisplayRow[] = (data.lineItems || []).map((item, index) => {
    const rate = parseFloat(String(item.rate).replace(/,/g, '')) || 0
    const amount = parseFloat(String(item.amount).replace(/,/g, '')) || 0
    const quantity = parseFloat(String(item.qty).replace(/,/g, '')) || 0
    const dummyWeight = quantity * 50
    return {
      item: index + 1,
      product: item.product?.trim() || defaultProductLabel,
      form: item.form?.trim() || '',
      quality: item.quality?.trim() || '',
      hsnCode: item.hsnCode?.trim() || '',
      mesh: '',
      brand: item.type || item.form || '',
      size: item.size || '',
      sqmArea: item.subQty || '',
      quantity,
      rate,
      amount,
      lineGrossKg: dummyWeight,
    }
  })

  const wmw2DriverRows = useCat1WmwBundle ? cat1Wmw20 : cat2Wmw20
  const wmwMappedBlock = wmw2DriverRows.length > 0 ? lineItemsFromZoho : []
  const fitmentMappedBlock = buildProductFitmentBrandedGoodsBlock(
    (rawQuotationData ?? null) as ZohoQuotation | null
  ).map((f) => ({
    item: 0,
    product: f.product,
    form: f.form,
    quality: f.quality,
    hsnCode: f.hsnCode,
    mesh: f.mesh || f.brandCategoryForMeshCol,
    brand: f.brand,
    size: f.size,
    sqmArea: f.sqmArea,
    quantity: f.quantity,
    rate: f.rate,
    amount: f.amount,
    lineGrossKg: f.totalWeight,
  }))

  let displayLineItems: EkamasDisplayRow[] =
    wmwMappedBlock.length + fitmentMappedBlock.length > 0
      ? renumberMergedGoodsItems([...wmwMappedBlock, ...fitmentMappedBlock])
      : lineItemsFromZoho.length > 0
        ? lineItemsFromZoho
        : lineItemsFallback

  if (displayLineItems.length === 0) {
    displayLineItems = [
      {
        item: 1,
        product: 'Stainless Steel Wire Cloth',
        form: 'Endless Diagonal Seam',
        quality: 'AISI 316L',
        hsnCode: '7314',
        mesh: '50/Inch',
        brand: 'Formx-050',
        size: '3.941 x 3.100',
        sqmArea: '12.2171',
        quantity: 2,
        rate: 1100,
        amount: 2200,
        lineGrossKg: 100,
      },
    ]
  }

  const documentGrossWeightLine = (() => {
    const raw = String(grossFromRaw || '').trim()
    if (raw) return `Total gross weight: ${raw} kgs`
    const sumKg = displayLineItems.reduce((s, r) => s + (r.lineGrossKg || 0), 0)
    if (sumKg > 0) return `Total gross weight: ${sumKg.toFixed(0)} kgs`
    return 'Total gross weight: 100 kgs'
  })()

  const lineSum = displayLineItems.reduce((s, it) => s + (it.amount || 0), 0)

  const baseAmount =
    subformTotalSaleValue > 0
      ? subformTotalSaleValue
      : subformCostBeforeTax > 0
        ? subformCostBeforeTax
        : lineSum > 0
          ? lineSum
          : data.totalAmount

  const totalWithCharges = baseAmount + packingFreight + transaction - discountDeduct
  const amountInWords = numberToWords(totalWithCharges)
  const currencyWords = currency === 'USD' ? 'US Dollars' : currency === 'INR' ? 'Indian Rupees' : currency

  const offerValidity = resolveQuotationValidity(rawQuotationData as Record<string, unknown> | undefined, '3 Months')

  const chunks: EkamasDisplayRow[][] = []
  for (let i = 0; i < displayLineItems.length; i += 5) {
    chunks.push(displayLineItems.slice(i, i + 5))
  }
  if (chunks.length === 0) chunks.push([])

  return (
    <div className="quotation-goods-pages-stack">
      {chunks.map((chunk, pageIdx) => {
        const isLastChunk = pageIdx === chunks.length - 1

        return (
          <div
            key={pageIdx}
            className={`quotation-goods-pages-segment ${!isLastChunk ? 'quotation-goods-pages-break' : ''}`}
            style={{ pageBreakInside: 'avoid', marginTop: pageIdx > 0 ? '-1px' : '0' }}
          >
            <div className="quotation-seamless-stack">
              {headerNode}

              <table
                className="goods-description-table quotation-stack-table ekamas-goods-table"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '2px solid #000',
                  borderTop: 'none',
                  marginTop: '-2px',
                  tableLayout: 'fixed',
                  fontSize: '10px',
                }}
              >
                <colgroup>
                  <col style={{ width: '46%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '18%' }} />
                </colgroup>
                <tbody>
                  <tr className="ekamas-goods-title-row">
                    <td
                      style={{
                        ...bdTitleRow,
                        borderTop: '2px solid #000',
                        padding: '8px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '11px',
                      }}
                    >
                      Description of Goods
                    </td>
                    <td
                      style={{
                        ...bdTitleRow,
                        borderTop: '2px solid #000',
                        padding: '8px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '10px',
                        verticalAlign: 'middle',
                      }}
                    >
                      HSN Code
                    </td>
                    <td
                      style={{
                        ...bdTitleRow,
                        borderTop: '2px solid #000',
                        padding: '8px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '10px',
                      }}
                    >
                      Quantity
                      <br />
                      UOM
                    </td>
                    <td
                      style={{
                        ...bdTitleRow,
                        borderTop: '2px solid #000',
                        padding: '8px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '10px',
                      }}
                    >
                      Rate
                      <br />
                      {currencySymbol} / UOM
                    </td>
                    <td
                      style={{
                        ...bdTitleRow,
                        borderTop: '2px solid #000',
                        padding: '8px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '10px',
                      }}
                    >
                      Amount
                      <br />
                      {currencySymbol}
                    </td>
                  </tr>

                  {groupChunkRowsByProductFormQuality(chunk).map((groupRows, groupIdx, chunkGroups) => {
                    const head = groupRows[0]
                    return (
                      <Fragment key={`ekamas-grp-${pageIdx}-${groupIdx}`}>
                        <tr className="ekamas-item-row ekamas-item-meta-row">
                          <td
                            style={{
                              ...bdProductBlock,
                              borderTop: 'none',
                            }}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: '60px 10px auto', marginBottom: '4px', fontWeight: 'bold' }}>
                              <span>Product</span>
                              <span>:</span>
                              <span>{head.product}</span>
                            </div>
                            {head.form ? (
                              <div style={{ display: 'grid', gridTemplateColumns: '60px 10px auto', marginBottom: '4px', fontWeight: 'bold' }}>
                                <span>Form</span>
                                <span>:</span>
                                <span>{head.form}</span>
                              </div>
                            ) : null}
                            {head.quality ? (
                              <div style={{ display: 'grid', gridTemplateColumns: '60px 10px auto', marginBottom: '8px', fontWeight: 'bold' }}>
                                <span>Quality</span>
                                <span>:</span>
                                <span>{head.quality}</span>
                              </div>
                            ) : null}
                          </td>
                          <td style={ekamasRightPlaceholderCell} aria-hidden>
                            {'\u00a0'}
                          </td>
                          <td style={ekamasRightPlaceholderCell} aria-hidden>
                            {'\u00a0'}
                          </td>
                          <td style={ekamasRightPlaceholderCell} aria-hidden>
                            {'\u00a0'}
                          </td>
                          <td style={ekamasRightPlaceholderCell} aria-hidden>
                            {'\u00a0'}
                          </td>
                        </tr>
                        <tr className="ekamas-item-row ekamas-item-grid-header-row">
                          <td style={{ ...bdProductBlock, borderTop: 'none', padding: '8px 10px 4px 10px', verticalAlign: 'top' }}>
                            <div style={{ ...descGrid, fontWeight: 'bold', marginBottom: 0, fontSize: '10px' }}>
                              <span>Item</span>
                              <span>MESH</span>
                              <span>BRAND</span>
                              <span>SIZE [Mtrs] (LxW)</span>
                              <span>Sqm Area / PC</span>
                            </div>
                          </td>
                          <td style={ekamasRightPlaceholderCell} aria-hidden>
                            {'\u00a0'}
                          </td>
                          <td style={ekamasRightPlaceholderCell} aria-hidden>
                            {'\u00a0'}
                          </td>
                          <td style={ekamasRightPlaceholderCell} aria-hidden>
                            {'\u00a0'}
                          </td>
                          <td style={ekamasRightPlaceholderCell} aria-hidden>
                            {'\u00a0'}
                          </td>
                        </tr>
                        {groupRows.map((row, rowIdx) => {
                          const isLastProductRow =
                            isLastChunk &&
                            groupIdx === chunkGroups.length - 1 &&
                            rowIdx === groupRows.length - 1
                          return (
                            <tr
                              key={`ekamas-line-${pageIdx}-${groupIdx}-${rowIdx}`}
                              className="ekamas-item-row ekamas-item-values-row"
                            >
                              <td
                                style={{
                                  ...bdProductBlock,
                                  borderTop: 'none',
                                }}
                              >
                                <div
                                  style={{
                                    paddingTop: '6px',
                                  }}
                                >
                                  <div style={{ ...descGrid, alignItems: 'start' }}>
                                    <span style={{ fontWeight: 'bold', textDecoration: 'underline', ...goodsDescGridValueSpan }}>{row.item}</span>
                                    <span style={{ ...goodsDescGridValueSpan, whiteSpace: 'nowrap' }}>{row.mesh}</span>
                                    <span style={goodsDescGridValueSpan}>{row.brand}</span>
                                    <span style={goodsDescGridValueSpan}>{row.size}</span>
                                    <span style={goodsDescGridValueSpan}>{row.sqmArea}</span>
                                  </div>
                                </div>

                                {isLastProductRow ? (
                                  <div
                                    style={{
                                      borderTop: '1px solid #000',
                                      paddingTop: '8px',
                                      marginTop: '8px',
                                      lineHeight: 1.45,
                                    }}
                                  >
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{defaultWarranty}</div>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{defaultPacking}</div>
                                    <div style={{ fontWeight: 'bold' }}>{documentGrossWeightLine}</div>
                                  </div>
                                ) : null}
                              </td>
                              <td
                                style={{
                                  ...ekamasRightValueCell,
                                  paddingTop: '10px',
                                  wordBreak: 'break-word',
                                  fontSize: '10px',
                                }}
                              >
                                {row.hsnCode || ''}
                              </td>
                              <td style={{ ...ekamasRightValueCell, paddingTop: '10px' }}>{row.quantity} Pcs</td>
                              <td style={{ ...ekamasRightValueCell, paddingTop: '10px' }}>
                                {Number.isFinite(row.rate) ? formatCurrency(row.rate, '') : ''}
                              </td>
                              <td style={{ ...ekamasRightValueCell, paddingTop: '10px' }}>{formatCurrency(row.amount, '')}</td>
                            </tr>
                          )
                        })}
                      </Fragment>
                    )
                  })}

                  {isLastChunk && (
                    <>
                      {Number.isFinite(overallDiscountAmt) && overallDiscountAmt !== 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            style={{
                              borderLeft: '1px solid #000',
                              borderRight: '1px solid #000',
                              borderBottom: '1px solid #000',
                              borderTop: '1px solid #000',
                              padding: '6px 10px',
                              textAlign: 'right',
                              fontWeight: 'bold',
                              fontSize: '10px',
                              verticalAlign: 'middle',
                            }}
                          >
                            {overallDiscountLabel}
                          </td>
                          <td
                            style={{
                              borderLeft: '1px solid #000',
                              borderRight: '1px solid #000',
                              borderBottom: '1px solid #000',
                              borderTop: '1px solid #000',
                              padding: '6px 10px',
                              textAlign: 'right',
                              fontWeight: 'bold',
                              fontSize: '10px',
                              verticalAlign: 'middle',
                            }}
                          >
                            {formatCurrency(overallDiscountAmt, '')}
                          </td>
                        </tr>
                      ) : null}
                      <tr>
                        <td
                          style={{
                            borderLeft: '1px solid #000',
                            borderRight: '1px solid #000',
                            borderBottom: '1px solid #000',
                            borderTop: 'none',
                            padding: 0,
                            verticalAlign: 'top',
                          }}
                        >
                          <div
                            style={{
                              borderTop: '1px solid #000',
                              padding: '8px 10px',
                              textAlign: 'center',
                              fontWeight: 'bold',
                              fontSize: '11px',
                            }}
                          >
                            Transport
                          </div>
                          <div
                            style={{
                              borderTop: '1px solid #000',
                              padding: '10px 10px',
                              textAlign: 'center',
                              fontWeight: 'bold',
                              fontSize: '11px',
                            }}
                          >
                            Total C&amp;F Price upto {destPortLabel} By {transportLabel}
                          </div>
                          <div
                            style={{
                              borderTop: '1px solid #000',
                              padding: '8px 10px',
                              fontSize: '9px',
                              textAlign: 'left',
                              verticalAlign: 'top',
                            }}
                          >
                            Note : If the total order value is less than {currencySymbol} 2500, transaction fee of {currencySymbol}{' '}
                            100 per invoice shall be charged extra
                          </div>
                        </td>
                        <td
                          style={{
                            borderLeft: '1px solid #000',
                            borderRight: '1px solid #000',
                            borderBottom: '1px solid #000',
                            borderTop: 'none',
                            padding: '6px',
                            verticalAlign: 'middle',
                          }}
                        />
                        <td
                          style={{
                            borderLeft: '1px solid #000',
                            borderRight: '1px solid #000',
                            borderBottom: '1px solid #000',
                            borderTop: 'none',
                            padding: '6px',
                            verticalAlign: 'middle',
                          }}
                        />
                        <td
                          style={{
                            borderLeft: '1px solid #000',
                            borderRight: '1px solid #000',
                            borderBottom: '1px solid #000',
                            borderTop: 'none',
                            padding: '6px',
                            verticalAlign: 'middle',
                          }}
                        />
                        <td
                          style={{
                            borderLeft: '1px solid #000',
                            borderRight: '1px solid #000',
                            borderBottom: '1px solid #000',
                            borderTop: 'none',
                            padding: '6px',
                            verticalAlign: 'middle',
                          }}
                        />
                      </tr>

                      <tr>
                        <td style={{ ...bd, borderTop: '2px solid #000', padding: '6px 10px', verticalAlign: 'middle' }} />
                        <td style={{ ...bd, borderTop: '2px solid #000', padding: '6px', verticalAlign: 'middle' }} />
                        <td
                          colSpan={2}
                          style={{
                            ...bd,
                            borderTop: '2px solid #000',
                            padding: '8px 6px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            verticalAlign: 'middle',
                            fontSize: '11px',
                          }}
                        >
                          {currency}
                        </td>
                        <td
                          style={{
                            ...bd,
                            borderTop: '2px solid #000',
                            padding: '8px 6px',
                            textAlign: 'right',
                            fontWeight: 'bold',
                            verticalAlign: 'middle',
                            fontSize: '11px',
                          }}
                        >
                          <span className="quotation-grand-total-amount">{formatCurrency(totalWithCharges, '')}</span>
                        </td>
                      </tr>

                      <tr>
                        <td colSpan={5} style={{ ...bd, padding: 0, verticalAlign: 'middle' }}>
                          <table
                            style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              tableLayout: 'fixed',
                              fontSize: '10px',
                            }}
                          >
                            <colgroup>
                              <col style={{ width: '18%' }} />
                              <col style={{ width: '62%' }} />
                              <col style={{ width: '20%' }} />
                            </colgroup>
                            <tbody>
                              <tr>
                                <td
                                  style={{
                                    borderRight: '1px solid #000',
                                    padding: '8px 10px',
                                    fontSize: '10px',
                                    verticalAlign: 'middle',
                                    fontWeight: 'bold',
                                    lineHeight: 1.35,
                                  }}
                                >
                                  Amount Chargeable
                                  <br />
                                  (In words) :
                                </td>
                                <td
                                  style={{
                                    borderRight: '1px solid #000',
                                    padding: '8px 10px',
                                    fontWeight: 'bold',
                                    verticalAlign: 'middle',
                                    fontSize: '11px',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '10px',
                                      width: '100%',
                                    }}
                                  >
                                    <span style={{ textAlign: 'left', flex: '1 1 auto', minWidth: 0 }}>
                                      {currencyWords} {amountInWords} Only
                                    </span>
                                    <span style={{ fontSize: '11px', flexShrink: 0, whiteSpace: 'nowrap' }}>Total:-</span>
                                  </div>
                                </td>
                                <td
                                  style={{
                                    padding: '8px 10px',
                                    textAlign: 'right',
                                    verticalAlign: 'middle',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                  }}
                                >
                                  <span className="quotation-grand-total-amount">
                                    {formatCurrency(totalWithCharges, '')}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style={{ ...bd, padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', verticalAlign: 'middle' }}>
                          Remarks
                        </td>
                        <td colSpan={4} style={{ ...bd, padding: '6px 10px', fontSize: '11px', verticalAlign: 'middle' }}>
                          Offer Validity : {offerValidity}
                        </td>
                      </tr>

                      <tr>
                        <td rowSpan={3} style={{ ...bd, padding: '8px 10px', verticalAlign: 'top', lineHeight: 1.45, fontSize: '11px' }}>
                          1. Please mention this quotation number on your PO and all communications
                          <br />
                          2. In case of extreme currency volatility prices maybe revised at anytime.
                          <br />
                          3. This quotation is valid only for the products &amp; quantity mentioned.
                          <br />
                          4. Packing : Export worthy packing
                          <br />
                          5. ISPM 15 (Phytosanitory) Certification for Packing Material - provided on request
                          <br />
                          6. All Foreign Bank charges on Purchaser Account.
                        </td>
                        <td
                          colSpan={4}
                          style={{
                            ...bd,
                            padding: '8px 10px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            fontSize: '11px',
                            borderBottom: '2px solid #000',
                          }}
                        >
                          For WMW Metal Fabrics Ltd.
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            ...bd,
                            padding: '18px 12px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            lineHeight: 1.45,
                            fontSize: '11px',
                          }}
                        >
                          This is an electronically generated document, doesn&apos;t require a signature.
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} style={{ ...bd, padding: '10px 12px', verticalAlign: 'middle', fontSize: '11px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold' }}>Signature &amp; Date</span>
                            <span style={{ fontWeight: 'bold' }}>{signatureDate}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} style={{ ...bd, padding: '4px 8px', fontSize: '9px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Doc No.: WMW/MKT/F.1 (Rev.00)</span>
                            <span>Subject to enclosed terms &amp; conditions</span>
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

            </div>
          </div>
        )
      })}
    </div>
  )
}
