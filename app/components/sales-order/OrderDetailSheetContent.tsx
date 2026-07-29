'use client'

import type { CSSProperties, ReactNode } from 'react'
import type {
  OdsAddress,
  OdsTermRow,
  OdsVariant,
  SalesOrderData,
} from './types'

/** Default row order for every variant. Individual fixtures may override via `data.termsOrder`. */
const DEFAULT_TERM_ROWS: OdsTermRow[] = [
  { label: 'DESTINATION', key: 'destination' },
  { label: 'PACKING TYPE', key: 'packingType' },
  { label: 'DOCUMENTS REQUIRED', key: 'documentsRequired' },
  { label: 'PAYMENT TERMS', key: 'paymentTerms' },
  { label: 'PAYMENT MODE', key: 'paymentMode' },
  { label: 'PACKING CHAREGES', key: 'packingCharges' },
  { label: 'INSURANCE', key: 'insurance' },
  { label: 'HSN CODE', key: 'hsnCode' },
  { label: 'BILLING UNIT OF MEASUREMENT', key: 'billingUom' },
  { label: 'GST', key: 'gst' },
  { label: 'INCOTERMS', key: 'incoterms' },
  { label: 'DISPATCH MODE', key: 'despatchMode' },
  { label: 'ROAD PERMIT', key: 'roadPermit' },
  { label: 'DIRECT TRUCK / SMALL', key: 'directTruckSmall' },
  { label: 'FREIGHT : TO PAY / PAID', key: 'freight' },
  { label: 'Application Code', key: 'applicationCode' },
]

function addressLines(address: string): string[] {
  return address.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
}

/** Normalize either address shape to a flat list of lines to render top-to-bottom. */
function normalizeAddress(a: OdsAddress): string[] {
  if ('lines' in a) return a.lines
  return [...addressLines(a.address), `CELL NO. - ${a.cell}`, `CONTACT PERSON: ${a.contact}`]
}

function buildAddressRowPairs(invoice: OdsAddress, delivery: OdsAddress) {
  const invRows = normalizeAddress(invoice)
  const delRows = normalizeAddress(delivery)
  const count = Math.max(invRows.length, delRows.length)
  return Array.from({ length: count }, (_, i) => ({
    invoice: invRows[i] ?? ' ',
    delivery: delRows[i] ?? ' ',
  }))
}

function LogoCell({ logo, rowSpan }: { logo: SalesOrderData['logo']; rowSpan: number }) {
  return (
    <td rowSpan={rowSpan} className="ods-logo-wrap">
      <img
        src={logo.src}
        alt={logo.alt}
        className="ods-logo-img"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
          const fallback = e.currentTarget.nextElementSibling
          if (fallback instanceof HTMLElement) fallback.style.display = 'block'
        }}
      />
      <div className="ods-logo-fallback" style={{ display: 'none', whiteSpace: 'pre-line' }}>
        {logo.fallbackText}
      </div>
      {logo.tagline ? <div className="ods-logo-tagline">{logo.tagline}</div> : null}
      {logo.taglineSub ? (
        <div className="ods-logo-tagline-sub" style={{ whiteSpace: 'pre-line' }}>
          {logo.taglineSub}
        </div>
      ) : null}
    </td>
  )
}

function GstValueCell({ value, rate }: { value?: string; rate?: string }): ReactNode {
  if (!rate) return value || ' '
  return (
    <div className="ods-gst-split">
      <span>{value || ' '}</span>
      <span className="ods-gst-rate">{rate}</span>
    </div>
  )
}

/** Product-column configuration derived from the variant. */
function resolveVariantLayout(variant: OdsVariant) {
  const isSlsOds50 = variant === 'sls-ods-50-a' || variant === 'sls-ods-50-p'
  const isWmw44 = variant === 'sls-ods-no-44'
  return {
    isWmw44,
    isSlsOds50,
    /** true → merged single qty column; false → separate PCS/Kg + QNTY. PCs cells */
    mergedQtyColumn: isWmw44,
    /** true → 3 extra columns (Position / SAP NO. / Delivery Request) */
    hasSapPositionCols: isWmw44,
    productColSpan: isWmw44 ? 12 : 10,
  }
}

