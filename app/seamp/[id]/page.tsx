import { Suspense } from 'react'
import SeampPageContent from '../../components/SeampPageContent'

export default function SeampPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading Seamp Invoice...</div>
        </main>
      }
    >
      <SeampPageContent />
    </Suspense>
  )
}