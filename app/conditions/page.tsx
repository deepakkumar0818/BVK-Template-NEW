import Link from 'next/link'
import { LegacyStandardConditionsBody } from '@/app/components/LegacyStandardConditionsBody'

export default function ConditionsPage() {
  return (
    <main className="conditions-doc" style={{ padding: '24px', maxWidth: '210mm', margin: '0 auto' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '16px', color: '#1e40af', textDecoration: 'underline' }}>
        ← Back to Quotation
      </Link>

      <LegacyStandardConditionsBody />
    </main>
  )
}
