'use client'

import type { QuotationData } from '@/lib/types'
import { resolveConsigneeDisplay } from '@/lib/consignee-display'
import {
  formatAmountInWords,
  formatCurrency,
  parseOverallGrandTotalInclAccessories,
  parseQuotationTaxForSummary,
} from '@/lib/quotation-utils'
import {
  buildSlsLineItemsFromWi20SubformsShared,
  resolveSlsWi20SubformKey,
  subformRows,
} from '@/lib/wi-line-display-shared'
import PrintButton from './PrintButton'

/**
 * BVK Proforma Invoice — ISOLATED sibling of WiPerformaInvoiceContent.tsx.
 *
 * Same approach as the WI PI (Quotation report, Category 1 WI / Category 2
 * WI / Product Fitments via `buildSlsLineItemsFromWi20SubformsShared`;
 * dynamic CGST/SGST/IGST summary box; "Amount In Word" describing the
 * Grand Total; live `Our_Bank_Details` parsed into a boxed Label/Value
 * table; line items filtered to only those whose matching `_3_0` row has a
 * non-empty `PI_no` that isn't "Closed"), but BVK-branded — reuses
 * BVKQuotationContent.tsx's own CSS classes directly (`bvk-quotation-container`,
 * `bvk-print-table`, `bvk-print-header-row`, `bvk-print-footer-row`,
 * `bvk-page-footer`), not a new isolated class set, since the goal is to
 * match BVK's letterhead/margin exactly, not to diverge from it. No new
 * globals.css rules were needed for this reason.
 *
 * One confirmed difference from the WI PI, per explicit instruction:
 *   - No Advance Payment section (the sample PDF has one; WI's PI dropped
 *     it, and BVK's follows the same choice).
 * Ref No. (root `Name`, same as WI PI) is shown next to GST No. — the
 * sample PDF's own unlabeled reference code next to GST No. is NOT mapped
 * (no confirmed field for it).
 * Also dropped versus the sample PDF: a "Telephone" line in the recipient
 * block — no confirmed Zoho field for it, so not mapped (no guessing).
 *
 * Item table adds a leading "Item" serial-number column (1, 2, 3…, matching
 * the sample) and renders Product as a single plain value (no "Product :"
 * prefix, no stacked Remarks) — the sample shows flat product names
 * ("Cathode Nickel", "Anode Nickel"), not the SLS-style Remarks block.
 *
 * Does NOT import from or modify BVKQuotationContent.tsx / WiPerformaInvoiceContent.tsx,
 * so neither is affected by anything here.
 */

interface BvkPerformaInvoiceContentProps {
  data: QuotationData
  shippingData?: any
  billingData?: any
  rawQuotationData?: any
  /** CRM Contact (Salutation + Full_Name), resolved via Quotation → Deal →
   * Contact — same chain SLS/BVK use. Feeds the recipient-name line. */
  contactData?: { salutation: string; fullName: string } | null
}

