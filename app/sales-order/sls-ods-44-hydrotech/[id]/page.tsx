'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import SlsOds44HydrotechContent from '@/app/components/sales-order/SlsOds44HydrotechContent'
import {
  accountModuleIdFromSalesOrder,
  applicationFromAccountModuleRecord,
  mapSlsOdsNo44,
  type SlsOdsNo44Data,
} from '@/lib/sls-ods-no-44-mapping'

/**
 * ISOLATED to sls-ods-44-hydrotech only — same live pipeline as
 * sls-ods-no-44 (/api/zoho-sales-order-report + mapSlsOdsNo44), rendered
 * through SlsOds44HydrotechContent, which is an exact copy of
 * SlsOdsNo44Content.tsx (same columns) with only the logo kept as BVK
 * Hydrotech branding, per explicit request that this variant's columns
 * match sls-ods-no-44 exactly. The static fixture/OrderDetailSheetContent
 * path is no longer used for this variant. Other Order Detail Sheet
 * variants are untouched.
 */
export default function SlsOds44HydrotechPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''

  const [data, setData] = useState<SlsOdsNo44Data | null>(null)
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

        let application = ''
        const accountModuleId = accountModuleIdFromSalesOrder(record)
        if (accountModuleId) {
          try {
            const amResponse = await fetch(
              `/api/zoho-account-module-report?id=${encodeURIComponent(accountModuleId)}`
            )
            const amJson = await amResponse.json()
            if (amResponse.ok && amJson.code === 3000 && amJson.data && amJson.data.length > 0) {
              application = applicationFromAccountModuleRecord(amJson.data[0])
            }
          } catch (amErr) {
            console.error('Error fetching Account Module for Application lookup:', amErr)
          }
        }

        setData(mapSlsOdsNo44(record, application))
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

      {!loading && !error && data && <SlsOds44HydrotechContent data={data} />}
    </>
  )
}
