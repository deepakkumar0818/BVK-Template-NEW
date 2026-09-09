'use client'

import type { AcceptanceOrderData, AcceptanceOrderLine } from './acceptanceOrderTypes'

function LabeledCell({
  label,
  value,
  className,
}: {
  label: string
  value?: string
  className?: string
}) {
  return (
    <div className={['xao-labeled', className].filter(Boolean).join(' ')}>
      <div className="xao-label">{label}</div>
      <div className="xao-value">{value || ' '}</div>
    </div>
  )
}

export default function AcceptanceOrderContent({
  data,
}: {
  data: AcceptanceOrderData
}) {
  const buyerLines = data.buyerOther?.addressLines ?? []

  // Pagination — same "chunk items into pages, repeat header every
  // page, footer only on the last page" pattern Adhunik/Saint use,
  // with a stepped chunk-size rule instead of one fixed cap:
  //   - total <= 4  → single page, all items, header + footer
  //   - total 5-7   → page 1 gets (total - 1) items (no footer),
  //                   page 2 gets exactly the 1 leftover item
  //                   (header + footer + total)
  //   - total > 7   → fixed chunks of 7; the last chunk (whatever
  //                   size 1-7) carries the footer + total
  const pages: AcceptanceOrderLine[][] =
    data.lines.length === 0
      ? [[]]
      : data.lines.length <= 4
        ? [data.lines]
        : data.lines.length <= 7
          ? [data.lines.slice(0, data.lines.length - 1), data.lines.slice(data.lines.length - 1)]
          : (() => {
              const chunks: AcceptanceOrderLine[][] = []
              for (let i = 0; i < data.lines.length; i += 7) {
                chunks.push(data.lines.slice(i, i + 7))
              }
              return chunks
            })()

  const headerTable = (
    <table className="xao-outer">
      <colgroup>
        <col style={{ width: '25%' }} />
        <col style={{ width: '25%' }} />
        <col style={{ width: '25%' }} />
        <col style={{ width: '25%' }} />
      </colgroup>
      <tbody>
        {/* Title */}
        <tr>
          <td colSpan={4} className="xao-title-cell">
            {data.title}
          </td>
        </tr>

        {/* Row 1: Exporter | AO Ref | AO Date */}
        <tr>
          <td rowSpan={3} colSpan={2} className="xao-exporter-cell">
            <div className="xao-corner-label">Exporter</div>
            {/* Side-by-side layout: logo LEFT, company text RIGHT —
             * same block used by Adhunik / Saint / WMW P1 / WMW P2
             * (see AdhunikInvoiceContent.tsx). Nested table so the
             * two cells align at the top and the row height is
             * driven by the taller of the two. */}
            <table className="xao-exp-layout" role="presentation">
              <tbody>
                <tr>
                  <td className="xao-exp-logo-cell">
                    <img
                      src={data.exporter.logoSrc}
                      alt={data.exporter.logoAlt}
                      className="xao-exp-logo"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </td>
                  <td className="xao-exp-text-cell">
                    <div className="xao-exp-company-name">WMW METAL FABRICS LIMITED</div>
                    <div className="xao-exp-line">53, Industrial Area: Jhotwara, Jaipur 302012 India</div>
                    <div className="xao-exp-line">Tel : +911417105151</div>
                    <div className="xao-exp-contact-row">
                      <span>info@wmwindia.com</span>
                      <span>www.wmwindia.com</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
          <td>
            <LabeledCell label={data.aoRef.label} value={data.aoRef.value} />
          </td>
          <td>
            <LabeledCell label={data.aoRef.dateLabel} value={data.aoRef.dateValue} />
          </td>
        </tr>

        {/* Row 2: Buyer's Order + Date */}
        <tr>
          <td>
            <LabeledCell label={data.buyerOrderRef.label} value={data.buyerOrderRef.value} />
          </td>
          <td>
            <LabeledCell label={data.buyerOrderRef.dateLabel} value={data.buyerOrderRef.dateValue} />
          </td>
        </tr>

        {/* Row 3: Other Reference(s) */}
        <tr>
          <td colSpan={2}>
            <LabeledCell label="Other Reference(s) :" value={data.otherReferences} />
          </td>
        </tr>

        {/* Row 4: Consignee | Buyer (if other than Consignee) */}
        <tr>
          <td rowSpan={3} colSpan={2} className="xao-consignee-cell">
            <div className="xao-corner-label">Consignee :</div>
            {data.consignee.addressLines.map((line, i) => (
              <div
                key={i}
                className={i === 0 ? 'xao-party-name' : 'xao-party-line'}
              >
                {line}
              </div>
            ))}
          </td>
          <td colSpan={2} className="xao-buyer-other-cell">
            <div className="xao-corner-label">Buyer (if other than Consigne) :</div>
            {buyerLines.length > 0 ? (
              buyerLines.map((line, i) => (
                <div key={i} className={i === 0 ? 'xao-party-name' : 'xao-party-line'}>
                  {line}
                </div>
              ))
            ) : (
              <div className="xao-party-line">&nbsp;</div>
            )}
          </td>
        </tr>

        {/* Row 5: Country of Origin | Country of Destination */}
        <tr>
          <td>
            <LabeledCell label="Country of Origin of Goods :" value={data.countryOfOrigin} />
          </td>
          <td>
            <LabeledCell label="Country of Final Destination" value={data.countryOfDestination} />
          </td>
        </tr>

        {/* Row 6: Terms of Delivery + value */}
        <tr>
          <td colSpan={2} className="xao-terms-delivery-cell">
            <span className="xao-label">Terms of Delivery</span>
            <span className="xao-terms-delivery-value">{data.termsOfDelivery}</span>
          </td>
        </tr>

        {/* Row 7: Carriage By | Port of Loading | Payment (rowspan 2) */}
        <tr>
          <td>
            <LabeledCell label="Carriage By:-" value={data.carriageBy} />
          </td>
          <td>
            <LabeledCell label="Port of Loading" value={data.portOfLoading} />
          </td>
          <td rowSpan={2} colSpan={2} className="xao-payment-cell">
            <LabeledCell label="Payment :" value={data.payment} />
            {data.bankerLines.map((line, i) => (
              <div key={i} className="xao-banker-line">
                {line}
              </div>
            ))}
            <div className="xao-dispatch-label">{data.dispatchExWorks}</div>
          </td>
        </tr>

        {/* Row 8: Port of Discharge | Final Destination */}
        <tr>
          <td>
            <LabeledCell label="Port of Discharge:" value={data.portOfDischarge} />
          </td>
          <td>
            <LabeledCell label="Final Destination :" value={data.finalDestination} />
          </td>
        </tr>
      </tbody>
    </table>
  )

  const footerBlock = (
    <>
      {/* ── Amount in words ─────────────────────────────────────── */}
      <div className="xao-amount-in-words">{data.amountInWords}</div>

      {/* ── Bottom terms + signature ──────────────────────────── */}
      <table className="xao-bottom">
        <colgroup>
          <col style={{ width: '60%' }} />
          <col style={{ width: '40%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="xao-other-terms-cell">
              {data.termsHeaderLines.map((line, i) => (
                <div key={i} className="xao-terms-header">
                  {line}
                </div>
              ))}
              {data.otherTermsNotes.map((line, i) => (
                <div key={i} className="xao-terms-note">
                  {line}
                </div>
              ))}
              {data.forceMajeureLines.map((line, i) => (
                <div key={i} className="xao-force-majeure">
                  {line}
                </div>
              ))}
            </td>
            <td className="xao-signature-cell">
              {/* Quality Harmonisation Number + Date — stacked, above the signature block */}
              <div className="xao-qh-line">
                <span className="xao-qh-label">Quality Harmonisation Number :</span>{' '}
                <span>{data.qualityHarmonisationNumber || ' '}</span>
              </div>
              <div className="xao-qh-line">
                <span className="xao-qh-label">Date :</span>{' '}
                <span>{data.qualityHarmonisationDate || ' '}</span>
              </div>
              <div className="xao-signature-company">{data.signatureCompany}</div>
              <div className="xao-signature-spacer">&nbsp;</div>
              <div className="xao-signature-date">{data.signatureDate}</div>
              <div className="xao-signature-note">{data.electronicNote}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="xao-doc-no">{data.docNo}</div>
    </>
  )

  return (
    <>
      {pages.map((pageLines, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1
        return (
          <div
            key={pageIdx}
            className={`sales-order-print-sheet sales-order-doc--${data.variant} xao-sheet xao-page-fill`}
            style={{
              // Dynamic-fill chain (same mechanism used to fix this
              // exact overflow bug in Saint/Adhunik): the page div is
              // stretched to the full printable-area height, laid out
              // as a flex column. The header and footer keep their
              // natural heights; the product table (flex: 1 below)
              // gets whatever is left, and its own filler <tr> (also
              // height: 100% below) absorbs that within the table.
              // Because the browser computes the REAL remaining space
              // from actual rendered heights, this can never overflow
              // a physical page — unlike the previous fixed `60mm`
              // filler, which silently overflowed the page even with
              // just 1 item on it.
              minHeight: 'calc(100vh - 12mm)',
              display: 'flex',
              flexDirection: 'column',
              ...(!isLastPage ? { pageBreakAfter: 'always', breakAfter: 'page' } : {}),
            }}
          >
            {headerTable}

            {/* ── Product table (5 cols — Description / HSN Code /
             * Quantity / Rate / Amount). Same as export-ao-ekamas's
             * product table but with an HSN Code column inserted
             * after Description, matching the column set every
             * other live-Zoho template (Adhunik/Saint/WMW P1/P2)
             * carries. ───────────────────────────────────────── */}
            <table className="xao-product" style={{ flex: 1, height: '100%' }}>
              <colgroup>
                <col style={{ width: '48%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="xao-desc-head">{data.descriptionHeader}</th>
                  <th className="xao-hsn-head">{data.hsnHeader}</th>
                  <th className="xao-qty-head">{data.quantityHeader}</th>
                  <th className="xao-rate-head" style={{ whiteSpace: 'pre-line' }}>
                    {data.rateHeader}
                  </th>
                  <th className="xao-amount-head" style={{ whiteSpace: 'pre-line' }}>
                    {data.amountHeader}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageLines.map((line, i) => (
                  /* CSS hides horizontal borders between data rows across ALL columns —
                   * see `.xao-product .xao-data-row > td { border-bottom-style: hidden }`
                   * in sales-order-doc.css. Only vertical column dividers remain. */
                  <tr key={i} className="xao-data-row">
                    <td className="xao-desc-cell">
                      {line.fields.map((f, j) => (
                        <div key={j} className="xao-desc-row">
                          <span className="xao-desc-label">{f.label}</span>
                          <span className="xao-desc-value">{f.value}</span>
                        </div>
                      ))}
                    </td>
                    <td className="xao-hsn-cell">{line.hsnCode}</td>
                    <td className="xao-qty-cell" style={{ whiteSpace: 'pre-line' }}>
                      {line.quantity}
                    </td>
                    <td className="xao-num-cell">{line.rate}</td>
                    <td className="xao-num-cell">{line.amount}</td>
                  </tr>
                ))}
                {/* Filler for empty middle space. Rendered as five separate cells (not
                 * one colSpan={5}) so the internal vertical column dividers continue
                 * running from the last data row all the way down to the total row.
                 * `height: 100%` makes this row grow to consume exactly whatever
                 * space is left in the flex-stretched table above — see the
                 * `xao-page-fill` comment on the page wrapper for why this can't
                 * overflow the page. */}
                <tr className="xao-filler-row" style={{ height: '100%' }}>
                  <td style={{ height: '100%' }}>&nbsp;</td>
                  <td style={{ height: '100%' }}>&nbsp;</td>
                  <td style={{ height: '100%' }}>&nbsp;</td>
                  <td style={{ height: '100%' }}>&nbsp;</td>
                  <td style={{ height: '100%' }}>&nbsp;</td>
                </tr>
                {/* total — only on the last page */}
                {isLastPage ? (
                  <tr className="xao-total-row">
                    <td className="xao-total-label" colSpan={2}>{data.totalLabel}</td>
                    <td className="xao-total-currency" colSpan={2}>
                      {data.totalCurrencyLabel}
                    </td>
                    <td className="xao-num-cell xao-total-amount">{data.totalAmount}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>

            {isLastPage ? footerBlock : null}
          </div>
        )
      })}
    </>
  )
}
