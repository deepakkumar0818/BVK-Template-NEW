'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ZohoTokenLoaderContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    fetch('/api/zoho-token')
      .then((res) => res.json())
      .then((data) => {
        if (data.access_token) {
          console.log('Zoho access_token:', data.access_token)
          console.log('Zoho token response:', data)
        } else {
          console.error('Zoho token error:', data)
        }
      })
      .catch((err) => console.error('Zoho token fetch failed:', err))

    // Get id from perm/URL (e.g. ?id=xxx or ?perm=xxx) - only fetch quotations when we have an id
    const id = searchParams.get('id') || searchParams.get('perm') || ''
    const quotationsUrl = id ? `/api/zoho-quotations?id=${encodeURIComponent(id)}` : '/api/zoho-quotations'

    fetch(quotationsUrl)
      .then((res) => res.json())
      .then((data) => {
        console.log('Zoho Quotations API response:', data)
        if (data.data) {
          console.log('Quotations records:', data.data)
        }
        if (data.error) {
          console.error('Zoho Quotations error:', data)
        }
      })
      .catch((err) => console.error('Zoho Quotations fetch failed:', err))
  }, [searchParams])

  return null
}

export default function ZohoTokenLoader() {
  return (
    <Suspense fallback={null}>
      <ZohoTokenLoaderContent />
    </Suspense>
  )
}
