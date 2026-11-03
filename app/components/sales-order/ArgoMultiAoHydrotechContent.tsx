'use client'

/**
 * argo-multi-ao-hydrotech — ISOLATED sibling of ArgoMultiAoContent.tsx.
 *
 * Exact copy of ArgoMultiAoContent.tsx (same live data pipeline, same
 * trimmed order-table columns, same repeating-header/fixed-bottom-footer
 * print technique, same margin/width matching SLS) — per explicit request
 * that this variant get the same column mapping and changes as
 * argo-multi-ao. TWO deliberate differences, confirmed with the user:
 *   - Header uses the BVK top-left/top-right images (same as
 *     MultiOrderAcceptanceOfOrderContent.tsx's current header), NOT the
 *     single `/wi.png` SLS image.
 *   - Footer stays the original text-based footerLeft/footerRight (from
 *     `argoMultiAoHydrotechFixture`), NOT the SLS two-image footer — just
 *     made fixed/repeating via the same `.mao-page-footer` print
 *     technique.
 *
 * Does NOT import from or modify `ArgoMultiAoContent.tsx` /
 * `MultiOrderAcceptanceOfOrderContent.tsx` / `types.ts`, so argo-multi-ao
 * and every other Order Detail Sheet variant are unaffected.
 */

import type { MultiOrderAcceptanceOfOrderData } from './types'
import type { SlsOdsNo44Line } from '@/lib/sls-ods-no-44-mapping'

