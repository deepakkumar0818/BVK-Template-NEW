'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PrintButton from './components/PrintButton'
import QuotationTemplateByType from './components/QuotationTemplateByType'
import { ZohoQuotationResponse, ShippingMasterResponse, BillingMasterResponse, TemplateType, ZohoQuotation, QuotationData } from '@/lib/types'
import { transformQuotationData, determineTemplateType } from '@/lib/quotation-utils'
import { TEST_TEMPLATE_ROUTES } from '@/lib/test-template-routes'

function QuotationPageContent() {
  const searchParams = useSearchParams()
  const [quotationData, setQuotationData] = useState<QuotationData | null>(null)
  const [rawQuotationData, setRawQuotationData] = useState<ZohoQuotation | null>(null)
  const [shippingData, setShippingData] = useState<unknown>(null)
  const [billingData, setBillingData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [templateType, setTemplateType] = useState<TemplateType>('WI')

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        setLoading(true)
        setError(null)

        const id = searchParams.get('id') || searchParams.get('perm') || ''
        const url = id ? `/api/zoho-quotations?id=${encodeURIComponent(id)}` : '/api/zoho-quotations'

        const response = await fetch(url)
        const data: ZohoQuotationResponse = await response.json()

        if (!response.ok || data.code !== 3000 || !data.data || data.data.length === 0) {
          throw new Error(data.error || 'No quotation data found')
        }

        const quotation = data.data[0]
        setRawQuotationData(quotation)

        const typeOfQuotation = quotation.Type_Of_Quotation
        const templateField = quotation.Template
        const autoTemplateType = determineTemplateType(typeOfQuotation, templateField)
        setTemplateType(autoTemplateType)

        const transformed = transformQuotationData(quotation, autoTemplateType, templateField)
        setQuotationData(transformed)

        if (quotation.Account_Module?.CRM_Account_ID) {
          const accountId = quotation.Account_Module.CRM_Account_ID

          try {
            const shippingResponse = await fetch(`/api/zoho-shipping-masters?account_id=${encodeURIComponent(accountId)}`)
            const shippingResult: ShippingMasterResponse = await shippingResponse.json()
            if (shippingResponse.ok && shippingResult.code === 3000 && shippingResult.data && shippingResult.data.length > 0) {
              const primaryShipping = shippingResult.data.find((item: any) => item.Address_Type === 'Primary')
              setShippingData(primaryShipping || shippingResult.data[0])
            }
          } catch (err) {
            console.error('Error fetching shipping masters:', err)
          }

          try {
            const billingResponse = await fetch(`/api/zoho-billing-masters?account_id=${encodeURIComponent(accountId)}`)
            const billingResult: BillingMasterResponse = await billingResponse.json()
            if (billingResponse.ok && billingResult.code === 3000 && billingResult.data && billingResult.data.length > 0) {
              const primaryBilling = billingResult.data.find((item: any) => item.Address_Type === 'Primary')
              setBillingData(primaryBilling || billingResult.data[0])
            }
          } catch (err) {
            console.error('Error fetching billing masters:', err)
          }
        }
      } catch (err) {
        console.error('Error fetching quotation:', err)
        setError(err instanceof Error ? err.message : 'Failed to load quotation')
      } finally {
        setLoading(false)
      }
    }

    fetchQuotation()
  }, [searchParams])

  const currentIdFromUrl = searchParams.get('id') || searchParams.get('perm') || ''
  const routeTemplates = [
    { key: 'ekamas', label: 'ekamas' },
    { key: 'bashundhara', label: 'bashundhara' },
    { key: 'adhunik', label: 'adhunik' },
    { key: 'perfomainvoice', label: 'perfomainvoice' },
    { key: 'seamp', label: 'seamp' },
    { key: 'ekamass', label: 'ekamass' },
    { key: 'wmwquotation', label: 'wmwquotation' },
    { key: 'everite', label: 'everite' },
    { key: 'performa', label: 'performa' },
    { key: 'wmw-quotation', label: 'wmw-quotation' },
    { key: 'quotation3', label: 'quotation3' },
    { key: 'saint', label: 'saint' },
  ] as const

  return (
    <main className="quotation-doc" style={{ padding: '16px' }}>
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <PrintButton />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}
        >
          <div style={{ fontWeight: 'bold', marginRight: '8px', color: '#666' }}>Test Templates:</div>
          {TEST_TEMPLATE_ROUTES.map((t) =>
            currentIdFromUrl ? (
              <Link
                key={t.path}
                href={`/${t.path}/${encodeURIComponent(currentIdFromUrl)}`}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 'normal',
                  backgroundColor: '#fff',
                  color: '#333',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                }}
              >
                {t.label}
              </Link>
            ) : (
              <span
                key={t.path}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 'normal',
                  backgroundColor: '#f3f4f6',
                  color: '#9ca3af',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  cursor: 'not-allowed',
                }}
                title="Load a quotation with ?id=… first"
              >
                {t.label}
              </span>
            )
          )}

          <div style={{ width: '100%', height: '1px', backgroundColor: '#ddd', margin: '8px 0' }} />
          <div style={{ fontWeight: 'bold', marginRight: '8px', color: '#666' }}>Route Templates:</div>
          {routeTemplates.map((t) =>
            currentIdFromUrl ? (
              <Link
                key={t.key}
                href={`/${t.key}/${encodeURIComponent(currentIdFromUrl)}`}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 'normal',
                  backgroundColor: '#fff',
                  color: '#333',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                }}
              >
                {t.label}
              </Link>
            ) : (
              <span
                key={t.key}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 'normal',
                  backgroundColor: '#f3f4f6',
                  color: '#9ca3af',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  cursor: 'not-allowed',
                }}
                title="Load a quotation with ?id=… first"
              >
                {t.label}
              </span>
            )
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div>Loading quotation data...</div>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#d32f2f' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error loading quotation</div>
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
        />
      )}
    </main>
  )
}

export default function QuotationPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading quotation...</div>
        </main>
      }
    >
      <QuotationPageContent />
    </Suspense>
  )
}
