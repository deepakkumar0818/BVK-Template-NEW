import type { ReactNode } from 'react'
import '../sales-order-doc.css'

export default function SalesOrderLayout({ children }: { children: ReactNode }) {
  return <main className="sales-order-doc sales-order-doc--bvk-ods">{children}</main>
}
