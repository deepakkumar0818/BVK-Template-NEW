'use client'

/**
 * sls-ods-0254 — ISOLATED sibling of SecondarySalesOdsContent.tsx.
 *
 * Only these pieces are live (mapSls0254, lib/sls-ods-0254-mapping.ts):
 *   - O.D.S / O.D.S Date / Client (header strip)
 *   - Wire Details table: Product Description (new, replaces Item Name +
 *     Item Code), Type, Len/Wid, QTY, Std/Agreed/Billed, Brand, D.Date,
 *     Quality, HSN Code. ("Wire" and "Unit" columns not mapped yet.)
 *   - Terms: Payment Terms, Payment Mode, Packing Chargs, Insurance, Destination
 *
 * Everything else — File No/Cust Code/Location/Credit Limit strip, the
 * entire "Order Details" box (per spec: do not touch), Qty Total, Total
 * Amount, Remarks, Quality Harmonisation Number/Date, RNA block, checklist,
 * Credit Limit Exceeded box, System Timestamp — stays on the static
 * fixture, unchanged.
 *
 * Does NOT import from or modify `SecondarySalesOdsContent.tsx` / `types.ts`.
 */

import type { SecondarySalesOdsData } from './types'
import type { Sls0254WireRow } from '@/lib/sls-ods-0254-mapping'

