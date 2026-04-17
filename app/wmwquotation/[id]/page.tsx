import { Suspense } from 'react'
import WmwquotationPageContent from '../../components/WmwquotationPageContent'

export default function WmwquotationPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <div>Loading WMW Quotation...</div>
        </main>
      }
    >
      <WmwquotationPageContent />
    </Suspense>
  )
}