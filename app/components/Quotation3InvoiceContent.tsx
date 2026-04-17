'use client'

import Link from 'next/link'
import type { QuotationData } from '@/lib/types'
import { resolveConsigneeDisplay, resolveConsigneePhone } from '@/lib/consignee-display'
import { quotationRichText } from '@/lib/quotation-rich-text'
import { resolveQuotationValidity } from '@/lib/quotation-utils'
import Quotation3GoodsTable from './Quotation3GoodsTable'

interface Quotation3InvoiceContentProps {
  data: QuotationData
  shippingData?: any
  billingData?: any
  rawQuotationData?: any
}

export default function Quotation3InvoiceContent({
  data,
  shippingData,
  billingData,
  rawQuotationData,
}: Quotation3InvoiceContentProps) {
  // Use dummy data as default fallbacks to match screenshot exactly
  const quotationInfo = rawQuotationData?.Name ? `${rawQuotationData.Name} dt ${data.date || rawQuotationData.Created_Date_and_time}` : '11101 dt 28.06.2024';
  const buyerEnquiryNo = data.buyerEnquiryNo || rawQuotationData?.customer_Reference || 'Email';
  const buyerEnquiryDate = data.customerReferenceDate || rawQuotationData?.Customer_Reference_Date || '10-Nov-2022';
  
  const otherReference = rawQuotationData?.Additional_info || (
    <>
      Panel-1 98PXL17000231<br />
      Panel-2 98PXL20000231<br />
      Panel-3 98ED30000123
    </>
  );

  const consignee = resolveConsigneeDisplay(shippingData, rawQuotationData)
  const consigneePhone = resolveConsigneePhone(shippingData, rawQuotationData)

  const countryOfOrigin = rawQuotationData?.Billing_Country || 'India';
  const countryOfDestination = rawQuotationData?.Shipping_Country || shippingData?.Shipping_Country || 'USA';
  const termsOfPayment = data.termsOfPayment || rawQuotationData?.Term_of_Payment || '100% Advance';
  
  const modeOfDelivery = rawQuotationData?.Mode_of_Delivery || data.termsOfDelivery || '';
  const portOfLoading = rawQuotationData?.Port_of_Loading || 'Any Indian Port';
  const portOfDischarge = rawQuotationData?.Port_of_Discharge || '';
  const finalDestination = rawQuotationData?.Final_Destination || 'USA';
  
  const dispatchExWorks = rawQuotationData?.Delivery_Date_Control || data.deliveryDate || '1st 1000 panels each type -  14-15 weeks from date of PO and advance.Then on, as per schedule ( 1000 panels each type, every 2 months).';
  const ourBankDetails = quotationRichText(rawQuotationData, 'Our_Bank_Details')

  return (
    <>
      <div className="performa-invoice-content-section performa-invoice-content-section--seamless" style={{ marginBottom: '8px' }}>
        <Quotation3GoodsTable
          data={data}
          rawQuotationData={rawQuotationData}
          shippingData={shippingData}
          headerNode={
            <table
              className="quotation3-header-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #000',
                marginBottom: 0,
                tableLayout: 'fixed',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              <tbody>
                <tr>
                  <td colSpan={2} style={{ border: '1px solid #000', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', padding: '2px', backgroundColor: '#f9f9f9' }}>
                    QUOTATION
                  </td>
                </tr>
                <tr>
                  <td style={{ width: '53%', verticalAlign: 'top', border: '1px solid #000', padding: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Exporter</div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                      <img
                        src="/wmw-logo.svg"
                        alt="WMW Logo"
                        style={{ width: '160px', height: '62px', objectFit: 'contain', display: 'block' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '3px', color: '#333' }}>WMW METAL FABRICS LIMITED</div>
                    <div style={{ textAlign: 'center', fontSize: '13px', marginBottom: '4px', color: '#444' }}>53, Industrial Area: Jhotwara, Jaipur 302012 India</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#444' }}>
                      <span>Tel : +911417105151</span>
                      <span>info@wmwindia.com</span>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px', color: '#444' }}>
                      <span>www.wmwindia.com</span>
                    </div>
                  </td>
                  <td style={{ width: '47%', verticalAlign: 'top', border: '1px solid #000', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '4px 6px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Quotation No. &amp; Date</div>
                            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                              {quotationInfo}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '4px 6px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Buyer&apos;s Enquiry No. &amp; Date</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#7e22ce', fontWeight: 'normal' }}>{buyerEnquiryNo}</span>
                              <span style={{ color: '#7e22ce', fontWeight: 'bold' }}>Dt. {buyerEnquiryDate}</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '4px 6px', verticalAlign: 'top', minHeight: '80px', height: '80px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Other Reference (s)</div>
                            <div style={{ lineHeight: '1.4' }}>{otherReference}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style={{ width: '53%', verticalAlign: 'top', border: '1px solid #000', padding: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>Consignee</div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{consignee.name}</div>
                    <div style={{ fontSize: '12px', lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>{consignee.addressBlock}</div>
                    <div style={{ fontSize: '12px', lineHeight: 1.3 }}>{consignee.country}</div>
                    {consigneePhone ? (
                      <div style={{ fontSize: '12px', marginTop: '6px' }}>Phone: {consigneePhone}</div>
                    ) : null}
                  </td>
                  <td style={{ width: '47%', verticalAlign: 'top', border: '1px solid #000', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', height: '100%' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '50%', border: '1px solid #000', padding: '4px 6px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '2px', color: '#555' }}>Country of Origin of Goods</div>
                            <div>{countryOfOrigin}</div>
                          </td>
                          <td style={{ width: '50%', border: '1px solid #000', padding: '4px 6px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '2px', color: '#555' }}>Country of Final Destination</div>
                            <div>{countryOfDestination}</div>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ border: '1px solid #000', padding: '4px 6px', verticalAlign: 'top', height: '100%' }}>
                            <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px', color: '#555' }}>Terms of Payment</div>
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
                  <td style={{ width: '53%', verticalAlign: 'top', border: '1px solid #000', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'fixed', height: '100%' }}>
                      <colgroup>
                        <col style={{ width: '50%' }} />
                        <col style={{ width: '50%' }} />
                      </colgroup>
                      <tbody>
                        <tr style={{ height: '50%' }}>
                          <td style={{ border: '1px solid #000', padding: '4px 6px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', color: '#333' }}>Carriage by</div>
                            <div>{modeOfDelivery}</div>
                          </td>
                          <td style={{ border: '1px solid #000', padding: '4px 6px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', color: '#333' }}>Port of Loading</div>
                            <div>{portOfLoading}</div>
                          </td>
                        </tr>
                        <tr style={{ height: '50%' }}>
                          <td style={{ border: '1px solid #000', padding: '4px 6px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', color: '#333' }}>Port of Discharge</div>
                            <div>{portOfDischarge}</div>
                          </td>
                          <td style={{ border: '1px solid #000', padding: '4px 6px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', color: '#333' }}>Final Destination</div>
                            <div>{finalDestination}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ width: '47%', verticalAlign: 'top', border: '1px solid #000', padding: '4px 6px', fontSize: '12px' }}>
                    <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px', color: '#333' }}>Dispatch Ex-Works</div>
                    <div style={{ lineHeight: '1.3' }}>{dispatchExWorks}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          }
          footerNode={
            <table
              className="quotation-header-master-table quotation-summary-follow-master-table"
              style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif' }}
            >
              <tbody>
                <tr className="quotation-master-body-row quotation-master-body-row--summary">
                  <td colSpan={2} className="quotation-seamless-stack">
                    <table className="quotation-stack-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '60%', border: '1px solid #000', padding: '4px 6px' }}>
                            HS Code: {rawQuotationData?.HS_Code || '73141200'}
                          </td>
                          <td style={{ width: '40%', border: '1px solid #000', padding: '4px 6px' }}>
                            Offer Validity : {resolveQuotationValidity(rawQuotationData as Record<string, unknown> | undefined)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '4px 6px' }}>
                            Remarks
                          </td>
                          <td style={{ border: '1px solid #000', padding: '4px 6px', fontWeight: 'bold', textAlign: 'center' }}>
                            For WMW Metal Fabrics Ltd.
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', lineHeight: '1.4' }}>
                            1. Please mention this quotation number on your PO and all communications<br />
                            2. In case of extreme currency volatility prices maybe revised at anytime.<br />
                            3. This quotation is valid only for the products &amp; quantity mentioned.<br />
                            4. Packing : Export worthy packing<br />
                            5. ISPM 15 (Phytosanitory) Certification for Packing Material - provided on request<br />
                            6. All Foreign Bank charges on Purchaser Account.
                          </td>
                          <td style={{ border: '1px solid #000', padding: '16px 8px', textAlign: 'center', verticalAlign: 'middle', height: '80px' }}>
                            This is an electronically generated document,<br />no signatrue required.
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ border: '1px solid #000', padding: '4px 6px', fontSize: '9px', color: '#666' }}>
                            <div style={{ marginBottom: '2px' }}>Registered office address: Ricoh Business Zone, Salt Lake Electronics Complex, Plot No-A1/1&amp;2, Block-GP, Sector V, Kolkata-700091, West Bengal</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '2px' }}>
                              <span>Doc No.: WMW/MKT/F.1 (Rev.00)</span>
                              <span>Subject to Terms &amp; Conditions listed on our website</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          }
        />
      </div>

      <div className="conditions-for-print conditions-doc" style={{ border: '1px solid #000', padding: '16px', marginTop: '24px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '16px' }}>STANDARD CONDITIONS OF SALE:</h1>

        <p style={{ marginBottom: '16px', lineHeight: 1.6 }}>
          <strong>Pretext -</strong> In the below stated terms and conditions of the sale, WMW Metal Fabrics Ltd., hereby referred to as &apos;The Company&apos; is holding the entity mentioned in the invoice, here by referred to as &quot;The Buyer&quot; liable to all stated terms as on the date of this invoice.
        </p>

        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>1. Contract</div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>1.1.</strong> All quotations and orders are subject to these conditions. In the event of any inconsistency between these conditions and the Buyers conditions of purchase or supply, these conditions shall prevail. The Buyer irrevocably accepts these conditions.</p>
        </div>

        {/* ... Include the rest of the conditions similarly... */}
        <div className="section" style={{ marginBottom: '16px' }}>
          <div className="section-title" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>2. DELIVERY</div>
          <p style={{ marginBottom: '8px', lineHeight: 1.6 }}><strong>2.1.</strong> Goods will be delivered to the location specified in the acceptance of order on the terms as per order. Unless specifically agreed in writing any date for delivery specified by the company is an estimate only and any failure to deliver goods by that shall not constitute a breach of contract or negligence.</p>
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
