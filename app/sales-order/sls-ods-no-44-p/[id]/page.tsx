import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import OrderDetailSheetContent from '@/app/components/sales-order/OrderDetailSheetContent'
import { slsOdsNo44PFixture } from '@/app/components/sales-order/fixtures/sls-ods-no-44-p'

export default function SlsOdsNo44PPage() {
  return (
    <>
      <div className="sales-order-screen-only sales-order-screen-toolbar">
        <SalesOrderPrintButton />
      </div>
      <OrderDetailSheetContent data={slsOdsNo44PFixture} />
    </>
  )
}
