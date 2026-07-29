'use client'

import type { MultiOrderAcceptanceOfOrderData } from './types'

export default function MultiOrderAcceptanceOfOrderContent({
  data,
}: {
  data: MultiOrderAcceptanceOfOrderData
}) {
  return (
    <div className={`sales-order-print-sheet sales-order-doc--${data.variant} mao-sheet`}>
      <div className="mao-content">
        {/* ── Brand header ─────────────────────────────────────── */}
        <div className="mao-header">
          <img
            src={data.logo.src}
            alt={data.logo.alt}
            className="mao-header-logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.nextElementSibling
              if (fallback instanceof HTMLElement) fallback.style.display = 'block'
            }}
          />
          <div className="mao-header-fallback" style={{ display: 'none', whiteSpace: 'pre-line' }}>
            {data.logo.fallbackText}
          </div>
          <div className="mao-header-text">
            <div className="mao-header-brand" style={{ whiteSpace: 'pre-line' }}>
              {data.logo.brandName}
            </div>
            <div className="mao-header-tagline">{data.logo.tagline}</div>
          </div>
        </div>

        {/* ── Title ────────────────────────────────────────────── */}
        <div className="mao-title">
          <span>{data.title}</span>
        </div>

        {/* ── Date row (right-aligned) ─────────────────────────── */}
        <div className="mao-date-row">Date: {data.date}</div>

        {/* ── Recipient ───────────────────────────────────────── */}
        <div className="mao-recipient">
          <div>{data.recipient.toLabel}</div>
          <div>
            {data.recipient.companyLabel}{' '}
            <strong>{data.recipient.companyName}</strong>
          </div>
          {data.recipient.addressLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>

        {/* ── Subject (bold + underlined) ─────────────────────── */}
        <div className="mao-subject">
          <span> {data.subject}</span>
        </div>

        {/* ── Greeting + body opening ────────────────────────── */}
        <div className="mao-body-para">{data.greeting}</div>
        <div className="mao-body-para">{data.bodyOpening}</div>

        {/* ── Big order table ────────────────────────────────── */}
        <table className="mao-table">
          <colgroup>
            <col style={{ width: '13%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '17%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>{data.columnHeaders.poNo}</th>
              <th>{data.columnHeaders.sapNo}</th>
              <th>{data.columnHeaders.quality}</th>
              <th>{data.columnHeaders.tentativeDispatchDate}</th>
              <th>{data.columnHeaders.orderQty}</th>
              <th>{data.columnHeaders.rate}</th>
              <th>{data.columnHeaders.totalValue}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i}>
                <td className="mao-cell-center">{row.poNo}</td>
                <td className="mao-cell-center">{row.sapNo}</td>
                <td className="mao-cell-left">{row.quality}</td>
                <td className="mao-cell-center">{row.tentativeDispatchDate}</td>
                <td className="mao-cell-center">{row.orderQty}</td>
                <td className="mao-cell-center">{row.rate}</td>
                <td className="mao-cell-center">{row.totalValue}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Closing paragraphs ─────────────────────────────── */}
        {data.bodyClosingParas.map((para, i) => (
          <div key={i} className="mao-body-para">
            {para}
          </div>
        ))}

        {/* ── Bold sign-off lines ────────────────────────────── */}
        {data.signatureLines.map((line, i) => (
          <div key={i} className="mao-signature-line">
            {line}
          </div>
        ))}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="mao-footer">
        <div className="mao-footer-col mao-footer-left">
          <div className="mao-footer-company-name">{data.footerLeft.companyName}</div>
          <div className="mao-footer-former">{data.footerLeft.formerName}</div>
          <div className="mao-footer-spacer">&nbsp;</div>
          <div className="mao-footer-plain">{data.footerLeft.address}</div>
          <div className="mao-footer-plain">{data.footerLeft.contactLine}</div>
          <div className="mao-footer-legal">
            <span>
              <em>CIN:</em> {data.footerLeft.cin}
            </span>
            {'   '}
            <span>
              <em>GST:</em> {data.footerLeft.gst}
            </span>
          </div>
        </div>
        <div className="mao-footer-col mao-footer-right">
          <div className="mao-footer-group">{data.footerRight.groupLine}</div>
          <div className="mao-footer-spacer">&nbsp;</div>
          <div className="mao-footer-reg-label">{data.footerRight.registeredOfficeLabel}</div>
          {data.footerRight.registeredOfficeLines.map((line, i) => (
            <div key={i} className="mao-footer-plain">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
