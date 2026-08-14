'use client'

/**
 * WI Decomesh — ISOLATED quotation template component.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  DEVELOPER ISOLATION NOTE
 * ─────────────────────────────────────────────────────────────────────────
 * This file is a physical clone of the isolated-template shape used by
 * `WIProcessFebricQuotationContent.tsx`, adapted for the WI Decomesh
 * layout (see WI-Decomesh Quotation.pdf). Only two files depend on this:
 *   • QuotationTemplateByType.tsx — a single additive branch
 *   • app/wi-decomesh/[id]/page.tsx — the route
 * Nothing else in the repo imports from this file, so this component and
 * `lib/wi-decomesh-line-display.ts` are safe to modify freely.
 *
 * All Zoho field names come from `WI_DECOMESH_ZOHO_FIELDS` in the line-
 * display file. Rename a field there and every consumer picks it up.
 *
 * CSS classes for this template are all prefixed `wi-decomesh-*` and live
 * in `app/globals.css`. They do NOT reuse SLS/BVK/GKD/WI-Process-Febric
 * class names.
 */

import Link from 'next/link'
import { QuotationData } from '@/lib/types'
import { resolveConsigneeDisplay } from '@/lib/consignee-display'
import { formatCurrency } from '@/lib/quotation-utils'
import {
  WI_DECOMESH_ZOHO_FIELDS as F,
  buildWiDecomeshTableRows,
} from '@/lib/wi-decomesh-line-display'
import PrintButton from './PrintButton'

interface WIDecomeshQuotationContentProps {
  data: QuotationData
  shippingData?: any
  billingData?: any
  rawQuotationData?: any
}

