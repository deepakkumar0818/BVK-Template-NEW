'use client'

/**
 * sls-ods-no-44-p — ISOLATED "price-redacted" sibling of sls-ods-no-44.
 *
 * Deliberately reuses `mapSlsOdsNo44` from `lib/sls-ods-no-44-mapping.ts`
 * as-is (same Zoho field structure/mappings, per spec) — only the
 * presentation differs: the Price / UOM and Total Value in INR columns are
 * removed from the product table. Does NOT import from or modify
 * `OrderDetailSheetContent.tsx` / `types.ts`, so the other Order Detail
 * Sheet variants are unaffected.
 */

import type { SlsOdsNo44Data } from '@/lib/sls-ods-no-44-mapping'

/** Strips thousands separators and parses a number from a mapped string value. */
function parseMappedNumber(v: string): number {
  const s = v.replace(/,/g, '').trim()
  return s ? parseFloat(s) : NaN
}

/** Qty — full decimal precision, no rounding; no trailing ".00" for whole numbers. */
function formatFullPrecision(v: string): string {
  const n = parseMappedNumber(v)
  if (!Number.isFinite(n)) return v
  return String(n)
}

/** Capitalizes only the first character (e.g. "road" -> "Road") — rest of the string untouched. */
function capitalizeFirst(v: string): string {
  if (!v) return v
  return v.charAt(0).toUpperCase() + v.slice(1)
}

const LOGO = {
  src: '/wmw-logo.png',
  alt: 'WMW INDUSTRIES LTD',
  fallbackText: 'WMW\nINDUSTRIES LTD',
  tagline: 'WMW INDUSTRIES LTD',
  taglineSub: 'A BVK Group Company\nWeaving Technical Mesh Solutions',
}

