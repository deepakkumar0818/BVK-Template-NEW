'use client'

export default function SalesOrderPrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="sales-order-print-button">
      Print
    </button>
  )
}
