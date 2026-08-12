'use client'

import Link from 'next/link'
import { QuotationData } from '@/lib/types'
import { resolveConsigneeDisplay } from '@/lib/consignee-display'
import {
  formatCurrency,
  parseOverallGrandTotalInclAccessories,
  parseQuotationTaxForSummary,
  resolveQuotationValidity,
} from '@/lib/quotation-utils'
import { buildSlsLineItemsFromWi20SubformsShared } from '@/lib/wi-line-display-shared'
import { quotationScalarFieldPresent, resolveWmwChargeTotals } from '@/lib/wmw-subform-mapping'
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

  const date = formatSLSDate(data.date || rawQuotationData?.Created_Date_and_time)
  const quotationRefNo = data.quotationNumber || rawQuotationData?.Name || ''
  // Root-level `Remarks` (NOT subform `Remarks` such as Product_Fitments[].Remarks).
  // Replaces the legacy "Concerning your inquiry…" intro line; hidden when empty.
  const slsRootRemarks = String(
    (rawQuotationData as Record<string, unknown> | undefined)?.Remarks ?? ''
  ).trim()
  const consignee = resolveConsigneeDisplay(shippingData, rawQuotationData)
  const recipientName = String(shippingData?.Contact_Name ?? rawQuotationData?.Contact_Name ?? '').trim()
  const recipientCompany =
    String(shippingData?.Shipping_Address_Name ?? rawQuotationData?.Shipping_Address_Name ?? '').trim() ||
    String(billingData?.Billing_Address_Name ?? rawQuotationData?.Billing_Address_Name ?? '').trim()
  // Recipient address block. Prefer the shipping-consignee display (multi-line
  // with country). If that's empty (record has no shipping address, only
  // billing), fall back to composing a single-line billing address from the
  // record's billing fields — same behavior as BVK so records with billing-only
  // data still show an address.
  const recipientAddressShipping = [consignee.addressBlock, consignee.country]
    .filter(Boolean)
    .join('\n')
  const recipientAddressBilling = (() => {
    const street = String(
      billingData?.Billing_Street ?? rawQuotationData?.Billing_Street ?? ''
    ).trim()
    if (!street) return ''
    const city = String(
      billingData?.Billing_City ?? rawQuotationData?.Billing_City ?? ''
    ).trim()
    const state = String(
      billingData?.Billing_State ?? rawQuotationData?.Billing_State ?? ''
    ).trim()
    const postal = String(
      billingData?.Billing_Postal_Code ?? rawQuotationData?.Billing_Postal_Code ?? ''
    ).trim()
    return `${street}, ${city}, ${state} ${postal}`.replace(/\s+/g, ' ').trim()
  })()
  const recipientAddressBody = recipientAddressShipping || recipientAddressBilling

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
        uom: (item.uom || '').trim(),
        hsnCode: (item.hsnCode || '').trim(),
        unitPrice: parseFloat(item.rate?.replace(/,/g, '') || '0'),
        totalPrice: parseFloat(item.amount?.replace(/,/g, '') || '0'),
      })) || []

  const {
    discountTotal: slsDiscountAmount,
    packingTotal: slsPackingTotal,
    freightTotal: slsFreightTotal,
  } = resolveWmwChargeTotals(rawQuotationData ?? null)
  const slsShowDiscountRow = Number.isFinite(slsDiscountAmount) && slsDiscountAmount !== 0

  // Other Charges (Zoho scalar `Other_Charges`, optionally labelled with `Type_of_Other_Charges`).
  const slsOtherChargesAmt = quotationScalarFieldPresent(
    (rawQuotationData as Record<string, unknown> | undefined)?.Other_Charges
  )
    ? parseFloat(
      String((rawQuotationData as Record<string, unknown>)?.Other_Charges)
        .replace(/,/g, '')
        .trim()
    ) || 0
    : 0
  const slsOtherChargesType = String(
    (rawQuotationData as Record<string, unknown> | undefined)?.Type_of_Other_Charges ?? ''
  ).trim()
  const slsOtherChargesLabel = slsOtherChargesType
    ? `Other Charges (${slsOtherChargesType})`
    : 'Other Charges'

  const slsLineItemsTotalFallback = lineItems.reduce(
    (sum, item) => sum + (Number.isFinite(item.totalPrice) ? item.totalPrice : 0),
    0
  )
  const {
    cgstAmount: slsCgstAmount,
    sgstAmount: slsSgstAmount,
    igstAmount: slsIgstAmount,
    totalBeforeTax: slsTotalBeforeTax,
    totalAfterTax: slsTotalAfterTax,
  } = parseQuotationTaxForSummary(rawQuotationData, slsLineItemsTotalFallback)
  const slsGrandTotal = (() => {
    const fromZoho = parseOverallGrandTotalInclAccessories(
      rawQuotationData as Record<string, unknown> | null | undefined
    )
    if (Number.isFinite(fromZoho)) return fromZoho
    if (Number.isFinite(slsTotalAfterTax)) return slsTotalAfterTax
    return slsLineItemsTotalFallback
  })()
  const slsSafe = (n: number) => (Number.isFinite(n) ? n : 0)
  /** Standard GST split: IGST = CGST + SGST = 18%; rate labels are fixed per tax type when an amount is present. */
  const slsTaxHasValue = (n: number) => Number.isFinite(n) && n !== 0

  // `Total <currency>` row: sum of the goods table's "Total Price" column minus the (red) discount value
  // shown in that table. Other summary rows still source their values from Zoho directly.
  const slsTotalInrValue =
    slsLineItemsTotalFallback -
    (Number.isFinite(slsDiscountAmount) ? Math.max(0, slsDiscountAmount) : 0)

  type SlsSummaryRow = { label: string; value: string; bold?: boolean; big?: boolean }
  const slsSummaryRows: SlsSummaryRow[] = [
    { label: `Total ${displayCurrency}`, value: formatCurrency(slsTotalInrValue, displayCurrency), bold: true },
    { label: 'Packing Charges', value: formatCurrency(slsSafe(slsPackingTotal), displayCurrency) },
  ]
  if (slsTaxHasValue(slsFreightTotal)) {
    slsSummaryRows.push({
      label: 'Freight Charges',
      value: formatCurrency(slsFreightTotal, displayCurrency),
    })
  }
  if (slsTaxHasValue(slsOtherChargesAmt)) {
    slsSummaryRows.push({
      label: slsOtherChargesLabel,
      value: formatCurrency(slsOtherChargesAmt, displayCurrency),
    })
  }
  slsSummaryRows.push({
    label: 'Total Amount Before Tax',
    value: formatCurrency(slsSafe(slsTotalBeforeTax), displayCurrency),
    bold: true,
  })
  if (slsTaxHasValue(slsCgstAmount)) {
    slsSummaryRows.push({
      label: 'Add CGST @ 9%',
      value: formatCurrency(slsCgstAmount, displayCurrency),
    })
  }
  if (slsTaxHasValue(slsSgstAmount)) {
    slsSummaryRows.push({
      label: 'Add SGST @ 9%',
      value: formatCurrency(slsSgstAmount, displayCurrency),
    })
  }
  if (slsTaxHasValue(slsIgstAmount)) {
    slsSummaryRows.push({
      label: 'Add IGST @ 18%',
      value: formatCurrency(slsIgstAmount, displayCurrency),
    })
  }
  slsSummaryRows.push({
    label: 'Total Amount After GST',
    value: formatCurrency(slsGrandTotal, displayCurrency),
    bold: true,
    big: true,
  })

  // "Please Note:" prefers Zoho `Inside_Quotation_Text`; else `Please_Note` only when that key exists on the record;
  // empty Please_Note must not fall through to `Remarks` (|| would treat "" as missing).
  const pleaseNote = (() => {
    const raw = rawQuotationData as Record<string, unknown> | null | undefined
    const fromInside = String(raw?.Inside_Quotation_Text ?? '').trim()
    if (fromInside !== '') return fromInside
    if (raw != null && Object.prototype.hasOwnProperty.call(raw, 'Please_Note')) {
      const v = raw.Please_Note
      return v == null ? '' : String(v)
    }
    return data.remarks || ''
  })()
  const rawRec = rawQuotationData as Record<string, unknown> | undefined
  const slsPackingTransportPacking = String(rawRec?.Packing ?? '').trim()
  const slsPackingTransportIncoterms = String(rawRec?.Delivery_Terms ?? rawRec?.Delivery_terms ?? '').trim()
  const slsPackingTransportFreight = String(rawRec?.Transport ?? '').trim()
  // "Taxes:" row content — per-tax notice lines derived from CGST/SGST/IGST amounts (rates hard-coded
  // to the standard 9%/9%/18% split, same convention as the summary block). When no per-tax amount has
  // data, fall back to the Zoho root `Taxes` scalar. When neither is present, the whole row is hidden.
  const slsTaxNoticeLines: string[] = []
  if (slsTaxHasValue(slsIgstAmount)) slsTaxNoticeLines.push('18% IGST will be applicable extra.')
  if (slsTaxHasValue(slsCgstAmount)) slsTaxNoticeLines.push('9% CGST will be applicable extra.')
  if (slsTaxHasValue(slsSgstAmount)) slsTaxNoticeLines.push('9% SGST will be applicable extra.')
  const slsTaxesScalar = String(
    (rawQuotationData as Record<string, unknown> | undefined)?.Taxes ?? ''
  ).trim()
  const slsShowTaxesRow = slsTaxNoticeLines.length > 0 || slsTaxesScalar !== ''
  // "Payment:" row body — read from Zoho `Payment_Condition` (same field
  // used by BVK's "Payment conditions:" section). No fallback.
  const payment = String(rawQuotationData?.Payment_Condition ?? '').trim()
  // "Quotation Valid Till Time:" row body — read from Zoho `Quotation_Validity`
  // (same field used by BVK's "Quotation Valid Till" section). No fallback.
  const quotationValidity = String(rawQuotationData?.Quotation_Validity ?? '').trim()
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

        {/* Recipient Information — Zoho-driven, no hardcoded lines:
         *   To,
         *   <company name>       (Shipping_Address_Name / Billing_Address_Name)
         *   <address body>       (Consignee address block; billing fallback;
         *                         pre-wrap so line breaks print as typed)
         *   - - - - - - - -      (dashed separator)                       */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '8px' }}>To,</div>
          {recipientCompany ? (
            <div style={{ marginBottom: '15px' }}>{recipientCompany}</div>
          ) : null}
          {recipientAddressBody ? (
            <div style={{ marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{recipientAddressBody}</div>
          ) : null}
          <div style={{ borderTop: '1px dashed #000', marginBottom: '15px' }}></div>
        </div>

        {/* Quotation Reference */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Quotation Ref. No.:</strong> {quotationRefNo}
          </div>
          {/* Opening paragraph — from Zoho `Quotation_Reference` (same field BVK
           * uses). Printed verbatim just below the Ref line. Skipped when the
           * field is empty. `whiteSpace: pre-wrap` preserves line breaks and
           * spacing exactly as typed. */}
          {(() => {
            const v = String(rawQuotationData?.Quotation_Reference ?? '').trim()
            if (!v) return null
            return (
              <div style={{ marginBottom: '8px', whiteSpace: 'pre-wrap' }}>{v}</div>
            )
          })()}
          {slsRootRemarks ? (
            <div style={{ marginBottom: '20px' }}>{slsRootRemarks}</div>
          ) : null}
        </div>

        {/* Product Table */}
        <div style={{ marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11px', tableLayout: 'fixed', wordWrap: 'break-word' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Item</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Product</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>HSN Code</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Qty/UOM</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>{`Unit Price/ ${displayCurrency}`}</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>{`Total Price/ ${displayCurrency}`}</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.item}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{item.product}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.hsnCode || ''}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                    {item.qty
                      ? `${item.qty}${item.uom ? ` ${item.uom}` : ''}`
                      : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(item.unitPrice, displayCurrency)}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(item.totalPrice, displayCurrency)}</td>
                </tr>
              ))}
              {slsShowDiscountRow ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#c00000' }}
                  >
                    Total discount
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#c00000' }}>
                    {formatCurrency(slsDiscountAmount, displayCurrency)}
                  </td>
                </tr>
              ) : null}
              {slsSummaryRows.map((srow) => (
                <tr key={srow.label} className="sls-summary-row">
                  <td
                    colSpan={5}
                    style={{
                      border: '1px solid #000',
                      padding: srow.big ? '12px 8px' : '6px 8px',
                      textAlign: 'right',
                      fontWeight: srow.bold ? 'bold' : 'normal',
                      fontSize: srow.big ? '13px' : '11px',
                      verticalAlign: 'middle',
                    }}
                  >
                    {srow.label}
                  </td>
                  <td
                    style={{
                      border: '1px solid #000',
                      padding: srow.big ? '12px 8px' : '6px 8px',
                      textAlign: 'right',
                      fontWeight: srow.bold ? 'bold' : 'normal',
                      fontSize: srow.big ? '13px' : '11px',
                      verticalAlign: 'middle',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {srow.value}
                  </td>
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
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Packing and Transport Cost :</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(160px, max-content) 12px 1fr',
                rowGap: '6px',
                columnGap: '4px',
                paddingLeft: '10px',
              }}
            >
              <div>Packing</div>
              <div>:</div>
              <div>{slsPackingTransportPacking || '\u00A0'}</div>
              <div>Incoterms</div>
              <div>:</div>
              <div>{slsPackingTransportIncoterms || '\u00A0'}</div>
              <div>Freight cost to site</div>
              <div>:</div>
              <div>{slsPackingTransportFreight || '\u00A0'}</div>
            </div>
          </div>
          {slsShowTaxesRow ? (
            <div style={{ marginBottom: '10px', borderTop: '1px solid #000', paddingTop: '10px', marginTop: '10px' ,}}>
              <strong>Taxes:</strong>
              {slsTaxNoticeLines.length > 0 ? (
                slsTaxNoticeLines.map((line, idx) => (
                  <div
                    key={line}
                    style={{
                      marginTop: idx === 0 ? '4px' : '2px',
                     marginLeft: '10px',
                    }}
                  >
                    {line}
                  </div>
                ))
              ) : (
                <span> {slsTaxesScalar}</span>
              )}
            </div>
          ) : null}
          {payment ? (
            <div style={{ marginBottom: '10px', borderTop: '1px solid #000', paddingTop: '10px', marginTop: '10px', whiteSpace: 'pre-wrap' }}>
              <strong>Payment:</strong> {payment}
            </div>
          ) : null}
          {quotationValidity ? (
            <div style={{ marginBottom: '10px', borderTop: '1px solid #000', paddingTop: '10px', marginTop: '10px', whiteSpace: 'pre-wrap' }}>
              <strong>Quotation Valid Till Time:</strong> {quotationValidity}
            </div>
          ) : null}
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

      {/* SLS: printable conditions block (Zoho-driven bodies; hardcoded section labels) */}
      <div className="conditions-for-print conditions-for-print--sls conditions-doc" style={{ border: '1px solid #000', padding: '16px' }}>
        {/* Exclusions section — hardcoded heading, bullets from Zoho
         * `The_following_is_not_included_in_this_quotation` (textarea split on newlines).
         * Whole section skipped when field is empty. */}
        {(() => {
          const body = String(
            rawQuotationData?.The_following_is_not_included_in_this_quotation ?? ''
          ).trim()
          if (!body) return null
          const items = body
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
          if (items.length === 0) return null
          return (
            <>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>The following is not included in this quotation:</div>
              <ul
                style={{
                  marginLeft: '20px',
                  marginBottom: '14px',
                  paddingLeft: '20px',
                  listStyleType: 'disc',
                  listStylePosition: 'outside',
                }}
              >
                {items.map((item, i) => (
                  <li key={i} style={{ marginBottom: '6px', whiteSpace: 'pre-wrap' }}>
                    {item}
                  </li>
                ))}
              </ul>
              <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />
            </>
          )
        })()}

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
          {/* Packing line — Zoho `Packing`; word "included" flips to "excluded"
           * when `Packing_Charge` toggle is false. */}
          {(() => {
            const packingText = String(rawQuotationData?.Packing ?? '').trim()
            if (!packingText) return null
            const v = rawQuotationData?.Packing_Charge
            const isTrue =
              v === true || (typeof v === 'string' && v.trim().toLowerCase() === 'true')
            const finalText = isTrue
              ? packingText
              : packingText.replace(/\bincluded\b/gi, (m) =>
                  m === m.toUpperCase()
                    ? 'EXCLUDED'
                    : m[0] === m[0].toUpperCase()
                      ? 'Excluded'
                      : 'excluded'
                )
            return (
              <>
                <div>Packing</div>
                <div>:</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{finalText}</div>
              </>
            )
          })()}
          <div>Freight cost to site</div>
          <div>:</div>
          <div>To be paid as per actual by the client directly.</div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />

        {/* Delivery time — body from Zoho `Delivery_Time`; skip when empty; pre-wrap. */}
        {(() => {
          const v = String(rawQuotationData?.Delivery_Time ?? '').trim()
          if (!v) return null
          return (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 10px 1fr', marginBottom: '14px' }}>
                <div style={{ fontWeight: 'bold' }}>Delivery time</div>
                <div>:</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{v}</div>
              </div>
              <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />
            </>
          )
        })()}

        {/* Payment conditions — body from Zoho `Payment_Condition`; skip when empty; pre-wrap. */}
        {(() => {
          const v = String(rawQuotationData?.Payment_Condition ?? '').trim()
          if (!v) return null
          return (
            <>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Payment conditions:</div>
              <div style={{ marginBottom: '14px', whiteSpace: 'pre-wrap' }}>{v}</div>
              <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />
            </>
          )
        })()}

        {/* Quotation Valid Till — body from Zoho `Quotation_Validity`; skip when empty; pre-wrap. */}
        {(() => {
          const v = String(rawQuotationData?.Quotation_Validity ?? '').trim()
          if (!v) return null
          return (
            <>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Quotation Valid Till:</div>
              <div style={{ marginBottom: '14px', whiteSpace: 'pre-wrap' }}>{v}</div>
              <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />
            </>
          )
        })()}

        {/* General Remarks — body from Zoho `General_Remarks`; skip when empty; pre-wrap. */}
        {(() => {
          const v = String(rawQuotationData?.General_Remarks ?? '').trim()
          if (!v) return null
          return (
            <>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>General Remarks:</div>
              <div style={{ marginBottom: '14px', whiteSpace: 'pre-wrap' }}>{v}</div>
              <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />
            </>
          )
        })()}

        {/* Additional remarks — body from Zoho `Additional_Remarks`; skip when empty; pre-wrap. */}
        {(() => {
          const v = String(rawQuotationData?.Additional_Remarks ?? '').trim()
          if (!v) return null
          return (
            <>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Additional remarks:</div>
              <div style={{ marginBottom: '14px', whiteSpace: 'pre-wrap' }}>{v}</div>
              <hr style={{ border: 0, borderTop: '1px solid #000', margin: '14px 0' }} />
            </>
          )
        })()}

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
