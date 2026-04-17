import { Suspense } from 'react'
import EkamasPageContent from '../../components/EkamasPageContent'

export default function EkamasQuotationPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading Ekamas quotation...</div>
        </main>
      }
    >
      <EkamasPageContent />
    </Suspense>
  )
}
