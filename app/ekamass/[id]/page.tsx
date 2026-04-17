import { Suspense } from 'react'
import EkamassPageContent from '../../components/EkamassPageContent'

export default function EkamassPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading Ekamass Invoice...</div>
        </main>
      }
    >
      <EkamassPageContent />
    </Suspense>
  )
}