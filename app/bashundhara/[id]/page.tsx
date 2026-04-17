import { Suspense } from 'react'
import BashundharaPageContent from '../../components/BashundharaPageContent'

export default function BashundharaPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading Bashundhara Invoice...</div>
        </main>
      }
    >
      <BashundharaPageContent />
    </Suspense>
  )
}