export default function SlsOds0254Content({
  fixture,
  odsNo,
  odsDate,
  clientName,
  wireDetails,
  paymentTerms,
  paymentMode,
  packingCharges,
  insurance,
  destination,
}: {
  fixture: SecondarySalesOdsData
  odsNo: string
  odsDate: string
  clientName: string
  wireDetails: Sls0254WireRow[]
  paymentTerms: string
  paymentMode: string
  packingCharges: string
  insurance: string
  destination: string
}) {
  return (
    <div className={`sales-order-print-sheet sales-order-doc--${fixture.variant} sos-sheet`}>
      {/* ── Brand header ────────────────────────────────────────── */}
      <div className="sos-brand">
        <img
          src={fixture.logo.src}
          alt={fixture.logo.alt}
          className="sos-brand-logo"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            const fallback = e.currentTarget.nextElementSibling
            if (fallback instanceof HTMLElement) fallback.style.display = 'block'
          }}
        />
        <div className="sos-brand-fallback" style={{ display: 'none', whiteSpace: 'pre-line' }}>
          {fixture.logo.fallbackText}
        </div>
        <div className="sos-brand-text">
          {fixture.logo.tagline ? <div className="sos-brand-name">{fixture.logo.tagline}</div> : null}
          {fixture.logo.taglineSub ? <div className="sos-brand-tagline">{fixture.logo.taglineSub}</div> : null}
        </div>
      </div>

      {/* ── Title / ODS / Client strip — ODS/Date/Client are LIVE ──── */}
      <div className="sos-title-strip">
        <div className="sos-title">{fixture.title}</div>
      </div>
      <div className="sos-ods-strip">
        <span className="sos-label">O.D.S : </span>
        <span className="sos-value">{odsNo}</span>
        <span className="sos-label sos-ods-date-label">O.D.S Date: </span>
        <span className="sos-value">{odsDate}</span>
      </div>
      <div className="sos-client-strip">
        <div className="sos-client">
          <span className="sos-label">Client : </span>
          <span className="sos-value">{clientName}</span>
        </div>
        <div className="sos-sales-category">{fixture.header.salesCategory}</div>
      </div>

      {/* ── File No / Cust Code / Location / Credit Limit strip — fixture, unchanged ── */}
      <table className="sos-info-strip">
        <colgroup>
          <col style={{ width: '13%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '20%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="sos-label">File No :.</td>
            <td>{fixture.header.fileNo}</td>
            <td className="sos-label">Cust Code :.</td>
            <td>{fixture.header.custCode}</td>
            <td className="sos-label">Location :.</td>
            <td>{fixture.header.location}</td>
          </tr>
          <tr>
            <td className="sos-label">Credit Limit :</td>
            <td>{fixture.header.creditLimit}</td>
            <td className="sos-label" colSpan={2}>{fixture.header.noOfCd}</td>
            <td className="sos-label">GST No :.</td>
            <td>{fixture.header.gstNo}</td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td className="sos-label">Tin No :.</td>
            <td>{fixture.header.tinNo}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Order Details section — NOT touched, fixture unchanged ── */}
      <div className="sos-outlined-box">
      <div className="sos-section-heading">Order Details</div>

      <table className="sos-order-details">
        <colgroup>
          <col style={{ width: '17%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '17%' }} />
          <col style={{ width: '17%' }} />
          <col style={{ width: '17%' }} />
          <col style={{ width: '16%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="sos-label">Customer P.O. No :</td>
            <td>{fixture.orderDetails.customerPoNo}</td>
            <td className="sos-label">Cons Values :.</td>
            <td>{fixture.orderDetails.consValues}</td>
            <td className="sos-label">Zone :.</td>
            <td>{fixture.orderDetails.zone}</td>
          </tr>
          <tr>
            <td className="sos-label">P.O. Date :.</td>
            <td>{fixture.orderDetails.poDate}</td>
            <td className="sos-label">Till Date Sold :.</td>
            <td>{fixture.orderDetails.tillDateSold}</td>
            <td className="sos-label">Industry Type:.</td>
            <td>{fixture.orderDetails.industryType}</td>
          </tr>
          <tr>
            <td className="sos-label">Delivery Requested</td>
            <td>{fixture.orderDetails.deliveryRequested}</td>
            <td className="sos-label">Target Value :.</td>
            <td>{fixture.orderDetails.targetValue}</td>
            <td className="sos-label">O/S As On :.</td>
            <td>{fixture.orderDetails.osAsOn}</td>
          </tr>
          <tr>
            <td className="sos-label">Delivery Commit :.</td>
            <td>{fixture.orderDetails.deliveryCommit || ' '}</td>
            <td></td>
            <td></td>
            <td className="sos-label">ODS In Hand :.</td>
            <td>{fixture.orderDetails.odsInHand}</td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td className="sos-label">PDC AMOUNT IN HAND</td>
            <td>{fixture.orderDetails.pdcAmountInHand}</td>
          </tr>
        </tbody>
      </table>
      </div>

      {/* ── Wire Details — LIVE. Item Name + Item Code columns removed,
          replaced by a single "Product Description" column. ─────────── */}
      <div className="sos-section-heading">Wire Details</div>

      <table className="sos-wire-details">
        <thead>
          <tr className="sos-wire-head-1">
            <th rowSpan={2}>SNo.</th>
            <th rowSpan={2}>Product Description</th>
            <th rowSpan={2}>Wire</th>
            <th rowSpan={2}>Type</th>
            <th colSpan={2}>Invoice Size</th>
            <th rowSpan={2}>QTY</th>
            <th rowSpan={2}>Unit</th>
            <th colSpan={3}>Price Per SQM</th>
            <th rowSpan={2}>Brand</th>
            <th rowSpan={2}>D.Date</th>
            <th rowSpan={2}>Quality</th>
            <th rowSpan={2}>Values INR</th>
            <th rowSpan={2}>HSN Code</th>
          </tr>
          <tr className="sos-wire-head-2">
            <th>Len</th>
            <th>Wid</th>
            <th>Std</th>
            <th>Agreed</th>
            <th>Billed</th>
          </tr>
        </thead>
        <tbody>
          {wireDetails.map((row, i) => (
            <tr key={i}>
              <td className="sos-num">{row.sno}</td>
              <td>{row.productDescription || ' '}</td>
              <td>{row.wire || ' '}</td>
              <td>{row.type || ' '}</td>
              <td className="sos-num">{row.len || ' '}</td>
              <td className="sos-num">{row.wid || ' '}</td>
              <td className="sos-num">{row.qty || ' '}</td>
              <td>{row.unit || ' '}</td>
              <td className="sos-num">{row.priceStd || ' '}</td>
              <td className="sos-num">{row.priceAgreed || ' '}</td>
              <td className="sos-num">{row.priceBilled || ' '}</td>
              <td>{row.brand || ' '}</td>
              <td>{row.dDate || ' '}</td>
              <td>{row.quality || ' '}</td>
              <td className="sos-num">{row.valuesInr || ' '}</td>
              <td>{row.hsnCode || ' '}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="sos-qty-total">
        <span className="sos-qty-total-underline">{fixture.qtyTotal}</span>
      </div>

      {/* ── Terms + Total Amount / Remarks — 5 fields LIVE, rest fixture ── */}
      <table className="sos-terms">
        <colgroup>
          <col style={{ width: '22%' }} />
          <col style={{ width: '28%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '30%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="sos-label">Payment Terms :.</td>
            <td>{paymentTerms || ' '}</td>
            {/* Total Amount / Remarks label / remarks body — stacked vertically
             * inside a single cell spanning both right columns and all 12 term rows.
             * Divider between the Total Amount strip, the Remarks label strip,
             * and the empty remarks body is horizontal (not vertical). */}
            <td className="sos-total-remarks-cell" colSpan={2} rowSpan={12}>
              <div className="sos-total-amount-strip">
                <span className="sos-label">Total Amount:</span>
                <span className="sos-total-value">{fixture.totalAmount}</span>
              </div>
              <div className="sos-remarks-strip">
                <span className="sos-label">Remarks</span>
              </div>
              <div className="sos-remarks-fill">{fixture.remarks || ' '}</div>
            </td>
          </tr>
          <tr>
            <td className="sos-label">Payment Mode :.</td>
            <td>{paymentMode || ' '}</td>
          </tr>
          <tr>
            <td className="sos-label">Packing Chargs :.</td>
            <td>{packingCharges || ' '}</td>
          </tr>
          <tr>
            <td className="sos-label">Insurance :.</td>
            <td>{insurance || ' '}</td>
          </tr>
          <tr>
            <td className="sos-label">Banker Name :.</td>
            <td>{fixture.terms.bankerName || ' '}</td>
          </tr>
          <tr>
            <td className="sos-label">Destination :.</td>
            <td>{destination || ' '}</td>
          </tr>
          <tr>
            <td className="sos-label">Road Permit :.</td>
            <td>{fixture.terms.roadPermit || ' '}</td>
          </tr>
          <tr>
            <td className="sos-label">Transporter :.</td>
            <td>{fixture.terms.transporter}</td>
          </tr>
          <tr>
            <td className="sos-label">Direct Truck / Small :.</td>
            <td>{fixture.terms.directTruckSmall}</td>
          </tr>
          <tr>
            <td className="sos-label">Freight- To Pay / Paid :.</td>
            <td>{fixture.terms.freightToPayPaid}</td>
          </tr>
          <tr>
            <td className="sos-label">Freight Charges :.</td>
            <td>{fixture.terms.freightCharges}</td>
          </tr>
          <tr>
            <td className="sos-label">Transaction Charges</td>
            <td>{fixture.terms.transactionCharges}</td>
          </tr>
        </tbody>
      </table>

      {/* Quality Harmonisation Number + Date — fixture, unchanged */}
      <div className="sos-qh-line">
        <span className="sos-label">Quality Harmonisation Number :</span>{' '}
        <span>{fixture.qualityHarmonisationNumber || ' '}</span>
      </div>
      <div className="sos-qh-line">
        <span className="sos-label">Date :</span>{' '}
        <span>{fixture.qualityHarmonisationDate || ' '}</span>
      </div>

      {/* ── Remarks if any + RNA table — fixture, unchanged ─────────── */}
      <div className="sos-remarks-if-any">{fixture.remarksIfAnyLabel}</div>
      <div className="sos-rna-heading">{fixture.rnaBlock.heading}</div>
      <table className="sos-rna-table">
        <colgroup>
          <col style={{ width: '65%' }} />
          <col style={{ width: '35%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>{fixture.rnaBlock.rnaHeader}</th>
            <th>{fixture.rnaBlock.amountHeader}</th>
          </tr>
        </thead>
        <tbody>
          {fixture.rnaBlock.rows.map((r, i) => (
            <tr key={i}>
              <td className="sos-rna-label">{r.label}</td>
              <td className="sos-num">{r.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Bottom section: checklist + Credit Limit Exceeded — fixture, unchanged ── */}
      <div className="sos-bottom">
        <table className="sos-checklist">
          <tbody>
            {fixture.checklist.map((item, i) => (
              <tr key={i}>
                <td className="sos-checklist-label">
                  ({i + 1}).{item.label}
                </td>
                <td className="sos-checklist-box">
                  <span className="sos-checkbox">{item.checked ? '✓' : ''}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="sos-credit-limit">
          <thead>
            <tr>
              <th colSpan={2}>{fixture.creditLimitExceeded.title}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="sos-label">Open Balance</td>
              <td className="sos-num">{fixture.creditLimitExceeded.openBalance}</td>
            </tr>
            <tr>
              <td className="sos-label">Current Order</td>
              <td className="sos-num">{fixture.creditLimitExceeded.currentOrder}</td>
            </tr>
            <tr>
              <td className="sos-label">Other Pending Order</td>
              <td className="sos-num">{fixture.creditLimitExceeded.otherPendingOrder}</td>
            </tr>
            <tr>
              <td className="sos-label">New Balance</td>
              <td className="sos-num">{fixture.creditLimitExceeded.newBalance}</td>
            </tr>
            <tr>
              <td className="sos-label">Credit Limit</td>
              <td className="sos-num">{fixture.creditLimitExceeded.creditLimit}</td>
            </tr>
            <tr>
              <td className="sos-label">Processing Limit</td>
              <td className="sos-num">{fixture.creditLimitExceeded.processingLimit}</td>
            </tr>
            <tr>
              <td className="sos-label">Credit Excess</td>
              <td className="sos-num">{fixture.creditLimitExceeded.creditExcess}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── System timestamp (bottom-right) — fixture, unchanged ────── */}
      <div className="sos-timestamp">{fixture.systemTimestamp}</div>
    </div>
  )
}
