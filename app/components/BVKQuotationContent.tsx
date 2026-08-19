'use client'

import type { QuotationData, ZohoQuotation } from '@/lib/types'
import { resolveConsigneeDisplay } from '@/lib/consignee-display'
import {
  formatCurrency,
  formatPiecesInteger,
  parseOverallGrandTotalInclAccessories,
  parseQuotationTaxForSummary,
  resolveQuotationValidity,
} from '@/lib/quotation-utils'
import { buildBvkQuotationTableRows } from '@/lib/wi-line-display-shared'
import { quotationScalarFieldPresent, resolveWmwChargeTotals } from '@/lib/wmw-subform-mapping'
import PrintButton from './PrintButton'

interface BVKQuotationContentProps {
  data: QuotationData
  shippingData?: any
  billingData?: any
  rawQuotationData?: ZohoQuotation
}

/** BVK tab: show mesh count with `/Inch` suffix when a value exists. */
function bvkMeshCellValue(meshDisplay?: string): string {
  const m = meshDisplay?.trim() ?? ''
  if (!m) return '---------'
  return m.endsWith('/Inch') ? m : `${m}/Inch`
}

export default function BVKQuotationContent({ data, shippingData, billingData, rawQuotationData }: BVKQuotationContentProps) {
  const tolerancesFromZoho = String(rawQuotationData?.Tolerances ?? '').trim()
  const pleaseNoteFromZoho =
    String(rawQuotationData?.Inside_Quotation_Text ?? '').trim() ||
    String(rawQuotationData?.Please_Note ?? '').trim()

  // Format date for BVK (DD.MM.YY format)
  const formatBVKDate = (dateString?: string): string => {
    if (!dateString) {
      // Fallback to today's date if no date provided
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
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
          'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        }
        const monthNum = monthMap[month] || '01'
        const shortYear = year.slice(-2)
        return `${day}.${monthNum}.${shortYear}`
      }
      return dateString
    } catch {
      // Fallback to today's date
      const today = new Date()
      const day = String(today.getDate()).padStart(2, '0')
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const year = String(today.getFullYear()).slice(-2)
      return `${day}.${month}.${year}`
    }
  }

  const quotationDate = formatBVKDate(data.date || rawQuotationData?.Created_Date_and_time)
  const quotationRef = data.quotationNumber || rawQuotationData?.Name || ''
  
  const consignee = resolveConsigneeDisplay(shippingData, rawQuotationData)
  const recipientName =
    consignee.name ||
    String(billingData?.Billing_Address_Name ?? rawQuotationData?.Billing_Address_Name ?? '').trim()
  const recipientAddressShipping = [consignee.addressBlock, consignee.country].filter(Boolean).join('\n')
  const recipientAddressBilling = billingData?.Billing_Street
    ? `${billingData.Billing_Street || rawQuotationData?.Billing_Street || ''}, ${billingData.Billing_City || rawQuotationData?.Billing_City || ''}, ${billingData.Billing_State || rawQuotationData?.Billing_State || ''} ${billingData.Billing_Postal_Code || rawQuotationData?.Billing_Postal_Code || ''}`
    : ''
  const recipientAddress = recipientAddressShipping || recipientAddressBilling
  const recipientAddressPreWrap = Boolean(recipientAddressShipping)

  const displayCurrency = data.currency || rawQuotationData?.Currency || 'INR'
  const bvkTableRows = buildBvkQuotationTableRows(
    rawQuotationData as Record<string, unknown> | null | undefined,
    data.lineItems ?? []
  )

  const {
    discountTotal: bvkDiscountAmount,
    discountLabel: bvkDiscountLabel,
    packingTotal: bvkPackingTotal,
    freightTotal: bvkFreightTotal,
  } = resolveWmwChargeTotals(rawQuotationData ?? null)
  const bvkShowDiscountRow = Number.isFinite(bvkDiscountAmount) && bvkDiscountAmount !== 0

  // Other Charges (Zoho scalar `Other_Charges`, optionally labelled with `Type_of_Other_Charges`).
  const bvkOtherChargesAmt = quotationScalarFieldPresent(
    (rawQuotationData as Record<string, unknown> | undefined)?.Other_Charges
  )
    ? parseFloat(
        String((rawQuotationData as Record<string, unknown>)?.Other_Charges)
          .replace(/,/g, '')
          .trim()
      ) || 0
    : 0
  const bvkOtherChargesType = String(
    (rawQuotationData as Record<string, unknown> | undefined)?.Type_of_Other_Charges ?? ''
  ).trim()
  const bvkOtherChargesLabel = bvkOtherChargesType
    ? `Other Charges (${bvkOtherChargesType})`
    : 'Other Charges'

  const bvkLineItemsTotalFallback = bvkTableRows.reduce(
    (sum, row) => sum + (Number.isFinite(row.totalPrice) ? row.totalPrice : 0),
    0
  )
  const {
    cgstAmount: bvkCgstAmount,
    sgstAmount: bvkSgstAmount,
    igstAmount: bvkIgstAmount,
    totalBeforeTax: bvkTotalBeforeTax,
    totalAfterTax: bvkTotalAfterTax,
  } = parseQuotationTaxForSummary(rawQuotationData, bvkLineItemsTotalFallback)
  const bvkGrandTotal = (() => {
    const fromZoho = parseOverallGrandTotalInclAccessories(
      rawQuotationData as Record<string, unknown> | null | undefined
    )
    if (Number.isFinite(fromZoho)) return fromZoho
    if (Number.isFinite(bvkTotalAfterTax)) return bvkTotalAfterTax
    return bvkLineItemsTotalFallback
  })()
  const bvkSafe = (n: number) => (Number.isFinite(n) ? n : 0)
  /** Standard GST split: IGST = CGST + SGST = 18%; rate is fixed per tax type when an amount is present. */
  const bvkTaxHasValue = (n: number) => Number.isFinite(n) && n !== 0
  type BvkSummaryRow = { label: string; value: string; bold?: boolean; big?: boolean }
  const bvkSummaryRows: BvkSummaryRow[] = [
    { label: `Total ${displayCurrency}`, value: formatCurrency(bvkGrandTotal, displayCurrency), bold: true },
    { label: 'Packing Charges', value: formatCurrency(bvkSafe(bvkPackingTotal), displayCurrency) },
  ]
  if (bvkTaxHasValue(bvkFreightTotal)) {
    bvkSummaryRows.push({
      label: 'Freight Charges',
      value: formatCurrency(bvkFreightTotal, displayCurrency),
    })
  }
  if (bvkTaxHasValue(bvkOtherChargesAmt)) {
    bvkSummaryRows.push({
      label: bvkOtherChargesLabel,
      value: formatCurrency(bvkOtherChargesAmt, displayCurrency),
    })
  }
  bvkSummaryRows.push({
    label: 'Total Amount Before Tax',
    value: formatCurrency(bvkSafe(bvkTotalBeforeTax), displayCurrency),
    bold: true,
  })
  if (bvkTaxHasValue(bvkCgstAmount)) {
    bvkSummaryRows.push({
      label: 'Add CGST @ 9%',
      value: formatCurrency(bvkCgstAmount, displayCurrency),
    })
  }
  if (bvkTaxHasValue(bvkSgstAmount)) {
    bvkSummaryRows.push({
      label: 'Add SGST @ 9%',
      value: formatCurrency(bvkSgstAmount, displayCurrency),
    })
  }
  if (bvkTaxHasValue(bvkIgstAmount)) {
    bvkSummaryRows.push({
      label: 'Add IGST @ 18%',
      value: formatCurrency(bvkIgstAmount, displayCurrency),
    })
  }
  bvkSummaryRows.push({
    label: 'Total Amount After GST',
    value: formatCurrency(bvkGrandTotal, displayCurrency),
    bold: true,
    big: true,
  })

  // Delivery Schedule — same mapping rules as SLS (see SLSQuotationContent).
  // Resolver is inline so BVK owns its own copy — no new shared helper.
  //
  //   • Family picked from the record's `Template` field (WI Cat 1/2, WMW
  //     Cat 1/2, or Product Fitment). Uses the matching `_Desired_Date`
  //     subform + the family's main product / `_2_0` subforms.
  //   • Groups entries by `Line_Item_ref`.
  //   • Product heading: Cat_1_WI → `Brand_Category` from main row.
  //     All other families → `Brand_Selling_Name` from main row. No fallback.
  //   • Per entry: first non-empty of Date_field → Week → Month_field.
  //   • Format: `<Label> : <value>, <count> items, <UOM>` (UOM = `_2_0`
  //     row's `UOM_Billing`).
  //   • Entries with all three date fields blank are skipped.
  //   • Whole section hidden when nothing renderable.
  const bvkDeliverySchedule = (() => {
    const raw = rawQuotationData as Record<string, unknown> | undefined
    if (!raw) return null
    const template = String(raw.Template ?? '').trim().toLowerCase()
    const family = (() => {
      if (template.includes('product fitment')) {
        return {
          desiredDateKey: 'Product_Fitments_Desired_Date',
          mainKey: 'Product_Fitments',
          twoZeroKey: 'Product_Fitments2_0',
          isCat1Wi: false,
        }
      }
      if (template.includes('category 2 mm database wmw') || template.includes('category 2 wmw')) {
        return {
          desiredDateKey: 'Category_2_MM_Database_WMW_Desired_Date',
          mainKey: 'Category_2_MM_Database_WMW',
          twoZeroKey: 'Category_2_MM_Database_WMW_2_0',
          isCat1Wi: false,
        }
      }
      if (template.includes('category 1 mm database wmw') || template.includes('category 1 wmw')) {
        return {
          desiredDateKey: 'Category_1_MM_Database_WMW_Desired_Date',
          mainKey: 'Category_1_MM_Database_WMW',
          twoZeroKey: 'Category_1_MM_Database_WMW_2_0',
          isCat1Wi: false,
        }
      }
      if (template.includes('category 2 mm database wi') || template.includes('category 2 wi')) {
        return {
          desiredDateKey: 'Category_2_MM_Database_WI_Desired_Date',
          mainKey: 'Category_2_MM_Database_WI',
          twoZeroKey: 'Category_2_MM_Database_WI_2_0',
          isCat1Wi: false,
        }
      }
      return {
        desiredDateKey: 'Category_1_MM_Database_WI_Desired_Date',
        mainKey: 'Category_1_MM_Database_WI',
        twoZeroKey: 'Category_1_MM_Database_WI_2_0',
        isCat1Wi: true,
      }
    })()

    const arrOf = (key: string): Array<Record<string, unknown>> => {
      const v = raw[key]
      if (v == null) return []
      if (Array.isArray(v)) return v.filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')
      if (typeof v === 'object') return [v as Record<string, unknown>]
      return []
    }
    const desiredRows = arrOf(family.desiredDateKey)
    if (desiredRows.length === 0) return null
    const mainRows = arrOf(family.mainKey)
    const twoZeroRows = arrOf(family.twoZeroKey)
    const findByRef = (rows: Array<Record<string, unknown>>, ref: string) =>
      rows.find((r) => String(r.Line_Item_ref ?? '').trim() === ref)

    type Entry = { label: 'Date' | 'Week' | 'Month'; value: string; count: string; uom: string }
    type Group = { ref: string; heading: string; entries: Entry[] }
    const groups = new Map<string, Group>()
    for (const row of desiredRows) {
      const ref = String(row.Line_Item_ref ?? '').trim()
      if (!ref) continue
      const dateVal = String(row.Date_field ?? '').trim()
      const weekVal = String(row.Week ?? '').trim()
      const monthVal = String(row.Month_field ?? '').trim()
      let entry: Entry | null = null
      const count = String(row.No_Of_Items ?? '').trim()
      const twoZeroRow = findByRef(twoZeroRows, ref)
      const uom = String(twoZeroRow?.UOM_Billing ?? '').trim()
      if (dateVal) entry = { label: 'Date', value: dateVal, count, uom }
      else if (weekVal) entry = { label: 'Week', value: weekVal, count, uom }
      else if (monthVal) entry = { label: 'Month', value: monthVal, count, uom }
      if (!entry) continue
      let group = groups.get(ref)
      if (!group) {
        const mainRow = findByRef(mainRows, ref)
        const heading = family.isCat1Wi
          ? String(mainRow?.Brand_Category ?? '').trim()
          : String(mainRow?.Brand_Selling_Name ?? '').trim()
        group = { ref, heading, entries: [] }
        groups.set(ref, group)
      }
      group.entries.push(entry)
    }
    if (groups.size === 0) return null
    return Array.from(groups.values()).sort((a, b) => {
      const na = parseInt(a.ref, 10)
      const nb = parseInt(b.ref, 10)
      return (Number.isFinite(na) ? na : 0) - (Number.isFinite(nb) ? nb : 0)
    })
  })()

  return (
    <>
      <div className="bvk-quotation-container" style={{ maxWidth: '210mm', margin: '0 auto', padding: '20mm', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.6' }}>
        <table className="bvk-print-table" style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
          {/* Header - Repeats on every page in print */}
          <thead className="bvk-print-header-row">
            <tr className="print-page-top-spacer" aria-hidden="true">
              <td colSpan={2} />
            </tr>
            <tr>
              <td colSpan={2} style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                <div className="bvk-print-header" style={{ marginBottom: '20px' }}>
                  {/* Top green line */}
                  <div style={{ borderTop: '2px solid #00a651', marginBottom: '10px' }}></div>
                  
                  {/* Header content */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {/* Left: Green lines decoration */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                      <div style={{ width: '20px', height: '2px', backgroundColor: '#00a651' }}></div>
                      <div style={{ width: '30px', height: '2px', backgroundColor: '#00a651' }}></div>
                      <div style={{ width: '30px', height: '2px', backgroundColor: '#00a651' }}></div>
                      <div style={{ width: '30px', height: '2px', backgroundColor: '#00a651' }}></div>
                    </div>
                    
                    {/* Right: Logo and Date */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ width: '150px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                          <img 
                            src="/hydrotech-logo.png" 
                            alt="BVK Hydrotech Logo" 
                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                            onError={(e) => {
                              console.error('Hydrotech Logo failed to load:', e);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                          Date : - {quotationDate}
                        </div>
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
                {/* Recipient Section — Zoho-driven, no hardcoded lines. */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ marginBottom: '8px' }}>To,</div>
                  {recipientName ? (
                    <div style={{ marginBottom: '15px' }}>{recipientName}</div>
                  ) : null}
                  {recipientAddress && (
                    <div
                      style={{
                        marginBottom: '15px',
                        whiteSpace: recipientAddressPreWrap ? 'pre-wrap' : undefined,
                      }}
                    >
                      {recipientAddress}
                    </div>
                  )}
                  <div style={{ borderTop: '1px dashed #000', marginBottom: '15px' }}></div>
                </div>

                {/* Quotation Reference */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    Quotation Ref. No.: {quotationRef}
                  </div>
                  {/* Opening paragraph — from Zoho `Quotation_Reference`; skip when empty.
                   * `whiteSpace: pre-wrap` preserves line breaks + spacing exactly as typed. */}
                  {(() => {
                    const v = String(rawQuotationData?.Quotation_Reference ?? '').trim()
                    if (!v) return null
                    return <div style={{ marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{v}</div>
                  })()}
                  <div style={{ borderTop: '1px solid #000', marginBottom: '15px' }}></div>
                </div>

                {/* Item Table */}
                <div style={{ marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed', wordWrap: 'break-word' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '5%', whiteSpace: 'nowrap' }}>Item</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '38%' }}>Product</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '14%' }}>HSN Code</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '11%' }}>Qty/UOM</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '16%' }}>{`Unit Price / ${displayCurrency}`}</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '16%' }}>{`Total Price / ${displayCurrency}`}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bvkTableRows.map((row, index) => (
                        <tr key={index}>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>{index + 1}.</td>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
                            {/* Line 1: "Product : <Product_Name>" — printed only when the
                              * Zoho `Product_Name` field on the main product row has a value.
                              * Line 2: `Remarks` value from the `_2_0` row — printed verbatim
                              * (line breaks + spacing preserved via `whiteSpace: pre-wrap`).
                              * No hardcoded Mesh/Material/Weave rows anymore. */}
                            {row.productName ? (
                              <div style={{ marginBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold' }}>Product</span>
                                {' : '}
                                {row.productName}
                              </div>
                            ) : null}
                            {row.remarks ? (
                              <div style={{ whiteSpace: 'pre-wrap' }}>{row.remarks}</div>
                            ) : null}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {row.hsnCode || ''}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
                            {row.qty
                              ? `${formatPiecesInteger(row.qty)}${row.uomBilling ? ` ${row.uomBilling}` : ''}`
                              : '---'}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
                            {row.unitPrice > 0 ? formatCurrency(row.unitPrice, displayCurrency) : ''}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
                            {row.totalPrice > 0 ? formatCurrency(row.totalPrice, displayCurrency) : ''}
                          </td>
                        </tr>
                      ))}
                      {bvkShowDiscountRow ? (
                        <tr>
                          <td
                            colSpan={5}
                            style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'top', color: '#c00000' }}
                          >
                            {bvkDiscountLabel}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'top', color: '#c00000' }}>
                            {formatCurrency(bvkDiscountAmount, displayCurrency)}
                          </td>
                        </tr>
                      ) : null}
                      {bvkSummaryRows.map((srow) => (
                        <tr key={srow.label} className="bvk-summary-row">
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

                {/* Tolerances Section */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ borderTop: '1px solid #000', marginBottom: '15px' }}></div>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Tolerances :</div>
                  <div
                    style={{
                      marginBottom: '8px',
                      marginLeft: '20px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {tolerancesFromZoho}
                  </div>
                  {pleaseNoteFromZoho ? (
                    <>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Note :</div>
                      <div
                        style={{
                          marginLeft: '20px',
                          marginBottom: '15px',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {pleaseNoteFromZoho}
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Exclusions Section — bullets come from Zoho
                 * `The_following_is_not_included_in_this_quotation` (textarea,
                 * split on newlines). The heading label is a fixed section title.
                 * Whole section is skipped when the Zoho field is empty. No
                 * hardcoded bullet fallback. `whiteSpace: pre-wrap` on each
                 * bullet preserves line breaks / spacing exactly as typed. */}
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
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ borderTop: '1px solid #000', marginBottom: '15px' }}></div>
                      <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>
                        The following is not included in this quotation:
                      </div>
                      <ul
                        style={{
                          marginLeft: '20px',
                          marginBottom: '15px',
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
                    </div>
                  )
                })()}

                {/* Terms and Conditions Section */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ borderTop: '1px solid #000', marginBottom: '15px' }}></div>
                  
                  {/* All items not mentioned */}
                  <div style={{ marginBottom: '12px', marginLeft: '20px' }}>
                    All items not mentioned, insurance, Taxes & Duties, Freight, Demurrage, Detention charges.
                  </div>

                  {/* Transit Insurance — from Zoho `Transit_Insurance`; skip when empty.
                   * `whiteSpace: pre-wrap` preserves line breaks + spacing exactly as typed. */}
                  {(() => {
                    const v = String(rawQuotationData?.Transit_Insurance ?? '').trim()
                    if (!v) return null
                    return (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Transit Insurance:</div>
                        <div style={{ marginLeft: '20px', whiteSpace: 'pre-wrap' }}>{v}</div>
                      </div>
                    )
                  })()}

                  {/* Warranty — from Zoho `Warranty`; skip when empty.
                   * `whiteSpace: pre-wrap` preserves line breaks + spacing exactly as typed. */}
                  {(() => {
                    const v = String(rawQuotationData?.Warranty ?? '').trim()
                    if (!v) return null
                    return (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Warranty</div>
                        <div style={{ marginLeft: '20px', whiteSpace: 'pre-wrap' }}>{v}</div>
                      </div>
                    )
                  })()}

                  {/* Packing and Transport Cost */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Packing and Transport Cost:</div>
                    {/* Packing line — always rendered. Hardcoded phrase
                     * "Normal Box packing … in above price" where the middle
                     * word flips between "included" / "excluded" based on the
                     * Zoho `Packing_Charge` toggle. Zoho `Packing` text field
                     * is not read here. */}
                    {(() => {
                      const v = rawQuotationData?.Packing_Charge
                      const isTrue =
                        v === true ||
                        (typeof v === 'string' && v.trim().toLowerCase() === 'true')
                      return (
                        <div style={{ marginLeft: '20px', marginBottom: '4px' }}>
                          Packing: Normal Box packing {isTrue ? 'included' : 'excluded'} in above price
                        </div>
                      )
                    })()}
                    {/* Incoterms line — value comes from Zoho `Delivery_Terms`, forced
                     * to ALL CAPS (e.g. "exw" → "EXW"). Same convention as the Inco Terms
                     * cell on /wmw and /quotation. Whole row is skipped when the field
                     * is empty — no hardcoded fallback. */}
                    {(() => {
                      const v = String(rawQuotationData?.Delivery_Terms ?? '').trim().toUpperCase()
                      if (!v) return null
                      return (
                        <div style={{ marginLeft: '20px', marginBottom: '4px' }}>Incoterms: {v}</div>
                      )
                    })()}
                    {/* Freight cost to site — value from Zoho `Transport`. Row is always
                     * rendered (matches SLS behavior); value is blank when the Zoho
                     * field is empty. `whiteSpace: pre-wrap` preserves line breaks. */}
                    {(() => {
                      const v = String(rawQuotationData?.Transport ?? '').trim()
                      return (
                        <div style={{ marginLeft: '20px', whiteSpace: 'pre-wrap' }}>
                          Freight cost to site: {v || ' '}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Delivery time — from Zoho `Delivery_Time`; skip when empty.
                   * `whiteSpace: pre-wrap` preserves line breaks + spacing exactly as typed. */}
                  {(() => {
                    const v = String(rawQuotationData?.Delivery_Time ?? '').trim()
                    if (!v) return null
                    return (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Delivery time</div>
                        <div style={{ marginLeft: '20px', whiteSpace: 'pre-wrap' }}>{v}</div>
                      </div>
                    )
                  })()}

                  {/* Payment conditions — from Zoho `Payment_Condition`; skip when empty.
                   * `whiteSpace: pre-wrap` preserves line breaks + spacing exactly as typed. */}
                  {(() => {
                    const v = String(rawQuotationData?.Term_of_Payment ?? '').trim()
                    if (!v) return null
                    return (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Payment conditions:</div>
                        <div style={{ marginLeft: '20px', whiteSpace: 'pre-wrap' }}>{v}</div>
                      </div>
                    )
                  })()}

                  {/* Quotation Valid Till — from Zoho `Expiry_Date`; skip when empty.
                   * `whiteSpace: pre-wrap` preserves line breaks + spacing exactly as typed. */}
                  {(() => {
                    const v = String(rawQuotationData?.Expiry_Date ?? '').trim()
                    if (!v) return null
                    return (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Quotation Valid Till</div>
                        <div style={{ marginLeft: '20px', whiteSpace: 'pre-wrap' }}>{v}</div>
                      </div>
                    )
                  })()}

                  {/* Quantity Validity */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Quotation Validity</div>
                    <div style={{ marginLeft: '20px' }}>Price valid for the quantity mentioned above in the quotation only.</div>
                  </div>

                  {/* Taxes and Duties */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Taxes and Duties**:</div>
                    <ul style={{ marginLeft: '20px', paddingLeft: '20px' }}>
                      <li style={{ marginBottom: '4px' }}>Will be Extra as applicable over and above the Ex-factory prices quoted.</li>
                      <li style={{ marginBottom: '4px' }}>18% IGST will be applicable extra.</li>
                      <li style={{ marginBottom: '4px' }}>However, if there is any change in Tax and any New Statutory Levies is introduced by Government at the time of delivery of the same will be billed as per actual.</li>
                      <li style={{ marginBottom: '4px' }}>Octroi, Entry Tax and any other taxes/ duties, if any, have to be borne by the Buyer as per the actual.</li>
                    </ul>
                  </div>

                  {/* Delivery Schedule — same mapping rules as SLS / WI Process
                   * Febric / WI Decomesh. Resolver is inline (see `bvkDeliverySchedule`
                   * above). Section hides when nothing is renderable. */}
                  {bvkDeliverySchedule ? (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Delivery Schedule:</div>
                      {bvkDeliverySchedule.map((group) => (
                        <div key={group.ref} style={{ marginBottom: '10px', marginLeft: '20px' }}>
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

                  {/* General Remarks — from Zoho `General_Remarks`; skip when empty.
                   * `whiteSpace: pre-wrap` preserves line breaks + spacing exactly as typed. */}
                  {(() => {
                    const v = String(rawQuotationData?.General_Remarks ?? '').trim()
                    if (!v) return null
                    return (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>General Remarks:</div>
                        <div style={{ marginLeft: '20px', whiteSpace: 'pre-wrap' }}>{v}</div>
                      </div>
                    )
                  })()}

                  {/* Additional Remarks — from Zoho `Additional_Remarks`; skip when empty.
                   * `whiteSpace: pre-wrap` preserves line breaks + spacing exactly as typed. */}
                  {(() => {
                    const v = String(rawQuotationData?.Additional_Remarks ?? '').trim()
                    if (!v) return null
                    return (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ borderTop: '1px solid #000', marginTop: '15px', marginBottom: '15px' }}></div>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Additional remarks:</div>
                        <div style={{ marginBottom: '8px', marginLeft: '20px', whiteSpace: 'pre-wrap' }}>{v}</div>
                      </div>
                    )
                  })()}

                  {/* Closing Statement */}
                  <div style={{ marginBottom: '20px', marginLeft: '20px' }}>
                    We hope that the above quotation is of interest and will gladly be of further help for any request you may have.
                  </div>

                  {/* Contact Person — name from Zoho `Contact_Person`; phone stays hardcoded. */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 'bold' }}>BVK Hydrotech India Pvt. Ltd..</div>
                    <div style={{ marginTop: '4px' }}>
                      Contact Person : <strong>{String(rawQuotationData?.Contact_Person ?? '').trim()}</strong>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>

          {/* Footer - Repeats on every page in print */}
          <tfoot className="bvk-print-footer-row">
            <tr>
              <td colSpan={2} style={{ border: 'none', padding: 0, verticalAlign: 'bottom' }}>
                <div className="bvk-print-footer" style={{ marginTop: '20px', paddingTop: '15px', fontSize: '10px' }}>
                  {/* Company Information */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>BVK Hydrotech India Pvt. Ltd.</div>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#00a651' }}>Reg. Office:</span> Imax Imperial, Room No. 1C, 1st Floor, 101/5, S.N. Banerjee Road, Taltala, Kolkata - 700014, West Bengal, India
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#00a651' }}>CIN:</span> U46103WB2024PTC269415 | <span style={{ color: '#00a651' }}>GSTIN:</span> 08AAMCB4592K1Z3
                    </div>
                    <div>
                      <span style={{ color: '#00a651' }}>Correspondence Address:</span> 54-B.1, Industrial Area, Jhotwara, Jaipur - 302012, Rajasthan, India
                    </div>
                  </div>
                  
                  {/* Bottom green line and tagline */}
                  <div style={{ borderTop: '2px solid #00a651', marginTop: '10px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: '60%' }}></div>
                    <div style={{ color: '#00a651', fontSize: '10px', textAlign: 'right' }}>
                      Woven Solutions for Electrolyzers and Fuel Cells
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}
