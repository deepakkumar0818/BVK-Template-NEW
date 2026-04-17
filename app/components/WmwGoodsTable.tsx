'use client'

import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { QuotationData } from '@/lib/types'
import { formatCurrency, numberToWords } from '@/lib/quotation-utils'
import { buildWmwFormTotalsDisplay, buildWmwJoinedLineRows } from '@/lib/wmw-subform-mapping'

const txBlue = '#0000CD'

/** Full cell border (title + footer rows) */
const bd: CSSProperties = { border: '1px solid #000' }

/** Left & right rules only — no horizontal lines (merge with adjacent row) */
const bdSides: CSSProperties = {
  borderLeft: '1px solid #000',
  borderRight: '1px solid #000',
}

/** Product/Form row: open bottom so it joins the Item grid row below */
const bdProductMeta: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: 'none',
}

/** Item grid row: vertical rules only — no horizontal lines above/below the row */
const bdItemGrid: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: 'none',
}

/** Column title row (Description of Goods): bottom border applied per request */
const bdTitleRow: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: '1px solid #000',
}

/** Right-side merged empty cell beside Product/Form — no horizontal rules */
const rightMergedEmpty: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: 'none',
  padding: '6px',
  verticalAlign: 'top',
}

interface WmwGoodsTableProps {
  data: QuotationData
  rawQuotationData?: any
  shippingData?: any
  headerNode?: ReactNode
  footerNode?: ReactNode
}

/** One rendered goods row (legacy Zoho 2_0 merge or joined WMW pipeline). */
interface WmwDisplayRow {
  item: number
  product: string
  form: string
  quality: string
  mesh: string
  brand: string
  size: string
  sqmArea: string
  quantity: string
  rate: number
  amount: number
  deliveryDate?: string
  freightCharge?: string
  packingCharge?: string
  seamCharge?: string
  /** When true, quantity cell already includes UOM text from joined WMW pipeline */
  usesJoinedQuantity?: boolean
}

