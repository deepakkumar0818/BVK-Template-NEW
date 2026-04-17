import { Suspense } from 'react'
import AdhunikPageContent from '../../components/AdhunikPageContent'

export default function AdhunikPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading Adhunik Invoice...</div>
        </main>
      }
    >
      <AdhunikPageContent />
    </Suspense>
  )
}
