'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type {
  BillingMasterResponse,
  QuotationData,
  ShippingMasterResponse,
  TemplateType,
  ZohoQuotation,
  ZohoQuotationResponse,
} from '@/lib/types'
import { logQuotationPayloadForUrlId } from '@/lib/log-quotation-payload'
import { transformQuotationData } from '@/lib/quotation-utils'
import PrintButton from './PrintButton'
import QuotationTemplateByType from './QuotationTemplateByType'

export interface ForcedTemplatePageContentProps {
  templateType: TemplateType
  /** Shown in loading / error UI */
  documentLabel: string
  /** WMW wmwd1 route only: document title in master header (default unchanged when omitted). */
  wmwd1DocumentTitle?: string
  /** WMW `/quotation/[id]` only: Notes from API (`Inside_Quotation_Text`, then `Please_Note`). */
  wmwd1NotesRemarksFromApi?: boolean
  /** `/wmw/[id]` only: enable WMW print pagination (head 7 / last 5 max). */
  useWmwPagination?: boolean
}

export default function ForcedTemplatePageContent({
  templateType,
  documentLabel,
  wmwd1DocumentTitle,
  wmwd1NotesRemarksFromApi,
  useWmwPagination,
}: ForcedTemplatePageContentProps) {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''

  const [quotationData, setQuotationData] = useState<QuotationData | null>(null)
  const [rawQuotationData, setRawQuotationData] = useState<ZohoQuotation | null>(null)
  const [shippingData, setShippingData] = useState<unknown>(null)
  const [billingData, setBillingData] = useState<unknown>(null)
  // CRM Contact for the recipient line — resolved via
  // Quotation.Deal_Id_s → Deals.Contact_Name.id → Contacts/{id}.
  // Populated only for the four templates that use it (SLS, BVK,
  // WI_PROCESS_FEBRIC, WI_DECOMESH). Passed through to the render.
  const [contactData, setContactData] = useState<{
    salutation: string
    fullName: string
  } | null>(null)
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
        logQuotationPayloadForUrlId(id, quotation, documentLabel)
        setRawQuotationData(quotation)

        const transformed = transformQuotationData(
          quotation,
          templateType,
          quotation.Template,
          Boolean(useWmwPagination)
        )
        setQuotationData(transformed)

        // Recipient-name resolution via Deals → Contacts (only for the
        // four templates that consume it; the API calls are silent
        // no-ops on other templates because they don't read contactData).
        const templatesUsingContact: TemplateType[] = ['SLS', 'BVK', 'WI_PROCESS_FEBRIC', 'WI_DECOMESH']
        if (templatesUsingContact.includes(templateType)) {
          const dealId = String(
            (quotation as unknown as Record<string, unknown>)?.Deal_Id_s ?? ''
          ).trim()
          if (dealId) {
            try {
              const dealRes = await fetch(`/api/zoho-deals?id=${encodeURIComponent(dealId)}`)
              const dealJson = await dealRes.json()
              const dealRow = (dealJson?.data?.[0] ?? null) as
                | Record<string, unknown>
                | null
              const contactField = dealRow?.Contact_Name as { id?: string } | null | undefined
              const contactId = String(contactField?.id ?? '').trim()
              if (contactId) {
                const contactRes = await fetch(`/api/zoho-contacts?id=${encodeURIComponent(contactId)}`)
                const contactJson = await contactRes.json()
                const contactRow = (contactJson?.data?.[0] ?? null) as
                  | Record<string, unknown>
                  | null
                if (contactRow) {
                  setContactData({
                    salutation: String(contactRow?.Salutation ?? '').trim(),
                    fullName: String(contactRow?.Full_Name ?? '').trim(),
                  })
                }
              }
            } catch (err) {
              console.error('Error resolving CRM contact via Deal:', err)
            }
          }
        }

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
  }, [id, templateType])

  return (
    <main
      className={['quotation-doc', useWmwPagination ? 'quotation-doc--wmw-numbered' : '']
        .filter(Boolean)
        .join(' ')}
      style={{ padding: '8px' }}
    >
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
          <div>Loading {documentLabel}…</div>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#d32f2f' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error loading {documentLabel}</div>
          <div>{error}</div>
          <div style={{ marginTop: '16px', fontSize: '14px' }}>
            <Link href="/" style={{ color: '#1e40af', textDecoration: 'underline' }}>
              Try again
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && quotationData && rawQuotationData && (
        <QuotationTemplateByType
          templateType={templateType}
          quotationData={quotationData}
          rawQuotationData={rawQuotationData}
          shippingData={shippingData}
          billingData={billingData}
          contactData={contactData}
          wmwd1DocumentTitle={wmwd1DocumentTitle}
          wmwd1NotesRemarksFromApi={wmwd1NotesRemarksFromApi}
          useWmwPagination={useWmwPagination}
        />
      )}
    </main>
  )
}
