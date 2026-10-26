'use client'

/**
 * sls-ods-44-hydrotech — ISOLATED sales-order content component.
 *
 * Exact copy of SlsOdsNo44Content.tsx (same columns, same structure, same
 * `lib/sls-ods-no-44-mapping.ts` view model) per explicit request that this
 * variant's columns match sls-ods-no-44 exactly. Only the header logo
 * differs (BVK Hydrotech branding instead of WMW Industries). Does NOT
 * import from or modify `OrderDetailSheetContent.tsx` / `types.ts` /
 * `SlsOdsNo44Content.tsx`, so every other Order Detail Sheet variant is
 * unaffected by this file.
 */

import type { SlsOdsNo44Data } from '@/lib/sls-ods-no-44-mapping'

const LOGO = {
  src: '/hydrotech-logo.png',
  alt: 'BVK HYDROTECH',
  fallbackText: 'BVK\nHYDROTECH',
}

export default function SlsOds44HydrotechContent({ data }: { data: SlsOdsNo44Data }) {
  // Length/Width columns are dropped entirely when no line has a value for
  // either (e.g. Invoice_Dimension_1/2 both empty on every line) — a single
  // SQM column (mapped to `SQM`) takes their place instead.
  const showDimensions = data.lines.some((line) => line.length || line.width)
  const productColCount = showDimensions ? 16 : 15
  const productFootLabelSpan = showDimensions ? 14 : 13
  return (
    <div
      className="sales-order-print-sheet sales-order-doc--sls-ods-44-hydrotech"
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
              <td rowSpan={2}>{data.odsDate}</td>
              <td className="ods-label">Page No.</td>
              <td>{data.pageNo}</td>
            </tr>
            <tr>
              <td className="ods-label">Issue Date</td>
              <td>{data.issueDate}</td>
            </tr>
            <tr>
              {/* Customer Name + Product Group on one line (replaces the old
                  standalone CLIENT NAME row). Product Group sits in the same
                  label/value column pair as Issue No./Issue Date above it. */}
              <td className="ods-label">CUSTOMER NAME</td>
              <td>{data.customerName}</td>
              <td className="ods-label">Product Group</td>
              <td>{data.productGroup}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Addresses (Billing / Shipping, was Invoice / Delivery) ──── */}
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

      {/* ── Product details ────────────────────────────────────────── */}
      <div className="ods-section-outline" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <table className="ods-table ods-product-table" role="presentation" style={{ flex: 1, height: '100%' }}>
          <thead>
            <tr>
              <th colSpan={productColCount} className="ods-section-label ods-section-label--center">
                PRODUCT DETAILS
              </th>
            </tr>
            <tr>
              <th>Product Code</th>
              <th>Application</th>
              <th>Billing Description</th>
              <th>HSN Code</th>
              <th>SAP No.</th>
              <th>Client PO No.</th>
              <th>PO Date</th>
              <th>Customer Desired Date</th>
              <th>QCT No. / QH</th>
              <th>QCT Date</th>
              <th>PPC Date</th>
              {showDimensions ? (
                <>
                  <th>Length (Meter)</th>
                  <th>Width (Meter)</th>
                </>
              ) : null}
              <th>Qty / UOM</th>
              {showDimensions ? null : <th>SQM</th>}
              <th>Price / UOM</th>
              <th>Total Value in INR</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line, idx) => (
              <tr key={idx}>
                <td className="ods-desc">{line.productCode || ' '}</td>
                <td>{line.application || ' '}</td>
                <td className="ods-desc">{line.billingDescription || ' '}</td>
                <td className="ods-num">{line.hsnCode || ' '}</td>
                <td className="ods-num">{line.sapNo || ' '}</td>
                <td className="ods-num">{line.clientPoNo || ' '}</td>
                <td className="ods-num">{line.poDate || ' '}</td>
                <td className="ods-num">{line.customerDesiredDate || ' '}</td>
                <td className="ods-num">{line.qctNo || ' '}</td>
                <td className="ods-num">{line.qctDate || ' '}</td>
                <td className="ods-num">{line.ppcDate || ' '}</td>
                {showDimensions ? (
                  <>
                    <td className="ods-num">{line.length || ' '}</td>
                    <td className="ods-num">{line.width || ' '}</td>
                  </>
                ) : null}
                <td className="ods-num">{line.qty ? `${line.qty}${line.uom ? ` ${line.uom}` : ''}` : ' '}</td>
                {showDimensions ? null : <td className="ods-num">{line.totalSqm || ' '}</td>}
                <td className="ods-amount">{line.price || ' '}</td>
                <td className="ods-amount">{line.totalValue || ' '}</td>
              </tr>
            ))}
            {/* Fills whatever vertical space is left on the page so the
             * IGST/Total Value rows below (and the Terms section after
             * this whole box) always sit flush at the bottom — only works
             * reliably when everything fits on one printed page. */}
            <tr style={{ height: '100%' }}>
              <td colSpan={productColCount} style={{ height: '100%', border: 'none', padding: 0 }} />
            </tr>
            <tr>
              <td colSpan={productFootLabelSpan} className="ods-product-foot-label">
                {data.gstLabel}
              </td>
              <td colSpan={2} className="ods-product-foot-value">
                {data.gstAmount}
              </td>
            </tr>
            <tr>
              <td colSpan={productFootLabelSpan} className="ods-product-foot-label">
                Total Value
              </td>
              <td colSpan={2} className="ods-product-foot-value">
                {data.totalValue}
              </td>
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
              <td className="ods-terms-value">{data.dispatchMode || ' '}</td>
            </tr>
            <tr>
              <td className="ods-terms-label">ROAD PERMIT</td>
              <td className="ods-terms-value">{data.roadPermit || ' '}</td>
            </tr>
            <tr>
              <td className="ods-terms-label">TERM OF PAYMENT</td>
              <td className="ods-terms-value">{data.termOfPayment || ' '}</td>
            </tr>
            <tr>
              <td className="ods-terms-label">METHOD OF PAYMENT</td>
              <td className="ods-terms-value">{data.methodOfPayment || ' '}</td>
            </tr>
            <tr>
              <td className="ods-terms-label">FREIGHT : TO PAY / PAID</td>
              <td className="ods-terms-value">{data.freight || ' '}</td>
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
    </div>
  )
}
