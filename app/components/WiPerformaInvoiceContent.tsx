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
 * WI Proforma Invoice — ISOLATED sibling of SLSQuotationContent.tsx.
 *
 * Same data source (Quotation report, Category 1 WI / Category 2 WI /
 * Product Fitments — via `buildSlsLineItemsFromWi20SubformsShared`, the
 * exact same helper SLS uses) and the exact same letterhead / repeating
 * header-footer print technique as SLS (and, downstream, argo-multi-ao,
 * which copies SLS's technique too): `/wi.png` header, `/wi bottom left
 * side.png` + `/wi_bottom_rightside.png` footer, 12mm top inset via a
 * repeating `print-page-top-spacer` row, 20mm side padding, full-bleed
 * footer with an 8mm inset on the left image only.
 *
 * Column set is trimmed from the sample PDF: no Item Code, no Po. No., no
 * SAP No., no Client Reference — none of those four have a matching field
 * anywhere in Quotation data (confirmed against live records; Sales Order
 * data has SAP_No / Client_PO_No / Customer_Reference on its `_3_0`
 * subform, Quotation data does not). Final columns: HSN Code / Product /
 * Qty. / Billing UOM / Rate / Total — Billing UOM is its own column (not
 * merged into Qty), matching the argo-multi-ao split.
 *
 * Summary block reuses BVKQuotationContent's dynamic CGST/SGST/IGST
 * pattern (rates read from the record, rows hidden when zero, Export
 * quotations show a single Total line). Two PI-only additions: "Amount In
 * Word" and "50% Advance" — both describe the SAME computed value (50% of
 * the Grand Total), matching the sample PDF exactly (its "Amount In Word"
 * line spells out 1,536,360.00, which is exactly half of its 3,072,720.00
 * Grand Total — not the Grand Total itself). There is no Zoho field for an
 * advance percentage, so this is a client-side computation, not a mapped
 * field.
 *
 * Bank Details are live — root `Our_Bank_Details`, a single free-text field
 * with one "Label : Value" line per field, printed verbatim (not parsed
 * into a table, since the line set isn't guaranteed to be the same shape
 * on every record). Authorized Signatory reads root `Contact_Person`.
 *
 * Does NOT import from or modify SLSQuotationContent.tsx / BVKQuotationContent.tsx,
 * so neither is affected by anything here.
 */

interface WiPerformaInvoiceContentProps {
  data: QuotationData
  shippingData?: any
  billingData?: any
  rawQuotationData?: any
  /** CRM Contact (Salutation + Full_Name), resolved via Quotation → Deal →
   * Contact — same chain SLS/BVK use. Feeds the recipient-name line. */
  contactData?: { salutation: string; fullName: string } | null
}

export default function WiPerformaInvoiceContent({
  data,
  shippingData,
  billingData,
  rawQuotationData,
  contactData,
}: WiPerformaInvoiceContentProps) {
  // Same DD.MM.YYYY formatter as SLSQuotationContent.
  const formatPiDate = (dateString?: string): string => {
    if (!dateString) return ''
    try {
      const dateMatch = dateString.match(/(\d{2})-(\w{3})-(\d{4})/)
      if (dateMatch) {
        const [, day, month, year] = dateMatch
        const monthMap: { [key: string]: string } = {
          Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
          Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
        }
        const monthNum = monthMap[month] || '01'
        return `${day}.${monthNum}.${year}`
      }
      return dateString
    } catch {
      return dateString || ''
    }
  }

  // Strip trailing zeros from a numeric qty string (same as SLS's formatQty).
  const formatQty = (q: unknown): string => {
    const s = String(q ?? '').trim()
    if (!s) return ''
    const n = Number(s.replace(/,/g, ''))
    return Number.isFinite(n) ? n.toString() : s
  }

  const date = formatPiDate(data.date || rawQuotationData?.Created_Date_and_time)
  // Ref No. — root `Name` (the quotation number), same field SLS/BVK use
  // for their own "Quotation Ref. No." line. NOT `Quotation_Reference`,
  // which is the long opening-paragraph text, not a short ref code.
  const refNo = data.quotationNumber || rawQuotationData?.Name || ''
  const gstNo = String(rawQuotationData?.Billing_GST_No ?? '').trim()

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

  // Same line-item source SLS uses — Category 1 WI / Category 2 WI /
  // Product Fitments, resolved from the record's `Template` field.
  const piTemplateField = rawQuotationData?.Template as string | undefined
  const rawLineItems = buildSlsLineItemsFromWi20SubformsShared(
    rawQuotationData as Record<string, unknown> | null | undefined,
    piTemplateField
  )
  // Only show line items whose matching `_3_0` row (same `Line_Item_ref`,
  // active WI category — Cat1 or Cat2, whichever the Template field
  // resolved to) has a non-empty `PI_no`. Only applies to the Category
  // 1/2 WI branch — Product Fitments records have no `_3_0`/PI_no concept,
  // so they're left unfiltered. Index-aligned with `rawLineItems` because
  // both call the exact same `subformRows(raw, key20)` the shared helper
  // uses internally, in the same order.
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
      // "Closed" is a line-status value some records put in this field, not
      // an actual PI number — doesn't count as "PI no is there".
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
  // one "Label : Value" line per field (account number, holder name, bank
  // name, branch, SWIFT/IFSC/MICR codes). Split on the first ":" per line
  // so it can render in the same bordered Label/Value box as the sample
  // PDF — the row SET is whatever Zoho sends, not a fixed list.
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
        className="wi-pi-quotation-container"
        style={{ maxWidth: '210mm', margin: '0 auto', padding: '10mm 20mm 20mm 20mm', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.6' }}
      >
        {/* Whole page wrapped in a <table> so the browser repeats <thead> on
         * every printed page — exact same technique as SLSQuotationContent.tsx. */}
        <table className="bvk-print-table wi-pi-print-table" style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
          <thead className="bvk-print-header-row wi-pi-print-header-row">
            <tr className="print-page-top-spacer" aria-hidden="true">
              <td />
            </tr>
            <tr>
              <td style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                {/* Header — same single combined-logo image as SLS
                 * (`/wi.png` already has the WMW mark + "WMW INDUSTRIES LTD"
                 * + tagline baked in as one graphic). */}
                <div style={{ marginBottom: '12px', marginTop: 0 }}>
                  <img
                    src="/wi.png"
                    alt="WMW Industries Ltd"
                    style={{ height: '80px', width: 'auto', objectFit: 'contain', display: 'block', marginTop: 0 }}
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
                {/* Recipient — "To," on the left, Date on the right, same
                 * baseline — same layout as SLS. */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold' }}>To,</div>
                    <div style={{ fontSize: '11px', textAlign: 'right' }}>
                      <strong>Date:</strong> {date}
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

                {/* GST No. (left) / Ref No. (right) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <div>
                    <strong>GST No.</strong> {gstNo}
                  </div>
                  <div>
                    <strong>Ref No.:</strong> {refNo}
                  </div>
                </div>

                {/* Line items table — no bottom margin so the summary box
                 * right below sits flush against it, no gap. */}
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '11px', tableLayout: 'fixed', wordWrap: 'break-word' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #000', padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0', width: '12%', whiteSpace: 'nowrap' }}>HSN Code</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', backgroundColor: '#f0f0f0', width: '40%' }}>Product</th>
                        <th style={{ border: '1px solid #000', padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0', width: '11%', whiteSpace: 'nowrap' }}>Qty.</th>
                        <th style={{ border: '1px solid #000', padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0', width: '12%', whiteSpace: 'nowrap' }}>Billing UOM</th>
                        <th style={{ border: '1px solid #000', padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0', width: '12%' }}>{`Rate${priceUomLabel ? ` / ${priceUomLabel}` : ''}`}</th>
                        <th style={{ border: '1px solid #000', padding: '4px 2px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0', width: '13%' }}>{`Total${displayCurrency ? ` in ${displayCurrency}` : ''}`}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, index) => (
                        <tr key={index}>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', whiteSpace: 'nowrap' }}>{item.hsnCode || ''}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>
                            {item.productName ? (
                              <div style={{ marginBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold' }}>Product</span> : {item.productName}
                              </div>
                            ) : null}
                            <div style={{ whiteSpace: 'pre-wrap' }}>{item.product}</div>
                          </td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{formatQty(item.qty)}</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.uom || ''}</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{formatCurrency(item.unitPrice, displayCurrency)}</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{formatCurrency(item.totalPrice, displayCurrency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary box — one bordered table, same layout as the
                 * sample PDF: "Amount In Word" on the left spans every row
                 * on the right (Total Before Tax / CGST / SGST / IGST /
                 * Total After GST — dynamic, same pattern as BVK/SLS), all
                 * inside a single box. No separate Advance row. */}
                <div style={{ marginBottom: '20px' }}>
                  {/* borderTop: none — the line items table right above already
                   * has its own 1px bottom border; without this the two
                   * adjacent 1px borders stack into a visibly thicker line.
                   * Column widths (52/23/25) deliberately mirror the item
                   * table's own widths above (HSN 12 + Product 40 = 52, so
                   * the Amount In Word line lands on the Qty column's LEFT
                   * edge; then + Qty 11 + Billing UOM 12 = 75 for the
                   * label/value line, landing on the Rate column's LEFT
                   * edge). */}
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
                 * into Label/Value rows and boxed the same way as the
                 * sample PDF. Skipped entirely when the field is empty. */}
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
                  <div>For WMW Industries Ltd.</div>
                  <div style={{ marginTop: '40px' }}>Authorized Signatory</div>
                  {piSignatoryName ? <div style={{ marginTop: '4px' }}>{piSignatoryName}</div> : null}
                </div>
              </td>
            </tr>
            {/* Spacer row — height:100% in print, stretches to consume
             * leftover space on the LAST page so the footer sinks to the
             * bottom (same trick SLS uses). */}
            <tr className="wi-pi-print-page-bottom-spacer" aria-hidden="true">
              <td />
            </tr>
          </tbody>
          {/* Empty tfoot spacer — reserves 32mm at the bottom of every
           * printed page so body content never flows under the fixed
           * footer below (same trick SLS uses). */}
          <tfoot className="wi-pi-print-footer-row">
            <tr>
              <td style={{ border: 'none', padding: 0, height: '32mm' }} aria-hidden />
            </tr>
          </tfoot>
        </table>

        {/* Actual footer — lives OUTSIDE the table. In print media it gets
         * `position: fixed; bottom: 0` (see globals.css) so the two images
         * pin to the paper bottom on EVERY generated page, including the
         * last — same two images / same full-bleed treatment as SLS's footer. */}
        <div
          className="wi-pi-page-footer wi-pi-company-footer"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}
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
      </div>

      <div className="no-print" style={{ marginTop: '24px', textAlign: 'center' }}>
        <PrintButton />
      </div>
    </>
  )
}
