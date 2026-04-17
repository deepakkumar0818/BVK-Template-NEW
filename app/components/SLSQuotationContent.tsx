'use client'

import Link from 'next/link'
import { QuotationData } from '@/lib/types'
import { resolveConsigneeDisplay } from '@/lib/consignee-display'
import { formatCurrency, resolveQuotationValidity } from '@/lib/quotation-utils'
import { buildSlsLineItemsFromWi20SubformsShared } from '@/lib/wi-line-display-shared'
import PrintButton from './PrintButton'

interface SLSQuotationContentProps {
  data: QuotationData
  shippingData?: any
  billingData?: any
  rawQuotationData?: any
}

export default function SLSQuotationContent({ data, shippingData, billingData, rawQuotationData }: SLSQuotationContentProps) {
  // Format date helper for DD.MM.YYYY format
  const formatSLSDate = (dateString?: string): string => {
    if (!dateString) return ''
    try {
      const dateMatch = dateString.match(/(\d{2})-(\w{3})-(\d{4})/)
      if (dateMatch) {
        const [, day, month, year] = dateMatch
        const monthMap: { [key: string]: string } = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
          'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        }
        const monthNum = monthMap[month] || '01'
        return `${day}.${monthNum}.${year}`
      }
      return dateString
    } catch {
      return dateString || ''
    }
  }

  // Format date for inquiry (DD.MM.YY)
  const formatInquiryDate = (dateString?: string): string => {
    if (!dateString) return ''
    try {
      const dateMatch = dateString.match(/(\d{2})-(\w{3})-(\d{4})/)
      if (dateMatch) {
        const [, day, month, year] = dateMatch
        const monthMap: { [key: string]: string } = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
          'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        }
        const monthNum = monthMap[month] || '01'
        const shortYear = year.slice(-2)
        return `${day}.${monthNum}.${shortYear}`
      }
      return dateString
    } catch {
      return dateString || ''
    }
  }

  // Use dynamic data from API
  const date = formatSLSDate(data.date || rawQuotationData?.Created_Date_and_time)
  const quotationRefNo = data.quotationNumber || rawQuotationData?.Name || ''
  const inquiryDate = formatInquiryDate(data.customerReferenceDate || rawQuotationData?.Customer_Reference_Date)
  const consignee = resolveConsigneeDisplay(shippingData, rawQuotationData)
  const recipientName = String(shippingData?.Contact_Name ?? rawQuotationData?.Contact_Name ?? '').trim()
  const recipientCompany =
    String(shippingData?.Shipping_Address_Name ?? rawQuotationData?.Shipping_Address_Name ?? '').trim() ||
    String(billingData?.Billing_Address_Name ?? rawQuotationData?.Billing_Address_Name ?? '').trim()
  const recipientAddressBody = [consignee.addressBlock, consignee.country].filter(Boolean).join('\n')
  
  const displayCurrency = data.currency || 'INR'
  const slsRowsFromWi20 = buildSlsLineItemsFromWi20SubformsShared(
    rawQuotationData as Record<string, unknown> | null | undefined,
    rawQuotationData?.Template as string | undefined
  )
  // Prefer WI_2_0 subform mapping for SLS; keep prior behavior if both subforms are empty
  const lineItems =
    slsRowsFromWi20.length > 0
      ? slsRowsFromWi20
      : data.lineItems?.map((item, index) => ({
          item: index + 1,
          product: `${item.product || ''}${item.quality ? `; ${item.quality}` : ''}`.trim(),
          qty: item.qty || '',
          unitPrice: parseFloat(item.rate?.replace(/,/g, '') || '0'),
          totalPrice: parseFloat(item.amount?.replace(/,/g, '') || '0'),
        })) || []
  
  // "Please Note:" line maps to Zoho `Please_Note` only when the field exists on the record.
  // Empty string must not fall through to `Remarks` (|| would treat "" as missing).
  const pleaseNote = (() => {
    const raw = rawQuotationData as Record<string, unknown> | null | undefined
    if (raw != null && Object.prototype.hasOwnProperty.call(raw, 'Please_Note')) {
      const v = raw.Please_Note
      return v == null ? '' : String(v)
    }
    return data.remarks || ''
  })()
  const packing = rawQuotationData?.Packing || 'Included'
  const taxes = rawQuotationData?.Taxes || 'All taxes extra as applicable from time to time.'
  const payment = data.termsOfPayment || rawQuotationData?.Term_of_Payment || ''
  const quotationValidity = resolveQuotationValidity(rawQuotationData as Record<string, unknown> | null | undefined)
  const warrantyDisclaimer = rawQuotationData?.Warranty_Disclaimer || 'We declare that our products are wearing parts. Therefore, they are excluded from any warranty regulations.'
  const generalTerms = rawQuotationData?.General_Terms || 'All WMW goods and services are subject to the WMW General Terms and Conditions, a copy of which is available on the WMW website (www.wmwindia.com) or you may request a hard copy which we can send to you. This is in line with the wording on the website.'
  const closingStatement = rawQuotationData?.Closing_Statement || 'We hope that the above quotation is of interest and will gladly be of further help with any request you may have.'
  const contactPerson = rawQuotationData?.Payement || 'Mr. Milap Verma'
  const contactNumber = rawQuotationData?.Contact_Number || '(+91-9358584002)'
  const companyName = rawQuotationData?.Company_Name || 'WMW Industries Limited.'
  const companyFormerName = rawQuotationData?.Company_Former_Name || 'Formerly known as GKD India Limited'
  const registeredAddress = rawQuotationData?.Registered_Address || '52, Industrial Area, Jhotwara, Jaipur-302012, Rajasthan, India'
  const phone = rawQuotationData?.Phone || '+91 141 7105100'
  const email = rawQuotationData?.Email || 'info@wmwindia.com'
  const website = rawQuotationData?.Website || 'www.wmwindia.com'
  const registeredOffice = rawQuotationData?.Registered_Office || '# Imax Imperial, Room No. 1C, 1st floor, 101/5, S.N. Banerjee Road, Kolkata-700014, West Bengal, India'
  const tagline = rawQuotationData?.Tagline || 'Weaving Technical Mesh Solutions'
  const cin = rawQuotationData?.CIN || 'U51909WB2011PLC163277'
  const gstin = rawQuotationData?.GSTIN || billingData?.Billing_GST_No || shippingData?.Shipping_GST_No || '08AAECG2743F1ZS'
  const groupCompany = rawQuotationData?.Group_Company || 'A BVK Group Company'

  return (
    <>
      <div className="sls-quotation-container" style={{ maxWidth: '210mm', margin: '0 auto', padding: '10mm 20mm 20mm 20mm', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.6' }}>
        {/* Header with Logo and Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', marginTop: 0 }}>
          {/* Left side - Empty for recipient info */}
          <div></div>
          
          {/* Right side - Logo, Company Name, and Date */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', marginTop: 0 }}>
            {/* WMW Logo - 150px */}
            <div style={{ width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 0, paddingTop: 0 }}>
              <img 
                src="/wmw-logo.png" 
                alt="WMW Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', marginTop: 0 }}
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            {/* Company Name */}
            <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', textAlign: 'right' }}>
              WMW INDUSTRIES LTD
            </div>
            {/* Date */}
            <div style={{ fontSize: '11px', textAlign: 'right' }}>
              <strong>Date:</strong> {date}
            </div>
          </div>
        </div>

        {/* Recipient Information */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '12px' }}>To,</div>
          <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>{recipientName}</div>
          <div style={{ marginBottom: '5px' }}>{recipientCompany}</div>
          {recipientAddressBody ? (
            <div style={{ marginBottom: '5px', whiteSpace: 'pre-wrap' }}>{recipientAddressBody}</div>
          ) : null}
        </div>

        {/* Quotation Reference */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Quotation Ref. No.:</strong> {quotationRefNo}
          </div>
          <div style={{ marginBottom: '20px' }}>
            Concerning your inquiry vide email dated {inquiryDate}, we are pleased to quote our price here.
          </div>
        </div>

        {/* Product Table */}
        <div style={{ marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11px', tableLayout: 'fixed', wordWrap: 'break-word' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Item</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Product</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>QTY/KG</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>{`Unit Price/ ${displayCurrency}`}</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>{`Total Price/ ${displayCurrency}`}</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.item}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{item.product}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(item.unitPrice, displayCurrency)}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(item.totalPrice, displayCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Terms and Conditions */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '15px' }}>
            <strong>Please Note:</strong> {pleaseNote}
          </div>
          <div style={{ marginBottom: '10px', borderTop: '1px solid #000', paddingTop: '10px', marginTop: '10px' }}>
            <strong>Packing:</strong> {packing}
          </div>
          <div style={{ marginBottom: '10px', borderTop: '1px solid #000', paddingTop: '10px', marginTop: '10px' }}>
            <strong>Taxes:</strong> {taxes}
          </div>
          <div style={{ marginBottom: '10px', borderTop: '1px solid #000', paddingTop: '10px', marginTop: '10px' }}>
            <strong>Payment:</strong> {payment}
          </div>
          <div style={{ marginBottom: '10px', borderTop: '1px solid #000', paddingTop: '10px', marginTop: '10px' }}>
            <strong>Quotation Validity Time:</strong> {quotationValidity}
          </div>
          <div style={{ marginBottom: '15px', marginTop: '15px' }}>
            {warrantyDisclaimer}
          </div>
          <div style={{ marginBottom: '15px' }}>
            {generalTerms}
          </div>
          <div style={{ marginBottom: '25px' }}>
            {closingStatement}
          </div>
        </div>

        {/* Contact Person */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{companyName}</div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Contact Person:</strong> {contactPerson} {contactNumber}
          </div>
        </div>

        {/* Signature Section */}
        <div className="sls-signature-block" style={{ marginBottom: '40px', marginTop: '50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ width: '200px' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginBottom: '4px' }}></div>
              <div style={{ fontSize: '10px' }}>Signature</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', marginBottom: '4px' }}>Date: {date}</div>
            </div>
          </div>
        </div>

        {/* Footer - Company Details */}
        <div className="sls-company-footer" style={{ borderTop: '2px solid #000', paddingTop: '15px', marginTop: '40px', fontSize: '9px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ width: '60%' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>WMW INDUSTRIES LIMITED</div>
              <div style={{ marginBottom: '8px', fontSize: '8px' }}>{companyFormerName}</div>
              <div style={{ marginBottom: '4px' }}>{registeredAddress}</div>
              <div style={{ marginBottom: '4px' }}>{phone} | {email} | {website}</div>
              <div style={{ marginTop: '8px' }}>
                <strong>Registered Office:</strong> {registeredOffice}
              </div>
            </div>
            <div style={{ width: '35%', textAlign: 'right' }}>
              <div style={{ marginBottom: '4px' }}>{tagline}</div>
              <div style={{ marginBottom: '4px' }}>CIN: {cin}</div>
              <div style={{ marginBottom: '4px' }}>GST: {gstin}</div>
              <div style={{ fontWeight: 'bold', marginTop: '8px' }}>{groupCompany}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="no-print" style={{ marginTop: '24px', textAlign: 'center' }}>
        <Link href="/sls-conditions" style={{ color: '#1e40af', textDecoration: 'underline' }}>
          View Standard Conditions of Sale
        </Link>
      </div>

      {/* SLS: printable conditions block (full content per screenshots) */}
      <div className="conditions-for-print conditions-for-print--sls conditions-doc" style={{ border: '1px solid #000', padding: '16px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>The following is not included in this quotation:</div>

        <div style={{ marginBottom: '14px' }}>
          <div>All items not mentioned, insurance, Taxes &amp; Duties, Freight, Demur rage, Detention charges, Supervision,</div>
          <div>Static Report, Support construction &amp; installation of mesh panels at site.</div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />

        <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Taxes and Duties**:</div>
        <div style={{ marginBottom: '6px' }}>Will be extra as applicable over and above the Ex-factory prices quoted.</div>
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>18% IGST will be applicable extra.</div>
        <div style={{ marginBottom: '10px' }}>
          However, if there is any change in Tax and any New Statutory Levies is introduced by Government at the time of delivery of the same will be
          billed as per actual.
        </div>
        <div style={{ marginBottom: '14px' }}>
          <strong>**</strong>Octroi, Entry Tax and any other taxes/ duties, if any, have to be borne by the Buyer as per the actual.
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />

        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Packing and Transport:</div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 10px 1fr', rowGap: '6px', marginBottom: '14px' }}>
          <div>Packing</div>
          <div>:</div>
          <div>Normal Box packing included in above price.</div>
          <div>Freight cost to site</div>
          <div>:</div>
          <div>To be paid as per actual by the client directly.</div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '120px 10px 1fr', marginBottom: '10px' }}>
          <div style={{ fontWeight: 'bold' }}>Delivery time</div>
          <div>:</div>
          <div>Delivery will be made based on later of the following below:</div>
        </div>

        <div style={{ marginLeft: '18px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ width: '20px' }}>A)</div>
            <div>
              Dispatch to be confirmed whenever project will be more concrete and will be dependent on receipt of the last of the following (As per
              terms or this Offer)
            </div>
          </div>
        </div>
        <div style={{ marginLeft: '56px', marginBottom: '8px' }}>
          <div>a) Purchase Order</div>
          <div>b) Advance</div>
        </div>
        <div style={{ marginLeft: '18px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ width: '20px' }}>B)</div>
            <div>
              Ex-factory Dispatch can only commence <strong>1 to 2 Week</strong> from receipt of all required documents &amp; pending amount.
            </div>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />

        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Payment conditions:</div>
        <div style={{ marginBottom: '10px' }}>
          100% Advance with an acceptance of offer and a confirmed purchase order of the total invoice value.
        </div>
        <div style={{ marginBottom: '14px' }}>
          If goods are not picked up within 15days from date of readiness notified by us via email to you / authorized person then we will be
          compelled to charge interest @24% per annul from the 16<sup>th</sup> day of such delay.
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />

        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Quotation Validity:</div>
        <div style={{ marginBottom: '14px' }}>
          Time: {quotationValidity.trim() !== '' ? quotationValidity : '1 months from the date of quotation.'}
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />

        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>General Remarks:</div>
        <div style={{ marginBottom: '10px' }}>If the specifications are changed as the project develops, prices &amp; deliveries may change.</div>
        <div style={{ marginBottom: '10px' }}>
          Changes to panel sizes post approval of drawings will be on extra chargeable basis, any decrease in quantity will not change the total order
          price. Any increase in quantity will be charged additionally on the SQM rate being agreed.
        </div>
        <div style={{ marginBottom: '10px' }}>
          The above quotation is valid for the Mesh panel quantities, dimensions and total quantity as well as for the finish and accessories as
          described.
        </div>
        <div style={{ marginBottom: '12px' }}>
          Determination of the fixing elements (If considered into quotation) : All fixing elements such as Roundbar, Eyebolt, Flat, Clevis bolt etc.
          have been defined on the basis of our static calculation. All parts of support construction and the expected loads have to be calculated and
          confirmed by customer&apos;s civil engineer.
        </div>

        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Only customer will be responsible for the following:</div>
        <ul style={{ marginTop: 0, marginBottom: '12px' }}>
          <li>The support construction is built according to drawings and static calculations.</li>
          <li>Tolerances of support construction at mesh fixing points is &plusmn; 2 mm</li>
          <li>Mesh panels are stored on building site safely and dry and will be handled according advice of GKD India Ltd.</li>
          <li>Installation of mesh panels is done according to drawings, static calculations</li>
          <li>Damage / theft of material on site</li>
          <li>Damage of mesh during transit / storage/ erection/ installation</li>
        </ul>

        <div style={{ marginBottom: '14px' }}>
          Our General conditions of sales and standard terms of supply apply, the copy of same is available on our website.
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />

        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Additional remarks:</div>
        <div style={{ marginBottom: '10px' }}>
          The confirmed delivery schedule will be subject to the following conditions and noncompliance of any of these conditions will result in
          revision of schedule.
        </div>
        <ol style={{ marginTop: 0, marginBottom: '14px' }}>
          <li>Receipt of Approved Drawings** from the customer / architect.</li>
          <li>Receipt of payment as per agreed terms</li>
          <li>No further changes affecting design and detailing after the approval of drawings.</li>
          <li>Receipt of complete panel dimensions.</li>
          <li>
            GKD India Ltd. will be provided with a GKD verification report duly stamped and approved by principal architects that the tolerances of the
            support construction at the architectural fixing points is within &plusmn;2mm.
          </li>
        </ol>

        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
          **Approved Drawings (Receipt of Signed off drawings with design and detailing from the customer / architect)
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />

        <div style={{ marginBottom: '12px' }}>
          We hope that the above quotation is of interest and will gladly be of further help for any request you may have.
        </div>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>GKD India Ltd.</div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 'bold' }}>Contact Person:</div>
          <div style={{ fontWeight: 'bold' }}>Mr. Milap Verma</div>
          <div style={{ fontWeight: 'bold' }}>(9358584002)</div>
        </div>
      </div>

      <div className="no-print" style={{ marginTop: '24px', textAlign: 'center' }}>
        <PrintButton />
      </div>
    </>
  )
}
