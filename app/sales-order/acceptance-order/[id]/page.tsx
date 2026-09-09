import { Suspense } from 'react'
import AcceptanceOrderPageContent from '@/app/components/AcceptanceOrderPageContent'

export default function AcceptanceOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="sales-order-screen-only" style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading Acceptance of Order...</div>
        </div>
      }
    >
      <AcceptanceOrderPageContent />
    </Suspense>
  )
}
