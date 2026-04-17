import { Suspense } from 'react'
import PerfomainvoicePageContent from '../../components/PerfomainvoicePageContent'

export default function PerfomainvoicePage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading Perfomainvoice...</div>
        </main>
      }
    >
      <PerfomainvoicePageContent />
    </Suspense>
  )
}
