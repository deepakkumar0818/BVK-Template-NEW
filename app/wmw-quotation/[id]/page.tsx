import { Suspense } from 'react'
import WmwPageContent from '../../components/WmwPageContent'

export default function WmwPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading WMW Quotation...</div>
        </main>
      }
    >
      <WmwPageContent />
    </Suspense>
  )
}