/** Price / Total Value — up to 2 decimals, no trailing zeros (e.g. "482.5", not "482.50"). */
function formatUpToTwoDecimals(v: string): string {
  const n = parseFloat(v.replace(/,/g, '').trim())
  if (!Number.isFinite(n)) return v
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export default function ArgoMultiAoHydrotechContent({
  fixture,
  lines,
  shippingAddressLines,
  subject,
  date,
  currency,
}: {
  fixture: MultiOrderAcceptanceOfOrderData
  lines: SlsOdsNo44Line[]
  /** Recipient block ("TO," / company / address) — live Shipping Address only, same as argo-multi-ao's shippingAddressLines[0]=name, rest=address. */
  shippingAddressLines: string[]
  /** Subject line — live `Acceptance_of_Order_Mention`, not the fixture's static subject. */
  subject: string
  /** Header "Date:" — live `Created_Date_and_time`, not the fixture's static date. */
  date: string
  /** Root `Currency` (e.g. "INR") — replaces the old hardcoded "INR" in the Total Value column header. */
  currency: string
}) {
  // SAP No. column — only shown when at least one line has a value.
  const showSapNo = lines.some((line) => line.sapNo)
  // Client Reference column — only shown when at least one line has a
  // value. Reuses `line.customerReference` (Category_2_MM_Database_WI_3_0
  // Customer_Reference, same fallback chain already used for this field).
  const showClientReference = lines.some((line) => line.customerReference)
  // "Price / UOM" header — the literal "UOM" is replaced by the actual
  // Billing UOM value (first line that has one), same field as the
  // Billing UOM column.
  const priceUomLabel = lines.find((line) => line.uom)?.uom ?? ''

  return (
    <div className={`sales-order-print-sheet sales-order-doc--${fixture.variant} mao-sheet`}>
      {/* ── Whole page wrapped in a <table> so the browser repeats the
          header on every printed page (same trick argo-multi-ao /
          SLSQuotationContent.tsx use) — thead = header, tfoot = empty 32mm
          spacer reserving room for the fixed-position footer below.
          ISOLATED via the `.sales-order-doc--argo-multi-ao-hydrotech` CSS
          selector. */}
      <table className="mao-print-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead className="mao-print-header-row">
          <tr>
            <td style={{ border: 'none', padding: 0 }}>
              {/* ── Brand header — same "BVK top left/right" letterhead
                  images as MultiOrderAcceptanceOfOrderContent.tsx. */}
              <div
                className="mao-header"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <img
                  src="/bvk top left.png"
                  alt="BVK header (left)"
                  style={{ height: '80px', width: 'auto', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <img
                  src="/bvk top right.png"
                  alt="BVK header (right)"
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
              <div className="mao-content">
        {/* ── Title ────────────────────────────────────────────── */}
        <div className="mao-title">
          <span>{fixture.title}</span>
        </div>

        {/* ── Date row (right-aligned) — live `Created_Date_and_time` ── */}
        <div className="mao-date-row">Date: {date}</div>

        {/* ── Recipient — live Shipping Address only (Shipping_Address_Name +
            Shipping_Street/City/State/Postal/Country), same source as
            argo-multi-ao's shippingAddressLines. Not the fixture anymore. */}
        <div className="mao-recipient">
          <div>{fixture.recipient.toLabel}</div>
          <div>
            {fixture.recipient.companyLabel}{' '}
            <strong>{shippingAddressLines[0] ?? ''}</strong>
          </div>
          {shippingAddressLines.slice(1).map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>

        {/* ── Subject (bold + underlined) — fixed label, unchanged ── */}
        <div className="mao-subject">
          <span> {fixture.subject}</span>
        </div>

        {/* Dynamic value below the subject label — live `Acceptance_of_Order_Mention`.
            Replaces the fixture's static greeting/bodyOpening entirely (that text
            duplicated what this dynamic field already says). */}
        {subject ? <div className="mao-body-para">{subject}</div> : null}

        {/* ── Order table — LIVE data. Only PO No. / Product Description /
            Qty / Price / Total Value columns kept; everything else removed. ── */}
        <table className="mao-table">
          {(() => {
            const extraCount = (showSapNo ? 1 : 0) + (showClientReference ? 1 : 0)
            if (extraCount === 2) {
              return (
                <colgroup>
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '31%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '13%' }} />
                </colgroup>
              )
            }
            if (extraCount === 1) {
              return (
                <colgroup>
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '35%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '15%' }} />
                </colgroup>
              )
            }
            return (
              <colgroup>
                <col style={{ width: '13%' }} />
                <col style={{ width: '39%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
            )
          })()}
          <thead>
            <tr>
              <th>PO No.</th>
              <th>Product Description</th>
              {showSapNo ? <th>SAP No.</th> : null}
              {showClientReference ? <th>Client Reference</th> : null}
              <th>Qty</th>
              <th>
                Billing
                <br />
                UOM
              </th>
              <th>Price{priceUomLabel ? ` / ${priceUomLabel}` : ''}</th>
              <th>Total Value {currency ? `in ${currency}` : ''}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td className="mao-cell-center">{line.clientPoNo || ' '}</td>
                <td className="mao-cell-left">
                  {line.brandSellingName || ' '}
                  {line.lineRemarks ? <div>{line.lineRemarks}</div> : null}
                </td>
                {showSapNo ? <td className="mao-cell-center">{line.sapNo || ' '}</td> : null}
                {showClientReference ? <td className="mao-cell-center">{line.customerReference || ' '}</td> : null}
                <td className="mao-cell-center">{line.qty || ' '}</td>
                <td className="mao-cell-center">{line.uom || ' '}</td>
                <td className="mao-cell-center">{line.price ? formatUpToTwoDecimals(line.price) : ' '}</td>
                <td className="mao-cell-center" style={{ whiteSpace: 'nowrap' }}>
                  {line.totalValue ? formatUpToTwoDecimals(line.totalValue) : ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Closing paragraphs ─────────────────────────────── */}
        {fixture.bodyClosingParas.map((para, i) => (
          <div key={i} className="mao-body-para">
            {para}
          </div>
        ))}

        {/* Quality Harmonisation Number + Date block REMOVED per spec. */}

        {/* ── Bold sign-off lines ────────────────────────────── */}
        {fixture.signatureLines.map((line, i) => (
          <div key={i} className="mao-signature-line">
            {line}
          </div>
        ))}
              </div>
            </td>
          </tr>
        </tbody>
        {/* Empty tfoot spacer — reserves 32mm at the bottom of every printed
            page so body content never flows under the fixed footer below. */}
        <tfoot className="mao-print-footer-row">
          <tr>
            <td style={{ border: 'none', padding: 0, height: '32mm' }} aria-hidden />
          </tr>
        </tfoot>
      </table>

      {/* ── Actual footer — lives OUTSIDE the table. In print media it gets
          `position: fixed; bottom: 0` (see sales-order-doc.css) so it pins
          to the paper bottom on EVERY generated page, including the last.
          Exact same content + margin/width treatment as
          BVKQuotationContent.tsx's footer (Company Information block +
          bottom green line/tagline) — replacing the old WMW-style
          footerLeft/footerRight fixture fields, which are no longer read
          here. */}
      <div className="mao-page-footer" style={{ paddingTop: '15px', fontSize: '10px' }}>
        {/* Company Information */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>BVK Hydrotech India Pvt. Ltd.</div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: '#00a651' }}>Reg. Office:</span> Imax Imperial, Room No. 1C, 1st Floor,
            101/5, S.N. Banerjee Road, Taltala, Kolkata - 700014, West Bengal, India
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: '#00a651' }}>CIN:</span> U46103WB2024PTC269415 |{' '}
            <span style={{ color: '#00a651' }}>GSTIN:</span> 08AAMCB4592K1Z3
          </div>
          <div>
            <span style={{ color: '#00a651' }}>Correspondence Address:</span> 52-B (Part), Industrial Area,
            Jhotwara, Jaipur - 302012, Rajasthan, India
          </div>
        </div>

        {/* Bottom green line and tagline */}
        <div
          style={{
            borderTop: '2px solid #00a651',
            marginTop: '10px',
            paddingTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '60%' }}></div>
          <div style={{ color: '#00a651', fontSize: '10px', textAlign: 'right' }}>
            Woven Solutions for Electrolyzers and Fuel Cells
          </div>
        </div>
      </div>
    </div>
  )
}
