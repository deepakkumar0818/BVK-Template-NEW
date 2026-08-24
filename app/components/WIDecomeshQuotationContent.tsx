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
  buildWiDecomeshDeliverySchedule,
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

  // Strip trailing zeros from the numeric prefix of a qty string, then
  // reattach any suffix (unit label, m², etc.). Decomesh values look
  // like "10.00 Panel" and "50.00 m²", so a plain Number() cast on the
  // whole string wouldn't match — pull the leading digits off first.
  //   "10.00"        -> "10"
  //   "10.00 Panel"  -> "10 Panel"
  //   "10.50 kg"     -> "10.5 kg"
  //   "10.05 m²"     -> "10.05 m²"
  //   "as required"  -> "as required" (unchanged)
  const formatQty = (q: unknown): string => {
    const s = String(q ?? '').trim()
    if (!s) return ''
    const m = s.match(/^([\d,]+(?:\.\d+)?)(\s.*)?$/)
    if (m) {
      const [, numPart, rest] = m
      const n = Number(numPart.replace(/,/g, ''))
      if (Number.isFinite(n)) return `${n.toString()}${rest ?? ''}`
    }
    return s
  }

  const date = formatWdmDate(data.date || (rawRec?.[F.quotationCreatedDate] as string | undefined))
  const quotationRefNo = data.quotationNumber || String(rawRec?.[F.quotationName] ?? '')

  const consignee = resolveConsigneeDisplay(shippingData, rawQuotationData)
  const recipientNameRaw = String(
    shippingData?.Contact_Name ?? rawQuotationData?.Contact_Name ?? ''
  ).trim()
  // Contact-person display with "Mr. " prefix (skip if the Zoho value
  // already starts with a title such as Mr / Mrs / Ms / Dr).
  const recipientName = recipientNameRaw
    ? /^(mr|mrs|ms|dr)\.?\s+/i.test(recipientNameRaw)
      ? recipientNameRaw
      : `Mr. ${recipientNameRaw}`
    : ''
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

  // Delivery Schedule — reads the desired-date subform for the active
  // family (mirrors the SLS Delivery Schedule spec). Returns `null` when
  // nothing is renderable so the caller can hide the whole section.
  const deliverySchedule = buildWiDecomeshDeliverySchedule(rawRec)
  const closingStatement = String(rawRec?.[F.closingStatement] ?? '').trim() ||
    'We hope that the above quotation is of interest and will gladly be of further help for any request you may have.'
  const contactPerson = String(rawRec?.[F.contactPerson] ?? '').trim()
  const contactNumber = String(rawRec?.[F.contactNumber] ?? '').trim()

  // Footer strings
  const companyName = String(rawRec?.[F.companyName] ?? '').trim() || 'WMW INDUSTRIES LIMITED'
  const contactPersonBlockCompany = String(rawRec?.[F.companyName] ?? '').trim() || 'WMW Industries Ltd.'
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
                {/* Header — logo on the LEFT (wide /wi.png), Date on the
                 * RIGHT (top-aligned with the logo). Same swap as SLS /
                 * Process Febric: Date used to sit stacked under the logo;
                 * moving it right lets the body ("To,", recipient, etc.)
                 * shift up and end up aligned near the Date row on the right. */}
                <div style={{ marginBottom: '20px' }}>
                  <img
                    src="/wi.png"
                    alt="WMW Industries Ltd"
                    style={{ height: '80px', width: 'auto', objectFit: 'contain', display: 'block' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                {/* "To," on the left, Date on the right — same baseline.
                 * Date moved out of the thead so it aligns with the "To,"
                 * word (client asked for this alignment). */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 'bold' }}>To,</div>
                    <div style={{ fontSize: '11px', textAlign: 'right' }}>
                      Date: {date}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  {recipientName ? (
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{recipientName}</div>
                  ) : null}
                  {recipientCompany ? (
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{recipientCompany}</div>
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
                          <div style={attrValueStyle}>{formatQty(row.quantity)}</div>
                        </>
                      ) : null}
                      {row.totalQuantity ? (
                        <>
                          <div style={attrLabelStyle}>Total quantity</div>
                          <div style={attrColonStyle}>:</div>
                          <div style={attrValueStyle}>{formatQty(row.totalQuantity)}</div>
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

                {/* Delivery Schedule — mirrors the SLS Delivery Schedule
                    section (see wi-decomesh-line-display.ts). Groups
                    entries by Line_Item_ref under a per-product heading;
                    each entry lists Date/Week/Month + count + UOM. Hidden
                    entirely when the record has no renderable entries. */}
                {deliverySchedule ? (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Delivery Schedule:</div>
                    {deliverySchedule.map((group) => (
                      <div key={group.ref} style={{ marginBottom: '10px', paddingLeft: '10px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {group.ref}. {group.heading || ' '}
                        </div>
                        <ul style={{ marginTop: 0, marginBottom: 0, paddingLeft: '20px', listStyleType: 'disc' }}>
                          {group.entries.map((entry, i) => (
                            <li key={`${group.ref}-${i}`} style={{ marginBottom: '2px' }}>
                              <strong>{entry.label}</strong> : {entry.value}
                              {entry.count ? `, ${entry.count} items` : ''}
                              {entry.uom ? `, ${entry.uom}` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
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

              </td>
            </tr>
            {/* Spacer row — height:100% in print. Stretches to fill leftover
             * space on the LAST page so the <tfoot> pins to the page bottom
             * (see .wi-decomesh-print-page-bottom-spacer in globals.css). */}
            <tr className="wi-decomesh-print-page-bottom-spacer" aria-hidden="true">
              <td />
            </tr>
          </tbody>
          {/* Footer — hoisted out of the <tbody> into its own <tfoot> so
           * the browser repeats it at the bottom of EVERY printed page
           * (same `display: table-footer-group` trick the <thead> uses).
           * Text block replaced with the two footer images (same swap
           * that was applied to SLS and WI Process Febric). */}
          <tfoot className="wi-decomesh-print-footer-row">
            <tr>
              <td style={{ border: 'none', padding: 0, verticalAlign: 'bottom' }}>
                <div
                  className="wi-decomesh-company-footer"
                  style={{
                    marginTop: '40px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    gap: '16px',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}
                >
                  <img
                    src="/wi bottom left side.png"
                    alt="WMW Industries Ltd — company details"
                    style={{ maxWidth: '60%', height: 'auto', display: 'block', marginBottom: '45px' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <img
                    src="/wi_bottom_rightside.png"
                    alt="WMW Industries Ltd — CIN / GST / BVK Group"
                    style={{ maxWidth: '35%', height: 'auto', display: 'block' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </td>
            </tr>
          </tfoot>
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
