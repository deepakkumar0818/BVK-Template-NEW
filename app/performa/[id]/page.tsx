import { Suspense } from 'react'
import ProformaPageContent from '../../components/ProformaPageContent'

export default function ProformaPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading Proforma...</div>
        </main>
      }
    >
      <ProformaPageContent />
    </Suspense>
  )
}