export default function BvkPerformaInvoiceContent({
  data,
  shippingData,
  billingData,
  rawQuotationData,
  contactData,
}: BvkPerformaInvoiceContentProps) {
  // Same DD.MM.YY formatter as BVKQuotationContent.
  const formatPiDate = (dateString?: string): string => {
    if (!dateString) {
      const today = new Date()
      const day = String(today.getDate()).padStart(2, '0')
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const year = String(today.getFullYear()).slice(-2)
      return `${day}.${month}.${year}`
    }
    try {
      const dateMatch = dateString.match(/(\d{2})-(\w{3})-(\d{4})/)
      if (dateMatch) {
        const [, day, month, year] = dateMatch
        const monthMap: { [key: string]: string } = {
          Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
          Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
        }
        const monthNum = monthMap[month] || '01'
        const shortYear = year.slice(-2)
        return `${day}.${monthNum}.${shortYear}`
      }
      return dateString
    } catch {
      const today = new Date()
      const day = String(today.getDate()).padStart(2, '0')
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const year = String(today.getFullYear()).slice(-2)
      return `${day}.${month}.${year}`
    }
  }

  // Strip trailing zeros from a numeric qty string.
  const formatQty = (q: unknown): string => {
    const s = String(q ?? '').trim()
    if (!s) return ''
    const n = Number(s.replace(/,/g, ''))
    return Number.isFinite(n) ? n.toString() : s
  }

  const date = formatPiDate(data.date || rawQuotationData?.Created_Date_and_time)
  const gstNo = String(rawQuotationData?.Billing_GST_No ?? '').trim()
  // Ref No. — root `Name` (the quotation number), same field/treatment as
  // the WI PI's Ref No.
  const refNo = data.quotationNumber || rawQuotationData?.Name || ''

  const consignee = resolveConsigneeDisplay(shippingData, rawQuotationData)
  const recipientNameDisplay = (() => {
    const crmSalutation = (contactData?.salutation ?? '').trim()
    const crmFullName = (contactData?.fullName ?? '').trim()
    return crmFullName ? `${crmSalutation} ${crmFullName}`.trim() : ''
  })()
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

  const displayCurrency = data.currency || rawQuotationData?.Currency || 'INR'

  // Same line-item source WI PI uses — Category 1 WI / Category 2 WI /
  // Product Fitments, resolved from the record's `Template` field.
  const piTemplateField = rawQuotationData?.Template as string | undefined
  const rawLineItems = buildSlsLineItemsFromWi20SubformsShared(
    rawQuotationData as Record<string, unknown> | null | undefined,
    piTemplateField
  )
  // Only show line items whose matching `_3_0` row (same `Line_Item_ref`,
  // active WI category) has a non-empty `PI_no` that isn't "Closed" (a
  // line-status value some records put in this field, not a real PI
  // number). Only applies to the Category 1/2 WI branch — Product
  // Fitments records have no `_3_0`/PI_no concept, so they're left
  // unfiltered.
  const lineItems = (() => {
    const t = String(piTemplateField ?? '').trim().toLowerCase()
    if (t.includes('product fitment')) return rawLineItems
    const key20 = resolveSlsWi20SubformKey(piTemplateField)
    const key30 = key20.replace(/_2_0$/, '_3_0') as
      | 'Category_1_MM_Database_WI_3_0'
      | 'Category_2_MM_Database_WI_3_0'
    const rows20 = subformRows(rawQuotationData as Record<string, unknown> | null | undefined, key20)
    const rows30 = subformRows(rawQuotationData as Record<string, unknown> | null | undefined, key30)
    const piNoByRef = new Map<string, string>()
    for (const row of rows30) {
      const ref = String(row.Line_Item_ref ?? '').trim()
      if (ref) piNoByRef.set(ref, String(row.PI_no ?? '').trim())
    }
    return rawLineItems.filter((_, index) => {
      const ref = String(rows20[index]?.Line_Item_ref ?? '').trim()
      const piNo = piNoByRef.get(ref) ?? ''
      return Boolean(piNo) && piNo.toLowerCase() !== 'closed'
    })
  })()
  // "Rate / {UOM}" header — first line that has a Billing UOM.
  const priceUomLabel = lineItems.find((item) => item.uom)?.uom ?? ''

  const lineItemsTotalFallback = lineItems.reduce(
    (sum, item) => sum + (Number.isFinite(item.totalPrice) ? item.totalPrice : 0),
    0
  )
  const {
    cgstAmount: piCgstAmount,
    sgstAmount: piSgstAmount,
    igstAmount: piIgstAmount,
    totalBeforeTax: piTotalBeforeTax,
    totalAfterTax: piTotalAfterTax,
  } = parseQuotationTaxForSummary(rawQuotationData, lineItemsTotalFallback)

  const piGrandTotal = (() => {
    const fromZoho = parseOverallGrandTotalInclAccessories(
      rawQuotationData as Record<string, unknown> | null | undefined
    )
    return Number.isFinite(fromZoho)
      ? fromZoho
      : Number.isFinite(piTotalAfterTax)
      ? piTotalAfterTax
      : lineItemsTotalFallback
  })()

  const piIsExportQuotation =
    String((rawQuotationData as Record<string, unknown> | undefined)?.Type_Of_Quotation ?? '')
      .trim()
      .toLowerCase() === 'export'
  const piSafe = (n: number) => (Number.isFinite(n) ? n : 0)
  const piTaxHasValue = (n: number) => Number.isFinite(n) && n !== 0

  // Dynamic GST rates — same resolver as BVKQuotationContent's `bvkGstRates`
  // (IGST/CGST from the active WI category's `_2_0` row, SGST from `_3_0`).
  const piGstRates = (() => {
    const raw = rawQuotationData as Record<string, unknown> | undefined
    const template = String(raw?.Template ?? '').trim().toLowerCase()
    const isCat2 = template.includes('category 2 mm database wi') || template.includes('category 2 wi')
    const line20Key = isCat2 ? 'Category_2_MM_Database_WI_2_0' : 'Category_1_MM_Database_WI_2_0'
    const line30Key = isCat2 ? 'Category_2_MM_Database_WI_3_0' : 'Category_1_MM_Database_WI_3_0'
    const arrOf = (key: string): Array<Record<string, unknown>> => {
      const v = raw?.[key]
      if (Array.isArray(v)) return v as Array<Record<string, unknown>>
      if (v && typeof v === 'object') return [v as Record<string, unknown>]
      return []
    }
    const row20 = arrOf(line20Key)[0]
    const row30 = arrOf(line30Key)[0]
    const parseRate = (v: unknown): number => {
      if (v == null) return 0
      const n = parseFloat(String(v).replace(/,/g, '').trim())
      return Number.isFinite(n) ? n : 0
    }
    return {
      igst: parseRate(row20?.IGST),
      cgst: parseRate(row20?.CGST),
      sgst: parseRate(row30?.SGST),
    }
  })()
  const piIgstLabelRate = piGstRates.igst > 0 ? piGstRates.igst : 18
  const piCgstLabelRate = piGstRates.cgst > 0 ? piGstRates.cgst : 9
  const piSgstLabelRate = piGstRates.sgst > 0 ? piGstRates.sgst : 9

  type PiSummaryRow = { label: string; value: string; bold?: boolean; big?: boolean }
  const piSummaryRows: PiSummaryRow[] = []
  if (piIsExportQuotation) {
    piSummaryRows.push({
      label: 'Total',
      value: formatCurrency(piGrandTotal, displayCurrency),
      bold: true,
      big: true,
    })
  } else {
    piSummaryRows.push({
      label: 'Total Amount Before Tax',
      value: formatCurrency(piSafe(piTotalBeforeTax), displayCurrency),
      bold: true,
    })
    if (piTaxHasValue(piCgstAmount)) {
      piSummaryRows.push({
        label: `Add CGST @ ${piCgstLabelRate}%`,
        value: formatCurrency(piCgstAmount, displayCurrency),
      })
    }
    if (piTaxHasValue(piSgstAmount)) {
      piSummaryRows.push({
        label: `Add SGST @ ${piSgstLabelRate}%`,
        value: formatCurrency(piSgstAmount, displayCurrency),
      })
    }
    if (piTaxHasValue(piIgstAmount)) {
      piSummaryRows.push({
        label: `Add IGST @ ${piIgstLabelRate}%`,
        value: formatCurrency(piIgstAmount, displayCurrency),
      })
    }
    piSummaryRows.push({
      label: 'Total Amount After GST',
      value: formatCurrency(piGrandTotal, displayCurrency),
      bold: true,
      big: true,
    })
  }

  // "Amount In Word" spells out the Grand Total (the same value the
  // summary box's last row shows).
  const piAmountInWords = formatAmountInWords(piGrandTotal, displayCurrency)

  const piPoNumber = String(rawQuotationData?.PO_Number ?? '').trim()
  const piPoDate = String(rawQuotationData?.PO_Date ?? '').trim()
  const piPaymentTerm = String(rawQuotationData?.Term_of_Payment ?? '').trim()
  const piSignatoryName = String(rawQuotationData?.Contact_Person ?? '').trim()
  // Bank Details — root `Our_Bank_Details`, a single free-text field with
  // one "Label : Value" line per field. Split on the first ":" per line so
  // it can render in a boxed Label/Value table — the row SET is whatever
  // Zoho sends for this record (BVK's own account, not WMW's).
  const piBankDetails = String(rawQuotationData?.Our_Bank_Details ?? '').trim()
  const piBankDetailsRows = piBankDetails
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':')
      return idx === -1
        ? { label: line, value: '' }
        : { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }
    })

  return (
    <>
      <div
        className="bvk-quotation-container"
        style={{ maxWidth: '210mm', margin: '0 auto', padding: '20mm', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.6' }}
      >
        {/* Whole page wrapped in a <table> so the browser repeats <thead> on
         * every printed page — exact same technique as BVKQuotationContent.tsx.
         * Reuses BVK's own `.bvk-print-table` / `.bvk-print-header-row` /
         * `.bvk-print-footer-row` classes directly (not a new isolated set)
         * so margin/width/repeat behaviour matches BVK exactly. */}
        <table className="bvk-print-table" style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
          <thead className="bvk-print-header-row">
            <tr className="print-page-top-spacer" aria-hidden="true">
              <td colSpan={2} />
            </tr>
            <tr>
              <td colSpan={2} style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                {/* Header — exact copy of BVKQuotationContent.tsx's header:
                 * top green line, then the BVK top-left/top-right images. */}
                <div className="bvk-print-header" style={{ marginBottom: '20px' }}>
                  <div style={{ borderTop: '2px solid #00a651', marginBottom: '10px' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <img
                        src="/bvk top left.png"
                        alt="BVK header (left)"
                        style={{ height: '80px', width: 'auto', objectFit: 'contain', display: 'block' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <img
                        src="/bvk top right.png"
                        alt="BVK header (right)"
                        style={{ height: '80px', width: 'auto', objectFit: 'contain', display: 'block' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2} style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                {/* Recipient — "To," on the left, Date on the right, same
                 * baseline — same layout as BVK quotation. */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold' }}>To,</div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', textAlign: 'right' }}>
                      Date : - {date}
                    </div>
                  </div>
                  {recipientNameDisplay ? (
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{recipientNameDisplay}</div>
                  ) : null}
                  {recipientCompany ? (
                    <div style={{ fontWeight: 'bold', marginBottom: '15px' }}>{recipientCompany}</div>
                  ) : null}
                  {recipientAddressBody ? (
                    <div style={{ marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{recipientAddressBody}</div>
                  ) : null}
                  {/* PO Number / PO Date — root `PO_Number` / `PO_Date`, stacked. */}
                  {piPoNumber || piPoDate ? (
                    <div style={{ marginBottom: '15px' }}>
                      <div>
                        <strong>PO Number:</strong> {piPoNumber}
                      </div>
                      <div>
                        <strong>PO Date:</strong> {piPoDate}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', textTransform: 'uppercase' }}>
                  Proforma Invoice
                </div>

                {/* GST No. (left) / Ref No. (right) — same layout as the WI PI. */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <div>
                    <strong>GST No.</strong> {gstNo}
                  </div>
                  <div>
                    <strong>Ref No.:</strong> {refNo}
                  </div>
                </div>

                {/* Line items table — "Item" serial column + plain Product
                 * text (no Remarks stack), matching the sample. No bottom
                 * margin so the summary box right below sits flush against
                 * it, no gap. */}
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11px', tableLayout: 'fixed', wordWrap: 'break-word' }}>
                    <colgroup>
                      <col style={{ width: '6%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '34%' }} />
                      <col style={{ width: '11%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '13%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #000', padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0', whiteSpace: 'nowrap' }}>Item</th>
                        <th style={{ border: '1px solid #000', padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0', whiteSpace: 'nowrap' }}>HSN Code</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Product</th>
                        <th style={{ border: '1px solid #000', padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0', whiteSpace: 'nowrap' }}>Qty.</th>
                        <th style={{ border: '1px solid #000', padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0', whiteSpace: 'nowrap' }}>Billing UOM</th>
                        <th style={{ border: '1px solid #000', padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>{`Rate${priceUomLabel ? ` / ${priceUomLabel}` : ''}`}</th>
                        <th style={{ border: '1px solid #000', padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>{`Total${displayCurrency ? ` in ${displayCurrency}` : ''}`}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, index) => (
                        <tr key={index}>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{index + 1}.</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', whiteSpace: 'nowrap' }}>{item.hsnCode || ''}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{item.productName || ''}</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{formatQty(item.qty)}</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.uom || ''}</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{formatCurrency(item.unitPrice, displayCurrency)}</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{formatCurrency(item.totalPrice, displayCurrency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary box — one bordered table: "Amount In Word" on the
                 * left spans every row on the right (Total Before Tax /
                 * CGST / SGST / IGST / Total After GST — dynamic, same
                 * pattern as BVK quotation), all inside a single box. No
                 * Advance row. Column widths (52/23/25) land the vertical
                 * lines on the item table's Qty-left-edge and
                 * Rate-left-edge, same alignment rule as the WI PI. */}
                <div style={{ marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', borderTop: 'none', fontSize: '11px', tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '52%' }} />
                      <col style={{ width: '23%' }} />
                      <col style={{ width: '25%' }} />
                    </colgroup>
                    <tbody>
                      {piSummaryRows.map((srow, i) => (
                        <tr key={srow.label}>
                          {i === 0 ? (
                            <td
                              rowSpan={piSummaryRows.length}
                              style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'middle' }}
                            >
                              <strong>Amount In Word:</strong> {piAmountInWords}
                            </td>
                          ) : null}
                          <td
                            style={{
                              border: '1px solid #000',
                              padding: srow.big ? '12px 8px' : '6px 8px',
                              textAlign: 'right',
                              fontWeight: srow.bold ? 'bold' : 'normal',
                              fontSize: srow.big ? '13px' : '11px',
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

                {/* Payment Term */}
                {piPaymentTerm ? (
                  <div style={{ marginBottom: '20px' }}>
                    <strong>Payment Term :</strong> {piPaymentTerm}
                  </div>
                ) : null}

                {/* Our Bank Details — live, root `Our_Bank_Details`, parsed
                 * into Label/Value rows and boxed. Skipped entirely when
                 * the field is empty. */}
                {piBankDetailsRows.length > 0 ? (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Our Bank Details:</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11px', tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '75%' }} />
                      </colgroup>
                      <tbody>
                        {piBankDetailsRows.map((row, i) => (
                          <tr key={i}>
                            <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>{row.label}</td>
                            <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {/* Signature block */}
                <div style={{ marginBottom: '20px' }}>
                  <div>For BVK Hydrotech India Pvt. Ltd</div>
                  <div style={{ marginTop: '40px' }}>Authorized Signatory</div>
                  {piSignatoryName ? <div style={{ marginTop: '4px' }}>{piSignatoryName}</div> : null}
                </div>
              </td>
            </tr>
          </tbody>
          {/* Empty tfoot spacer — reserves 32mm at the bottom of every
           * printed page so body content never flows under the fixed
           * footer below (same trick BVK quotation uses). */}
          <tfoot className="bvk-print-footer-row">
            <tr>
              <td colSpan={2} style={{ border: 'none', padding: 0, height: '32mm' }} aria-hidden />
            </tr>
          </tfoot>
        </table>

        {/* Actual footer — lives OUTSIDE the table. In print media it gets
         * `position: fixed; bottom: 0` (see globals.css `.bvk-page-footer`)
         * so it pins to the paper bottom on EVERY generated page. Exact
         * same content as BVKQuotationContent.tsx's footer. */}
        <div className="bvk-page-footer bvk-print-footer" style={{ paddingTop: '15px', fontSize: '10px' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>BVK Hydrotech India Pvt. Ltd.</div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#00a651' }}>Reg. Office:</span> Imax Imperial, Room No. 1C, 1st Floor, 101/5, S.N. Banerjee Road, Taltala, Kolkata - 700014, West Bengal, India
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#00a651' }}>CIN:</span> U46103WB2024PTC269415 | <span style={{ color: '#00a651' }}>GSTIN:</span> 08AAMCB4592K1Z3
            </div>
            <div>
              <span style={{ color: '#00a651' }}>Correspondence Address:</span> 52-B (Part), Industrial Area, Jhotwara, Jaipur - 302012, Rajasthan, India
            </div>
          </div>
          <div style={{ borderTop: '2px solid #00a651', marginTop: '10px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '60%' }}></div>
            <div style={{ color: '#00a651', fontSize: '10px', textAlign: 'right' }}>
              Woven Solutions for Electrolyzers and Fuel Cells
            </div>
          </div>
        </div>
      </div>

      <div className="no-print" style={{ marginTop: '24px', textAlign: 'center' }}>
        <PrintButton />
      </div>
    </>
  )
}
