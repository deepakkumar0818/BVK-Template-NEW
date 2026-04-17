'use client'

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print-button"
    >
      Print
    </button>
  )
}
