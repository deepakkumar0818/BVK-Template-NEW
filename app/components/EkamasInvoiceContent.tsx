'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { QuotationData } from '@/lib/types'
import { resolveConsigneeDisplay, resolveConsigneePhone } from '@/lib/consignee-display'
import { quotationRichText } from '@/lib/quotation-rich-text'
import EkamasGoodsTable from './EkamasGoodsTable'

interface EkamasInvoiceContentProps {
  data: QuotationData
  shippingData?: Record<string, unknown> | null
  billingData?: Record<string, unknown> | null
  rawQuotationData?: Record<string, unknown> | null
}

const outerBorder: CSSProperties = { border: '2px solid #000' }
const cellBorder: CSSProperties = { border: '1px solid #000' }

export default function EkamasInvoiceContent({
  data,
  shippingData,
  rawQuotationData,
}: EkamasInvoiceContentProps) {
  const quotationNumber = data.quotationNumber || (rawQuotationData?.Name as string) || ''
  const quotationDate = data.date || (rawQuotationData?.Created_Date_and_time as string) || ''
  const buyerEnquiryNo =
    data.buyerEnquiryNo || data.customerReference || (rawQuotationData?.customer_Reference as string) || ''
  const buyerEnquiryDate =
    data.customerReferenceDate || (rawQuotationData?.Customer_Reference_Date as string) || ''
  const otherReference = (rawQuotationData?.Additional_info as string) || ''

  const consignee = resolveConsigneeDisplay(shippingData, rawQuotationData)
  const consigneePhone = resolveConsigneePhone(shippingData, rawQuotationData)

  const countryOfOrigin = (rawQuotationData?.Billing_Country as string) || 'India'
  const countryOfDestination =
    (rawQuotationData?.Shipping_Country as string) || (shippingData?.Shipping_Country as string) || 'Indonesia'

  const modeOfDelivery =
    (rawQuotationData?.Mode_of_Delivery as string) || data.termsOfDelivery || 'Sea'
  const portOfLoading = (rawQuotationData?.Port_of_Loading as string) || 'Any Indian Port'
  const portOfDischarge = (rawQuotationData?.Port_of_Discharge as string) || 'Surabaya'
  const finalDestination =
    (rawQuotationData?.Final_Destination as string) || portOfDischarge || 'Indonesia'

  const dispatchExWorks =
    (rawQuotationData?.Delivery_Date_Control as string) ||
    data.deliveryDate ||
    '2-3 Weeks after receipt of Confirm PO'

  const termsOfPayment =
    data.termsOfPayment || (rawQuotationData?.Term_of_Payment as string) || '30 days from the date of Invoice'
  const ourBankDetails = quotationRichText(rawQuotationData, 'Our_Bank_Details')

  const signatureDate = quotationDate || data.date || ''

  return (
    <>
      <div className="performa-invoice-content-section performa-invoice-content-section--seamless" style={{ marginBottom: '8px' }}>
        <EkamasGoodsTable
          data={data}
          rawQuotationData={rawQuotationData}
          headerNode={
            <table
              className="ekamas-quotation-header-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                ...outerBorder,
                marginBottom: 0,
                tableLayout: 'fixed',
                fontSize: '11px',
              }}
            >
              <tbody>
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      ...cellBorder,
                      textAlign: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      padding: '8px',
                    }}
                  >
                    QUOTATION
                  </td>
                </tr>
                <tr>
                  <td style={{ width: '50%', verticalAlign: 'top', ...cellBorder, padding: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>Exporter</div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                      <img
                        src="/wmw-logo.svg"
                        alt="WMW Logo"
                        style={{ width: '160px', height: '62px', objectFit: 'contain', display: 'block' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>
                      WMW METAL FABRICS LIMITED
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '11px', marginBottom: '8px', lineHeight: 1.35 }}>
                      53, Industrial Area: Jhotwara, Jaipur 302012 India
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                      <span>Tel : +911417105151</span>
                      <span>info@wmwindia.com</span>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '10px' }}>www.wmwindia.com</div>
                  </td>
                  <td style={{ width: '50%', verticalAlign: 'top', ...cellBorder, padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <tbody>
                        <tr>
                          <td style={{ ...cellBorder, padding: '4px 8px 6px 8px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Quotation No. &amp; Date</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                              <span>{quotationNumber}</span>
                              <span>{quotationDate}</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ ...cellBorder, padding: '4px 8px 6px 8px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Buyer&apos;s Enquiry No. &amp; Date</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>{buyerEnquiryNo || '—'}</span>
                              <span style={{ fontWeight: 'bold' }}>{buyerEnquiryDate}</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ ...cellBorder, padding: '4px 8px 6px 8px', verticalAlign: 'top', minHeight: '36px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Other Reference (s)</div>
                            <div>{otherReference}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style={{ width: '50%', verticalAlign: 'top', ...cellBorder, padding: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '6px' }}>Consignee</div>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{consignee.name}</div>
                    <div style={{ fontSize: '11px', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{consignee.addressBlock}</div>
                    {consignee.country ? (
                      <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '4px' }}>{consignee.country}</div>
                    ) : null}
                    {consigneePhone ? (
                      <div style={{ fontSize: '11px', marginTop: '8px' }}>Phone: {consigneePhone}</div>
                    ) : null}
                  </td>
                  <td style={{ width: '50%', verticalAlign: 'top', ...cellBorder, padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '50%', ...cellBorder, padding: '4px 8px 6px 8px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Country of Origin of Goods</div>
                            <div style={{ textDecoration: 'underline' }}>{countryOfOrigin}</div>
                          </td>
                          <td style={{ width: '50%', ...cellBorder, padding: '4px 8px 6px 8px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Country of Final Destination</div>
                            <div style={{ textDecoration: 'underline' }}>{countryOfDestination}</div>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ ...cellBorder, padding: '4px 8px 8px 8px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>Terms of Payment</div>
                            <div>{termsOfPayment}</div>
                            {ourBankDetails ? (
                              <div
                                style={{
                                  marginTop: '8px',
                                  fontWeight: 'normal',
                                  fontSize: '10px',
                                  lineHeight: 1.35,
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {ourBankDetails}
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style={{ width: '50%', verticalAlign: 'top', ...cellBorder, padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '50%' }} />
                        <col style={{ width: '50%' }} />
                      </colgroup>
                      <tbody>
                        <tr>
                          <td style={{ ...cellBorder, padding: '6px 8px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold' }}>Carriage by</div>
                            <div style={{ textDecoration: 'underline' }}>{modeOfDelivery}</div>
                          </td>
                          <td style={{ ...cellBorder, padding: '6px 8px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold' }}>Port of Loading</div>
                            <div style={{ textDecoration: 'underline' }}>{portOfLoading}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ ...cellBorder, padding: '6px 8px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold' }}>Port of Discharge</div>
                            <div style={{ textDecoration: 'underline' }}>{portOfDischarge}</div>
                          </td>
                          <td style={{ ...cellBorder, padding: '6px 8px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold' }}>Final Destination</div>
                            <div style={{ textDecoration: 'underline' }}>{finalDestination}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ width: '50%', verticalAlign: 'top', ...cellBorder, padding: '8px' }}>
                    <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6px' }}>Dispatch Ex-Works</div>
                    <div>{dispatchExWorks}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          }
          signatureDate={signatureDate}
        />
      </div>

      <div className="conditions-for-print conditions-doc" style={{ border: '1px solid #000', padding: '16px', marginTop: '24px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '16px' }}>
          STANDARD CONDITIONS OF SALE:
        </h1>

        <p style={{ marginBottom: '16px', lineHeight: 1.6 }}>
          <strong>Pretext -</strong> In the below stated terms and conditions of the sale, WMW Metal Fabrics Ltd., hereby referred to as &apos;The
          Company&apos; is holding the entity mentioned in the invoice, here by referred to as &quot;The Buyer&quot; liable to all stated terms as on the
          date of this invoice.
        </p>

        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
            1. Contract
          </div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}>
            <strong>1.1.</strong> All quotations and orders are subject to these conditions. In the event of any inconsistency between these conditions
            and the Buyers conditions of purchase or supply, these conditions shall prevail. The Buyer irrevocably accepts these conditions.
          </p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}>
            <strong>1.2.</strong> The contract is not assignable. The Buyer cannot withdraw from this contract unless specifically agreed to in writing by
            the company in the event of withdrawal the Buyer shall pay full contract price.
          </p>
        </div>

        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>2. DELIVERY</div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>2.1.</strong> Goods will be delivered to the location specified in the acceptance of order on the terms as per order. Unless specifically agreed in writing any date for delivery specified by the company is an estimate only and any failure to deliver goods by that shall not constitute a breach of contract or negligence, nor shall the company be liable for the consequences.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>2.2.</strong> If a Buyer falls to take delivery, the company will have the right to make a charge of handling and storage of the goods (@ 1% per week of the invoice price with the maximum of) 50%)and the buyer will also be liable for demurrage and/or additional transportation costs incurred by the company.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>2.3.</strong> Where the contract specifies delivery by installment and the Company makes defective deliveries in respect of one or more installments the Buyer shall not be entitled to repudiate the whole contract.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>2.4.</strong> Where any goods have not been collected by the Buyer within three months from the date of notification to the Buyer that the goods are ready for dispatch, the company reserves the right to call back the material at the buyers cost and recover in full the price of the contract.</p>
        </div>

        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>3. RISK</div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>3.1.</strong> Risk shall pass to the Buyer as soon as the goods are dispatched and the Buyer is responsible for all loss damage or deterioration to the goods.</p>
        </div>

        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>4. PRICE</div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>4.1.</strong> The price quoted by the company is its current price. The Company reserves the rights to revise the contract price of the goods and the date of dispatch to take account of increase in costs including (without lamination) currency fluctuations, wages, materials, transport, overhead and taxes etc. between those prevailing at the date of the contract..</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>4.2.</strong> In the event of any alteration being required by the Buyer in design or specification of the company shall be entitled to make an appropriate adjustment to the contract.</p>
        </div>

        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>5. PAYMENT</div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>5.1.</strong> Each consignment shall be separately invoiced and paid for. The payment shall be made/remitted by the Buyer to the Company&apos;s Bankers at Jaipur, India.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>5.2.</strong> Payment is due in full when the goods leave the company premises or on the expiry of any agreed extended payment period. If the price is payable by installments and any amount is not paid on the due date, the whole outstanding balance becomes immediately due and payable. Interest is chargeable on a day to day basis on all overdue amount at the rate specified in any special conditions or if no such rate is specified, at a rate of 10% over and above of the bank rate for the time being of the Reserve Bank of India.</p>
        </div>

        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>6. CLAIMS</div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>6.1.</strong> The Buyer shall not be entitled to any claim in respect of any repairs of alterations to goods undertaken by the Buyer without the prior specific written consent of the Company nor in respect of any defect arising by reason of normal wear and tear or damage due to misuse/accident.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>6.2.</strong> The company&apos;s liability in relation to any claim (whether for breach of contract of otherwise) shall neither, in any circumstances, exceed the ex-factory price of the goods, nor shall the Company be liable for any consequential or indirect loss or damage. No warranty is given as performance running time etc. Consideration of claim/complaints will only be undertaken provided the whole piece in question is made available to us for examination. Complaints regarding faulty supply cannot be accepted after 6 months from the date of invoice. Any complaint cannot be raised if the product is not used within 12 months of invoice date. Any liability thereafter lies with the buyer.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>6.3.</strong> Without prejudice to any other rights which it may have against the Buyers, the company may rescind the contract, in whole or in part, or suspend deliveries under it or of any other goods in any of the following circumstances:</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6, marginLeft: '20px' }}><strong>6.3.1.</strong> If any sum is due from the Buyer to the Company under the contract (or of any other account) but it is unpaid.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6, marginLeft: '20px' }}><strong>6.3.2.</strong> If the Buyer is in breach of any provision of the contract.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6, marginLeft: '20px' }}><strong>6.3.3.</strong> If the Buyer become bankrupt or insolvent or unable to pay its debt.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6, marginLeft: '20px' }}><strong>6.3.4.</strong> If the company is not in a position to deliver the goods as per the contract.</p>
        </div>

        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>7. SPECIFICATION, COPYRIGHT</div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>7.1.</strong> Buyer will indemnify the Company from and against all claims, proceedings, damages, and expenses to which the Company may become liable as a result of work done in accordance with the Buyer specifications which infringes any patent or registered design.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>7.2.</strong> Where specifications are to be supplied to the Company, the Buyer shall supply such specification within a time specified by the Company so as to enable the company tocomplete the delivery within contract period as per predefined written approvals from the company.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>7.3.</strong> The Copyright of all documents (including drawings) furnished to the Buyer by the in connection with this contract shall at all times remain vested in the Company. Neither the documents nor their contents shall be used for any purpose other than for which they were furnished. The Buyer shall not disclose the documents to any other party without the expresses written consent of the company.</p>
        </div>

        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>8. GENERAL PLAN</div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>8.1.</strong> Without prejudice to any other right which it may have against the Buyer the company shall have a general lien over any property of the Buyer which is in the company&apos;s possession, in respect of all unpaid debts to it from the Buyer. The Company shall be entitled to dispose of the property as it thinks fit after expiration of 14 days prior notice to the Buyer, and to apply the proceeds of sale in, or towards payments of the debts.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>8.2.</strong> The company shall be under no liability if it is prevented from, or delayed in carrying out any part of its agreements for any cause beyond its control.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>8.3.</strong> The Buyer warrants that these conditions are freely accepted in the knowledge and on the basis that the price charged for the goods would be higher if the Company were under liability or potential liability, than as set out in these conditions.</p>
        </div>

        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>9. LIMITATION OF DAMAGES</div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>9.1.</strong> Seller shall not be liable to Buyer for any SPECIAL, EXEMPLARY, PROXIMATE CONSEQUENTIAL OR INCIDENTAL DAMAGES, WHETHER ARISING UNDER CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR OTHER THEORY OF LAW OR EQUITY. SELLER&apos;S MAXIMUM LIABILITY TO BUYER SHALL NOT EXCEED THE CONTRACT PRICE OF THE ORDER GIVING RISE TO THE CLAIM, DEMAND, OR CAUSE OF ACTION.</p>
        </div>

        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>10. INDEMNIFICATION</div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>10.1.</strong> Buyer shall defend, indemnify and hold harmless seller, and Seller&apos;s directors, officers and employees, from any and all claims, losses, liability, damages and expenses, including but not limited to, attorney&apos;s fees and costs of defense, arising from, related to, or in any way connected with or alleged to rise from or out of any asserted deficiencies or defects in the Product causes by any alteration or modification thereof by Buyer with or without Seller&apos;s written consent, or improper handling or storage by Buyer.</p>
        </div>

        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>11. ARBITRATION & JURISDICTION</div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>11.1.</strong> In case of any dispute, the same shall be referred to the arbitration of mutually acceptable arbitrator or a panel of two arbitrators, one to be appointed by each of us and who before the start of the proceedings shall appoint an umpire and their decision shall be final and binding on both of us. The arbitration shall be held at Jaipur, India and jurisdiction of this agreement lies at Jaipur, India only.</p>
        </div>
      </div>

      <div className="no-print" style={{ marginTop: '24px', textAlign: 'center' }}>
        <Link href="/conditions" style={{ color: '#1e40af', textDecoration: 'underline' }}>
          View Standard Conditions of Sale
        </Link>
      </div>
    </>
  )
}
