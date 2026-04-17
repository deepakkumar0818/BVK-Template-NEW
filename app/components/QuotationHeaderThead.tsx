import { QuotationData } from '@/lib/types'
import QuotationAddressPair from './QuotationAddressPair'

/**
 * Invoice-style quotation header: title + supplier | meta grid + consignee/recipient.
 * Renders as <thead class="repeating-header"> so the block can repeat at the top of each printed page.
 */
export default function QuotationHeaderThead({
  title = 'QUOTATION',
  data,
  shippingData,
  billingData,
  rawQuotationData,
  /** WMWD1: keep GSTIN + CIN on one line when printing (narrow supplier column). */
  singleLineGstinCinInSupplier = false,
}: {
  title?: string
  data: QuotationData
  shippingData?: any
  billingData?: any
  rawQuotationData?: any
  singleLineGstinCinInSupplier?: boolean
}) {
  const refDate = data.customerReferenceDate || data.date

  return (
    <thead className="repeating-header quotation-header-thead">
      <tr className="print-page-top-spacer" aria-hidden="true">
        <td colSpan={2} />
      </tr>
      <tr className="quotation-header-tr quotation-header-tr--title">
        <td className="quotation-header-td quotation-header-td--title" colSpan={2}>
          {title}
        </td>
      </tr>
      <tr className="quotation-header-tr quotation-header-tr--main">
        <td className="quotation-header-td quotation-header-td--supplier">
          <div className="qh-supplier-label">Supplier</div>

          <table className="qh-supplier-layout" role="presentation">
            <tbody>
              <tr>
                <td className="qh-supplier-layout__logo">
                  <div className="qh-logo-box">
                    <img
                      src="/wmw-logo.svg"
                      alt="WMW Metal Fabrics"
                      className="qh-logo-img"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                </td>
                <td className="qh-supplier-layout__text">
                  <div className="qh-company-name">WMW Metal Fabrics Ltd</div>
                  <div className="qh-line">53, Industrial Area, Jhotwara, Jaipur-302012, Rajasthan, India</div>
                  <div className="qh-line">Tel: +91.141.7105151</div>
                </td>
              </tr>
            </tbody>
          </table>

          <table
            className={[
              'qh-supplier-footer',
              singleLineGstinCinInSupplier ? 'qh-supplier-footer--single-tax-line' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="presentation"
          >
            <tbody>
              <tr>
                <td className="qh-supplier-footer__left">www.wmwindia.com</td>
                <td className="qh-supplier-footer__right">info@wmwindia.com</td>
              </tr>
              {singleLineGstinCinInSupplier ? (
                <tr>
                  <td colSpan={2} className="qh-supplier-footer__gstin-cin-cell">
                    <div className="qh-supplier-footer__gstin-cin-line">
                      <span className="qh-supplier-footer__gstin">GSTIN: 08AAACW2620D1Z8</span>
                      <span className="qh-supplier-footer__cin">CIN: U27109WB1995PLC068681</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td className="qh-supplier-footer__left">GSTIN: 08AAACW2620D1Z8</td>
                  <td className="qh-supplier-footer__right">CIN: U27109WB1995PLC068681</td>
                </tr>
              )}
            </tbody>
          </table>
        </td>

        <td className="quotation-header-td quotation-header-td--meta">
          <table className="qh-meta-grid" role="presentation">
            <colgroup>
              <col className="qh-meta-col qh-meta-col--label" />
              <col className="qh-meta-col qh-meta-col--val" />
              <col className="qh-meta-col qh-meta-col--date" />
            </colgroup>
            <tbody>
              <tr>
                <td>
                  <strong>Quotation No</strong>
                </td>
                <td>{data.quotationNumber}</td>
                <td className="qh-meta-date-stack">
                  <div>
                    <strong>Date</strong>
                  </div>
                  <div>{data.date}</div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Buyer, S Enquiry No</strong>
                </td>
                <td>{data.buyerEnquiryNo || ''}</td>
                <td className="qh-meta-date-stack">
                  <div>
                    <strong>Date</strong>
                  </div>
                  <div>{refDate}</div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Terms Of Payment</strong>
                </td>
                <td colSpan={2}>{data.termsOfPayment || ''}</td>
              </tr>
              <tr>
                <td>
                  <strong>Inco Terms</strong>
                </td>
                <td colSpan={2}>
                  {data.incoTerms || ''}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Terms Of Delivery</strong>
                </td>
                <td colSpan={2}>
                  {data.termsOfDelivery || ''}
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr className="quotation-header-tr quotation-header-tr--addresses">
        <td className="quotation-header-td quotation-header-td--addresses" colSpan={2}>
          <QuotationAddressPair
            shippingData={shippingData}
            billingData={billingData}
            rawQuotationData={rawQuotationData}
          />
        </td>
      </tr>
    </thead>
  )
}
