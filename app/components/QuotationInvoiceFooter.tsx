'use client'

interface QuotationInvoiceFooterProps {
  quotationDate?: string
}

/**
 * Remarks + signature block + DOC NO. Placed in quotation-header-master-table <tfoot>
 * so print engines repeat it at the bottom of each sheet for the quotation only (not on Standard Conditions).
 */
export default function QuotationInvoiceFooter({ quotationDate }: QuotationInvoiceFooterProps) {
  return (
    <div className="quotation-a4-footer">
      <table className="qs-remarks-table" role="presentation">
        <tbody>
          <tr>
            <th className="qs-remarks-table__head" scope="col">
              Remarks:-
            </th>
            <th className="qs-remarks-table__head" scope="col">
              For WMW Metal Fabrics Ltd.
            </th>
          </tr>
          <tr>
            <td className="qs-remarks-table__body qs-remarks-table__body--left">
              <ol className="qs-remarks-list">
                <li>Please mention this quotation number on your PO and all communications</li>
                <li>In case of extreme currency volatility prices maybe revised at anytime.</li>
                <li>This quotation is valid only for the products &amp; quantity mentioned.</li>
                <li>Packing : Export worthy packing</li>
                <li>ISPM 15 (Phytosanitory) Certification for Packing Material - provided on request</li>
                <li>All Foreign Bank charges on Purchaser Account.</li>
              </ol>
            </td>
            <td className="qs-remarks-table__body qs-remarks-table__body--right">
              <div className="qs-sig-lines">
                <div>Computer Generated Document</div>
                <div>No Signature Needed</div>
              </div>
              <div className="qs-sig-dated">Dated: {quotationDate}</div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="quotation-a4-footer__docno">DOC NO. WMW/MKT/F.1 (Rev.00)</div>
    </div>
  )
}
