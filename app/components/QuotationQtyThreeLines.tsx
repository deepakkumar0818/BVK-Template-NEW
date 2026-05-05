'use client'

import type { ReactNode } from 'react'

function trimDisplay(v: unknown): string {
  if (v == null) return ''
  const s = String(v).trim()
  return s === '' || s === '0' ? '' : s
}

/** Zoho: `UOM_Billing`, `Qty`, `Pieces` — only non-empty lines render; Pieces prefixed with `Pc `. */
export default function QuotationQtyThreeLines({
  uomBilling,
  qty,
  pieces,
}: {
  uomBilling?: unknown
  qty?: unknown
  pieces?: unknown
}) {
  const u = trimDisplay(uomBilling)
  const q = trimDisplay(qty)
  const p = trimDisplay(pieces)

  const nodes: ReactNode[] = []
  let first = true
  const cls = () => (first ? 'quotation-qty-value' : 'quotation-qty-uom')

  if (u) {
    nodes.push(
      <div key="uom" className={cls()}>
        {u}
      </div>
    )
    first = false
  }
  if (q) {
    nodes.push(
      <div key="qty" className={cls()}>
        {q}
      </div>
    )
    first = false
  }
  if (p) {
    nodes.push(
      <div key="pieces" className={cls()}>{`Pc ${p}`}</div>
    )
    first = false
  }

  if (nodes.length === 0) {
    return (
      <div className="quotation-qty-uom-cell">
        {'\u00A0'}
      </div>
    )
  }

  return <div className="quotation-qty-uom-cell">{nodes}</div>
}
