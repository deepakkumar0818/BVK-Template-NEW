'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import ArgoMultiAoHydrotechContent from '@/app/components/sales-order/ArgoMultiAoHydrotechContent'
import { argoMultiAoHydrotechFixture } from '@/app/components/sales-order/fixtures/argo-multi-ao-hydrotech'
import { mapSlsOdsNo44, type SlsOdsNo44Data } from '@/lib/sls-ods-no-44-mapping'

/**
 * ISOLATED to argo-multi-ao-hydrotech only — same live pipeline as
 * argo-multi-ao (/api/zoho-sales-order-report + mapSlsOdsNo44), rendered
 * through ArgoMultiAoHydrotechContent (BVK top-left/right header images,
 * text-based footer — see that file's header comment for the two
 * deliberate differences from argo-multi-ao). The static fixture/
 * MultiOrderAcceptanceOfOrderContent path is no longer used for this
 * variant. Other sales-order variants are unaffected.
 */
export default function ArgoMultiAoHydrotechPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''

  const [data, setData] = useState<SlsOdsNo44Data | null>(null)
  // Subject line — live `Acceptance_of_Order_Mention`, read directly here
  // (not shared with sls-ods-no-44-mapping.ts, same as argo-multi-ao).
  const [subject, setSubject] = useState('')
  // Date row — `Created_Date_and_time`, read directly here so this form can
  // diverge from sls-ods-no-44's ODS_DATE-based odsDate.
  const [date, setDate] = useState('')
  // Shown right after the Subject paragraph — root `Order_of_Acceptance_Header`.
  const [orderOfAcceptanceHeader, setOrderOfAcceptanceHeader] = useState('')
  // Replaces the old static fixture.bodyClosingParas text — root `Order_of_Acceptance_Remarks`.
  const [orderOfAcceptanceRemarks, setOrderOfAcceptanceRemarks] = useState('')
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
        setDate(String(record?.Created_Date_and_time ?? '').trim().split(' ')[0] ?? '')
        setOrderOfAcceptanceHeader(String(record?.Order_of_Acceptance_Header ?? '').trim())
        setOrderOfAcceptanceRemarks(String(record?.Order_of_Acceptance_Remarks ?? '').trim())
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
        <ArgoMultiAoHydrotechContent
          fixture={argoMultiAoHydrotechFixture}
          lines={data.lines}
          shippingAddressLines={data.shippingAddressLines}
          subject={subject}
          date={date}
          currency={data.currency}
          orderNo={data.odsNo}
          deliverySchedule={data.deliverySchedule}
          orderOfAcceptanceHeader={orderOfAcceptanceHeader}
          orderOfAcceptanceRemarks={orderOfAcceptanceRemarks}
        />
      )}
    </>
  )
}
