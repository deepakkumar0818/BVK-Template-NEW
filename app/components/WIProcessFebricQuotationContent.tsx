'use client'

/**
 * WI Process Febric — ISOLATED quotation template component.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  DEVELOPER ISOLATION NOTE
 * ─────────────────────────────────────────────────────────────────────────
 * This file is a physical clone of `SLSQuotationContent.tsx`, adapted for
 * the WI Process Febric layout (see WI-Process-Febric.pdf). It is safe to
 * modify freely — nothing in this codebase imports from this file except
 * `QuotationTemplateByType.tsx` (single additive branch) and the
 * `app/wi-process-febric/[id]/page.tsx` route.
 *
 * All Zoho field names come from `WI_PROCESS_FEBRIC_ZOHO_FIELDS` in
 * `lib/wi-process-febric-line-display.ts`. Rename a field there and every
 * consumer picks it up.
 *
 * CSS classes for this template are all prefixed `wi-process-febric-*` and
 * live in `app/globals.css`. They do NOT reuse SLS/BVK class names, so
 * print-layout edits stay isolated.
 */

import { Fragment } from 'react'
import Link from 'next/link'
import { QuotationData } from '@/lib/types'
import { resolveConsigneeDisplay } from '@/lib/consignee-display'
import {
  formatCurrency,
  parseOverallGrandTotalInclAccessories,
  parseQuotationTaxForSummary,
} from '@/lib/quotation-utils'
import {
  WI_PROCESS_FEBRIC_ZOHO_FIELDS as F,
  buildWiProcessFebricDeliverySchedule,
  buildWiProcessFebricTableRows,
  resolveWiProcessFebricChargeTotals,
  resolveWiProcessFebricGstLine,
  resolveWiProcessFebricOtherCharges,
} from '@/lib/wi-process-febric-line-display'
import PrintButton from './PrintButton'

interface WIProcessFebricQuotationContentProps {
  data: QuotationData
  shippingData?: any
  billingData?: any
  rawQuotationData?: any
}

