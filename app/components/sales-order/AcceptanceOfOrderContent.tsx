'use client'

import type { AcceptanceOfOrderData } from './types'

export default function AcceptanceOfOrderContent({ data }: { data: AcceptanceOfOrderData }) {
  return (
    <div className={`sales-order-print-sheet sales-order-doc--${data.variant} ao-sheet`}>
      <div className="ao-content">
        {/* ── Brand header ─────────────────────────────────────── */}
        <div className="ao-header">
          <img
            src={data.logo.src}
            alt={data.logo.alt}
            className="ao-header-logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.nextElementSibling
              if (fallback instanceof HTMLElement) fallback.style.display = 'block'
            }}
          />
          <div className="ao-header-fallback" style={{ display: 'none', whiteSpace: 'pre-line' }}>
            {data.logo.fallbackText}
          </div>
          <div className="ao-header-text">
            <div className="ao-header-brand" style={{ whiteSpace: 'pre-line' }}>
              {data.logo.brandName}
            </div>
            <div className="ao-header-tagline">{data.logo.tagline}</div>
          </div>
        </div>

        {/* ── Title ────────────────────────────────────────────── */}
        <div className="ao-title">{data.title}</div>

        {/* ── To / Date row ───────────────────────────────────── */}
        <div className="ao-to-row">
          <span>To,</span>
          <span>Date: {data.date}</span>
        </div>

        {/* ── Recipient block ─────────────────────────────────── */}
        <div className="ao-recipient">
          <div className="ao-recipient-name">
            <strong>{data.recipient.salutationPrefix}</strong>
            {' '}
            <strong>{data.recipient.name}</strong>
          </div>
          <div className="ao-recipient-company">
            <strong>{data.recipient.company}</strong>
          </div>
          {data.recipient.addressLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          <div>{data.recipient.phone}</div>
        </div>

        {/* ── Subject ─────────────────────────────────────────── */}
        <div className="ao-subject">
          <span>{data.subject}</span>
        </div>

        {/* ── Greeting + body opening ─────────────────────────── */}
        <div className="ao-body-para">{data.greeting}</div>
        <div className="ao-body-para">{data.bodyOpening}</div>

        {/* ── Product table ───────────────────────────────────── */}
        <table className="ao-table">
          <colgroup>
            <col style={{ width: '8%' }} />
            <col style={{ width: '52%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Item</th>
              <th>Product</th>
              <th>Pcs</th>
              <th>
                Unit Price/
                <br />
                INR
              </th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line, i) => (
              <tr key={i}>
                <td className="ao-item-cell">{line.item}</td>
                <td className="ao-product-cell">{line.product}</td>
                <td className="ao-num-cell">{line.pcs}</td>
                <td className="ao-num-cell">{line.unitPriceInr}</td>
                <td className="ao-num-cell">{line.totalValue}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Closing paragraphs ─────────────────────────────── */}
        {data.bodyClosingParas.map((para, i) => (
          <div key={i} className="ao-body-para">
            {para}
          </div>
        ))}

        <div className="ao-body-para">{data.yoursTruly}</div>

        <div className="ao-signature-company">{data.companySignature}</div>
        <div className="ao-signer-role">{data.signerRole}</div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="ao-footer">
        <div className="ao-footer-col ao-footer-left">
          <div className="ao-footer-company-name">{data.footerLeft.companyName}</div>
          <div className="ao-footer-former">{data.footerLeft.formerName}</div>
          <div className="ao-footer-plain">{data.footerLeft.address}</div>
          <div className="ao-footer-plain">{data.footerLeft.contactLine}</div>
          <div className="ao-footer-legal">
            <span>
              <em>CIN:</em> {data.footerLeft.cin}
            </span>
            {'   '}
            <span>
              <em>GST:</em> {data.footerLeft.gst}
            </span>
          </div>
        </div>
        <div className="ao-footer-col ao-footer-right">
          <div className="ao-footer-group">{data.footerRight.groupLine}</div>
          <div className="ao-footer-reg-label">{data.footerRight.registeredOfficeLabel}</div>
          {data.footerRight.registeredOfficeLines.map((line, i) => (
            <div key={i} className="ao-footer-plain">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