export default function SlsOdsNo44PContent({ data }: { data: SlsOdsNo44Data }) {
  // Length/Width columns are dropped entirely when no line has a value for
  // either (e.g. Invoice_Dimension_1/2 both empty on every line) — a single
  // SQM column (mapped to `SQM`) takes their place instead.
  const showDimensions = data.lines.some((line) => line.length || line.width)
  const productColCount = showDimensions ? 12 : 11

  // QCT No. / Date row (below FREIGHT) — one entry per unique Product Code,
  // in the order first encountered: "<code> - <qctNo>, <qctDate>", joined
  // across products with ", ".
  const qctSummary = (() => {
    const seen = new Set<string>()
    const parts: string[] = []
    for (const line of data.lines) {
      const code = line.productCode.trim()
      if (!code || seen.has(code)) continue
      seen.add(code)
      parts.push(`${code} - ${line.qctNo || ''}, ${line.qctDate || ''}`)
    }
    return parts.join(', ')
  })()

  return (
    <div
      className="sales-order-print-sheet sales-order-doc--sls-ods-no-44-p"
      style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 2mm)' }}
    >
      {/* ── Header block ───────────────────────────────────────────── */}
      <div className="ods-section-outline">
        <table className="ods-table ods-header-table" role="presentation">
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '24%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td colSpan={2} className="ods-title-cell">
                ORDER DETAIL SHEET
              </td>
              <td colSpan={2} className="ods-doc-top">
                {/* Document No. is a fixed constant, independent of Revision Number below —
                    editing one never changes the other. */}
                <span className="ods-label">DOC. NO. :</span> {data.docNo}
                <span className="ods-doc-rev"> Rev : {data.docRev}</span>
              </td>
              <td rowSpan={5} className="ods-logo-wrap">
                <img
                  src={LOGO.src}
                  alt={LOGO.alt}
                  className="ods-logo-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling
                    if (fallback instanceof HTMLElement) fallback.style.display = 'block'
                  }}
                />
                <div className="ods-logo-fallback" style={{ display: 'none', whiteSpace: 'pre-line' }}>
                  {LOGO.fallbackText}
                </div>
                <div className="ods-logo-tagline">{LOGO.tagline}</div>
                <div className="ods-logo-tagline-sub" style={{ whiteSpace: 'pre-line' }}>
                  {LOGO.taglineSub}
                </div>
              </td>
            </tr>
            <tr>
              <td className="ods-label">ODS NO.</td>
              <td>{data.odsNo}</td>
              <td className="ods-label">Issue No.</td>
              <td>{data.issueNo}</td>
            </tr>
            <tr>
              <td className="ods-label" rowSpan={2}>
                ODS DATE
              </td>
              <td rowSpan={2}>{data.createdDateAndTime}</td>
              <td className="ods-label">Page No.</td>
              <td>{data.pageNo}</td>
            </tr>
            <tr>
              <td className="ods-label">Issue Date</td>
              <td>{data.issueDate}</td>
            </tr>
            <tr>
              {/* Customer Name + Product Group on one line, same as sls-ods-no-44. */}
              <td className="ods-label">CUSTOMER NAME</td>
              <td>{data.customerName}</td>
              <td className="ods-label">Product Group</td>
              <td>{data.productGroup}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Addresses (Billing / Shipping) ──────────────────────────── */}
      <div className="ods-section-outline">
        <table className="ods-table ods-address-table" role="presentation">
          <tbody>
            <tr>
              <td className="ods-section-label ods-address-col">BILLING ADDRESS</td>
              <td className="ods-section-label ods-address-col">SHIPPING ADDRESS</td>
            </tr>
            {Array.from({ length: Math.max(data.billingAddressLines.length, data.shippingAddressLines.length, 1) }).map(
              (_, idx) => (
                <tr key={idx}>
                  <td className={['ods-address-line', idx === 0 ? 'ods-address-line--name' : ''].filter(Boolean).join(' ')}>
                    {data.billingAddressLines[idx] ?? ' '}
                  </td>
                  <td className={['ods-address-line', idx === 0 ? 'ods-address-line--name' : ''].filter(Boolean).join(' ')}>
                    {data.shippingAddressLines[idx] ?? ' '}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* ── Product details — Price / UOM and Total Value in INR columns removed ── */}
      <div className="ods-section-outline" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <table className="ods-table ods-product-table" role="presentation" style={{ flex: 1, height: '100%' }}>
          {showDimensions ? (
            <colgroup>
              <col style={{ width: '9%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '4%' }} />
            </colgroup>
          ) : (
            <colgroup>
              <col style={{ width: '9%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '4%' }} />
            </colgroup>
          )}
          <thead>
            <tr>
              <th colSpan={productColCount} className="ods-section-label ods-section-label--center">
                PRODUCT DETAILS
              </th>
            </tr>
            <tr>
              <th>Product Code</th>
              <th>Billing Description</th>
              <th>HSN Code</th>
              <th>SAP No.</th>
              <th>Client PO No.</th>
              <th>PO Date</th>
              <th>Customer Desired Date</th>
              <th>Customer Reference</th>
              {showDimensions ? (
                <>
                  <th>{data.lengthColumnLabel}</th>
                  <th>{data.widthColumnLabel}</th>
                </>
              ) : null}
              <th>UOM</th>
              <th>Qty</th>
              {showDimensions ? null : <th>SQM</th>}
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line, idx) => (
              <tr key={idx}>
                <td className="ods-desc">{line.productCode || ' '}</td>
                <td className="ods-desc">
                  {line.billingDescription || ' '}
                  {line.lineRemarks ? <div>{line.lineRemarks}</div> : null}
                </td>
                <td className="ods-num">{line.hsnCode || ' '}</td>
                <td className="ods-num">{line.sapNo || ' '}</td>
                <td className="ods-num">{line.clientPoNo || ' '}</td>
                <td className="ods-num">{line.poDate || ' '}</td>
                <td className="ods-num">{line.customerDesiredDate || ' '}</td>
                <td className="ods-num">{line.customerReference || ' '}</td>
                {showDimensions ? (
                  <>
                    <td className="ods-num">{line.length || ' '}</td>
                    <td className="ods-num">{line.width || ' '}</td>
                  </>
                ) : null}
                <td className="ods-num">{line.uom || ' '}</td>
                <td className="ods-num">{line.qty ? formatFullPrecision(line.qty) : ' '}</td>
                {showDimensions ? null : <td className="ods-num">{line.totalSqm || ' '}</td>}
              </tr>
            ))}
            {/* Fills whatever vertical space is left on the page so the
             * IGST/Total Value rows below (and the Terms section after
             * this whole box) always sit flush at the bottom — only works
             * reliably when everything fits on one printed page (see
             * discussion: multi-page overflow would need a per-page
             * chunking system to guarantee the same bottom alignment on
             * the last page). */}
            <tr style={{ height: '100%' }}>
              <td colSpan={productColCount} style={{ height: '100%', border: 'none', padding: 0 }} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Terms + Remarks + Signature ───────────────────────────── */}
      <div className="ods-section-outline">
        <table className="ods-table" role="presentation">
          <tbody>
            <tr>
              <td className="ods-terms-label">DESTINATION</td>
              <td className="ods-terms-value">{data.destination || ' '}</td>
            </tr>
            <tr>
              <td className="ods-terms-label">PACKING TYPE</td>
              <td className="ods-terms-value">{data.packingType || ' '}</td>
            </tr>
            <tr>
              <td className="ods-terms-label">DOCUMENTS REQUIRED</td>
              <td className="ods-terms-value">{data.documentsRequired || ' '}</td>
            </tr>
            <tr>
              <td className="ods-terms-label">INSURANCE</td>
              <td className="ods-terms-value">{data.insurance || ' '}</td>
            </tr>
            <tr>
              <td className="ods-terms-label">INCOTERMS</td>
              <td className="ods-terms-value">{data.incoterms || ' '}</td>
            </tr>
            <tr>
              <td className="ods-terms-label">DISPATCH MODE</td>
              <td className="ods-terms-value">{data.dispatchMode ? capitalizeFirst(data.dispatchMode) : ' '}</td>
            </tr>
            <tr>
              <td className="ods-terms-label">ROAD PERMIT</td>
              <td className="ods-terms-value">{data.roadPermit || ' '}</td>
            </tr>
            <tr>
              <td className="ods-terms-label">FREIGHT : TO PAY / PAID</td>
              <td className="ods-terms-value">{data.freight || ' '}</td>
            </tr>
            <tr>
              <td className="ods-terms-label">QCT No. / Date</td>
              <td className="ods-terms-value">{qctSummary || ' '}</td>
            </tr>
          </tbody>
        </table>

        <table className="ods-table" role="presentation">
          <tbody>
            <tr>
              <td className="ods-label ods-remarks-label" style={{ borderBottom: 'none' }}>
                REMARKS :
              </td>
            </tr>
            <tr>
              <td className="ods-remarks-body" style={{ borderTop: 'none' }}>
                {data.remarks || ' '}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="ods-table ods-signatures" role="presentation">
          <tbody>
            <tr>
              <td>
                <div className="ods-sign-line">&nbsp;</div>
                <div className="ods-sign-name">{data.signerName}</div>
              </td>
              <td>
                <div className="ods-sign-line">&nbsp;</div>
                <div className="ods-sign-name">&nbsp;</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Delivery Schedule — forced onto its own new printed page. One
       * group per line item (heading = that line's Product Code, not
       * deduped), each listing its delivery batches. Hidden entirely when
       * there's nothing to show. */}
      {data.deliverySchedule.length > 0 ? (
        <div className="ods-delivery-schedule-page">
          <div className="ods-section-outline">
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              Order No. : {data.odsNo}&nbsp;&nbsp;&nbsp;Order Date : {data.createdDateAndTime}&nbsp;&nbsp;&nbsp;Delivery Schedule:
            </div>
            {data.deliverySchedule.map((group) => (
              <div key={group.ref} style={{ marginBottom: '10px', paddingLeft: '10px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {group.ref}. {group.productCode || ' '}
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
        </div>
      ) : null}
    </div>
  )
}
