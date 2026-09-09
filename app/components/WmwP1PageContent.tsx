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
import { logQuotationPayloadForUrlId } from '@/lib/log-quotation-payload'
import { transformQuotationData, determineTemplateType } from '@/lib/quotation-utils'
import PrintButton from './PrintButton'
import WmwP1InvoiceContent from './WmwP1InvoiceContent'

export default function WmwP1PageContent() {
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
        logQuotationPayloadForUrlId(id, quotation, 'wmw-p1')
        setRawQuotationData(quotation)

        // Debug: pull the linked Deal record via the new /api/zoho-deals
        // proxy (Zoho CRM v8 Get Records) and dump it in the browser
        // console. Runs asynchronously so the render isn't blocked.
        const dealId = String(
          (quotation as unknown as Record<string, unknown>)?.Deal_Id_s ?? ''
        ).trim()
        if (dealId) {
          fetch(`/api/zoho-deals?id=${encodeURIComponent(dealId)}`)
            .then((r) => r.json())
            .then((dealJson) => {
              // eslint-disable-next-line no-console
              console.log('[Deal_Id_s]', dealId, '→ Zoho CRM Deal payload:', dealJson)

              // Pull Contact_Name.id off the first Deal row and chain a
              // second Zoho CRM v8 call to the Contacts module.
              const dealRow = (dealJson?.data?.[0] ?? null) as
                | Record<string, unknown>
                | null
              const contactField = dealRow?.Contact_Name as
                | { id?: string }
                | null
                | undefined
              const contactId = String(contactField?.id ?? '').trim()

              if (contactId) {
                fetch(`/api/zoho-contacts?id=${encodeURIComponent(contactId)}`)
                  .then((r) => r.json())
                  .then((contactJson) => {
                    // eslint-disable-next-line no-console
                    console.log(
                      '[Contact_Name.id]', contactId,
                      '→ Zoho CRM Contact payload:', contactJson
                    )
                  })
                  .catch((e) => {
                    // eslint-disable-next-line no-console
                    console.error('[Contact_Name.id]', contactId, '→ fetch failed:', e)
                  })
              } else {
                // eslint-disable-next-line no-console
                console.log('[Contact_Name.id] not present on Deal payload')
              }
            })
            .catch((e) => {
              // eslint-disable-next-line no-console
              console.error('[Deal_Id_s]', dealId, '→ fetch failed:', e)
            })
        } else {
          // eslint-disable-next-line no-console
          console.log('[Deal_Id_s] not present on this quotation record')
        }

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
          <div>Loading WMW P1 Invoice...</div>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#d32f2f' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error loading WMW P1 Invoice</div>
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
                  <WmwP1InvoiceContent
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