function resolveProductHeaders(data: SalesOrderData) {
  const isWmw44 = data.variant === 'sls-ods-no-44'
  const isSls50 = data.variant === 'sls-ods-50-a' || data.variant === 'sls-ods-50-p'
  const overrides = data.productHeaders ?? {}
  const defaults = {
    lengthLabel: isSls50 ? 'LENGTH' : 'LENGTH (Meter)',
    widthLabel: isSls50 ? 'WIDTH' : 'WIDTH (Meter) (+0/-1)',
    sizeLabel: isSls50 ? 'TOTAL SIZE' : 'TOTAL SQM',
    qtyLabelSplitFirst: 'PCS / Kg',
    qtyLabelSplitSecond: isSls50 ? 'QNTY. PCs / KG' : 'QNTY. PCs',
    qtyLabelMerged: 'QNTY. PCs / KG',
    priceLabel: isWmw44 ? 'PRICE / SQM' : isSls50 ? 'PRICE / UNIT (Rs.)' : 'PRICE / PCS',
  }
  return {
    ...defaults,
    sizeLabel: overrides.size ?? defaults.sizeLabel,
    qtyLabelMerged: overrides.qty ?? defaults.qtyLabelMerged,
    qtyLabelSplitSecond: overrides.qty ?? defaults.qtyLabelSplitSecond,
    priceLabel: overrides.price ?? defaults.priceLabel,
  }
}

/** Render the effective price for a line, honoring variant precedence. */
function resolveLinePrice(line: SalesOrderData['lines'][number], variant: OdsVariant): string {
  if (variant === 'sls-ods-no-44') return line.priceSqm ?? line.priceUnit ?? line.pricePcs ?? ''
  if (variant === 'sls-ods-50-a' || variant === 'sls-ods-50-p')
    return line.priceUnit ?? line.pricePcs ?? line.priceSqm ?? ''
  return line.pricePcs ?? line.priceUnit ?? line.priceSqm ?? ''
}

