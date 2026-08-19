'use client'

/**
 * argo-multi-ao — ISOLATED sibling of MultiOrderAcceptanceOfOrderContent.tsx.
 *
 * Same letter layout as the original argo-multi-ao (header, recipient,
 * subject, greeting, closing paragraphs, signature lines, footer) — all of
 * that stays static, from `argoMultiAoFixture`, exactly as before.
 *
 * ONLY the order table is replaced: instead of the fixture's static
 * PO/SAP/Quality/Dispatch/Qty/Rate/Total rows, it renders live line items
 * built by `mapSlsOdsNo44` (lib/sls-ods-no-44-mapping.ts) — same columns as
 * sls-ods-no-44's product table, minus Product Code and Application. The
 * "Quality Harmonisation Number" + "Date" block that used to sit between
 * the closing paragraphs and the sign-off lines is removed.
 *
 * Does NOT import from or modify `MultiOrderAcceptanceOfOrderContent.tsx` /
 * `types.ts`, so argo-multi-ao-hydrotech is unaffected.
 */

import type { MultiOrderAcceptanceOfOrderData } from './types'
import type { SlsOdsNo44Line } from '@/lib/sls-ods-no-44-mapping'

export default function ArgoMultiAoContent({
  fixture,
  lines,
  shippingAddressLines,
  subject,
  date,
}: {
  fixture: MultiOrderAcceptanceOfOrderData
  lines: SlsOdsNo44Line[]
  /** Recipient block ("TO," / company / address) — live Shipping Address only, same as sls-ods-no-44's shippingAddressLines[0]=name, rest=address. */
  shippingAddressLines: string[]
  /** Subject line — live `Acceptance_of_Order_Mention`, not the fixture's static subject. */
  subject: string
  /** Header "Date:" — live `Created_Date_and_time` (same field/value as sls-ods-no-44's ODS DATE), not the fixture's static date. */
  date: string
}) {
  return (
    <div className={`sales-order-print-sheet sales-order-doc--${fixture.variant} mao-sheet`}>
      <div className="mao-content">
        {/* ── Brand header ─────────────────────────────────────── */}
        <div className="mao-header">
          <img
            src={fixture.logo.src}
            alt={fixture.logo.alt}
            className="mao-header-logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.nextElementSibling
              if (fallback instanceof HTMLElement) fallback.style.display = 'block'
            }}
          />
          <div className="mao-header-fallback" style={{ display: 'none', whiteSpace: 'pre-line' }}>
            {fixture.logo.fallbackText}
          </div>
          <div className="mao-header-text">
            <div className="mao-header-brand" style={{ whiteSpace: 'pre-line' }}>
              {fixture.logo.brandName}
            </div>
            <div className="mao-header-tagline">{fixture.logo.tagline}</div>
          </div>
        </div>

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

        {/* ── Order table — LIVE data, sls-ods-no-44 columns minus
            Product Code / Application ─────────────────────────── */}
        <table className="mao-table">
          <colgroup>
            <col style={{ width: '12%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '7%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Billing Description</th>
              <th>HSN Code</th>
              <th>SAP No.</th>
              <th>PPC Date</th>
              <th>Length (Meter)</th>
              <th>Width (Meter)</th>
              <th>Total SQM</th>
              <th>Qty / UOM</th>
              <th>Price / UOM</th>
              <th>Total Value in INR</th>
              <th>Client PO No.</th>
              <th>PO Date</th>
              <th>QCT No.</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td className="mao-cell-left">{line.billingDescription || ' '}</td>
                <td className="mao-cell-center">{line.hsnCode || ' '}</td>
                <td className="mao-cell-center">{line.sapNo || ' '}</td>
                <td className="mao-cell-center">{line.ppcDate || ' '}</td>
                <td className="mao-cell-center">{line.length || ' '}</td>
                <td className="mao-cell-center">{line.width || ' '}</td>
                <td className="mao-cell-center">{line.totalSqm || ' '}</td>
                <td className="mao-cell-center">{line.qty ? `${line.qty}${line.uom ? ` ${line.uom}` : ''}` : ' '}</td>
                <td className="mao-cell-center">{line.price || ' '}</td>
                <td className="mao-cell-center" style={{ whiteSpace: 'nowrap' }}>{line.totalValue || ' '}</td>
                <td className="mao-cell-center">{line.clientPoNo || ' '}</td>
                <td className="mao-cell-center">{line.poDate || ' '}</td>
                <td className="mao-cell-center">{line.qctNo || ' '}</td>
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

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="mao-footer">
        <div className="mao-footer-col mao-footer-left">
          <div className="mao-footer-company-name">{fixture.footerLeft.companyName}</div>
          <div className="mao-footer-former">{fixture.footerLeft.formerName}</div>
          <div className="mao-footer-spacer">&nbsp;</div>
          <div className="mao-footer-plain">{fixture.footerLeft.address}</div>
          <div className="mao-footer-plain">{fixture.footerLeft.contactLine}</div>
          <div className="mao-footer-legal">
            <span>
              <em>CIN:</em> {fixture.footerLeft.cin}
            </span>
            {'   '}
            <span>
              <em>GST:</em> {fixture.footerLeft.gst}
            </span>
          </div>
        </div>
        <div className="mao-footer-col mao-footer-right">
          <div className="mao-footer-group">{fixture.footerRight.groupLine}</div>
          <div className="mao-footer-spacer">&nbsp;</div>
          <div className="mao-footer-reg-label">{fixture.footerRight.registeredOfficeLabel}</div>
          {fixture.footerRight.registeredOfficeLines.map((line, i) => (
            <div key={i} className="mao-footer-plain">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
