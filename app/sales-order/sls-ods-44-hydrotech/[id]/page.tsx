import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import OrderDetailSheetContent from '@/app/components/sales-order/OrderDetailSheetContent'
import { slsOds44HydrotechFixture } from '@/app/components/sales-order/fixtures/sls-ods-44-hydrotech'

export default function SlsOds44HydrotechPage() {
  return (
    <>
      <div className="sales-order-screen-only sales-order-screen-toolbar">
        <SalesOrderPrintButton />
      </div>
      <OrderDetailSheetContent data={slsOds44HydrotechFixture} />
    </>
  )
}