function parseMoney(value: string | undefined): number {
  if (value === undefined || value === null) return 0
  const n = parseFloat(String(value).replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : 0
}

function trimStr(value: string | undefined): string {
  return (value ?? '').trim()
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

export default function WmwGoodsTable({ data, rawQuotationData, shippingData, headerNode, footerNode }: WmwGoodsTableProps) {
  const rawLineItems = (rawQuotationData?.Category_1_MM_Database_WMW_2_0 as any[]) || []
  const rawProductDetails = (rawQuotationData?.Category_1_MM_Database_WMW as any[]) || []

  const defaultProductLabel = 'Stainless Steel Wire Cloth'

  const currency = data.currency || rawQuotationData?.Currency || 'USD'
  const currencySymbol = currency

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

  const packingFreight = parseFloat(rawQuotationData?.Packing_Freight || '0') || 0
  const transaction = parseFloat(rawQuotationData?.Transaction_Charges || '0') || 0

  const countryOfDestination = rawQuotationData?.Shipping_Country || shippingData?.Shipping_Country || ''
  const portOfDischarge = rawQuotationData?.Port_of_Discharge || ''
  const finalDestination = rawQuotationData?.Final_Destination || portOfDischarge || ''

  const joinedRows = buildWmwJoinedLineRows(rawQuotationData)
  const formTotals = buildWmwFormTotalsDisplay(rawQuotationData)

  const lineItemsFromJoined: WmwDisplayRow[] =
    joinedRows.length > 0
      ? joinedRows.map((row) => {
        const qtyLabel = [row.quantity, row.uom].filter((s) => trimStr(s) !== '').join(' ')
        return {
          item: row.rowIndex,
          product: row.productLabel.trim() || defaultProductLabel,
          form: row.supplyForm,
          quality: row.seamType,
          mesh: '',
          brand: '',
          size: row.size,
          sqmArea: '',
          quantity: qtyLabel || row.quantity || '0',
          rate: parseMoney(row.ratePerSqmDisplay),
          amount: parseMoney(row.amountDisplay),
          deliveryDate: row.deliveryDate || undefined,
          freightCharge: row.freightCharge || undefined,
          packingCharge: row.packingCharges || undefined,
          seamCharge: row.seamCharges || undefined,
          usesJoinedQuantity: true,
        }
      })
      : []

  const lineItemsFromZoho: WmwDisplayRow[] = rawLineItems.map((item, index) => {
    const itemRef = item.last_item_ref?.trim() || item.Last_item_ref?.trim() || ''
    const productDetail = itemRef
      ? rawProductDetails.find(
        (pd: any) => pd.last_item_ref?.trim() === itemRef || pd.Last_item_ref?.trim() === itemRef
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
    const quantity = productDetail.Qty?.trim() || item.Qty?.trim() || '0'
    const rateStr = item.Selling_Price?.replace(/,/g, '') || ''
    const rate = rateStr ? (parseFloat(rateStr) || 0) : NaN
    const amount = parseFloat(item.Net_Selling_Amount?.replace(/,/g, '') || item.Gross_Amount?.replace(/,/g, '') || '0')

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
    }
  })

  const lineItemsFallback: WmwDisplayRow[] = (data.lineItems || []).map((item, index) => {
    const rate = parseFloat(String(item.rate).replace(/,/g, '')) || 0
    const amount = parseFloat(String(item.amount).replace(/,/g, '')) || 0
    return {
      item: index + 1,
      product: item.product?.trim() || defaultProductLabel,
      form: item.form?.trim() || '',
      quality: item.quality?.trim() || '',
      mesh: '',
      brand: item.type || item.form || '',
      size: item.size || '',
      sqmArea: item.subQty || '',
      quantity: item.qty || '0',
      rate,
      amount,
    }
  })

  const displayLineItems: WmwDisplayRow[] =
    lineItemsFromJoined.length > 0
      ? lineItemsFromJoined
      : lineItemsFromZoho.length > 0
        ? lineItemsFromZoho
        : lineItemsFallback

  const showZohoFormTotals = lineItemsFromJoined.length > 0

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

  const destLabel = finalDestination || portOfDischarge || 'Jaipur'

  const splitQtyAndUom = (value: unknown): { qty: string; uom: string } => {
    const s = String(value ?? '').trim()
    if (!s) return { qty: '', uom: '' }
    const parts = s.split(/\s+/).filter(Boolean)
    if (parts.length < 2) return { qty: s, uom: '' }
    const uom = parts.pop() || ''
    const qty = parts.join(' ')
    return { qty, uom }
  }

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
                className="goods-description-table quotation-stack-table wmw-goods-table"
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
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '38%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>
                <tbody>
                  <tr className="wmw-goods-title-row">
                    <td colSpan={2} style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                      Description of Goods
                    </td>
                    <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                      Quantity
                      <br />
                      UOM
                    </td>
                    <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                      {showZohoFormTotals ? 'Rate/Sqm' : 'Rate'}
                      <br />
                      {showZohoFormTotals ? currencySymbol : `${currencySymbol} / UOM`}
                    </td>
                    <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                      Amount
                      <br />
                      {currencySymbol}
                    </td>
                  </tr>

                  {/* Explicit horizontal line below header to guarantee rendering */}
                  <tr aria-hidden className="wmw-horizontal-border">
                    <td colSpan={5} style={{ borderTop: '1px solid #000', padding: 0, margin: 0, height: 0, lineHeight: 0, fontSize: 0 }} />
                  </tr>

                  {chunk.map((row, index) => (
                    <Fragment key={`wmw-line-${pageIdx}-${index}`}>
                      <tr className="wmw-item-meta-row">
                        <td colSpan={2} style={{ ...bdProductMeta, padding: '8px 10px 4px 10px', verticalAlign: 'top' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '80px 10px auto', marginBottom: '3px' }}>
                            <strong>Product</strong><span>:</span><span style={{ fontWeight: 'bold' }}>{row.product}</span>
                          </div>
                          {row.form ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 10px auto', marginBottom: '3px' }}>
                              <strong>Form</strong><span>:</span><span style={{ fontWeight: 'bold' }}>{row.form}</span>
                            </div>
                          ) : null}
                          {row.quality ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 10px auto', marginBottom: '3px' }}>
                              <strong>{row.usesJoinedQuantity ? 'Type' : 'Quality'}</strong><span>:</span><span style={{ fontWeight: 'bold' }}>{row.quality}</span>
                            </div>
                          ) : null}
                          {row.deliveryDate ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 10px auto', marginBottom: '3px' }}>
                              <strong>Delivery Date</strong><span>:</span><span style={{ fontWeight: 'bold' }}>{row.deliveryDate}</span>
                            </div>
                          ) : null}
                          {trimStr(row.freightCharge) !== '' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 10px auto', marginBottom: '3px' }}>
                              <strong>Freight</strong><span>:</span><span style={{ fontWeight: 'bold' }}>{row.freightCharge}</span>
                            </div>
                          ) : null}
                          {trimStr(row.packingCharge) !== '' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 10px auto', marginBottom: '3px' }}>
                              <strong>Packing</strong><span>:</span><span style={{ fontWeight: 'bold' }}>{row.packingCharge}</span>
                            </div>
                          ) : null}
                          {trimStr(row.seamCharge) !== '' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 10px auto' }}>
                              <strong>Seam chg.</strong><span>:</span><span style={{ fontWeight: 'bold' }}>{row.seamCharge}</span>
                            </div>
                          ) : null}
                        </td>
                        <td style={rightMergedEmpty} />
                        <td style={rightMergedEmpty} />
                        <td style={rightMergedEmpty} />
                      </tr>
                      <tr className="wmw-item-grid-row">
                        <td colSpan={2} style={{ ...bdItemGrid, padding: '16px 10px 6px 10px', verticalAlign: 'middle' }}>
                          <div style={{ ...descGrid, fontWeight: 'bold', marginBottom: '6px' }}>
                            <span style={{ textAlign: 'center' }}>Item</span>
                            <span>Mesh</span>
                            <span>Brand</span>
                            <span>Size [m]</span>
                            <span>(L x W)</span>
                            <span>Sqm Area</span>
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                            columnGap: '10px',
                            rowGap: '2px',
                            alignItems: 'center',
                            width: '100%',
                            textAlign: 'left'
                          }}>
                            <span style={{ fontWeight: 'bold', textAlign: 'center' }}>{row.item}</span>
                            <span>{row.mesh}</span>
                            <span>{row.brand}</span>
                            <span style={{ whiteSpace: 'nowrap' }}>{row.size}</span>
                            <span style={{ opacity: 0 }}>(L x W)</span>
                            <span>{row.sqmArea}</span>
                          </div>
                        </td>
                        <td style={{ ...bdItemGrid, padding: '6px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {row.usesJoinedQuantity ? (
                            (() => {
                              const { qty, uom } = splitQtyAndUom(row.quantity)
                              return (
                                <div className="quotation-qty-uom-cell">
                                  <div className="quotation-qty-value">{qty || '\u00A0'}</div>
                                  {uom ? <div className="quotation-qty-uom">{uom}</div> : null}
                                </div>
                              )
                            })()
                          ) : (
                            `${row.quantity}${row.quantity !== '0' ? ' Pc' : ''}`
                          )}
                        </td>
                        <td style={{ ...bdItemGrid, padding: '6px', textAlign: 'right', verticalAlign: 'middle' }}>
                          {Number.isFinite(row.rate) ? formatCurrency(row.rate, currency) : ''}
                        </td>
                        <td style={{ ...bdItemGrid, padding: '6px', textAlign: 'right', verticalAlign: 'middle' }}>
                          {formatCurrency(row.amount, currency) || '-'}
                        </td>
                      </tr>
                    </Fragment>
                  ))}

                  {isLastChunk && (
                    <>
                      <tr aria-hidden className="wmw-goods-spacer">
                        <td colSpan={2} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '40px 0', lineHeight: 0, fontSize: 0 }} />
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '40px 0', lineHeight: 0, fontSize: 0 }} />
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '40px 0', lineHeight: 0, fontSize: 0 }} />
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '40px 0', lineHeight: 0, fontSize: 0 }} />
                      </tr>

                      {showZohoFormTotals ? (
                        <>
                          <tr>
                            <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', textAlign: 'right' }}>
                              Total Amount Before Tax
                            </td>
                            <td style={{ ...bdSides, padding: '6px' }} />
                            <td style={{ ...bdSides, padding: '6px' }} />
                            <td style={{ ...bdSides, padding: '6px', textAlign: 'right' }}>
                              {trimStr(formTotals.totalAmountBeforeTax)
                                ? formatCurrency(parseMoney(formTotals.totalAmountBeforeTax), currency)
                                : '-'}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', textAlign: 'right' }}>
                              Add CGST @ 0.00
                            </td>
                            <td style={{ ...bdSides, padding: '6px' }} />
                            <td style={{ ...bdSides, padding: '6px' }} />
                            <td style={{ ...bdSides, padding: '6px', textAlign: 'right' }}>
                              {trimStr(formTotals.addCgst) ? formatCurrency(parseMoney(formTotals.addCgst), currency) : '-'}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', textAlign: 'right' }}>
                              Add SGST @ 0.00
                            </td>
                            <td style={{ ...bdSides, padding: '6px' }} />
                            <td style={{ ...bdSides, padding: '6px' }} />
                            <td style={{ ...bdSides, padding: '6px', textAlign: 'right' }}>
                              {trimStr(formTotals.addSgst) ? formatCurrency(parseMoney(formTotals.addSgst), currency) : '-'}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', textAlign: 'right' }}>
                              Add IGST @ 0.00
                            </td>
                            <td style={{ ...bdSides, padding: '6px' }} />
                            <td style={{ ...bdSides, padding: '6px' }} />
                            <td style={{ ...bdSides, padding: '6px', textAlign: 'right' }}>
                              {trimStr(formTotals.addIgst) ? formatCurrency(parseMoney(formTotals.addIgst), currency) : '-'}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', textAlign: 'right' }}>
                              Tax Amount GST
                            </td>
                            <td style={{ ...bdSides, padding: '6px' }} />
                            <td style={{ ...bdSides, padding: '6px' }} />
                            <td style={{ ...bdSides, padding: '6px', textAlign: 'right' }}>
                              {trimStr(formTotals.taxAmountGst)
                                ? formatCurrency(parseMoney(formTotals.taxAmountGst), currency)
                                : '-'}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                              Total Amount After GST
                            </td>
                            <td style={{ ...bdSides, padding: '6px' }} />
                            <td style={{ ...bdSides, padding: '6px' }} />
                            <td style={{ ...bdSides, padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>
                              {trimStr(formTotals.totalAmountAfterGst)
                                ? formatCurrency(parseMoney(formTotals.totalAmountAfterGst), currency)
                                : '-'}
                            </td>
                          </tr>
                        </>
                      ) : null}

                      <tr>
                        <td colSpan={2} style={{ ...bdSides, padding: '6px 10px', textAlign: 'right' }}>
                          ADD: Transaction Charges
                        </td>
                        <td style={{ ...bdSides, padding: '6px' }} />
                        <td style={{ ...bdSides, padding: '6px' }} />
                        <td style={{ ...bdSides, padding: '6px', textAlign: 'right' }}>
                          {transaction ? formatCurrency(transaction, currency) : '-'}
                        </td>
                      </tr>

                      <tr aria-hidden className="wmw-goods-spacer">
                        <td colSpan={2} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '20px 0', lineHeight: 0, fontSize: 0 }} />
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '20px 0', lineHeight: 0, fontSize: 0 }} />
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '20px 0', lineHeight: 0, fontSize: 0 }} />
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '20px 0', lineHeight: 0, fontSize: 0 }} />
                      </tr>

                      <tr>
                        <td colSpan={2} style={{ ...bdSides, borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '5px 10px', textAlign: 'center', fontWeight: 'bold' }}>Transport</td>
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '5px 6px' }} />
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '5px 6px' }} />
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '5px 6px' }} />
                      </tr>

                      <tr>
                        <td colSpan={2} style={{ ...bdSides, borderTop: 'none', borderBottom: '1px solid #000', padding: '10px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                          Total EXW Price upto {destLabel}
                        </td>
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '5px 6px' }} />
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '5px 6px' }} />
                        <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '5px 6px' }} />
                      </tr>

                      <tr>
                        <td colSpan={2} style={{ ...bd, padding: '6px 10px', fontSize: '9px', verticalAlign: 'top' }}>
                          <span>
                            Note : If the total order value is less than {currencySymbol} 2500, transaction fee of {currencySymbol} 100 per invoice
                            shall be charged extra
                          </span>
                        </td>
                        <td style={{ ...bd, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{currency}</td>
                        <td style={{ ...bd, padding: '6px', borderRight: 'none' }} />
                        <td style={{ ...bd, padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>
                          <span className="quotation-grand-total-amount">{formatCurrency(totalWithCharges, currency) || '-'}</span>
                        </td>
                      </tr>

                      <tr>
                        <td style={{ ...bd, padding: '6px 10px', fontSize: '9px', verticalAlign: 'top', borderRight: 'none', width: '15%' }}>
                          <div style={{ fontWeight: 'bold' }}>
                            Amount Chargeable<br />
                            (In words) :
                          </div>
                        </td>
                        <td style={{ ...bd, borderLeft: 'none', padding: '6px 10px', fontSize: '10px', verticalAlign: 'middle', width: '40%' }}>
                          <div style={{ fontWeight: 'bold' }}>
                            {/* Wait, the screenshot shows blank here for the word text */}
                          </div>
                        </td>
                        <td style={{ ...bd, padding: '6px' }} />
                        <td style={{ ...bd, padding: '6px', fontWeight: 'bold', textAlign: 'right', verticalAlign: 'middle' }}>Total:-</td>
                        <td style={{ ...bd, padding: '6px', fontWeight: 'bold', textAlign: 'right', verticalAlign: 'middle' }}>
                          <span className="quotation-grand-total-amount">{formatCurrency(totalWithCharges, currency) || '-'}</span>
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
