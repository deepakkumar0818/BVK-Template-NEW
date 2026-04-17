'use client'

import { QuotationData } from '@/lib/types'
import { formatCurrency, numberToWords } from '@/lib/quotation-utils'
import PrintButton from './PrintButton'

interface GKDQuotationContentProps {
  data: QuotationData
  shippingData?: any
  billingData?: any
  rawQuotationData?: any
}

export default function GKDQuotationContent({ data, shippingData, billingData, rawQuotationData }: GKDQuotationContentProps) {
  // Format date helper
  const formatGKDDate = (dateString?: string): string => {
    if (!dateString) return ''
    try {
      const dateMatch = dateString.match(/(\d{2})-(\w{3})-(\d{4})/)
      if (dateMatch) {
        const [, day, month, year] = dateMatch
        const monthMap: { [key: string]: string } = {
          'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April', 'May': 'May', 'Jun': 'June',
          'Jul': 'July', 'Aug': 'August', 'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
        }
        const monthName = monthMap[month] || month
        return `${day} ${monthName} ${year}`
      }
      return dateString
    } catch {
      return dateString || ''
    }
  }

  // Use dynamic data from API
  const date = formatGKDDate(data.date || rawQuotationData?.Created_Date_and_time)
  const gstNo = billingData?.Billing_GST_No || rawQuotationData?.Billing_GST_No || shippingData?.Shipping_GST_No || ''
  const refNo = data.quotationNumber || rawQuotationData?.Name || ''
  const recipientCompany = billingData?.Billing_Address_Name || rawQuotationData?.Billing_Address_Name || ''
  const recipientAddress = `${billingData?.Billing_Street || rawQuotationData?.Billing_Street || ''} ${billingData?.Billing_City || rawQuotationData?.Billing_City || ''} ${billingData?.Billing_Postal_Code || rawQuotationData?.Billing_Postal_Code || ''}-${billingData?.Billing_State || rawQuotationData?.Billing_State || ''}`.trim()
  
  // Transform line items from data
  const lineItems = data.lineItems?.map((item, index) => ({
    item: index + 1,
    productCode: rawQuotationData?.Category_1_MM_Database_WI?.[index]?.Product_Code || '',
    productName: item.product || '',
    description: `${item.type || ''} ${item.form || ''} ${item.size || ''} ${item.quality || ''}`.trim(),
    qty: parseFloat(item.qty?.replace(/,/g, '') || '0'),
    unitPrice: parseFloat(item.rate?.replace(/,/g, '') || '0'),
    totalPrice: parseFloat(item.amount?.replace(/,/g, '') || '0')
  })) || []
  
  // Direct field mapping for IGST
  const igstPercent = parseFloat(rawQuotationData?.IGST_Percent || rawQuotationData?.IGST_Rate || '0') || 0
  const igstAmount = parseFloat(rawQuotationData?.IGST_Amount || '0') || 0
  const totalAmount = (() => {
    const overall = rawQuotationData?.Overall_Grand_Total_incl_Accessories
    if (overall != null && String(overall).trim() !== '') {
      const n = parseFloat(String(overall).replace(/,/g, ''))
      if (Number.isFinite(n)) return n
    }
    const fallback =
      parseFloat(String(rawQuotationData?.Total_After_Tax || rawQuotationData?.Total_Amount_After_GST || '0').replace(/,/g, '')) || 0
    return fallback || data.totalAmount
  })()
  const amountInWords = numberToWords(totalAmount)
  const paymentTerms = data.termsOfPayment || rawQuotationData?.Term_of_Payment || ''
  
  const bankDetails = {
    companyName: rawQuotationData?.Bank_Company_Name || 'GKD India Limited',
    bankName: rawQuotationData?.Bank_Name || 'HDFC Bank',
    bankAddress: rawQuotationData?.Bank_Address || 'Times Square, 10 Central Spine, Vidhyadhar Nagar, Jaipur-302023, Rajasthan',
    accountType: rawQuotationData?.Account_Type || 'Current Account',
    accountNumber: rawQuotationData?.Account_Number || '50200076113695',
    bankIFSC: rawQuotationData?.Bank_IFSC || 'HDFC0000348'
  }
  
  const signatory = rawQuotationData?.Payement || 'Milap Verma'
  const companyName = rawQuotationData?.Company_Name || 'GKD INDIA LTD.'
  const companyAddress = rawQuotationData?.Company_Address || '52, Industrial Area, Jhotwara, Jaipur-202012 Rajasthan, India'
  const phone = rawQuotationData?.Phone || '91 141 710 5100'
  const fax = rawQuotationData?.Fax || '91 141 710 5199'
  const email = rawQuotationData?.Email || 'query@gkd-india.com'
  const website = rawQuotationData?.Website || 'www.gkd-india.com'
  const isoCertifications = rawQuotationData?.ISO_Certifications?.split(',') || ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 18001:2007']

  return (
    <>
      <div className="gkd-quotation-container" style={{ maxWidth: '210mm', margin: '0 auto', padding: '20mm', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.6' }}>
        <table className="gkd-print-table" style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
          {/* Header - Repeats on every page in print */}
          <thead className="gkd-print-header-row">
            <tr className="print-page-top-spacer" aria-hidden="true">
              <td colSpan={2} />
            </tr>
            <tr>
              <td colSpan={2} style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                <div className="gkd-print-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  {/* Left: Company Name */}
                  <div style={{ fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase' }}>
                    {companyName}
                  </div>
                  {/* Right: Logo and Date */}
                  <div style={{ textAlign: 'right' }}>
                    {/* Logo Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ width: '180px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                        <img 
                          src="/wmw-logo.png" 
                          alt="WMW Logo" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                          onError={(e) => {
                            console.error('WMW Logo failed to load:', e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      {/* Date - Bold and Centered */}
                      <div style={{ fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>
                        {date}
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </thead>

          {/* Main Content */}
          <tbody>
            <tr>
              <td colSpan={2} style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                {/* Recipient Information */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}>To,</div>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>{recipientCompany}</div>
                  <div style={{ marginBottom: '4px' }}>{recipientAddress}</div>
                </div>

                {/* PROFORMA INVOICE Title */}
                <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', textTransform: 'uppercase' }}>
                  PROFORMA INVOICE
                </div>

                {/* GST No. and Ref. No. */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '11px' }}>
                  <div>
                    <strong>GST No.:</strong> {gstNo}
                  </div>
                  <div>
                    <strong>Ref. No.:</strong> {refNo}
                  </div>
                </div>

                {/* Item Details Table — borderless body like proforma reference (rules via .gkd-proforma-line-table) */}
                <div style={{ marginBottom: '20px' }}>
                  <table className="gkd-proforma-line-table">
                    <thead>
                      <tr>
                        <th className="gkd-pl-head gkd-pl-item">Item</th>
                        <th className="gkd-pl-head gkd-pl-product">Product</th>
                        <th className="gkd-pl-head gkd-pl-num">Qty</th>
                        <th className="gkd-pl-head gkd-pl-num">Unit Price / INR</th>
                        <th className="gkd-pl-head gkd-pl-num">Total Price / INR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, index) => (
                        <tr key={index}>
                          <td className="gkd-pl-cell gkd-pl-item">{item.item}.</td>
                          <td className="gkd-pl-cell gkd-pl-product">
                            <div style={{ marginBottom: '4px' }}>
                              <strong>Product:</strong> {item.productCode} {item.productName}
                            </div>
                            <div style={{ fontSize: '10px', lineHeight: '1.5' }}>
                              {item.description}
                            </div>
                          </td>
                          <td className="gkd-pl-cell gkd-pl-num">{item.qty}</td>
                          <td className="gkd-pl-cell gkd-pl-num">{formatCurrency(item.unitPrice, 'INR')}</td>
                          <td className="gkd-pl-cell gkd-pl-num">{formatCurrency(item.totalPrice, 'INR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                <div style={{ marginBottom: '20px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                    <div style={{ width: '300px' }}>
                      {igstPercent > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div><strong>IGST {igstPercent}%:</strong></div>
                          <div>{formatCurrency(igstAmount, 'INR')}</div>
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: '8px',
                          paddingTop: '8px',
                          fontWeight: 'bold',
                        }}
                      >
                        <div><strong>Total Amount:</strong></div>
                        <div>{formatCurrency(totalAmount, 'INR')}</div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="gkd-proforma-amount-words"
                    style={{ marginTop: '12px', marginBottom: '12px', paddingBottom: '12px' }}
                  >
                    <strong>Amount in Words:</strong> {amountInWords}
                  </div>
                </div>

                {/* Payment Terms */}
                <div style={{ marginBottom: '20px', fontSize: '11px' }}>
                  <div>
                    <strong>Payment Terms:</strong> {paymentTerms}
                  </div>
                </div>

                {/* Bank Details */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ backgroundColor: '#1e40af', color: '#fff', padding: '8px', fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}>
                    Our Bank Details
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11px' }}>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold', width: '25%' }}>Company Name:</td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{bankDetails.companyName}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>Bank Name:</td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{bankDetails.bankName}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>Bank Address:</td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{bankDetails.bankAddress}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>Account Type:</td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{bankDetails.accountType}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>Account Number:</td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{bankDetails.accountNumber}</td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>Bank IFSC:</td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{bankDetails.bankIFSC}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>

          {/* Footer - Repeats on every page in print */}
          <tfoot className="gkd-print-footer-row">
            <tr>
              <td colSpan={2} style={{ border: 'none', padding: 0, verticalAlign: 'bottom' }}>
                <div className="gkd-print-footer" style={{ marginTop: '20px', paddingTop: '15px', fontSize: '10px' }}>
                  {/* Signature Name - Left-aligned */}
                  <div className="gkd-signatory-name" style={{ textAlign: 'left', marginBottom: '20px', fontWeight: 'bold' }}>
                    {signatory}
                  </div>

                  {/* Footer - Three Column Layout */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '10px' }}>
                    {/* Column 1 - Company Address (Left) */}
                    <div style={{ width: '33%' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase' }}>{companyName}</div>
                      <div style={{ marginBottom: '4px' }}>52, Industrial Area,</div>
                      <div style={{ marginBottom: '4px' }}>Jhotwara, Jaipur-302012</div>
                      <div>Rajasthan, India</div>
                    </div>

                    {/* Column 2 - Contact Information (Middle) */}
                    <div style={{ width: '33%', textAlign: 'center' }}>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>Tel:</strong> + {phone}
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>Fax:</strong> + {fax}
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>E-Mail:</strong> <span style={{ color: '#0066cc', textDecoration: 'underline' }}>{email}</span>
                      </div>
                      <div>
                        <span style={{ color: '#0066cc', textDecoration: 'underline' }}>{website}</span>
                      </div>
                    </div>

                    {/* Column 3 - ISO Certifications (Right) */}
                    <div style={{ width: '33%', textAlign: 'right' }}>
                      {isoCertifications.map((cert: string, index: number) => (
                        <div key={index} style={{ marginBottom: '4px' }}>{cert}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="no-print" style={{ marginTop: '24px', textAlign: 'center' }}>
        <PrintButton />
      </div>
    </>
  )
}
