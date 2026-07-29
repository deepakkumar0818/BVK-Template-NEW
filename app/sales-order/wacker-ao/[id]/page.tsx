import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import AcceptanceOfOrderContent from '@/app/components/sales-order/AcceptanceOfOrderContent'
import { wackerAoFixture } from '@/app/components/sales-order/fixtures/wacker-ao'

export default function WackerAoPage() {
  return (
    <>
      <div className="sales-order-screen-only sales-order-screen-toolbar">
        <SalesOrderPrintButton />
      </div>
      <AcceptanceOfOrderContent data={wackerAoFixture} />
    </>
  )
}
