import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import OrderDetailSheetContent from '@/app/components/sales-order/OrderDetailSheetContent'
import { slsOdsNo44Fixture } from '@/app/components/sales-order/fixtures/sls-ods-no-44'

export default function SlsOdsNo44SalesOrderPage() {
  return (
    <>
      <div className="sales-order-screen-only sales-order-screen-toolbar">
        <SalesOrderPrintButton />
      </div>
      <OrderDetailSheetContent data={slsOdsNo44Fixture} />
    </>
  )
}
