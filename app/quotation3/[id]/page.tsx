import { Suspense } from 'react'
import Quotation3PageContent from '../../components/Quotation3PageContent'

export default function Quotation3Page() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading Quotation3...</div>
        </main>
      }
    >
      <Quotation3PageContent />
    </Suspense>
  )
}
