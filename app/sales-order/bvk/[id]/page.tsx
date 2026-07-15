import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import BvkOrderDetailSheetContent from '@/app/components/sales-order/BvkOrderDetailSheetContent'

export default function BvkSalesOrderPage() {
  return (
    <>
      <div className="sales-order-screen-only sales-order-screen-toolbar">
        <SalesOrderPrintButton />
      </div>
      <BvkOrderDetailSheetContent />
    </>
  )
}
