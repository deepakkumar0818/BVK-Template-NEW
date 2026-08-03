import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import MultiOrderAcceptanceOfOrderContent from '@/app/components/sales-order/MultiOrderAcceptanceOfOrderContent'
import { argoMultiAoHydrotechFixture } from '@/app/components/sales-order/fixtures/argo-multi-ao-hydrotech'

export default function ArgoMultiAoHydrotechPage() {
  return (
    <>
      <div className="sales-order-screen-only sales-order-screen-toolbar">
        <SalesOrderPrintButton />
      </div>
      <MultiOrderAcceptanceOfOrderContent data={argoMultiAoHydrotechFixture} />
    </>
  )
}
