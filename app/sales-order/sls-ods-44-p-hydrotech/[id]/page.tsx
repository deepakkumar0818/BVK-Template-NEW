import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import OrderDetailSheetContent from '@/app/components/sales-order/OrderDetailSheetContent'
import { slsOds44PHydrotechFixture } from '@/app/components/sales-order/fixtures/sls-ods-44-p-hydrotech'

export default function SlsOds44PHydrotechPage() {
  return (
    <>
      <div className="sales-order-screen-only sales-order-screen-toolbar">
        <SalesOrderPrintButton />
      </div>
      <OrderDetailSheetContent data={slsOds44PHydrotechFixture} />
    </>
  )
}
