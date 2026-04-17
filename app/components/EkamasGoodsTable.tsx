'use client'

import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { QuotationData } from '@/lib/types'
import { formatCurrency, numberToWords, resolveQuotationValidity } from '@/lib/quotation-utils'

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
  mesh: string
  brand: string
  size: string
  sqmArea: string
  quantity: number
  rate: number
  amount: number
  warrantyText: string
  packingText: string
  grossWeightLine: string
}

export default function EkamasGoodsTable({
  data,
  rawQuotationData,
  headerNode,
  signatureDate = '',
}: EkamasGoodsTableProps) {
  const rawLineItems = (rawQuotationData?.Category_1_MM_Database_WMW_2_0 as Record<string, string>[]) || []
  const rawProductDetails = (rawQuotationData?.Category_1_MM_Database_WMW as Record<string, string>[]) || []

  const defaultProductLabel = 'Stainless Steel Wire Cloth'

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

    let size = ''
    if (item.Invoice_Dimension_1 && item.Invoice_Dimension_2) {
      const extractNumber = (str: string) => {
        const match = str.match(/(\d+\.?\d*)/)
        return match ? match[1] : str.replace(/Length|length|Width|width/gi, '').trim()
      }
      const dim1 = extractNumber(item.Invoice_Dimension_1)
      const dim2 = extractNumber(item.Invoice_Dimension_2)
      size = `${dim1} x ${dim2}`
    }

    const sqmArea = productDetail.Total_SQM?.trim() || productDetail.SQM?.trim() || ''
    const quantity = parseFloat(productDetail.Qty?.trim() || item.Qty?.trim() || '0')
    const rateStr = item.Selling_Price?.replace(/,/g, '') || ''
    const rate = rateStr ? (parseFloat(rateStr) || 0) : NaN
    const amountFromLine = parseFloat(item.Net_Selling_Amount?.replace(/,/g, '') || item.Gross_Amount?.replace(/,/g, '') || '0')
    const computedAmount = quantity * rate
    const amount = Number.isFinite(computedAmount) ? computedAmount : amountFromLine

    const mesh = productDetail.Brand_Category?.trim() || ''
    const brand = productDetail.Brand_Selling_Name?.trim() || ''

    const wiLine = data.lineItems?.[index]
    const product =
      productDetail.Product_Name?.trim() ||
      productDetail.Product_Master?.trim() ||
      wiLine?.product?.trim() ||
      defaultProductLabel
    const form = productDetail.Supply_Form?.trim() || wiLine?.form?.trim() || ''
    const quality = wiLine?.quality?.trim() || ''

    const perPc = parseFloat(productDetail.Net_Weight_Per_Pcs || '0') || (index === 0 ? 50 : 50)
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
      warrantyText: defaultWarranty,
      packingText: defaultPacking,
      grossWeightLine: `Total gross weight: ${totalWeight ? `${totalWeight.toFixed(0)} kgs` : '100 kgs'}`,
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
      mesh: '',
      brand: item.type || item.form || '',
      size: item.size || '',
      sqmArea: item.subQty || '',
      quantity,
      rate,
      amount,
      warrantyText: defaultWarranty,
      packingText: defaultPacking,
      grossWeightLine: `Total gross weight: ${dummyWeight ? `${dummyWeight.toFixed(0)} kgs` : '100 kgs'}`,
    }
  })

  let displayLineItems = lineItemsFromZoho.length > 0 ? lineItemsFromZoho : lineItemsFallback

  if (displayLineItems.length === 0) {
    displayLineItems = [
      {
        item: 1,
        product: 'Stainless Steel Wire Cloth',
        form: 'Endless Diagonal Seam',
        quality: 'AISI 316L',
        mesh: '50/Inch',
        brand: 'Formx-050',
        size: '3.941 x 3.100',
        sqmArea: '12.2171',
        quantity: 2,
        rate: 1100,
        amount: 2200,
        warrantyText: defaultWarranty,
        packingText: defaultPacking,
        grossWeightLine: 'Total gross weight: 100 kgs',
      },
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

  const totalWithCharges = baseAmount + packingFreight + transaction
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
                  <col style={{ width: '52%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '24%' }} />
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

                  {chunk.map((row, index) => (
                    <Fragment key={`ekamas-line-${pageIdx}-${index}`}>
                      <tr className="ekamas-item-row">
                        <td
                          style={{
                            ...bdProductBlock,
                            borderTop: index === 0 && pageIdx === 0 ? 'none' : '1px solid #000',
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: '60px 10px auto', marginBottom: '4px', fontWeight: 'bold' }}>
                            <span>Product</span>
                            <span>:</span>
                            <span>{row.product}</span>
                          </div>
                          {row.form ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '60px 10px auto', marginBottom: '4px', fontWeight: 'bold' }}>
                              <span>Form</span>
                              <span>:</span>
                              <span>{row.form}</span>
                            </div>
                          ) : null}
                          {row.quality ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '60px 10px auto', marginBottom: '8px', fontWeight: 'bold' }}>
                              <span>Quality</span>
                              <span>:</span>
                              <span>{row.quality}</span>
                            </div>
                          ) : null}

                          <div
                            style={{
                              borderTop: '1px solid #000',
                              paddingTop: '8px',
                              marginTop: '4px',
                            }}
                          >
                            <div style={{ ...descGrid, fontWeight: 'bold', marginBottom: '6px', fontSize: '10px' }}>
                              <span>Item</span>
                              <span>MESH</span>
                              <span>BRAND</span>
                              <span>SIZE [Mtrs] (LxW)</span>
                              <span>Sqm Area / PC</span>
                            </div>
                            <div style={descGrid}>
                              <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{row.item}</span>
                              <span>{row.mesh}</span>
                              <span>{row.brand}</span>
                              <span>{row.size}</span>
                              <span>{row.sqmArea}</span>
                            </div>
                          </div>

                          <div
                            style={{
                              borderTop: '1px solid #000',
                              paddingTop: '8px',
                              marginTop: '8px',
                              lineHeight: 1.45,
                            }}
                          >
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{row.warrantyText}</div>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{row.packingText}</div>
                            <div style={{ fontWeight: 'bold' }}>
                              {grossFromRaw ? `Total gross weight: ${grossFromRaw} kgs` : row.grossWeightLine}
                            </div>
                          </div>
                        </td>
                        <td
                          style={{
                            ...bdSides,
                            borderTop: index === 0 && pageIdx === 0 ? 'none' : '1px solid #000',
                            borderBottom: '1px solid #000',
                            padding: '10px 6px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            fontWeight: 'bold',
                          }}
                        >
                          {row.quantity} Pcs
                        </td>
                        <td
                          style={{
                            ...bdSides,
                            borderTop: index === 0 && pageIdx === 0 ? 'none' : '1px solid #000',
                            borderBottom: '1px solid #000',
                            padding: '10px 6px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            fontWeight: 'bold',
                          }}
                        >
                          {Number.isFinite(row.rate) ? formatCurrency(row.rate, '') : ''}
                        </td>
                        <td
                          style={{
                            ...bdSides,
                            borderTop: index === 0 && pageIdx === 0 ? 'none' : '1px solid #000',
                            borderBottom: '1px solid #000',
                            padding: '10px 6px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            fontWeight: 'bold',
                          }}
                        >
                          {formatCurrency(row.amount, '')}
                        </td>
                      </tr>
                    </Fragment>
                  ))}

                  {isLastChunk && (
                    <>
                      <tr>
                        <td style={{ ...bd, padding: 0, verticalAlign: 'top' }}>
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
                        <td style={{ ...bd, padding: '6px', verticalAlign: 'middle' }} />
                        <td style={{ ...bd, padding: '6px', verticalAlign: 'middle' }} />
                        <td style={{ ...bd, padding: '6px', verticalAlign: 'middle' }} />
                      </tr>

                      <tr>
                        <td style={{ ...bd, borderTop: '2px solid #000', padding: '6px 10px', verticalAlign: 'middle' }} />
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
                        <td style={{ ...bd, padding: '8px 10px', fontSize: '10px', verticalAlign: 'top', fontWeight: 'bold', lineHeight: 1.35 }}>
                          Amount Chargeable
                          <br />
                          (In words) :
                        </td>
                        <td colSpan={2} style={{ ...bd, padding: '8px 10px', fontWeight: 'bold', verticalAlign: 'middle', fontSize: '11px' }}>
                          {currencyWords} {amountInWords} Only
                        </td>
                        <td style={{ ...bd, padding: '8px 10px', textAlign: 'right', verticalAlign: 'middle', fontWeight: 'bold' }}>
                          <div style={{ fontSize: '11px', marginBottom: '4px' }}>Total:-</div>
                          <div style={{ fontSize: '14px' }}>
                            <span className="quotation-grand-total-amount">{formatCurrency(totalWithCharges, '')}</span>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style={{ ...bd, padding: '6px 10px', fontWeight: 'bold', fontSize: '11px', verticalAlign: 'middle' }}>
                          Remarks
                        </td>
                        <td colSpan={3} style={{ ...bd, padding: '6px 10px', fontSize: '11px', verticalAlign: 'middle' }}>
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
                          colSpan={3}
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
                          colSpan={3}
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
                        <td colSpan={3} style={{ ...bd, padding: '10px 12px', verticalAlign: 'middle', fontSize: '11px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold' }}>Signature &amp; Date</span>
                            <span style={{ fontWeight: 'bold' }}>{signatureDate}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} style={{ ...bd, padding: '4px 8px', fontSize: '9px' }}>
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
