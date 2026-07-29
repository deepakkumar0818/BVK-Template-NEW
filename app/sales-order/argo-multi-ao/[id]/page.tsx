import SalesOrderPrintButton from '@/app/components/sales-order/SalesOrderPrintButton'
import MultiOrderAcceptanceOfOrderContent from '@/app/components/sales-order/MultiOrderAcceptanceOfOrderContent'
import { argoMultiAoFixture } from '@/app/components/sales-order/fixtures/argo-multi-ao'

export default function ArgoMultiAoPage() {
  return (
    <>
      <div className="sales-order-screen-only sales-order-screen-toolbar">
        <SalesOrderPrintButton />
      </div>
      <MultiOrderAcceptanceOfOrderContent data={argoMultiAoFixture} />
    </>
  )
}