export default function WIProcessFebricQuotationContent({
  data,
  shippingData,
  billingData,
  rawQuotationData,
}: WIProcessFebricQuotationContentProps) {
  // Date helper (DD.MM.YYYY). Local copy — do not share.
  const formatWpfDate = (dateString?: string): string => {
    if (!dateString) return ''
    try {
      const m = dateString.match(/(\d{2})-(\w{3})-(\d{4})/)
      if (m) {
        const [, day, mon, year] = m
        const monthMap: { [key: string]: string } = {
          Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
          Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
        }
        return `${day}-${monthMap[mon] || '01'}-${year}`
      }
      return dateString
    } catch {
      return dateString || ''
    }
  }

  const rawRec = rawQuotationData as Record<string, unknown> | undefined

  const date = formatWpfDate(data.date || (rawRec?.[F.quotationCreatedDate] as string | undefined))
  const quotationRefNo = data.quotationNumber || String(rawRec?.[F.quotationName] ?? '')
  const rootRemarks = String(rawRec?.[F.rootRemarks] ?? '').trim()

  // Recipient — same resolution shape as SLS, kept inline so it's easy for
  // the WI Process Febric developer to change.
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
  // Buyer's tel line — shown right after the recipient block per the PDF.
  const recipientTel = String(
    shippingData?.Shipping_Phone ?? billingData?.Billing_Phone ?? rawQuotationData?.Phone_1 ?? ''
  ).trim()

  const displayCurrency = data.currency || String(rawRec?.[F.currency] ?? '') || 'INR'

  // Line items — ISOLATED builder. Falls back to `data.lineItems` when the
  // Product_Fitments subforms are absent.
  const tableRows = buildWiProcessFebricTableRows(rawRec, data.lineItems ?? [])

  // Summary block — the PDF uses a simplified 3-row summary:
  //   Total Ex-Factory Price
  //   Discount On total Qty Order
  //   Total
  // Taxes are described in text below the table (not summed into the grid).
  const { discountTotal, packingTotal, freightTotal } =
    resolveWiProcessFebricChargeTotals(rawRec)
  const { amount: otherChargesAmt, label: otherChargesLabel } =
    resolveWiProcessFebricOtherCharges(rawRec)

  const lineItemsTotal = tableRows.reduce(
    (sum, r) => sum + (Number.isFinite(r.totalPrice) ? r.totalPrice : 0),
    0
  )

  const {
    totalBeforeTax,
    totalAfterTax,
  } = parseQuotationTaxForSummary(rawQuotationData, lineItemsTotal)

  const grandTotal = (() => {
    const fromZoho = parseOverallGrandTotalInclAccessories(rawRec)
    if (Number.isFinite(fromZoho)) return fromZoho
    if (Number.isFinite(totalAfterTax)) return totalAfterTax
    return lineItemsTotal
  })()

  const showDiscountRow = Number.isFinite(discountTotal) && discountTotal !== 0
  const finalNetTotal = lineItemsTotal - (showDiscountRow ? Math.max(0, discountTotal) : 0)

  type WpfSummaryRow = { label: string; value: string; bold?: boolean; big?: boolean }
  const summaryRows: WpfSummaryRow[] = [
    {
      label: 'Total Ex- Factory Price',
      value: formatCurrency(lineItemsTotal, displayCurrency),
      bold: true,
    },
  ]
  if (showDiscountRow) {
    summaryRows.push({
      label: 'Discount On total Qty Order',
      value: formatCurrency(discountTotal, displayCurrency),
      bold: true,
    })
  }
  summaryRows.push({
    label: 'Total',
    value: formatCurrency(finalNetTotal, displayCurrency),
    bold: true,
    big: true,
  })

  // "Please Note" — Inside_Quotation_Text preferred; else Please_Note only
  // when the key exists on the record.
  const pleaseNote = (() => {
    const inside = String(rawRec?.[F.insideQuotationText] ?? '').trim()
    if (inside !== '') return inside
    if (rawRec != null && Object.prototype.hasOwnProperty.call(rawRec, F.pleaseNote)) {
      const v = rawRec[F.pleaseNote]
      return v == null ? '' : String(v)
    }
    return data.remarks || ''
  })()

  // Packing line — hardcoded phrase, word flips based on Packing_Charge toggle.
  const packingLine = (() => {
    const charge = rawRec?.[F.packingCharge]
    const isTrue =
      charge === true ||
      (typeof charge === 'string' && charge.trim().toLowerCase() === 'true')
    return `Normal Box packing ${isTrue ? 'included' : 'excluded'} in above price.`
  })()
  const freightLine = String(rawRec?.[F.transport] ?? '').trim() ||
    'To be paid as per actual by the client directly.'
  const incoterms = String(
    rawRec?.[F.deliveryTerms] ?? rawRec?.[F.deliveryTermsAlt] ?? ''
  ).trim()
  const deliveryTime = String(rawRec?.[F.deliveryTime] ?? '').trim()
  const paymentTerms = String(rawRec?.[F.paymentTerms] ?? '').trim()
  const quotationValidity = String(rawRec?.[F.quotationValidity] ?? '').trim()
  const generalRemarks = String(rawRec?.[F.generalRemarks] ?? '').trim()

  // Taxes narrative — exactly one of root `IGST` / `CGST` / `SGST` is
  // expected to be non-zero at a time; shows "<Type> is <rate>%" for that
  // one only, under the always-shown hard-coded sentence.
  const gstLine = resolveWiProcessFebricGstLine(rawRec)

  // Delivery Schedule — reads the desired-date subform for the active
  // family and returns one group per Line_Item_ref. `null` when nothing is
  // renderable, in which case the whole section is hidden.
  const deliverySchedule = buildWiProcessFebricDeliverySchedule(rawRec)

  // Closing + Contact + Footer strings — same "Zoho with fallback default"
  // pattern SLS uses, but each read goes through the ISOLATED field
  // registry so a rename in the other file is picked up here automatically.
  const closingStatement = String(rawRec?.[F.closingStatement] ?? '').trim() ||
    'We hope that the above quotation is of interest and will gladly be of further help for any request you may have.'
  // Sample record stores name+phone combined in one string (e.g. "hello world(987654321)"),
  // so the "9358364921" fallback number is only used alongside the fallback
  // name — never appended to a real Contact_Person value that already has no
  // separate Contact_Number field.
  const contactPersonRaw = String(rawRec?.[F.contactPerson] ?? '').trim()
  const contactNumberRaw = String(rawRec?.[F.contactNumber] ?? '').trim()
  const contactPerson = contactPersonRaw || 'Mr. Alok Maheshwari'
  const contactNumber = contactPersonRaw ? contactNumberRaw : contactNumberRaw || '9358364921'
  const companyName = String(rawRec?.[F.companyName] ?? '').trim() || 'WMW INDUSTRIES LIMITED'
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

  return (
    <>
      <div
        className="wi-process-febric-quotation-container"
        style={{
          maxWidth: '210mm',
          margin: '0 auto',
          padding: '10mm 20mm 20mm 20mm',
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          lineHeight: '1.6',
        }}
      >
        {/*
          Whole page wrapped in a <table> so the browser repeats the <thead>
          on every printed page. Isolated print classes:
            .wi-process-febric-print-table
            .wi-process-febric-print-header-row
            .wi-process-febric-print-page-top-spacer
        */}
        <table
          className="wi-process-febric-print-table"
          style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}
        >
          <thead className="wi-process-febric-print-header-row">
            <tr className="wi-process-febric-print-page-top-spacer" aria-hidden="true">
              <td />
            </tr>
            <tr>
              <td style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                {/* Header: WMW logo (top-right) + Date under it */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '30px',
                  }}
                >
                  <div></div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '150px',
                        height: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src="/wmw-logo.png"
                        alt="WMW Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', textAlign: 'right' }}>
                      Date: {date}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                {/* Recipient block */}
                <div style={{ marginBottom: '15px' }}>
                  {recipientName ? (
                    <div style={{ marginBottom: '4px' }}>{recipientName}</div>
                  ) : null}
                  {recipientCompany ? (
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{recipientCompany}</div>
                  ) : null}
                  {recipientAddressBody ? (
                    <div style={{ marginBottom: '8px', whiteSpace: 'pre-wrap' }}>{recipientAddressBody}</div>
                  ) : null}
                  {recipientTel ? (
                    <div style={{ marginBottom: '15px' }}>Tel {recipientTel}</div>
                  ) : (
                    <div style={{ marginBottom: '15px' }} />
                  )}
                </div>

                {/* Quotation Ref */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    Quotation Ref : {quotationRefNo}
                  </div>
                  {(() => {
                    const v = String(rawRec?.[F.quotationReference] ?? '').trim()
                    if (!v) return null
                    return (
                      <div style={{ marginBottom: '8px', whiteSpace: 'pre-wrap' }}>{v}</div>
                    )
                  })()}
                  {rootRemarks ? (
                    <div style={{ marginBottom: '20px', whiteSpace: 'pre-wrap' }}>{rootRemarks}</div>
                  ) : (
                    <div style={{ marginBottom: '15px' }}>
                      With reference to your inquiry for belts, we are pleased to quote our price hereunder.
                      The size and prices given below are based on the information provided by you.
                    </div>
                  )}
                </div>

                {/* Items table — PDF columns: Item / Product / Qty / Unit Price / Total Price
                    The Product cell renders a header line and a labelled Seam/Type/Length/Width/Sqm block. */}
                <div style={{ marginBottom: '30px' }}>
                  <table
                    className="wi-process-febric-items-table"
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      border: '1px solid #000',
                      fontSize: '11px',
                      tableLayout: 'fixed',
                      wordWrap: 'break-word',
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={itemsHeaderCellStyle(8, 'center')}>Item</th>
                        <th style={itemsHeaderCellStyle(27, 'left')}>Product</th>
                        <th style={itemsHeaderCellStyle(13, 'center')}>HSN Code</th>
                        <th style={itemsHeaderCellStyle(12, 'center')}>Qty</th>
                        <th style={itemsHeaderCellStyle(20, 'center')}>{`Unit Price / ${displayCurrency}`}</th>
                        <th style={itemsHeaderCellStyle(20, 'center')}>{`Total Price ${displayCurrency}`}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => (
                        <tr key={row.item}>
                          <td style={itemsBodyCellStyle('center')}>{row.item}</td>
                          <td style={itemsBodyCellStyle('left')}>
                            {row.productName ? (
                              <div style={{ marginBottom: '4px' }}>{row.productName}</div>
                            ) : null}
                            {row.attributes.length > 0 ? (
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'minmax(60px, max-content) 8px 1fr',
                                  rowGap: '2px',
                                  columnGap: '2px',
                                  paddingLeft: '10px',
                                }}
                              >
                                {row.attributes.map((attr) => (
                                  <Fragment key={attr.label}>
                                    <div>{attr.label}</div>
                                    <div>:</div>
                                    <div>{attr.value}</div>
                                  </Fragment>
                                ))}
                              </div>
                            ) : null}
                          </td>
                          <td style={{ ...itemsBodyCellStyle('center'), whiteSpace: 'nowrap' }}>{row.hsnCode || ''}</td>
                          <td style={itemsBodyCellStyle('center')}>
                            {row.qty
                              ? `${row.qty}${row.uom ? ` ${row.uom}` : ''}`
                              : ''}
                          </td>
                          <td style={itemsBodyCellStyle('center')}>
                            {row.unitPrice > 0
                              ? `${formatCurrency(row.unitPrice, displayCurrency)}${row.uom ? ` ${row.uom}` : ''}`
                              : ''}
                          </td>
                          <td style={itemsBodyCellStyle('center')}>
                            {row.totalPrice > 0 ? formatCurrency(row.totalPrice, displayCurrency) : ''}
                          </td>
                        </tr>
                      ))}
                      {summaryRows.map((srow) => (
                        <tr key={srow.label} className="wi-process-febric-summary-row">
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

                {/* Please Note */}
                {pleaseNote ? (
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Please Note:</strong> {pleaseNote}
                  </div>
                ) : null}

                {/* Exclusions — Zoho `The_following_is_not_included_in_this_quotation`, split on newlines.
                    Heading always renders; body is blank (no hard-coded fallback) when Zoho has no value. */}
                {(() => {
                  const body = String(rawRec?.[F.exclusions] ?? '').trim()
                  const items = body
                    .split(/\r?\n/)
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0)
                  return (
                    <div style={{ marginBottom: '10px', borderTop: '1px solid #000', paddingTop: '10px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        The following is not included in this quotation:
                      </div>
                      {items.length === 0 ? null : items.length === 1 ? (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{items[0]}</div>
                      ) : (
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
                      )}
                    </div>
                  )
                })()}

                {/* Taxes and Duties */}
                <div style={{ marginBottom: '10px', borderTop: '1px solid #000', paddingTop: '10px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Taxes and Duties**:</div>
                  <div>
                    Will be Extra as applicable over and above the Ex-factory prices quoted.
                    {gstLine ? ` ${gstLine.type} is ${gstLine.rate}%` : ''}
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    However, if there is any change in Sales Tax, Excise Duty and any New Statutory Levies is introduced by Government at the time of delivery, the same will be billed as per actual.
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <strong>**</strong>Octroi, Entry Tax and any other taxes/ duties, if any, have to be borne by the Buyer as per the actuals.
                  </div>
                </div>

                {/* Packing / Freight — 2-row grid */}
                <div
                  className="wi-process-febric-terms-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(160px, max-content) 12px 1fr',
                    rowGap: '6px',
                    columnGap: '4px',
                    borderTop: '1px solid #000',
                    paddingTop: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>Packing</div>
                  <div style={{ fontWeight: 'bold' }}>:</div>
                  <div>{packingLine}</div>
                  <div style={{ fontWeight: 'bold' }}>Freight cost to site</div>
                  <div style={{ fontWeight: 'bold' }}>:</div>
                  <div>{freightLine}</div>
                  {incoterms ? (
                    <>
                      <div style={{ fontWeight: 'bold' }}>Incoterms</div>
                      <div style={{ fontWeight: 'bold' }}>:</div>
                      <div>{incoterms}</div>
                    </>
                  ) : null}
                </div>

                {/* Delivery Schedule — mirrors the SLS Delivery Schedule
                    section (see wi-process-febric-line-display.ts). Groups
                    entries by Line_Item_ref under a per-product heading;
                    each entry lists Date/Week/Month + count + UOM. Hidden
                    entirely when the record has no renderable entries. */}
                {deliverySchedule ? (
                  <div style={{ marginBottom: '10px', borderTop: '1px solid #000', paddingTop: '10px' }}>
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

                {/* Delivery / Payment / Validity / General Remarks — labelled grid.
                    Rows always render (label + colon), value is blank when Zoho has no data. */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(160px, max-content) 12px 1fr',
                    rowGap: '6px',
                    columnGap: '4px',
                    borderTop: '1px solid #000',
                    paddingTop: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>Delivery time</div>
                  <div style={{ fontWeight: 'bold' }}>:</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{deliveryTime}</div>

                  <div style={{ fontWeight: 'bold' }}>Payment Terms</div>
                  <div style={{ fontWeight: 'bold' }}>:</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{paymentTerms}</div>

                  <div style={{ fontWeight: 'bold' }}>Quotation Validity</div>
                  <div style={{ fontWeight: 'bold' }}>:</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{quotationValidity}</div>

                  <div style={{ fontWeight: 'bold' }}>General Remarks</div>
                  <div style={{ fontWeight: 'bold' }}>:</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{generalRemarks}</div>
                </div>

                <div style={{ marginBottom: '25px' }}>{closingStatement}</div>

                {/* Company + Contact Person */}
                <div style={{ marginBottom: '30px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{companyName}</div>
                  <div style={{ marginBottom: '4px' }}>
                    Contact Person: <strong>{contactPerson}</strong>{contactNumber ? ` (${contactNumber})` : ''}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
          {/*
            Footer as its own <tfoot> (not crammed into the <tbody> cell above)
            so the browser's table pagination treats it as a distinct section
            instead of one giant unbreakable-ish <td> — this is what was
            causing the trailing blank page. Mirrors BVKQuotationContent's
            <tfoot className="bvk-print-footer-row"> pattern.
          */}
          <tfoot className="wi-process-febric-print-footer-row">
            <tr>
              <td style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                <div
                  className="wi-process-febric-company-footer"
                  style={{
                    borderTop: '2px solid #000',
                    paddingTop: '15px',
                    marginTop: '40px',
                    fontSize: '9px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ width: '60%' }}>
                      <div
                        style={{
                          fontWeight: 'bold',
                          fontSize: '10px',
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {companyName}
                      </div>
                      <div style={{ marginBottom: '4px' }}>{registeredAddress}</div>
                      <div style={{ marginBottom: '4px' }}>
                        {phone} | {email} | {website}
                      </div>
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

// Local style helpers — kept in-file to avoid a shared style module.

function itemsHeaderCellStyle(widthPct: number, align: 'left' | 'center' | 'right'): React.CSSProperties {
  return {
    border: '1px solid #000',
    padding: '8px',
    textAlign: align,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    width: `${widthPct}%`,
  }
}

function itemsBodyCellStyle(align: 'left' | 'center' | 'right'): React.CSSProperties {
  return {
    border: '1px solid #000',
    padding: '8px',
    textAlign: align,
    verticalAlign: 'top',
  }
}
