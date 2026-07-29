import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import ExportAcceptanceOfOrderContent from '@/app/components/sales-order/ExportAcceptanceOfOrderContent'
import { exportAoEkamasFixture } from '@/app/components/sales-order/fixtures/export-ao-ekamas'

export default function ExportAoEkamasPage() {
  return (
    <>
      <div className="sales-order-screen-only sales-order-screen-toolbar">
        <SalesOrderPrintButton />
      </div>
      <ExportAcceptanceOfOrderContent data={exportAoEkamasFixture} />
    </>
  )
}
