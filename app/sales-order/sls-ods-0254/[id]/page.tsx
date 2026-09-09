'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import SlsOds0254Content from '@/app/components/sales-order/SlsOds0254Content'
import { slsOds0254Fixture } from '@/app/components/sales-order/fixtures/sls-ods-0254'
import { mapSls0254, type Sls0254Data } from '@/lib/sls-ods-0254-mapping'

/**
 * ISOLATED to sls-ods-0254 only. Only O.D.S/O.D.S Date/Client, the Wire
 * Details table, and 5 terms fields (Payment Terms/Payment Mode/Packing
 * Chargs/Insurance/Destination) are live — everything else stays on the
 * static fixture (Order Details box explicitly untouched per spec). Other
 * sales-order variants are unaffected.
 */
export default function SlsOds0254Page() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''

  const [data, setData] = useState<Sls0254Data | null>(null)
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
        setData(mapSls0254(record))
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
        <SlsOds0254Content
          fixture={slsOds0254Fixture}
          odsNo={data.odsNo}
          odsDate={data.odsDate}
          clientName={data.clientName}
          wireDetails={data.wireDetails}
          paymentTerms={data.paymentTerms}
          paymentMode={data.paymentMode}
          packingCharges={data.packingCharges}
          insurance={data.insurance}
          destination={data.destination}
        />
      )}
    </>
  )
}
