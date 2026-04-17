'use client'

import type { QuotationData, TemplateType, ZohoQuotation } from '@/lib/types'
import QuotationContent from './QuotationContent'
import PerformaInvoiceContent from './PerformaInvoiceContent'
import ExportQuotationContent from './ExportQuotationContent'
import Wmwe1QuotationContent from './Wmwe1QuotationContent'
import SLSQuotationContent from './SLSQuotationContent'
import GKDQuotationContent from './GKDQuotationContent'
import BVKQuotationContent from './BVKQuotationContent'

const headerSupplierCell = (
  <td style={{ width: '55%', verticalAlign: 'top', border: '1px solid #000', padding: '12px' }}>
    <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Supplier</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
      <div
        style={{
          width: '48px',
          height: '48px',
          background: '#1e40af',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '14px',
        }}
      >
        wmw
      </div>
      <div style={{ fontWeight: 'bold', fontSize: '12px' }}>METAL FABRICS</div>
    </div>
    <div style={{ fontWeight: 'bold' }}>WMW Metal Fabrics Ltd</div>
    <div>53, Industrial Area, Jhotwara, Jaipur-302012, Rajasthan, India</div>
    <div>Tel: +91.141.7105151</div>
    <div>www.wmwindia.com</div>
    <div>info@wmwindia.com</div>
    <div>GSTIN: 08AAACW2620D1Z8</div>
    <div>CIN: U27109WB1995PLC068681</div>
  </td>
)

/** WMW2 performa header right cell (bordered grid) — only used in that layout. */
function wmw2HeaderQuotationCell(quotationData: QuotationData) {
  return (
    <td style={{ width: '45%', verticalAlign: 'top', border: '1px solid #000', padding: '12px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '4px 8px', width: '50%' }}>
              <strong>Quotation No</strong>
            </td>
            <td style={{ border: '1px solid #000', padding: '4px 8px', width: '30%' }}>{quotationData.quotationNumber}</td>
            <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right', width: '10%' }}>
              <strong>Date</strong>
            </td>
            <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right', width: '10%' }}>{quotationData.date}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
              <strong>Buyer,S Enquiry N</strong>
            </td>
            <td style={{ border: '1px solid #000', padding: '4px 8px' }}>{quotationData.buyerEnquiryNo || ''}</td>
            <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>
              <strong>Date</strong>
            </td>
            <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>
              {quotationData.customerReferenceDate || quotationData.date}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
              <strong>Terms Of Payment</strong>
            </td>
            <td colSpan={3} style={{ border: '1px solid #000', padding: '4px 8px' }}>
              {quotationData.termsOfPayment || ''}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
              <strong>Inco Terms</strong>
            </td>
            <td colSpan={3} style={{ border: '1px solid #000', padding: '4px 8px' }}>
              {quotationData.incoTerms || ''}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
              <strong>Terms Of Delivery</strong>
            </td>
            <td colSpan={3} style={{ border: '1px solid #000', padding: '4px 8px' }}>
              {quotationData.termsOfDelivery || ''}
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  )
}

export interface QuotationTemplateByTypeProps {
  templateType: TemplateType
  quotationData: QuotationData
  rawQuotationData: ZohoQuotation
  shippingData?: unknown
  billingData?: unknown
}

/**
 * Renders the same quotation layouts as the home page “Test Templates” switcher (WI, WMW, WMW2, …).
 */
export default function QuotationTemplateByType({
  templateType,
  quotationData,
  rawQuotationData,
  shippingData,
  billingData,
}: QuotationTemplateByTypeProps) {
  return (
    <div className="print-container">
      {templateType === 'EXPORT' ? (
        <ExportQuotationContent
          data={quotationData}
          shippingData={shippingData}
          billingData={billingData}
          rawQuotationData={rawQuotationData}
        />
      ) : templateType === 'WMWE1' ? (
        <Wmwe1QuotationContent
          data={quotationData}
          shippingData={shippingData}
          billingData={billingData}
          rawQuotationData={rawQuotationData}
        />
      ) : templateType === 'SLS' ? (
        <SLSQuotationContent
          data={quotationData}
          shippingData={shippingData}
          billingData={billingData}
          rawQuotationData={rawQuotationData}
        />
      ) : templateType === 'GKD' ? (
        <GKDQuotationContent
          data={quotationData}
          shippingData={shippingData}
          billingData={billingData}
          rawQuotationData={rawQuotationData}
        />
      ) : templateType === 'BVK' ? (
        <BVKQuotationContent
          data={quotationData}
          shippingData={shippingData}
          billingData={billingData}
          rawQuotationData={rawQuotationData}
        />
      ) : templateType === 'WMW' ? (
        <table className="print-doc-table" style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top', border: 'none', padding: 0 }}>
                <PerformaInvoiceContent
                  data={quotationData}
                  shippingData={shippingData}
                  billingData={billingData}
                  rawQuotationData={rawQuotationData}
                  useWmwd1StyleLayout
                />
              </td>
            </tr>
          </tbody>
        </table>
      ) : templateType === 'WMW2' ? (
        <table className="print-doc-table" style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
          <thead>
            <tr>
              {headerSupplierCell}
              {wmw2HeaderQuotationCell(quotationData)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2} style={{ verticalAlign: 'top', border: 'none', padding: 0 }}>
                <PerformaInvoiceContent
                  data={quotationData}
                  shippingData={shippingData}
                  billingData={billingData}
                  rawQuotationData={rawQuotationData}
                />
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <table className="print-doc-table" style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top', border: 'none', padding: 0 }}>
                <QuotationContent
                  data={quotationData}
                  shippingData={shippingData}
                  billingData={billingData}
                  rawQuotationData={rawQuotationData}
                />
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}
