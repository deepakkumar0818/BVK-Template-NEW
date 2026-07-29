import Link from 'next/link'
import { StandardConditionsOfSaleBody } from '@/app/components/StandardConditionsOfSale'

/**
 * `/quotation/[id]`'s "View Standard Conditions of Sale" link lands here.
 * Renders the same 18-section body used inline on the /wmw and /quotation
 * print sheets — single source of truth: StandardConditionsOfSale.tsx.
 */
export default function QuotationConditionsPage() {
  return (
    <main className="conditions-doc" style={{ padding: '24px', maxWidth: '210mm', margin: '0 auto' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '16px', color: '#1e40af', textDecoration: 'underline' }}>
        ← Back to Quotation
      </Link>

      <div style={{ border: '1px solid #000', padding: '16px' }}>
        <StandardConditionsOfSaleBody />
      </div>
    </main>
  )
}
