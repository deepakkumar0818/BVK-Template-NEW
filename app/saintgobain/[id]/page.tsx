import { Suspense } from 'react'
import SaintgobainPageContent from '../../components/SaintgobainPageContent'

export default function SaintgobainPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading Saint-Gobain quotation...</div>
        </main>
      }
    >
      <SaintgobainPageContent />
    </Suspense>
  )
}
