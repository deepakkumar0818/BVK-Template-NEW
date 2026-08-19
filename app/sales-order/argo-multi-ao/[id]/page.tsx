'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import ArgoMultiAoContent from '@/app/components/sales-order/ArgoMultiAoContent'
import { argoMultiAoFixture } from '@/app/components/sales-order/fixtures/argo-multi-ao'
import { mapSlsOdsNo44, type SlsOdsNo44Data } from '@/lib/sls-ods-no-44-mapping'

/**
 * ISOLATED to argo-multi-ao only. Header/subject/greeting/closing
 * paragraphs/signature/footer stay on the static fixture, unchanged. The
 * order table AND the recipient block ("TO," / company / address) are live:
 * fetched from /api/zoho-sales-order-report and mapped through
 * mapSlsOdsNo44 (same pipeline as sls-ods-no-44) — recipient uses
 * shippingAddressLines only (Shipping_Address_Name + Shipping_Street/City/
 * State/Postal/Country), not the fixture's static recipient. argo-multi-ao-
 * hydrotech and the other Order Detail Sheet variants are untouched.
 */
export default function ArgoMultiAoPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''

  const [data, setData] = useState<SlsOdsNo44Data | null>(null)
  // Subject line — argo-multi-ao-specific field, not shared with sls-ods-no-44,
  // so read directly here rather than adding it to lib/sls-ods-no-44-mapping.ts.
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('Missing sales order id in URL')
      setLoading(false)
      return
    }

    const fetchSalesOrder = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/zoho-sales-order-report?id=${encodeURIComponent(id)}`)
        const json = await response.json()

        if (!response.ok || json.code !== 3000 || !json.data || json.data.length === 0) {
          throw new Error(json.error || 'No sales order data found')
        }

        const record = json.data[0]
        console.log(`Sales Order Report — record ${id}:`, record)
        setData(mapSlsOdsNo44(record))
        setSubject(String(record?.Acceptance_of_Order_Mention ?? '').trim())
      } catch (err) {
        console.error('Error fetching sales order:', err)
        setError(err instanceof Error ? err.message : 'Failed to load sales order')
      } finally {
        setLoading(false)
      }
    }

    fetchSalesOrder()
  }, [id])

  return (
    <>
      <div className="sales-order-screen-only sales-order-screen-toolbar">
        <SalesOrderPrintButton />
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div>Loading sales order…</div>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#d32f2f' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error loading sales order</div>
          <div>{error}</div>
        </div>
      )}

      {!loading && !error && data && (
        <ArgoMultiAoContent
          fixture={argoMultiAoFixture}
          lines={data.lines}
          shippingAddressLines={data.shippingAddressLines}
          subject={subject}
        />
      )}
    </>
  )
}
