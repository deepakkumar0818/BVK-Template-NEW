'use client'

/**
 * argo-multi-ao — ISOLATED sibling of MultiOrderAcceptanceOfOrderContent.tsx.
 *
 * Same letter layout as the original argo-multi-ao (recipient, subject,
 * greeting, closing paragraphs, signature lines) — stays static, from
 * `argoMultiAoFixture`, exactly as before. Header and footer now use the
 * same letterhead IMAGES as SLSQuotationContent.tsx (`/wi.png` header;
 * `/wi bottom left side.png` + `/wi_bottom_rightside.png` footer) instead
 * of the fixture's old logo/footerLeft/footerRight text fields, which are
 * no longer read here.
 *
 * ONLY the order table is replaced: instead of the fixture's static
 * PO/SAP/Quality/Dispatch/Qty/Rate/Total rows, it renders live line items
 * built by `mapSlsOdsNo44` (lib/sls-ods-no-44-mapping.ts) — trimmed down to
 * PO No. (clientPoNo), SAP No. (sapNo — Category_1/2_MM_Database_WI_3_0[i].
 * SAP_No, with product-row fallback; column hidden entirely when no line
 * has a value), Client Reference (customerReference — same fallback chain
 * as sls-ods-no-44's Customer Reference column; column hidden entirely
 * when no line has a value), Product Description (Brand Selling Name
 * [Category_2_MM_Database_WI[0].Brand_Selling_Name] with per-line Remarks
 * [Category_2_MM_Database_WI_2_0[0].Remarks] stacked below it — Product
 * Code is NOT shown here, unlike sls-ods-no-44), Qty (value only, no UOM
 * suffix), Billing UOM (same `line.uom` —
 * Category_2_MM_Database_WI[0].UOM_Billing — as its own column), Price
 * (header reads the same `line.uom` value, e.g. "Price / Kgs", not a
 * hardcoded "Price / UOM"), Total Value (header reads live `Currency`,
 * e.g. "Total Value in INR", not a hardcoded "INR"). Every other
 * sls-ods-no-44 column (HSN Code, PO
 * Date, QCT No./Date, PPC Date, Length, Width, Total SQM, Billing
 * Description) is not shown here. The "Quality Harmonisation Number" +
 * "Date" block that used to sit
 * between the closing paragraphs and the sign-off lines is removed.
 *
 * Does NOT import from or modify `MultiOrderAcceptanceOfOrderContent.tsx` /
 * `types.ts`, so argo-multi-ao-hydrotech is unaffected.
 */

import type { MultiOrderAcceptanceOfOrderData } from './types'
import type { SlsOdsNo44Line } from '@/lib/sls-ods-no-44-mapping'

/** Price / Total Value — up to 2 decimals, no trailing zeros (e.g. "482.5", not "482.50"). */
function formatUpToTwoDecimals(v: string): string {
  const n = parseFloat(v.replace(/,/g, '').trim())
  if (!Number.isFinite(n)) return v
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export default function ArgoMultiAoContent({
  fixture,
  lines,
  shippingAddressLines,
  subject,
  date,
  currency,
}: {
  fixture: MultiOrderAcceptanceOfOrderData
  lines: SlsOdsNo44Line[]
  /** Recipient block ("TO," / company / address) — live Shipping Address only, same as sls-ods-no-44's shippingAddressLines[0]=name, rest=address. */
  shippingAddressLines: string[]
  /** Subject line — live `Acceptance_of_Order_Mention`, not the fixture's static subject. */
  subject: string
  /** Header "Date:" — live `Created_Date_and_time` (same field/value as sls-ods-no-44's ODS DATE), not the fixture's static date. */
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
          header on every printed page (same trick SLSQuotationContent.tsx
          uses) — thead = header, tfoot = empty 32mm spacer reserving room
          for the fixed-position footer below. ISOLATED to argo-multi-ao
          via the `.sales-order-doc--argo-multi-ao` CSS selector, so
          argo-multi-ao-hydrotech (still single-page) is unaffected. */}
      <table className="mao-print-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead className="mao-print-header-row">
          <tr>
            <td style={{ border: 'none', padding: 0 }}>
              {/* ── Brand header — same single combined-logo image as
                  SLSQuotationContent.tsx's header (`/wi.png` already has the
                  WMW mark + "WMW INDUSTRIES LTD" + tagline baked in as one
                  graphic, so no separate brand-text/tagline elements are
                  needed here). */}
              <div className="mao-header">
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
              <div className="mao-content">
        {/* ── Title ────────────────────────────────────────────── */}
        <div className="mao-title">
          <span>{fixture.title}</span>
        </div>

        {/* ── Date row (right-aligned) — live `Created_Date_and_time` ── */}
        <div className="mao-date-row">Date: {date}</div>

        {/* ── Recipient — live Shipping Address only (Shipping_Address_Name +
            Shipping_Street/City/State/Postal/Country), same source as
            sls-ods-no-44's shippingAddressLines. Not the fixture anymore. */}
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
            page so body content never flows under the fixed footer below
            (same height as that footer, same trick SLS uses). Not painted
            here — the visible footer is the separate fixed div after this
            table. */}
        <tfoot className="mao-print-footer-row">
          <tr>
            <td style={{ border: 'none', padding: 0, height: '32mm' }} aria-hidden />
          </tr>
        </tfoot>
      </table>

      {/* ── Actual footer — lives OUTSIDE the table. In print media it gets
          `position: fixed; bottom: 0` (see sales-order-doc.css) so the two
          images pin to the paper bottom on EVERY generated page, including
          the last. On screen it flows normally at the end of the container.
          Same two combined-text images as SLSQuotationContent.tsx's footer
          (left = company details, right = CIN/GST/BVK Group/Registered
          Office), replacing the old text-driven footerLeft/footerRight
          fixture fields. ──────────────────────────────────────────────── */}
      <div
        className="mao-footer mao-page-footer"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}
      >
        <img
          src="/wi bottom left side.png"
          alt="WMW Industries Ltd — company details"
          style={{ maxWidth: '60%', height: 'auto', display: 'block' }}
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
  )
}
