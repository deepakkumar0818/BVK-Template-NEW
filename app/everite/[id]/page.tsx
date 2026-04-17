import { Suspense } from 'react'
import EveritePageContent from '../../components/EveritePageContent'

export default function EveritePage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading Everite Invoice...</div>
        </main>
      }
    >
      <EveritePageContent />
    </Suspense>
  )
}
