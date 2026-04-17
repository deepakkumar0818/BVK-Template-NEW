'use client'

import { Fragment } from 'react'
import { QuotationData } from '@/lib/types'
import { resolveConsigneeDisplay } from '@/lib/consignee-display'
import { formatCurrency, numberToWords, formatDate, resolveQuotationValidity } from '@/lib/quotation-utils'
import { buildWmwJoinedLineRows } from '@/lib/wmw-subform-mapping'
import PrintButton from './PrintButton'

interface ExportTableLine {
  item: number
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
}

function parseMoneyField(value: string | undefined): number {
  if (value === undefined || value === null) return 0
  const n = parseFloat(String(value).replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : 0
}

interface ExportQuotationContentProps {
  data: QuotationData
  shippingData?: any
  billingData?: any
  rawQuotationData?: any
  /** Shown in “Total {incoterm} Price…” row. Default CFR; WMWE1 tab passes CPT. */
  priceHeaderIncoterm?: 'CFR' | 'CPT'
}

export default function ExportQuotationContent({
  data,
  shippingData,
  billingData,
  rawQuotationData,
  priceHeaderIncoterm = 'CFR',
}: ExportQuotationContentProps) {
  // Format date helper for Export format (DD-MMM-YYYY)
  const formatExportDate = (dateString?: string): string => {
    if (!dateString) return ''
    try {
      // If already in DD-MMM-YYYY format, return as is
      if (dateString.match(/\d{2}-\w{3}-\d{4}/)) {
        return dateString.split(' ')[0] // Remove time if present
      }
      // Try to parse and format
      const dateMatch = dateString.match(/(\d{2})-(\w{3})-(\d{4})/)
      if (dateMatch) {
        const [, day, month, year] = dateMatch
        return `${day}-${month}-${year}`
      }
      return dateString
    } catch {
      return dateString || ''
    }
  }

  // Use dynamic data from API
  const quotationNumber = data.quotationNumber || rawQuotationData?.Name || ''
  const quotationDate = formatExportDate(data.date || rawQuotationData?.Created_Date_and_time)
  const buyerEnquiryNo = data.buyerEnquiryNo || data.customerReference || rawQuotationData?.customer_Reference || ''
  const buyerEnquiryDate = formatExportDate(data.customerReferenceDate || rawQuotationData?.Customer_Reference_Date)
  const email = rawQuotationData?.Invoice_Sent_Via === 'Email' ? (shippingData?.Email || billingData?.Email || '') : ''
  const otherReference = rawQuotationData?.Additional_info || ''
  const countryOfOrigin = rawQuotationData?.Billing_Country || 'India'
  const countryOfDestination = rawQuotationData?.Shipping_Country || shippingData?.Shipping_Country || ''
  const portOfLoading = rawQuotationData?.Port_of_Loading || ''
  const portOfDischarge = rawQuotationData?.Port_of_Discharge || ''
  const finalDestination = rawQuotationData?.Final_Destination || ''
  const modeOfDelivery = rawQuotationData?.Mode_of_Delivery || data.termsOfDelivery || ''
  const dispatchExWorks = rawQuotationData?.Delivery_Date_Control || data.deliveryDate || ''
  const termsOfPayment = data.termsOfPayment || rawQuotationData?.Term_of_Payment || ''
  const bankName = rawQuotationData?.Bank_Name || 'Indian Overseas Bank'
  const bankBranch = rawQuotationData?.Bank_Branch || 'Jaipur Branch'
  const swiftCode = rawQuotationData?.Swift_Code || 'IOBA0000102'
  const accountNumber = rawQuotationData?.Account_Number || '010200003059'
  const accountName = rawQuotationData?.Account_Name || 'WMW METAL FABRICS LTD'
  // Get HSN Code from subform breakdown or line items, fallback to root level
 
  const offerValidity = resolveQuotationValidity(rawQuotationData as Record<string, unknown> | undefined)
  
  // Get raw line items and product details from Category 1 WMW for Export template
  const rawLineItems = Array.isArray(rawQuotationData?.Category_1_MM_Database_WMW_2_0)
    ? (rawQuotationData.Category_1_MM_Database_WMW_2_0 as any[])
    : rawQuotationData?.Category_1_MM_Database_WMW_2_0 && typeof rawQuotationData.Category_1_MM_Database_WMW_2_0 === 'object'
      ? [rawQuotationData.Category_1_MM_Database_WMW_2_0]
      : []
  const rawProductDetails = Array.isArray(rawQuotationData?.Category_1_MM_Database_WMW)
    ? (rawQuotationData.Category_1_MM_Database_WMW as any[])
    : rawQuotationData?.Category_1_MM_Database_WMW && typeof rawQuotationData.Category_1_MM_Database_WMW === 'object'
      ? [rawQuotationData.Category_1_MM_Database_WMW]
      : []

  /** Main-subform-driven join (last_item_ref) — same as WmwGoodsTable; required when Type = Export (this template). */
  const joinedWmwRows = rawQuotationData ? buildWmwJoinedLineRows(rawQuotationData) : []
  const useWmwJoinedPipeline = joinedWmwRows.length > 0

  // Get product details from first line item if available
  const firstItem = data.lineItems && data.lineItems.length > 0 ? data.lineItems[0] : null
  const firstJoined = useWmwJoinedPipeline ? joinedWmwRows[0] : null
  const firstProductDetail = rawProductDetails[0] || {}

  const product = useWmwJoinedPipeline
    ? firstJoined?.productLabel?.trim() || firstItem?.product || 'Stainless Steel Wire Cloth (Woven Type)'
    : firstItem?.product || 'Stainless Steel Wire Cloth (Woven Type)'

  const form = useWmwJoinedPipeline
    ? firstJoined?.supplyForm?.trim() || firstProductDetail.Supply_Form || firstItem?.form || ''
    : firstProductDetail.Supply_Form || firstItem?.form || ''

  const weave = rawQuotationData?.Weave || firstProductDetail.Weave || ''
  const quality = useWmwJoinedPipeline
    ? firstJoined?.seamType?.trim() || ''
    : firstItem?.quality || ''
  
  const currency = data.currency || rawQuotationData?.Currency || 'USD'
  const currencySymbol = currency
  
  // Get subform breakdown data - prefer Category 1 WMW if available, otherwise use first subform with data
  const subformBreakdown = rawQuotationData?.Subform_Breakdown || []
  const category1WMWSubform = subformBreakdown.find((sf: any) => 
    sf.Subform?.includes('Category 1 WMW') || sf.Subform === 'Category 1 WMW'
  )
  const activeSubform = category1WMWSubform || subformBreakdown.find((sf: any) => 
    parseFloat(sf.Total_Sale_Value || '0') > 0 || parseFloat(sf.Cost_Before_Tax || '0') > 0
  ) || subformBreakdown[0]
  
  // Map subform fields to amounts
  const subformTotalSaleValue = parseFloat(activeSubform?.Total_Sale_Value || '0') || 0
  const subformCostBeforeTax = parseFloat(activeSubform?.Cost_Before_Tax || '0') || 0
  const subformCostAfterTax = parseFloat(activeSubform?.Cost_After_Tax || '0') || 0
  const subformIGST = parseFloat(activeSubform?.IGST || '0') || 0
  const subformCGST = parseFloat(activeSubform?.CGST || '0') || 0
  
  // Use subform data if available, otherwise fallback to existing logic
  const baseAmount = subformTotalSaleValue > 0 ? subformTotalSaleValue : 
                     (subformCostBeforeTax > 0 ? subformCostBeforeTax : data.totalAmount)
  
  const packingFreight = parseFloat(rawQuotationData?.Packing_Freight || '0') || 0
  const transaction = parseFloat(rawQuotationData?.Transaction_Charges || '0') || 0
  const totalWithCharges = baseAmount + packingFreight + transaction
  const amountInWords = numberToWords(totalWithCharges)
  const currencyWords = currency === 'USD' ? 'US Dollars' : currency === 'INR' ? 'Indian Rupees' : currency

  const splitQtyAndUom = (value: unknown): { qty: string; uom: string } => {
    const s = String(value ?? '').trim()
    if (!s) return { qty: '', uom: '' }
    const parts = s.split(/\s+/).filter(Boolean)
    if (parts.length < 2) return { qty: s, uom: '' }
    const uom = parts.pop() || ''
    const qty = parts.join(' ')
    return { qty, uom }
  }
  
  // Line grid: prefer main WMW + linked subforms (last_item_ref); else legacy WMW_2_0 × main merge
  const lineItems: ExportTableLine[] = useWmwJoinedPipeline
    ? joinedWmwRows.map((row) => {
        const qtyLabel = [row.quantity, row.uom].filter((s) => (s ?? '').trim() !== '').join(' ')
        return {
          item: row.rowIndex,
          mesh: row.productLabel?.trim() || '',
          brand: '',
          size: row.size?.trim() || '',
          sqmArea: '',
          quantity: qtyLabel || row.quantity || '0',
          rate: parseMoneyField(row.ratePerSqmDisplay),
          amount: parseMoneyField(row.amountDisplay),
          deliveryDate: row.deliveryDate || undefined,
          freightCharge: row.freightCharge || undefined,
          packingCharge: row.packingCharges || undefined,
          seamCharge: row.seamCharges || undefined,
        }
      })
    : rawLineItems.map((item, index) => {
        const itemRef = item.last_item_ref?.trim() || item.Last_item_ref?.trim() || ''
        const productDetail = itemRef
          ? rawProductDetails.find(
              (pd: any) =>
                pd.last_item_ref?.trim() === itemRef || pd.Last_item_ref?.trim() === itemRef
            ) || rawProductDetails[index] || {}
          : rawProductDetails[index] || {}

        const brand = productDetail.Brand_Selling_Name || ''

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
        const qtyNum = parseFloat(String(quantity).replace(/,/g, '').trim() || '0')
        const amountFromLine = parseFloat(item.Net_Selling_Amount?.replace(/,/g, '') || item.Gross_Amount?.replace(/,/g, '') || '0')
        const computedAmount = qtyNum * rate
        const amount = Number.isFinite(computedAmount) ? computedAmount : amountFromLine

        return {
          item: index + 1,
          mesh: productDetail.Brand_Category || productDetail.Brand_Selling_Name || '',
          brand,
          size,
          sqmArea,
          quantity,
          rate,
          amount,
        }
      })
  
  const netWeightPerPcs = rawQuotationData?.Net_Weight_Per_Pcs || ''
  const totalNetWeight = rawQuotationData?.Total_Net_Weight || ''
  const totalGrossWeight = rawQuotationData?.Total_Gross_Weight || ''
  
  const consignee = resolveConsigneeDisplay(shippingData, rawQuotationData)
  const kindAttn = shippingData?.Contact_Name || rawQuotationData?.Contact_Name || ''
  const remarks = data.remarks || rawQuotationData?.Remarks || ''

  return (
    <>
      <div
        className="export-quotation-container quotation-doc"
        style={{ maxWidth: '210mm', margin: '0 auto', padding: '8mm 15mm 15mm 15mm', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.4', border: '1px solid #000' }}
      >

        {/* Print table — thead repeats on every printed page */}
        <table className="export-print-table" style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '10px' }}>
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '1%' }} />
            <col style={{ width: '19%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '23%' }} />
          </colgroup>

          {/* ══ REPEATING HEADER ══ */}
          <thead className="export-print-header-row">
            <tr className="print-page-top-spacer" aria-hidden="true">
              <td colSpan={8} />
            </tr>
            <tr>
              <td colSpan={8} style={{ border: 'none', padding: 0, margin: 0 }}>
                <div className="export-print-header" style={{ marginBottom: '15px', marginLeft: 0, marginRight: 0, padding: 0 }}>

                  {/* Title */}
                  <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    QUOTATION
                  </div>

                  {/* Header Section - Exporter + Quotation Details */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #000', borderBottom: '1px solid #000', marginBottom: '15px', tableLayout: 'fixed', marginLeft: 0, marginRight: 0, boxSizing: 'border-box' }}>
                    <colgroup>
                      <col style={{ width: '50%' }} />
                      <col style={{ width: '50%' }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        {/* Left Column - Exporter */}
                        <td style={{ width: '50%', verticalAlign: 'top', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '12px', margin: 0 }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Exporter</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <img
                                src="/wmw-logo.png"
                                alt="WMW Logo"
                                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                              />
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}>METAL FABRICS</div>
                          </div>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>WMW METAL FABRICS LIMITED</div>
                          <div style={{ marginBottom: '2px' }}>53, Industrial Area: Jhotwara,</div>
                          <div style={{ marginBottom: '2px' }}>Jaipur 302012 India</div>
                          <div style={{ marginBottom: '2px' }}>Tel: +911417105151</div>
                          <div style={{ marginBottom: '2px' }}>info@wmwindia.com</div>
                          <div>www.wmwindia.com</div>
                        </td>

                        {/* Right Column - Quotation Details */}
                        <td style={{ width: '50%', verticalAlign: 'top', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '12px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #000', borderBottom: '1px solid #000', fontSize: '10px' }}>
                            <tbody>
                              <tr>
                                <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>Quotation No. & Date:</td>
                                <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>{quotationNumber}, {quotationDate}</td>
                              </tr>
                              <tr>
                                <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>Buyer&apos;s Enquiry No. & Date:</td>
                                <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>{buyerEnquiryNo}, {buyerEnquiryDate}</td>
                              </tr>
                              <tr>
                                <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>Email:</td>
                                <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>{email}</td>
                              </tr>
                              <tr>
                                <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>Other Reference (s):</td>
                                <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>{otherReference || '(nil)'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                </div>{/* end export-print-header */}
              </td>
            </tr>
          </thead>

          {/* ══ BODY — every section is its own <tr> so thead repeats on page breaks ══ */}
          <tbody>

            {/* ── Consignee and Shipping Details (body — shown once, on first page only) ── */}
            <tr>
              <td colSpan={8} style={{ border: 'none', padding: 0, margin: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #000', borderBottom: '1px solid #000', tableLayout: 'fixed', marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 0, boxSizing: 'border-box' }}>
                  <colgroup>
                    <col style={{ width: '50%' }} />
                    <col style={{ width: '50%' }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      {/* Left Column - Consignee */}
                      <td style={{ width: '50%', verticalAlign: 'top', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '12px', margin: 0 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Consignee:</div>
                        <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>{consignee.name}</div>
                        <div style={{ marginBottom: '2px', fontSize: '10px', whiteSpace: 'pre-wrap' }}>{consignee.addressBlock}</div>
                        <div style={{ marginBottom: '4px', fontSize: '10px' }}>{consignee.country}</div>
                        {kindAttn && (
                          <div style={{ marginTop: '4px', marginBottom: '15px', fontWeight: 'bold', fontSize: '10px' }}>
                            Kind Attn: {kindAttn}
                          </div>
                        )}
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginTop: '15px' }}>
                          <tbody>
                            <tr>
                              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>Carriage by:</td>
                              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px' }}>{modeOfDelivery}</td>
                            </tr>
                            <tr>
                              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>Port of Loading:</td>
                              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px' }}>{portOfLoading}</td>
                            </tr>
                            <tr>
                              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>Port of Discharge:</td>
                              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px' }}>{portOfDischarge || ''}</td>
                            </tr>
                            <tr>
                              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>Final Destination:</td>
                              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px' }}>{finalDestination || portOfDischarge || ''}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>

                      {/* Right Column - Country, Payment, Dispatch */}
                      <td style={{ width: '50%', verticalAlign: 'top', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '12px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                          <tbody>
                            <tr>
                              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>Country of Origin of Goods:</td>
                              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>{countryOfOrigin}</td>
                            </tr>
                            <tr>
                              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>Country of Final Destination:</td>
                              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>{countryOfDestination}</td>
                            </tr>
                            <tr>
                              <td colSpan={2} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Terms of Payment:</td>
                            </tr>
                            <tr>
                              <td colSpan={2} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontSize: '10px' }}>{termsOfPayment}</td>
                            </tr>
                            <tr>
                              <td colSpan={2} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontWeight: 'bold', fontSize: '10px', backgroundColor: '#1e40af', color: '#fff' }}>OUR BANKER:</td>
                            </tr>
                            <tr>
                              <td colSpan={2} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontSize: '9px' }}>
                                <div style={{ marginBottom: '2px' }}><strong>Care of:</strong> {accountName}, Jaipur INDIA</div>
                                <div style={{ marginBottom: '2px' }}><strong>Bank:</strong> {bankName}, {bankBranch}</div>
                                {swiftCode && <div style={{ marginBottom: '2px' }}><strong>Swift:</strong> {swiftCode}</div>}
                                {accountNumber && <div><strong>Account:</strong> {accountNumber}</div>}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={2} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Dispatch Ex-Works:</td>
                            </tr>
                            <tr>
                              <td colSpan={2} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 8px', fontSize: '10px' }}>{dispatchExWorks}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ── Description of Goods: header row ── */}
            <tr>
              <td colSpan={5} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                Description of Goods
              </td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                Quantity<br />
                {useWmwJoinedPipeline ? 'UOM' : 'Pcs'}
              </td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                Rate<br />
                {currencySymbol} / {useWmwJoinedPipeline ? 'Sqm' : 'Pcs'}
              </td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                Amount<br />USD
              </td>
            </tr>

            {/* ── Product / Form / Weave / Quality ── */}
            <tr>
              <td colSpan={5} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px 6px 4px 6px', verticalAlign: 'top' }}>
                <div style={{ marginBottom: '3px' }}><strong>Product :</strong> {product}</div>
                {form && <div style={{ marginBottom: '3px' }}><strong>Form :</strong> {form}</div>}
                {weave && <div style={{ marginBottom: '3px' }}><strong>Weave :</strong> {weave}</div>}
                {quality && <div><strong>Quality :</strong> {quality}</div>}
              </td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px' }}></td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px' }}></td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px' }}></td>
            </tr>

            {/* ── Sub-header: Item / MESH BRAND / SIZE / Sqm Area ── */}
            <tr>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 6px', textAlign: 'center', fontWeight: 'bold' }}>Item</td>
              <td colSpan={2} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 6px', fontWeight: 'bold' }}>MESH BRAND</td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 6px', fontWeight: 'bold' }}>SIZE [Mtrs] (LxW)</td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 6px', fontWeight: 'bold' }}>Sqm Area / PC</td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 6px' }}></td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 6px' }}></td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 6px' }}></td>
            </tr>

            {/* ── Line Items ── */}
            {lineItems.map((item, index) => {
              const meshBrand = [item.mesh, item.brand].filter(Boolean).join(' ') || ''
              const metaBits: string[] = []
              if (item.deliveryDate?.trim()) metaBits.push(`Delivery Date: ${item.deliveryDate.trim()}`)
              if (item.freightCharge?.trim()) metaBits.push(`Freight: ${item.freightCharge.trim()}`)
              if (item.packingCharge?.trim()) metaBits.push(`Packing: ${item.packingCharge.trim()}`)
              if (item.seamCharge?.trim()) metaBits.push(`Seam: ${item.seamCharge.trim()}`)
              return (
                <Fragment key={index}>
                  <tr>
                    <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', textAlign: 'center' }}>{item.item}</td>
                    <td colSpan={2} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px' }}>{meshBrand}</td>
                    <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px' }}>{item.size || ''}</td>
                    <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px' }}>{item.sqmArea || ''}</td>
                    <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                      {(() => {
                        const { qty, uom } = splitQtyAndUom(item.quantity)
                        const fallbackUom = !useWmwJoinedPipeline && String(item.quantity ?? '').trim() !== '' && String(item.quantity ?? '').trim() !== '0' ? 'Pos' : ''
                        const uomLabel = uom || fallbackUom
                        return (
                          <div className="quotation-qty-uom-cell">
                            <div className="quotation-qty-value">{qty || '\u00A0'}</div>
                            {uomLabel ? <div className="quotation-qty-uom">{uomLabel}</div> : null}
                          </div>
                        )
                      })()}
                    </td>
                    <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                      {Number.isFinite(item.rate) ? formatCurrency(item.rate, currency) : ''}
                    </td>
                    <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', textAlign: 'right' }}>{formatCurrency(item.amount, currency)}</td>
                  </tr>
                  {useWmwJoinedPipeline && metaBits.length > 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          borderTop: '1px solid #000',
                          borderBottom: '1px solid #000',
                          padding: '4px 6px',
                          fontSize: '9px',
                          verticalAlign: 'top',
                        }}
                      >
                        {metaBits.join('  |  ')}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}

            {/* ── Spacer ── */}
            <tr>
              <td colSpan={5} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px' }}></td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px' }}></td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px' }}></td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px' }}></td>
            </tr>

            {/* ── Weight Details ── */}
            <tr>
              <td colSpan={5} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '4px 6px 10px 6px', fontSize: '9px', verticalAlign: 'top' }}>
                <div style={{ marginBottom: '3px' }}>
                  <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Net Weight (Per Pcs.)</span> :&nbsp;{netWeightPerPcs} Kgs. (± 5%)
                </div>
                <div style={{ marginBottom: '3px' }}>
                  <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Total Net Weight</span> :&nbsp;{totalNetWeight} Kgs. (± 5%)
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Total Gross Weight</span> :&nbsp;{totalGrossWeight} Kgs. (± 5%)
                </div>
              </td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px' }}></td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px' }}></td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px' }}></td>
            </tr>

            {/* ── Spacer ── */}
            <tr>
              <td colSpan={5} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px' }}></td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px' }}></td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px' }}></td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px' }}></td>
            </tr>

            {/* ── Packing / Freight ── */}
            {packingFreight > 0 && (
              <tr>
                <td colSpan={7} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px' }}>
                  Packing, Freight &amp; Forwarding charges upto {finalDestination || portOfDischarge || 'Benapole'}, {countryOfDestination} by {modeOfDelivery}:
                </td>
                <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                  {formatCurrency(packingFreight, currency)}
                </td>
              </tr>
            )}

            {/* ── Transaction Charges ── */}
            {transaction > 0 && (
              <tr>
                <td colSpan={7} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', textAlign: 'right', color: '#0000CD' }}>
                  Add.: Transaction charges
                </td>
                <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 'bold', color: '#0000CD' }}>
                  {formatCurrency(transaction, currency)}
                </td>
              </tr>
            )}

            {/* ── Transport ── */}
            <tr>
              <td colSpan={7} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '5px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                Transport
              </td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '5px 6px' }}></td>
            </tr>

            {/* ── Total CFR / CPT ── */}
            <tr>
              <td colSpan={7} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '5px 6px', textAlign: 'center', fontWeight: 'bold' }}>
                Total {priceHeaderIncoterm} Price upto {finalDestination || portOfDischarge || 'Benapole'} By {modeOfDelivery}:
              </td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '5px 6px' }}></td>
            </tr>

            {/* ── Note + Currency + Total ── */}
            <tr>
              <td colSpan={6} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', fontSize: '9px', verticalAlign: 'top' }}>
                {transaction > 0 && (
                  <span>Note : If the total order value is less than {currencySymbol} 2500, transaction fee of {currencySymbol} 100 per invoice shall be charged extra</span>
                )}
              </td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                {currency}
              </td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>
                <span className="quotation-grand-total-amount">{formatCurrency(totalWithCharges, currency)}</span>
              </td>
            </tr>

            {/* ── Amount Chargeable ── */}
            <tr>
              <td colSpan={1} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', fontWeight: 'bold', fontSize: '9px', verticalAlign: 'top' }}>
                Amount<br />Chargeable<br />(In words) :
              </td>
              <td colSpan={5} style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', fontSize: '9px', fontWeight: 'bold' }}>
                {currencyWords} {amountInWords} Only
              </td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', fontWeight: 'bold', textAlign: 'right' }}>
                Total:-
              </td>
              <td style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>
                <span className="quotation-grand-total-amount">{formatCurrency(totalWithCharges, currency)}</span>
              </td>
            </tr>

            {/* ── HSN Code & Remarks ── */}
            <tr>
              <td colSpan={8} style={{ padding: '10px 0 0 0', fontSize: '10px' }}>
                {/* {hsCode && <div style={{ marginBottom: '8px' }}><strong>HSN CODE:</strong> {hsCode}</div>} */}
                {remarks && (
                  <div>
                    <strong>Remarks:</strong>
                    {/* <div style={{ marginTop: '4px', whiteSpace: 'pre-line', fontSize: '9px' }}>
                      {remarks.split('\n').map((line, idx) => (
                        <div key={idx} style={{ marginBottom: '2px' }}>
                          {line.match(/^\d+\./) ? line : `${idx + 1}. ${line}`}
                        </div>
                      ))}
                    </div> */}
                  </div>
                )}
              </td>
            </tr>

            {/* ── Footer ── */}
            <tr>
              <td colSpan={8} style={{ padding: '30px 0 0 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', verticalAlign: 'top', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '12px' }}></td>
                      <td style={{ width: '50%', verticalAlign: 'top', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '12px', textAlign: 'right' }}>
                        <div style={{ marginBottom: '8px', fontSize: '10px' }}>
                          <strong>Offer Validity:</strong> {offerValidity}
                        </div>
                        <div style={{ marginBottom: '20px', fontSize: '10px', fontWeight: 'bold' }}>
                          For WMW Metal Fabrics Ltd.
                        </div>
                        <div style={{ marginBottom: '8px', fontSize: '9px', fontStyle: 'italic' }}>
                          This is an electronically generated document, No signature required.
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', fontSize: '10px' }}>
                          <div style={{ width: '150px', borderTop: '1px solid #000', paddingTop: '4px' }}>Signature</div>
                          <div>&amp; Date: {quotationDate}</div>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '9px', fontStyle: 'italic' }}>
                          Subject to enclosed terms &amp; conditions
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

          </tbody>
        </table>{/* end export-print-table */}

      </div>

      <div className="no-print" style={{ marginTop: '24px', textAlign: 'center' }}>
        <PrintButton />
      </div>
    </>
  )
}
