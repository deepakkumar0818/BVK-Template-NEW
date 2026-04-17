'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import type { QuotationData } from '@/lib/types'
import GoodsDescriptionPaginatedBlock from './GoodsDescriptionPaginatedBlock'
import {
  formatCurrency,
  formatAmountInWords,
  parseQuotationTaxForSummary,
  resolveQuotationValidity,
  DEFAULT_WMW_PERFORMA_QUOTATION_VALIDITY_PHRASE,
} from '@/lib/quotation-utils'
import { resolveWmwChargeTotals } from '@/lib/wmw-subform-mapping'
import QuotationHeaderThead from './QuotationHeaderThead'
import QuotationSummarySection from './QuotationSummarySection'

interface PerformaInvoiceContentProps {
  data: QuotationData
  shippingData?: any
  billingData?: any
  rawQuotationData?: any
  /**
   * WMW tab only: same structure as WMWD1 (header, 7-col goods + HSN, summary grid + field order).
   * Keeps legacy Performa “Remarks :” list + bank details + DOC NO after the summary.
   */
  useWmwd1StyleLayout?: boolean
}

/** Static Performa remarks (unchanged copy) — left column beside tax rows (original WMW position). */
const performaStaticRemarksBlock: ReactNode = (
  <>
    <div style={{ borderTop: '1px solid #000', textAlign: 'center', fontWeight: 'bold', padding: '3px 6px' }}>
      Remarks :
    </div>
    <ol style={{ margin: 0, padding: '4px 8px 8px 28px', lineHeight: 1.35 }}>
      <li>Mentioned delivery date is from date of confirmed PO other terms if any</li>
      <li>Subjects to terms and conditions enclosed.</li>
    </ol>
  </>
)

function performaBankDetailsBlock(data: QuotationData): ReactNode {
  return (
    <>
      <table className="quotation-stack-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td
              style={{ width: '61%', border: '1px solid #000', padding: '3px 8px', fontWeight: 'bold', textAlign: 'center' }}
            >
              Bank Details :-
            </td>
            <td
              style={{ width: '39%', border: '1px solid #000', padding: '3px 8px', fontWeight: 'bold', textAlign: 'center' }}
            >
              For WMW Metal Fabrics Ltd.
            </td>
          </tr>
          <tr>
            <td style={{ width: '61%', verticalAlign: 'top', border: '1px solid #000', padding: '4px 8px', lineHeight: 1.2 }}>
              <div>Bank Name: Indian Overseas Bank</div>
              <div>Account Number: 015802000003059</div>
              <div>Branch Code: 0158</div>
              <div>IFSC Code: IOBA0000158</div>
              <div>Swift Code: IOBAINBB158</div>
            </td>
            <td style={{ width: '39%', verticalAlign: 'top', border: '1px solid #000', padding: '0' }}>
              <div style={{ padding: '4px 8px', textAlign: 'center', lineHeight: 1.35 }}>
                <div>Computer Generated Document</div>
                <div>No Signature Needed</div>
              </div>
              <div style={{ borderTop: '1px solid #000', padding: '4px 8px' }}>Dated: {data.date}</div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="quotation-doc-footer-meta" style={{ textAlign: 'right', marginTop: '6px', padding: '0 4px 4px', fontSize: '10px' }}>
        DOC NO. WMW/MKT/F.1 (Rev.00)
      </div>
    </>
  )
}

