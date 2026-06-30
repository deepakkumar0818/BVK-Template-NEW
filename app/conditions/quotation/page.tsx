import Link from 'next/link'
import { QuotationRouteStandardConditionsBody } from '@/app/components/QuotationRouteStandardConditions'

/** Standard Conditions for `/quotation/[id]` only — not shared with other templates. */
export default function QuotationConditionsPage() {
  return (
    <main className="conditions-doc" style={{ padding: '24px', maxWidth: '210mm', margin: '0 auto' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '16px', color: '#1e40af', textDecoration: 'underline' }}>
        ← Back to Quotation
      </Link>

      <div style={{ border: '1px solid #000', padding: '16px' }}>
        <QuotationRouteStandardConditionsBody />
      </div>
    </main>
  )
}
