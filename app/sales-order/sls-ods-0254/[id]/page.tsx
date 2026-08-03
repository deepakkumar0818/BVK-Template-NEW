import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import SecondarySalesOdsContent from '@/app/components/sales-order/SecondarySalesOdsContent'
import { slsOds0254Fixture } from '@/app/components/sales-order/fixtures/sls-ods-0254'

export default function SlsOds0254Page() {
  return (
    <>
      <div className="sales-order-screen-only sales-order-screen-toolbar">
        <SalesOrderPrintButton />
      </div>
      <SecondarySalesOdsContent data={slsOds0254Fixture} />
    </>
  )
}
