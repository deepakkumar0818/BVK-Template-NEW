import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import OrderDetailSheetContent from '@/app/components/sales-order/OrderDetailSheetContent'
import { slsOds50AFixture } from '@/app/components/sales-order/fixtures/sls-ods-50-a'

export default function SlsOds50APage() {
  return (
    <>
      <div className="sales-order-screen-only sales-order-screen-toolbar">
        <SalesOrderPrintButton />
      </div>
      <OrderDetailSheetContent data={slsOds50AFixture} />
    </>
  )
}
