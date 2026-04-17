'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type {
  ZohoQuotationResponse,
  ShippingMasterResponse,
  BillingMasterResponse,
  ZohoQuotation,
  QuotationData,
} from '@/lib/types'
import { transformQuotationData, determineTemplateType } from '@/lib/quotation-utils'
import PrintButton from './PrintButton'
import SaintInvoiceContent from './SaintInvoiceContent'

export default function SaintPageContent() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''

  const [quotationData, setQuotationData] = useState<QuotationData | null>(null)
  const [rawQuotationData, setRawQuotationData] = useState<ZohoQuotation | null>(null)
  const [shippingData, setShippingData] = useState<any>(null)
  const [billingData, setBillingData] = useState<any>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!id) {
          throw new Error('Missing quotation id in URL')
        }

        const response = await fetch(`/api/zoho-quotations?id=${encodeURIComponent(id)}`)
        const data: ZohoQuotationResponse = await response.json()

        if (!response.ok || data.code !== 3000 || !data.data || data.data.length === 0) {
          throw new Error(data.error || 'No quotation data found')
        }

        const quotation = data.data[0]
        setRawQuotationData(quotation)

        const autoTemplateType = determineTemplateType(quotation.Type_Of_Quotation, quotation.Template)
        const transformed = transformQuotationData(quotation, autoTemplateType, quotation.Template)
        setQuotationData(transformed)

        if (quotation.Account_Module?.CRM_Account_ID) {
          const accountId = quotation.Account_Module.CRM_Account_ID

          try {
            const shippingResponse = await fetch(
              `/api/zoho-shipping-masters?account_id=${encodeURIComponent(accountId)}`
            )
            const shippingJson: ShippingMasterResponse = await shippingResponse.json()
            if (shippingResponse.ok && shippingJson.code === 3000 && shippingJson.data && shippingJson.data.length > 0) {
              const primaryShipping = shippingJson.data.find((item: any) => item.Address_Type === 'Primary')
              setShippingData(primaryShipping || shippingJson.data[0])
            }
          } catch (err) {
            console.error('Error fetching shipping masters:', err)
          }

          try {
            const billingResponse = await fetch(
              `/api/zoho-billing-masters?account_id=${encodeURIComponent(accountId)}`
            )
            const billingJson: BillingMasterResponse = await billingResponse.json()
            if (billingResponse.ok && billingJson.code === 3000 && billingJson.data && billingJson.data.length > 0) {
              const primaryBilling = billingJson.data.find((item: any) => item.Address_Type === 'Primary')
              setBillingData(primaryBilling || billingJson.data[0])
            }
          } catch (err) {
            console.error('Error fetching billing masters:', err)
          }
        }
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load quotation')
      } finally {
        setLoading(false)
      }
    }

    fetchQuotation()
  }, [id])

  return (
    <main className="quotation-doc" style={{ padding: '8px' }}>
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <PrintButton />
          <Link href="/" style={{ color: '#1e40af', textDecoration: 'underline', fontSize: '14px' }}>
            Back to Quotation
          </Link>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div>Loading Saint-Gobain Invoice...</div>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#d32f2f' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error loading Saint-Gobain Invoice</div>
          <div>{error}</div>
          <div style={{ marginTop: '16px', fontSize: '14px' }}>
            <Link href="/" style={{ color: '#1e40af', textDecoration: 'underline' }}>
              Try again
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && quotationData && rawQuotationData && (
        <div className="print-container">
          <table className="print-doc-table" style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
            <tbody>
              <tr>
                <td colSpan={2} style={{ verticalAlign: 'top', border: 'none', padding: 0 }}>
                  <SaintInvoiceContent
                    data={quotationData}
                    shippingData={shippingData}
                    billingData={billingData}
                    rawQuotationData={rawQuotationData}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
