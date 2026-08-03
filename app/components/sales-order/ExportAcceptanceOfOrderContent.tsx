'use client'

import type { ExportAcceptanceOfOrderData } from './types'

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
      <div className="xao-value">{value || ' '}</div>
    </div>
  )
}

export default function ExportAcceptanceOfOrderContent({
  data,
}: {
  data: ExportAcceptanceOfOrderData
}) {
  const buyerLines = data.buyerOther?.addressLines ?? []

  return (
    <div className={`sales-order-print-sheet sales-order-doc--${data.variant} xao-sheet`}>
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
              <div className="xao-exp-brand-row">
                <img
                  src={data.exporter.logoSrc}
                  alt={data.exporter.logoAlt}
                  className="xao-exp-logo"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling
                    if (fallback instanceof HTMLElement) fallback.style.display = 'block'
                  }}
                />
                <div
                  className="xao-exp-logo-fallback"
                  style={{ display: 'none', whiteSpace: 'pre-line' }}
                >
                  {data.exporter.logoFallbackText}
                </div>
                {(data.exporter.brandLine1 || data.exporter.brandLine2) && (
                  <div className="xao-exp-brand-text">
                    {data.exporter.brandLine1 ? (
                      <div className="xao-exp-brand-1">{data.exporter.brandLine1}</div>
                    ) : null}
                    {data.exporter.brandLine2 ? (
                      <div className="xao-exp-brand-2">{data.exporter.brandLine2}</div>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="xao-exp-name">{data.exporter.name}</div>
              <div className="xao-exp-address">{data.exporter.address}</div>
              <div className="xao-exp-tel">{data.exporter.tel}</div>
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

          {/* Row 6: Terms of Delivery + CFR */}
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

      {/* ── Product table ─────────────────────────────────────────── */}
      <table className="xao-product">
        <colgroup>
          <col style={{ width: '60%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '13%' }} />
        </colgroup>
        <thead>
          <tr>
            <th className="xao-desc-head">{data.descriptionHeader}</th>
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
          {data.lines.map((line, i) => (
            /* CSS handles hiding the horizontal borders between data rows across ALL
             * columns — see `.xao-product .xao-data-row > td { border-bottom-style:
             * hidden }` in sales-order-doc.css. Only the vertical column dividers
             * remain visible in the product data area. */
            <tr key={i} className="xao-data-row">
              <td className="xao-desc-cell">
                {line.fields.map((f, j) => (
                  <div key={j} className="xao-desc-row">
                    <span className="xao-desc-label">{f.label}</span>
                    <span className="xao-desc-value">{f.value}</span>
                  </div>
                ))}
              </td>
              <td className="xao-qty-cell" style={{ whiteSpace: 'pre-line' }}>
                {line.quantity}
              </td>
              <td className="xao-num-cell">{line.rate}</td>
              <td className="xao-num-cell">{line.amount}</td>
            </tr>
          ))}
          {/* Filler for empty middle space. Rendered as four separate cells (not
           * one colSpan={4}) so the internal vertical column dividers continue
           * running from the last data row all the way down to the total row. */}
          <tr className="xao-filler-row">
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
          {/* total */}
          <tr className="xao-total-row">
            <td className="xao-total-label">{data.totalLabel}</td>
            <td className="xao-total-currency" colSpan={2}>
              {data.totalCurrencyLabel}
            </td>
            <td className="xao-num-cell xao-total-amount">{data.totalAmount}</td>
          </tr>
        </tbody>
      </table>

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
    </div>
  )
}