export default function WIDecomeshQuotationContent({
  data,
  shippingData,
  billingData,
  rawQuotationData,
}: WIDecomeshQuotationContentProps) {
  // Date helper (DD MMM YYYY-ish). Local copy — do not share.
  const formatWdmDate = (dateString?: string): string => {
    if (!dateString) return ''
    try {
      const m = dateString.match(/(\d{2})-(\w{3})-(\d{4})/)
      if (m) {
        const [, day, mon, year] = m
        return `${day} ${mon} ${year}`
      }
      return dateString
    } catch {
      return dateString || ''
    }
  }

  const rawRec = rawQuotationData as Record<string, unknown> | undefined
  const date = formatWdmDate(data.date || (rawRec?.[F.quotationCreatedDate] as string | undefined))
  const quotationRefNo = data.quotationNumber || String(rawRec?.[F.quotationName] ?? '')

  const consignee = resolveConsigneeDisplay(shippingData, rawQuotationData)
  const recipientName = String(
    shippingData?.Contact_Name ?? rawQuotationData?.Contact_Name ?? ''
  ).trim()
  const recipientCompany =
    String(shippingData?.Shipping_Address_Name ?? rawQuotationData?.Shipping_Address_Name ?? '').trim() ||
    String(billingData?.Billing_Address_Name ?? rawQuotationData?.Billing_Address_Name ?? '').trim()
  const recipientAddressShipping = [consignee.addressBlock, consignee.country].filter(Boolean).join('\n')
  const recipientAddressBilling = (() => {
    const street = String(billingData?.Billing_Street ?? rawQuotationData?.Billing_Street ?? '').trim()
    if (!street) return ''
    const city = String(billingData?.Billing_City ?? rawQuotationData?.Billing_City ?? '').trim()
    const state = String(billingData?.Billing_State ?? rawQuotationData?.Billing_State ?? '').trim()
    const postal = String(billingData?.Billing_Postal_Code ?? rawQuotationData?.Billing_Postal_Code ?? '').trim()
    return `${street}, ${city}, ${state} ${postal}`.replace(/\s+/g, ' ').trim()
  })()
  const recipientAddressBody = recipientAddressShipping || recipientAddressBilling

  const displayCurrency = data.currency || String(rawRec?.[F.currency] ?? '') || 'INR'

  const tableRows = buildWiDecomeshTableRows(rawRec, data.lineItems ?? [])

  // Intro paragraph — from Zoho `Quotation_Reference` (kept verbatim, pre-wrap).
  // Falls back to the PDF's default sentence when Zoho has no value.
  const introParagraph = (() => {
    const v = String(rawRec?.[F.quotationReference] ?? '').trim()
    if (v) return v
    return 'With reference to your inquiry, as desired by you we are pleased to quote our price for engineering drawings, hereunder.'
  })()

  // Terms & conditions strings — same "Zoho then default" pattern as
  // WI Process Febric, but each read goes through the ISOLATED field
  // registry so a rename picks up here automatically.
  const deliveryTime = String(rawRec?.[F.deliveryTime] ?? '').trim()
  const incoterms = String(rawRec?.[F.deliveryTerms] ?? rawRec?.[F.deliveryTermsAlt] ?? '').trim() ||
    'Ex-Works, WMW Industries, Jaipur'
  const packingLine = (() => {
    const packingText = String(rawRec?.[F.packing] ?? '').trim()
    if (packingText) return packingText
    const charge = rawRec?.[F.packingCharge]
    const isTrue =
      charge === true ||
      (typeof charge === 'string' && charge.trim().toLowerCase() === 'true')
    return isTrue
      ? '1 wooden box, approx. 250 cm long x 40 cm wide x 60 cm high, gross weight approx. 210 kg.'
      : ''
  })()
  const paymentConditions = String(rawRec?.[F.paymentCondition] ?? '').trim() || 'Payment in advance'
  const generalRemarks = String(rawRec?.[F.generalRemarks] ?? '').trim()
  const closingStatement = String(rawRec?.[F.closingStatement] ?? '').trim() ||
    'We hope that the above quotation is of interest and will gladly be of further help for any request you may have.'
  const contactPerson = String(rawRec?.[F.contactPerson] ?? '').trim()
  const contactNumber = String(rawRec?.[F.contactNumber] ?? '').trim()

  // Footer strings
  const companyName = String(rawRec?.[F.companyName] ?? '').trim() || 'WMW INDUSTRIES LIMITED'
  const contactPersonBlockCompany = String(rawRec?.[F.companyName] ?? '').trim() || 'WMW Industries Ltd.'
  const companyFormerName = String(rawRec?.[F.companyFormerName] ?? '').trim() || 'Formerly known as GKD India Limited'
  const registeredAddress = String(rawRec?.[F.registeredAddress] ?? '').trim() ||
    '52, Industrial Area, Jhotwara, Jaipur-302012, Rajasthan, India'
  const phone = String(rawRec?.[F.phone] ?? '').trim() || '+91 141 7105100'
  const email = String(rawRec?.[F.email] ?? '').trim() || 'info@wmwindia.com'
  const website = String(rawRec?.[F.website] ?? '').trim() || 'www.wmwindia.com'
  const registeredOffice = String(rawRec?.[F.registeredOffice] ?? '').trim() ||
    '# Imax Imperial, Room No. 1C, 1st floor, 101/5, S.N. Banerjee Road, Kolkata-700014, West Bengal, India'
  const tagline = String(rawRec?.[F.tagline] ?? '').trim() || 'Weaving Technical Mesh Solutions'
  const cin = String(rawRec?.[F.cin] ?? '').trim() || 'U51909WB2011PLC163277'
  const gstin =
    String(rawRec?.[F.gstin] ?? '').trim() ||
    String(billingData?.Billing_GST_No ?? shippingData?.Shipping_GST_No ?? '').trim() ||
    '08AAECG2743F1ZS'
  const groupCompany = String(rawRec?.[F.groupCompany] ?? '').trim() || 'A BVK Group Company'

  // Small style helpers for the labelled attribute grid inside each Item block.
  const attrGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(140px, max-content) 12px 1fr',
    rowGap: '6px',
    columnGap: '4px',
    marginBottom: '18px',
  }
  const attrLabelStyle: React.CSSProperties = { fontWeight: 'normal' }
  const attrColonStyle: React.CSSProperties = {}
  const attrValueStyle: React.CSSProperties = { whiteSpace: 'pre-wrap' }

  return (
    <>
      <div
        className="wi-decomesh-quotation-container"
        style={{
          maxWidth: '210mm',
          margin: '0 auto',
          padding: '10mm 20mm 20mm 20mm',
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          lineHeight: '1.6',
        }}
      >
        {/* Whole page wrapped in a <table> so the browser repeats the <thead>
         * on every printed page — isolated class names. */}
        <table
          className="wi-decomesh-print-table"
          style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}
        >
          <thead className="wi-decomesh-print-header-row">
            <tr className="wi-decomesh-print-page-top-spacer" aria-hidden="true">
              <td />
            </tr>
            <tr>
              <td style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                {/* Header: WMW logo (top-right). Date is rendered under it in the To/Date row below. */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                  <div style={{ width: '150px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src="/wmw-logo.png"
                      alt="WMW Logo"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                {/* To,  ...  Date: on right */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold' }}>To,</div>
                  <div style={{ fontWeight: 'bold' }}>Date: {date}</div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  {recipientName ? (
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{recipientName}</div>
                  ) : null}
                  {recipientCompany ? (
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>M/s. : {recipientCompany}</div>
                  ) : null}
                  {recipientAddressBody ? (
                    <div style={{ marginBottom: '8px', whiteSpace: 'pre-wrap' }}>{recipientAddressBody}</div>
                  ) : null}
                </div>

                {/* Quotation Ref. No. */}
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold' }}>Quotation Ref. No. :</span> {quotationRefNo}
                </div>

                {/* Intro paragraph */}
                <div style={{ marginBottom: '20px', whiteSpace: 'pre-wrap' }}>{introParagraph}</div>

                {/* Per-item blocks — one "Item No-N" per row */}
                {tableRows.map((row) => (
                  <div key={row.item} className="wi-decomesh-item-block" style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Item No-{row.item}</div>
                    <div style={attrGridStyle}>
                      {row.meshType ? (
                        <>
                          <div style={attrLabelStyle}>Mesh Type</div>
                          <div style={attrColonStyle}>:</div>
                          <div style={attrValueStyle}>{row.meshType}</div>
                        </>
                      ) : null}
                      {row.material ? (
                        <>
                          <div style={attrLabelStyle}>Material</div>
                          <div style={attrColonStyle}>:</div>
                          <div style={attrValueStyle}>{row.material}</div>
                        </>
                      ) : null}
                      {row.sizes ? (
                        <>
                          <div style={attrLabelStyle}>Sizes</div>
                          <div style={attrColonStyle}>:</div>
                          <div style={attrValueStyle}>{row.sizes}</div>
                        </>
                      ) : null}
                      {row.quantity ? (
                        <>
                          <div style={attrLabelStyle}>Quantity</div>
                          <div style={attrColonStyle}>:</div>
                          <div style={attrValueStyle}>{row.quantity}</div>
                        </>
                      ) : null}
                      {row.totalQuantity ? (
                        <>
                          <div style={attrLabelStyle}>Total quantity</div>
                          <div style={attrColonStyle}>:</div>
                          <div style={attrValueStyle}>{row.totalQuantity}</div>
                        </>
                      ) : null}
                      {row.totalPrice > 0 ? (
                        <>
                          <div style={attrLabelStyle}>Total Price</div>
                          <div style={attrColonStyle}>:</div>
                          <div style={attrValueStyle}>{formatCurrency(row.totalPrice, displayCurrency)}</div>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}

                {/* "Our price includes:" — per-item Remarks bodies */}
                {tableRows.some((r) => r.remarks) ? (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Our price includes:</div>
                    {tableRows.map((row) =>
                      row.remarks ? (
                        <div key={row.item} style={{ marginBottom: '14px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Item No. {row.item}</div>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{row.remarks}</div>
                        </div>
                      ) : null
                    )}
                  </div>
                ) : null}

                {/* Delivery time */}
                {deliveryTime ? (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold' }}>Delivery time:</span>
                    <div style={{ whiteSpace: 'pre-wrap', marginTop: '2px' }}>{deliveryTime}</div>
                  </div>
                ) : null}

                {/* Incoterms */}
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold' }}>Incoterms:</span> {incoterms}
                </div>

                {/* Packing */}
                {packingLine ? (
                  <div style={{ marginBottom: '20px' }}>
                    <span style={{ fontWeight: 'bold' }}>Packing included:</span> {packingLine}
                  </div>
                ) : null}

                {/* Payment conditions */}
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontWeight: 'bold' }}>Payment conditions:</span> {paymentConditions}
                </div>

                {/* Our price does not include — from Zoho exclusions field, split into bullets */}
                {(() => {
                  const body = String(rawRec?.[F.exclusions] ?? '').trim()
                  if (!body) return null
                  const items = body
                    .split(/\r?\n/)
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0)
                  if (items.length === 0) return null
                  return (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Our price does not include:</div>
                      <ul
                        style={{
                          marginLeft: '20px',
                          marginBottom: 0,
                          paddingLeft: '20px',
                          listStyleType: 'disc',
                          listStylePosition: 'outside',
                        }}
                      >
                        {items.map((it, i) => (
                          <li key={i} style={{ marginBottom: '4px', whiteSpace: 'pre-wrap' }}>
                            {it}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })()}

                {/* General Remarks */}
                {generalRemarks ? (
                  <div style={{ marginBottom: '20px', borderTop: '1px solid #000', paddingTop: '10px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>General Remarks:</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{generalRemarks}</div>
                  </div>
                ) : null}

                {/* Closing */}
                <div style={{ marginBottom: '20px', whiteSpace: 'pre-wrap' }}>{closingStatement}</div>

                {/* Company + Contact Person */}
                <div style={{ marginBottom: '30px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{contactPersonBlockCompany}</div>
                  <div style={{ marginBottom: '4px' }}>
                    Contact Person: <strong>{contactPerson}</strong>{contactNumber ? ` (${contactNumber})` : ''}
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="wi-decomesh-company-footer"
                  style={{
                    borderTop: '2px solid #000',
                    paddingTop: '15px',
                    marginTop: '40px',
                    fontSize: '9px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ width: '60%' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>
                        {companyName}
                      </div>
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="no-print" style={{ marginTop: '24px', textAlign: 'center' }}>
        <Link
          href="/"
          style={{ color: '#1e40af', textDecoration: 'underline', marginRight: '12px' }}
        >
          Back to Quotation
        </Link>
        <PrintButton />
      </div>
    </>
  )
}
