import type { Metadata } from 'next'
import './globals.css'
import ZohoTokenLoader from './components/ZohoTokenLoader'

export const metadata: Metadata = {
  title: 'Quotation - WMW Metal Fabrics Ltd',
  description: 'Quotation document',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ZohoTokenLoader />
        {children}
      </body>
    </html>
  )
}
