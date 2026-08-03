'use client'

import type { SecondarySalesOdsData } from './types'

export default function SecondarySalesOdsContent({
  data,
}: {
  data: SecondarySalesOdsData
}) {
  return (
    <div className={`sales-order-print-sheet sales-order-doc--${data.variant} sos-sheet`}>
      {/* ── Brand header ────────────────────────────────────────── */}
      <div className="sos-brand">
        <img
          src={data.logo.src}
          alt={data.logo.alt}
          className="sos-brand-logo"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            const fallback = e.currentTarget.nextElementSibling
            if (fallback instanceof HTMLElement) fallback.style.display = 'block'
          }}
        />
        <div className="sos-brand-fallback" style={{ display: 'none', whiteSpace: 'pre-line' }}>
          {data.logo.fallbackText}
        </div>
        <div className="sos-brand-text">
          {data.logo.tagline ? <div className="sos-brand-name">{data.logo.tagline}</div> : null}
          {data.logo.taglineSub ? <div className="sos-brand-tagline">{data.logo.taglineSub}</div> : null}
        </div>
      </div>

      {/* ── Title / ODS / Client strip ─────────────────────────── */}
      <div className="sos-title-strip">
        <div className="sos-title">{data.title}</div>
      </div>
      <div className="sos-ods-strip">
        <span className="sos-label">O.D.S : </span>
        <span className="sos-value">{data.header.odsNo}</span>
        <span className="sos-label sos-ods-date-label">O.D.S Date: </span>
        <span className="sos-value">{data.header.odsDate}</span>
      </div>
      <div className="sos-client-strip">
        <div className="sos-client">
          <span className="sos-label">Client : </span>
          <span className="sos-value">{data.header.clientName}</span>
        </div>
        <div className="sos-sales-category">{data.header.salesCategory}</div>
      </div>

      {/* ── File No / Cust Code / Location / Credit Limit strip ── */}
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
            <td>{data.header.fileNo}</td>
            <td className="sos-label">Cust Code :.</td>
            <td>{data.header.custCode}</td>
            <td className="sos-label">Location :.</td>
            <td>{data.header.location}</td>
          </tr>
          <tr>
            <td className="sos-label">Credit Limit :</td>
            <td>{data.header.creditLimit}</td>
            <td className="sos-label" colSpan={2}>{data.header.noOfCd}</td>
            <td className="sos-label">GST No :.</td>
            <td>{data.header.gstNo}</td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td className="sos-label">Tin No :.</td>
            <td>{data.header.tinNo}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Order Details section (bordered box with heading + grid) ── */}
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
            <td>{data.orderDetails.customerPoNo}</td>
            <td className="sos-label">Cons Values :.</td>
            <td>{data.orderDetails.consValues}</td>
            <td className="sos-label">Zone :.</td>
            <td>{data.orderDetails.zone}</td>
          </tr>
          <tr>
            <td className="sos-label">P.O. Date :.</td>
            <td>{data.orderDetails.poDate}</td>
            <td className="sos-label">Till Date Sold :.</td>
            <td>{data.orderDetails.tillDateSold}</td>
            <td className="sos-label">Industry Type:.</td>
            <td>{data.orderDetails.industryType}</td>
          </tr>
          <tr>
            <td className="sos-label">Delivery Requested</td>
            <td>{data.orderDetails.deliveryRequested}</td>
            <td className="sos-label">Target Value :.</td>
            <td>{data.orderDetails.targetValue}</td>
            <td className="sos-label">O/S As On :.</td>
            <td>{data.orderDetails.osAsOn}</td>
          </tr>
          <tr>
            <td className="sos-label">Delivery Commit :.</td>
            <td>{data.orderDetails.deliveryCommit || ' '}</td>
            <td></td>
            <td></td>
            <td className="sos-label">ODS In Hand :.</td>
            <td>{data.orderDetails.odsInHand}</td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td className="sos-label">PDC AMOUNT IN HAND</td>
            <td>{data.orderDetails.pdcAmountInHand}</td>
          </tr>
        </tbody>
      </table>
      </div>

      {/* ── Wire Details (17-col product table) ─────────────────── */}
      <div className="sos-section-heading">Wire Details</div>

      <table className="sos-wire-details">
        <thead>
          <tr className="sos-wire-head-1">
            <th rowSpan={2}>SNo.</th>
            <th rowSpan={2}>Item Name</th>
            <th rowSpan={2}>Wire</th>
            <th rowSpan={2}>Type</th>
            <th colSpan={2}>Invoice Size</th>
            <th rowSpan={2}>QTY</th>
            <th rowSpan={2}>Unit</th>
            <th colSpan={3}>Price Per SQM</th>
            <th rowSpan={2}>Item Code</th>
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
          {data.wireDetails.map((row, i) => (
            <tr key={i}>
              <td className="sos-num">{row.sno}</td>
              <td>{row.itemName}</td>
              <td>{row.wire || ' '}</td>
              <td>{row.type}</td>
              <td className="sos-num">{row.len}</td>
              <td className="sos-num">{row.wid}</td>
              <td className="sos-num">{row.qty}</td>
              <td>{row.unit}</td>
              <td className="sos-num">{row.priceStd}</td>
              <td className="sos-num">{row.priceAgreed}</td>
              <td className="sos-num">{row.priceBilled}</td>
              <td>{row.itemCode}</td>
              <td>{row.brand}</td>
              <td>{row.dDate}</td>
              <td>{row.quality}</td>
              <td className="sos-num">{row.valuesInr}</td>
              <td>{row.hsnCode}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="sos-qty-total">
        <span className="sos-qty-total-underline">{data.qtyTotal}</span>
      </div>

      {/* ── Terms + Total Amount / Remarks ──────────────────────── */}
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
            <td>{data.terms.paymentTerms}</td>
            {/* Total Amount / Remarks label / remarks body — stacked vertically
             * inside a single cell spanning both right columns and all 12 term rows.
             * Divider between the Total Amount strip, the Remarks label strip,
             * and the empty remarks body is horizontal (not vertical). */}
            <td className="sos-total-remarks-cell" colSpan={2} rowSpan={12}>
              <div className="sos-total-amount-strip">
                <span className="sos-label">Total Amount:</span>
                <span className="sos-total-value">{data.totalAmount}</span>
              </div>
              <div className="sos-remarks-strip">
                <span className="sos-label">Remarks</span>
              </div>
              <div className="sos-remarks-fill">{data.remarks || ' '}</div>
            </td>
          </tr>
          <tr>
            <td className="sos-label">Payment Mode :.</td>
            <td>{data.terms.paymentMode}</td>
          </tr>
          <tr>
            <td className="sos-label">Packing Chargs :.</td>
            <td>{data.terms.packingCharges}</td>
          </tr>
          <tr>
            <td className="sos-label">Insurance :.</td>
            <td>{data.terms.insurance || ' '}</td>
          </tr>
          <tr>
            <td className="sos-label">Banker Name :.</td>
            <td>{data.terms.bankerName || ' '}</td>
          </tr>
          <tr>
            <td className="sos-label">Destination :.</td>
            <td>{data.terms.destination}</td>
          </tr>
          <tr>
            <td className="sos-label">Road Permit :.</td>
            <td>{data.terms.roadPermit || ' '}</td>
          </tr>
          <tr>
            <td className="sos-label">Transporter :.</td>
            <td>{data.terms.transporter}</td>
          </tr>
          <tr>
            <td className="sos-label">Direct Truck / Small :.</td>
            <td>{data.terms.directTruckSmall}</td>
          </tr>
          <tr>
            <td className="sos-label">Freight- To Pay / Paid :.</td>
            <td>{data.terms.freightToPayPaid}</td>
          </tr>
          <tr>
            <td className="sos-label">Freight Charges :.</td>
            <td>{data.terms.freightCharges}</td>
          </tr>
          <tr>
            <td className="sos-label">Transaction Charges</td>
            <td>{data.terms.transactionCharges}</td>
          </tr>
        </tbody>
      </table>

      {/* Quality Harmonisation Number + Date — stacked, above the "Remarks if any :" heading */}
      <div className="sos-qh-line">
        <span className="sos-label">Quality Harmonisation Number :</span>{' '}
        <span>{data.qualityHarmonisationNumber || ' '}</span>
      </div>
      <div className="sos-qh-line">
        <span className="sos-label">Date :</span>{' '}
        <span>{data.qualityHarmonisationDate || ' '}</span>
      </div>

      {/* ── Remarks if any + RNA table ──────────────────────────── */}
      <div className="sos-remarks-if-any">{data.remarksIfAnyLabel}</div>
      <div className="sos-rna-heading">{data.rnaBlock.heading}</div>
      <table className="sos-rna-table">
        <colgroup>
          <col style={{ width: '65%' }} />
          <col style={{ width: '35%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>{data.rnaBlock.rnaHeader}</th>
            <th>{data.rnaBlock.amountHeader}</th>
          </tr>
        </thead>
        <tbody>
          {data.rnaBlock.rows.map((r, i) => (
            <tr key={i}>
              <td className="sos-rna-label">{r.label}</td>
              <td className="sos-num">{r.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Bottom section: checklist + Credit Limit Exceeded ──── */}
      <div className="sos-bottom">
        <table className="sos-checklist">
          <tbody>
            {data.checklist.map((item, i) => (
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
              <th colSpan={2}>{data.creditLimitExceeded.title}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="sos-label">Open Balance</td>
              <td className="sos-num">{data.creditLimitExceeded.openBalance}</td>
            </tr>
            <tr>
              <td className="sos-label">Current Order</td>
              <td className="sos-num">{data.creditLimitExceeded.currentOrder}</td>
            </tr>
            <tr>
              <td className="sos-label">Other Pending Order</td>
              <td className="sos-num">{data.creditLimitExceeded.otherPendingOrder}</td>
            </tr>
            <tr>
              <td className="sos-label">New Balance</td>
              <td className="sos-num">{data.creditLimitExceeded.newBalance}</td>
            </tr>
            <tr>
              <td className="sos-label">Credit Limit</td>
              <td className="sos-num">{data.creditLimitExceeded.creditLimit}</td>
            </tr>
            <tr>
              <td className="sos-label">Processing Limit</td>
              <td className="sos-num">{data.creditLimitExceeded.processingLimit}</td>
            </tr>
            <tr>
              <td className="sos-label">Credit Excess</td>
              <td className="sos-num">{data.creditLimitExceeded.creditExcess}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── System timestamp (bottom-right) ─────────────────────── */}
      <div className="sos-timestamp">{data.systemTimestamp}</div>
    </div>
  )
}
