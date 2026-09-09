import { Suspense } from 'react'
import WmwP1PageContent from '../../components/WmwP1PageContent'

export default function WmwP1Page() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading WMW P1 Invoice...</div>
        </main>
      }
    >
      <WmwP1PageContent />
    </Suspense>
  )
}
