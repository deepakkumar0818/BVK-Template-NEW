import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import OrderDetailSheetContent from '@/app/components/sales-order/OrderDetailSheetContent'
import { slsOds50PFixture } from '@/app/components/sales-order/fixtures/sls-ods-50-p'

export default function SlsOds50PPage() {
  return (
    <>
      <div className="sales-order-screen-only sales-order-screen-toolbar">
        <SalesOrderPrintButton />
      </div>
      <OrderDetailSheetContent data={slsOds50PFixture} />
    </>
  )
}