export default function OrderDetailSheetContent({ data }: { data: SalesOrderData }) {
  const { isWmw44, mergedQtyColumn, hasSapPositionCols, productColSpan } = resolveVariantLayout(data.variant)
  const productHeaders = resolveProductHeaders(data)
  const addressRows = buildAddressRowPairs(data.invoice, data.delivery)
  const hasExtraQctCell = Boolean(data.orderDetails.qctExtraCell)
  const qctCellStyle: CSSProperties = hasExtraQctCell ? { width: '12%' } : { width: '16%' }
  const docLabel = data.header.docLabel ?? 'DOC. NO. :'
  const showRev = Boolean(data.header.docRev && data.header.docRev.trim())

  const termRows = data.termsOrder ?? DEFAULT_TERM_ROWS

  const productHeadersRow = hasSapPositionCols ? (
    <tr>
      <th>{data.internalCodeHeader}</th>
      <th>APPLICATION</th>
      <th>EXCISE TARRIF CODE &amp; BILLING DESCRIPTION</th>
      <th>Position</th>
      <th>SAP NO.</th>
      <th>Delivery Request</th>
      <th>{productHeaders.lengthLabel}</th>
      <th>{productHeaders.widthLabel}</th>
      <th>{productHeaders.sizeLabel}</th>
      <th>{productHeaders.qtyLabelMerged}</th>
      <th>{productHeaders.priceLabel}</th>
      <th>TOTAL VALUE INR</th>
    </tr>
  ) : (
    <tr>
      <th>{data.internalCodeHeader}</th>
      <th>APPLICATION</th>
      <th>EXCISE TARRIF CODE &amp; BILLING DESCRIPTION</th>
      <th>{productHeaders.lengthLabel}</th>
      <th>{productHeaders.widthLabel}</th>
      <th>{productHeaders.sizeLabel}</th>
      <th>{productHeaders.qtyLabelSplitFirst}</th>
      <th>{productHeaders.qtyLabelSplitSecond}</th>
      <th>{productHeaders.priceLabel}</th>
      <th>TOTAL VALUE INR</th>
    </tr>
  )

  const productColgroup = isWmw44 ? (
    <colgroup>
      <col style={{ width: '8%' }} />
      <col style={{ width: '7%' }} />
      <col style={{ width: '15%' }} />
      <col style={{ width: '5%' }} />
      <col style={{ width: '8%' }} />
      <col style={{ width: '8%' }} />
      <col style={{ width: '6%' }} />
      <col style={{ width: '7%' }} />
      <col style={{ width: '6%' }} />
      <col style={{ width: '8%' }} />
      <col style={{ width: '11%' }} />
      <col style={{ width: '11%' }} />
    </colgroup>
  ) : (
    <colgroup>
      <col style={{ width: '7%' }} />
      <col style={{ width: '9%' }} />
      <col style={{ width: '26%' }} />
      <col style={{ width: '7%' }} />
      <col style={{ width: '8%' }} />
      <col style={{ width: '7%' }} />
      <col style={{ width: '6%' }} />
      <col style={{ width: '6%' }} />
      <col style={{ width: '9%' }} />
      <col style={{ width: '15%' }} />
    </colgroup>
  )

  return (
    <div className={`sales-order-print-sheet sales-order-doc--${data.variant}`}>
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
                <span className="ods-label">{docLabel}</span> {data.header.docNo}
                {showRev ? <span className="ods-doc-rev"> Rev : {data.header.docRev}</span> : null}
              </td>
              <LogoCell logo={data.logo} rowSpan={5} />
            </tr>
            <tr>
              <td className="ods-label">ODS NO.</td>
              <td>{data.header.odsNo}</td>
              <td className="ods-label">Page No.</td>
              <td>{data.header.pageNo}</td>
            </tr>
            <tr>
              <td className="ods-label" rowSpan={2}>
                ODS DATE
              </td>
              <td rowSpan={2}>{data.header.odsDate}</td>
              <td className="ods-label">Issue No.</td>
              <td>{data.header.issueNo}</td>
            </tr>
            <tr>
              <td className="ods-label">Issue Date</td>
              <td>{data.header.issueDate}</td>
            </tr>
            <tr>
              <td className="ods-label">CLIENT NAME</td>
              <td colSpan={3}>{data.header.clientName}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Addresses ──────────────────────────────────────────────── */}
      <div className="ods-section-outline">
        <table className="ods-table ods-address-table" role="presentation">
          <tbody>
            <tr>
              <td className="ods-section-label ods-address-col">INVOICE ADDRESS</td>
              <td className="ods-section-label ods-address-col">DELIVERY ADDRESS</td>
            </tr>
            {addressRows.map((row, idx) => (
              <tr key={idx}>
                <td className={['ods-address-line', idx === 0 ? 'ods-address-line--name' : ''].filter(Boolean).join(' ')}>
                  {row.invoice}
                </td>
                <td className={['ods-address-line', idx === 0 ? 'ods-address-line--name' : ''].filter(Boolean).join(' ')}>
                  {row.delivery}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Order details strip + optional delivery request block ── */}
      <div className="ods-section-outline">
        <table className="ods-table" role="presentation">
          <tbody>
            <tr>
              <td colSpan={hasExtraQctCell ? 7 : 6} className="ods-section-label ods-section-label--center">
                ORDER DETAILS
              </td>
            </tr>
            <tr>
              <td className="ods-label" style={{ width: '14%' }}>
                CLIENT PO NO.
              </td>
              <td style={{ width: '22%' }}>{data.orderDetails.clientPoNo}</td>
              <td className="ods-label" style={{ width: '10%' }}>
                P.O. DATE
              </td>
              <td style={{ width: '14%' }}>{data.orderDetails.poDate}</td>
              <td className="ods-label" style={{ width: '10%' }}>
                QCT NO.
              </td>
              <td style={qctCellStyle}>{data.orderDetails.qctNo}</td>
              {hasExtraQctCell ? <td style={{ width: '10%' }}>{data.orderDetails.qctExtraCell}</td> : null}
            </tr>
          </tbody>
        </table>

        {data.deliveryRequest ? (
          <table className="ods-table" role="presentation">
            <tbody>
              <tr>
                <td rowSpan={data.deliveryRequest.notes.length} className="ods-delivery-label-col">
                  DELIVERY REQUEST{' '}
                  <span className="ods-delivery-helper">(Please provide complete delivery schedule if any)</span>
                </td>
                <td className="ods-delivery-line">{data.deliveryRequest.notes[0] || ' '}</td>
              </tr>
              {data.deliveryRequest.notes.slice(1).map((note, idx) => (
                <tr key={idx}>
                  <td className="ods-delivery-line">{note || ' '}</td>
                </tr>
              ))}
              <tr>
                <td className="ods-delivery-label-col">DELIVERY COMMIT</td>
                <td className="ods-delivery-commit">{data.deliveryRequest.commit || ' '}</td>
              </tr>
            </tbody>
          </table>
        ) : null}
      </div>

      {/* ── Product details ────────────────────────────────────────── */}
      <div className="ods-section-outline">
        <table className="ods-table ods-product-table" role="presentation">
          {productColgroup}
          <thead>
            <tr>
              <th colSpan={productColSpan} className="ods-section-label ods-section-label--center">
                PRODUCT DETAILS
              </th>
            </tr>
            {productHeadersRow}
          </thead>
          <tbody>
            {data.lines.map((line, idx) => {
              const price = resolveLinePrice(line, data.variant)
              return (
                <tr key={idx}>
                  <td className="ods-desc">{line.internalCode || ' '}</td>
                  <td>{line.application || ' '}</td>
                  <td className="ods-desc">{line.description || ' '}</td>
                  {hasSapPositionCols ? (
                    <>
                      <td className="ods-num">{line.position || ' '}</td>
                      <td className="ods-num">{line.sapNo || ' '}</td>
                      <td className="ods-num">{line.deliveryRequest || ' '}</td>
                    </>
                  ) : null}
                  <td className="ods-num">{line.length || ' '}</td>
                  <td className="ods-num">{line.width || ' '}</td>
                  <td className="ods-num">{line.totalSqm || ' '}</td>
                  {mergedQtyColumn ? (
                    <td className="ods-num">{line.qtyPcsKg || ' '}</td>
                  ) : (
                    <>
                      <td className="ods-num">{line.pcsKg || ' '}</td>
                      <td className="ods-num">{line.qtyPcs ?? line.qtyPcsKg ?? ' '}</td>
                    </>
                  )}
                  <td className="ods-amount">{price || ' '}</td>
                  <td className="ods-amount">{line.totalValue || ' '}</td>
                </tr>
              )
            })}
            {data.hideProductFooter ? null : (
              <>
                <tr>
                  <td colSpan={productColSpan - 1} className="ods-product-foot-label">
                    {data.gstLabel}
                  </td>
                  <td className="ods-product-foot-value">{data.gstAmount}</td>
                </tr>
                <tr>
                  <td colSpan={productColSpan - 1} className="ods-product-foot-label">
                    Total Value
                  </td>
                  <td className="ods-product-foot-value">{data.totalValue}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Terms + Remarks + Signatures ───────────────────────────── */}
      <div className="ods-section-outline">
        <table className="ods-table" role="presentation">
          <tbody>
            {termRows.map((row) => {
              const value = data.terms[row.key]
              return (
                <tr key={row.key}>
                  <td className="ods-terms-label">{row.label}</td>
                  <td className="ods-terms-value">
                    {row.key === 'gst' ? (
                      <GstValueCell value={data.terms.gst} rate={data.terms.gstRate} />
                    ) : (
                      value || ' '
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <table className="ods-table" role="presentation">
          <tbody>
            <tr>
              <td className="ods-label ods-remarks-label">REMARKS :</td>
            </tr>
            <tr>
              <td className="ods-remarks-body">{data.remarks || ' '}</td>
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
    </div>
  )
}
