import { Suspense } from 'react'
import WmwP2PageContent from '../../components/WmwP2PageContent'

export default function WmwP2Page() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading WMW P2 Invoice...</div>
        </main>
      }
    >
      <WmwP2PageContent />
    </Suspense>
  )
}
