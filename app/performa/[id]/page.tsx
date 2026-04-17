import { Suspense } from 'react'
import PerformaPageContent from '../../components/PerformaPageContent'

export default function PerformaPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading Performa...</div>
        </main>
      }
    >
      <PerformaPageContent />
    </Suspense>
  )
}

