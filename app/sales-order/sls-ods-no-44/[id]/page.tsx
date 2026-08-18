'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import SlsOdsNo44Content from '@/app/components/sales-order/SlsOdsNo44Content'
import {
  accountModuleIdFromSalesOrder,
  applicationFromAccountModuleRecord,
  mapSlsOdsNo44,
  type SlsOdsNo44Data,
} from '@/lib/sls-ods-no-44-mapping'

/**
 * ISOLATED to sls-ods-no-44 only — fetches the record by URL id from
 * /api/zoho-sales-order-report (Sales_Order_Report) and maps it through
 * lib/sls-ods-no-44-mapping.ts. The other 6 Order Detail Sheet variants are
 * untouched and still render their static fixtures via OrderDetailSheetContent.
 */
export default function SlsOdsNo44SalesOrderPage() {
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

        // Application column: look up the linked Account Module record in a
        // SEPARATE report (All_Account_Modules) by Account_Module.ID, then
        // read its Application field. Same value applied to every line item.
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
              console.log(`All_Account_Modules — record ${accountModuleId} Application:`, application)
            } else {
              console.error(`All_Account_Modules — no record found for id ${accountModuleId}:`, amJson)
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

      {!loading && !error && data && <SlsOdsNo44Content data={data} />}
    </>
  )
}