export default function PerformaInvoiceContent({
  data,
  shippingData,
  billingData,
  rawQuotationData,
  useWmwd1StyleLayout = false,
}: PerformaInvoiceContentProps) {
  const {
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    taxAmount,
    totalBeforeTax,
    totalAfterTax,
  } = parseQuotationTaxForSummary(rawQuotationData, data.totalAmount)

  const totalAmount = formatCurrency(data.totalAmount)

  const lineItems = data.lineItems ?? []

  const { freightTotal, packingTotal, seamTotal } = resolveWmwChargeTotals(rawQuotationData ?? null)

  if (useWmwd1StyleLayout) {
    const performaTitle = 'PERFORMA INVOICE'
    return (
      <>
        <div className="quotation-print-sheet">
          <div className="quotation-content-section quotation-content-section--seamless print-content" style={{ marginBottom: '24px' }}>
            <table
              className="quotation-header-master-table quotation-header-master-table--wmwd1"
              style={{ width: '100%', borderCollapse: 'collapse' }}
            >
              <QuotationHeaderThead
                title={performaTitle}
                data={data}
                shippingData={shippingData}
                billingData={billingData}
                rawQuotationData={rawQuotationData}
                singleLineGstinCinInSupplier
              />
              <tbody>
                <tr className="quotation-master-body-row quotation-master-body-row--goods">
                  <td colSpan={2} className="quotation-seamless-stack">
                    <GoodsDescriptionPaginatedBlock
                      lineItems={lineItems}
                      totalFoot={{ currency: data.currency, amountFormatted: totalAmount }}
                      masterQuotationHeaderProps={{
                        title: performaTitle,
                        data,
                        shippingData,
                        billingData,
                        rawQuotationData,
                      }}
                      showHsnCodeColumn
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <table
              className="quotation-header-master-table quotation-summary-follow-master-table"
              style={{ width: '100%', borderCollapse: 'collapse' }}
            >
              <tbody>
                <tr className="quotation-master-body-row quotation-master-body-row--summary">
                  <td colSpan={2} className="quotation-seamless-stack">
                    <QuotationSummarySection
                      data={data}
                      totalAmountFormatted={totalAmount}
                      cgstRate={cgstRate}
                      cgstAmount={cgstAmount}
                      sgstRate={sgstRate}
                      sgstAmount={sgstAmount}
                      igstRate={igstRate}
                      igstAmount={igstAmount}
                      taxAmount={taxAmount}
                      totalBeforeTax={totalBeforeTax}
                      totalAfterTax={totalAfterTax}
                      wmwFreightChargeTotal={freightTotal}
                      wmwPackingChargeTotal={packingTotal}
                      wmwSeamChargeTotal={seamTotal}
                      sevenColumnGoodsLayout
                      notesMergedSlot={performaStaticRemarksBlock}
                      rawQuotationData={rawQuotationData as Record<string, unknown> | null | undefined}
                    />
                    {performaBankDetailsBlock(data)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="conditions-for-print conditions-doc" style={{ border: '1px solid #000', padding: '16px', marginTop: '24px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '16px' }}>STANDARD CONDITIONS OF SALE:</h1>

        <p style={{ marginBottom: '16px', lineHeight: 1.6 }}>
          <strong>Pretext -</strong> In the below stated terms and conditions of the sale, WMW Metal Fabrics Ltd., hereby referred to as &apos;The Company&apos; is holding the entity mentioned in the invoice, here by referred to as &quot;The Buyer&quot; liable to all stated terms as on the date of this invoice.
        </p>

        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>1. Contract</div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>1.1.</strong> All quotations and orders are subject to these conditions. In the event of any inconsistency between these conditions and the Buyers conditions of purchase or supply, these conditions shall prevail. The Buyer irrevocably accepts these conditions.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>1.2.</strong> The contract is not assignable. The Buyer cannot withdraw from this contract unless specifically agreed to in writing by the company in the event of withdrawal the Buyer shall pay full contract price.</p>
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
    );
  }

  return (
    <>
      <div className="performa-invoice-content-section performa-invoice-content-section--seamless" style={{ marginBottom: '8px' }}>
        <div className="quotation-seamless-stack">
          <table className="quotation-stack-table quotation-header-master-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <QuotationHeaderThead
              title="PERFORMA INVOICE"
              data={data}
              shippingData={shippingData}
              billingData={billingData}
              rawQuotationData={rawQuotationData}
            />
            <tbody>
              <tr className="quotation-master-body-row quotation-master-body-row--goods">
                <td colSpan={2} className="quotation-seamless-stack">
                  <GoodsDescriptionPaginatedBlock
                    lineItems={lineItems}
                    totalFoot={{ currency: data.currency, amountFormatted: totalAmount }}
                    masterQuotationHeaderProps={{ title: 'PERFORMA INVOICE', data, shippingData, billingData, rawQuotationData }}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <table
            className="quotation-header-master-table quotation-summary-follow-master-table"
            style={{ width: '100%', borderCollapse: 'collapse' }}
          >
            <tbody>
              <tr className="quotation-master-body-row quotation-master-body-row--summary">
                <td colSpan={2} className="quotation-seamless-stack">
                  <table className="quotation-stack-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '61%', verticalAlign: 'top', border: '1px solid #000', padding: '0' }}>
                          <div style={{ padding: '6px 8px', borderBottom: '1px solid #000' }}>
                            <strong>QUOTATION VALIDITY:</strong>{' '}
                            {resolveQuotationValidity(
                              rawQuotationData as Record<string, unknown> | undefined,
                              DEFAULT_WMW_PERFORMA_QUOTATION_VALIDITY_PHRASE
                            )}
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>Freight</th>
                                <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>Excl.</th>
                                <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}></th>
                                <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left', fontWeight: 'bold' }}>HSN Number</th>
                              </tr>
                              <tr>
                                <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>Insurance</th>
                                <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>Incl.</th>
                                <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>StainlessSteelWireCloth</th>
                                <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right' }}>7314</th>
                              </tr>
                              <tr>
                                <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>Packing</th>
                                <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>Incl.</th>
                                <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left', fontWeight: 'bold' }}>PB Wire Cloth</th>
                                <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right' }}>7419</th>
                              </tr>
                            </thead>
                          </table>
                          <div style={{ borderTop: '1px solid #000', textAlign: 'center', fontWeight: 'bold', padding: '3px 6px' }}>Remarks :</div>
                          <ol style={{ margin: 0, padding: '4px 8px 8px 28px', lineHeight: 1.35 }}>
                            <li>Mentioned delivery date is from date of confirmed PO other terms if any</li>
                            <li>Subjects to terms and conditions enclosed.</li>
                          </ol>
                        </td>
                        <td style={{ width: '39%', verticalAlign: 'top', border: '1px solid #000', padding: '0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                            <tbody>
                              <tr>
                                <td style={{ border: '1px solid #000', padding: '3px 8px', fontWeight: 'bold' }}>Total INR</td>
                                <td style={{ border: '1px solid #000', padding: '3px 8px', textAlign: 'right' }}>{totalAmount}</td>
                              </tr>
                              {Number.isFinite(freightTotal) && freightTotal !== 0 ? (
                                <tr>
                                  <td style={{ border: '1px solid #000', padding: '1px 8px' }}>Freight Charge</td>
                                  <td style={{ border: '1px solid #000', padding: '1px 8px', textAlign: 'right' }}>
                                    {formatCurrency(freightTotal, data.currency || 'INR')}
                                  </td>
                                </tr>
                              ) : null}
                              {Number.isFinite(packingTotal) && packingTotal !== 0 ? (
                                <tr>
                                  <td style={{ border: '1px solid #000', padding: '1px 8px' }}>Packing Charges</td>
                                  <td style={{ border: '1px solid #000', padding: '1px 8px', textAlign: 'right' }}>
                                    {formatCurrency(packingTotal, data.currency || 'INR')}
                                  </td>
                                </tr>
                              ) : null}
                              {Number.isFinite(seamTotal) && seamTotal !== 0 ? (
                                <tr>
                                  <td style={{ border: '1px solid #000', padding: '1px 8px' }}>Seam Charges</td>
                                  <td style={{ border: '1px solid #000', padding: '1px 8px', textAlign: 'right' }}>
                                    {formatCurrency(seamTotal, data.currency || 'INR')}
                                  </td>
                                </tr>
                              ) : null}
                              <tr>
                                <td style={{ border: '1px solid #000', padding: '1px 8px', fontWeight: 'bold' }}>Total Amount Before Tax</td>
                                <td style={{ border: '1px solid #000', padding: '1px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                                  {formatCurrency(totalBeforeTax, data.currency || 'INR')}
                                </td>
                              </tr>
                              <tr>
                                <td style={{ border: '1px solid #000', padding: '1px 8px' }}>Add CGST @ &nbsp;&nbsp;{cgstRate > 0 ? `${cgstRate}` : '0.00'}</td>
                                <td style={{ border: '1px solid #000', padding: '1px 8px', textAlign: 'right' }}>{formatCurrency(cgstAmount)}</td>
                              </tr>
                              <tr>
                                <td style={{ border: '1px solid #000', padding: '1px 8px' }}>Add SGST @ &nbsp;&nbsp;{sgstRate > 0 ? `${sgstRate}` : '0.00'}</td>
                                <td style={{ border: '1px solid #000', padding: '1px 8px', textAlign: 'right' }}>{formatCurrency(sgstAmount)}</td>
                              </tr>
                              <tr>
                                <td style={{ border: '1px solid #000', padding: '1px 8px' }}>Add IGST @ &nbsp;&nbsp;{igstRate > 0 ? `${igstRate}` : '0.00'}</td>
                                <td style={{ border: '1px solid #000', padding: '1px 8px', textAlign: 'right' }}>{formatCurrency(igstAmount)}</td>
                              </tr>
                              <tr>
                                <td style={{ border: '1px solid #000', padding: '1px 8px' }}>Tax Amount GST</td>
                                <td style={{ border: '1px solid #000', padding: '1px 8px', textAlign: 'right' }}>{formatCurrency(taxAmount)}</td>
                              </tr>
                              <tr>
                                <td style={{ border: '1px solid #000', padding: '3px 8px', fontWeight: 'bold', fontSize: '13px' }}>Total Amount After GST</td>
                                <td style={{ border: '1px solid #000', padding: '3px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                                  {formatCurrency(totalAfterTax)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="amount-in-words quotation-stack-amount-row" style={{ fontStyle: 'normal', padding: '4px 8px' }}>
                    <strong>Amount Chargeable (In words):-</strong> {formatAmountInWords(totalAfterTax, data.currency || 'INR')}
                  </div>

                  {performaBankDetailsBlock(data)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="conditions-for-print conditions-doc" style={{ border: '1px solid #000', padding: '16px', marginTop: '24px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '16px' }}>STANDARD CONDITIONS OF SALE:</h1>

        <p style={{ marginBottom: '16px', lineHeight: 1.6 }}>
          <strong>Pretext -</strong> In the below stated terms and conditions of the sale, WMW Metal Fabrics Ltd., hereby referred to as &apos;The Company&apos; is holding the entity mentioned in the invoice, here by referred to as &quot;The Buyer&quot; liable to all stated terms as on the date of this invoice.
        </p>

        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>1. Contract</div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>1.1.</strong> All quotations and orders are subject to these conditions. In the event of any inconsistency between these conditions and the Buyers conditions of purchase or supply, these conditions shall prevail. The Buyer irrevocably accepts these conditions.</p>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>1.2.</strong> The contract is not assignable. The Buyer cannot withdraw from this contract unless specifically agreed to in writing by the company in the event of withdrawal the Buyer shall pay full contract price.</p>
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
  );
}
