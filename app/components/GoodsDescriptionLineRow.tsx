'use client'

import type { QuotationLineItem } from '@/lib/types'
import { formatQuantityDisplay } from '@/lib/quotation-utils'
import { lineText } from '@/lib/quotation-line-item-display'

interface GoodsDescriptionLineRowProps {
  row: QuotationLineItem
  /** When set, applies uniform padding to body cells (Performa uses 8). */
  cellPaddingPx?: number
  /** WMWD1: HSN column after description */
  showHsnCodeColumn?: boolean
  /** Document currency — drives qty grouping locale (same as Rate/Amount). */
  currency?: string
  /** `/wmw/[id]` + `/quotation/[id]` only: show `Total_SQM` next to the UOM label instead of `qty`. */
  useWmwPagination?: boolean
}

export default function GoodsDescriptionLineRow({
  row,
  cellPaddingPx,
  showHsnCodeColumn = false,
  currency = 'INR',
  useWmwPagination = false,
}: GoodsDescriptionLineRowProps) {
  const pad = cellPaddingPx != null ? ({ padding: `${cellPaddingPx}px` } as const) : undefined

  const product = lineText(row.product)
  const quality = lineText(row.quality)
  const form = lineText(row.form)
  const size = lineText(row.size)
  const type = lineText(row.type)
  const hsnCode = lineText(row.hsnCode)
  const delivery = lineText(row.delivery)
  const uom = lineText(row.uom)
  const subQty = lineText(row.subQty)
  const unit = lineText(row.unit)
  const totalSqmRaw = lineText(row.totalSqm)
  const qtyLine = useWmwPagination
    ? formatQuantityDisplay(totalSqmRaw, currency)
    : formatQuantityDisplay(row.qty, currency)
  const rate = lineText(row.rate)
  const amount = lineText(row.amount)
  const qtyFirstLine = [uom, subQty].filter(Boolean).join(' ')

  return (
    <tr className="goods-description-data-row">
      <td
        className="goods-description-table-body-cell goods-description-table-desc-cell"
        style={pad}
      >
        <div className="goods-description-meta-grid">
          <strong>Product</strong>
          <span>:</span>
          <span>{product || '—'}</span>
          {quality ? (
            <>
              <strong>Quality</strong>
              <span>:</span>
              <span>{quality}</span>
            </>
          ) : null}
          {form ? (
            <>
              <strong>Form</strong>
              <span>:</span>
              <span>{form}</span>
            </>
          ) : null}
          {size ? (
            <>
              <strong>Size</strong>
              <span>:</span>
              <span>{size}</span>
            </>
          ) : null}
          {type ? (
            <>
              <strong>Type</strong>
              <span>:</span>
              <span>{type}</span>
            </>
          ) : null}
        </div>
      </td>
      {showHsnCodeColumn ? (
        <td className="goods-description-table-body-cell" style={pad}>
          {hsnCode || '—'}
        </td>
      ) : null}
      <td className="goods-description-table-body-cell" style={pad}>
        {delivery || '—'}
      </td>
      <td className="goods-description-table-body-cell" style={pad}>
        {uom || '—'}
      </td>
      <td className="goods-description-table-body-cell" style={pad}>
        {(() => {
          const piecesSource = useWmwPagination ? lineText(row.pieces) : lineText(row.pieces) || unit
          // Strip trailing "Pc" / "Pcs" and convert word-numbers ("One"/"Two"/"Three"/"Four") so the value column is just the count.
          const piecesValue = (() => {
            if (!piecesSource) return ''
            const stripped = piecesSource.replace(/\s*pcs?\s*$/i, '').trim()
            const wordMap: Record<string, string> = {
              one: '1',
              two: '2',
              three: '3',
              four: '4',
            }
            const lower = stripped.toLowerCase()
            return wordMap[lower] ?? stripped
          })()
          const hasSubQty = !useWmwPagination && Boolean(subQty) && subQty !== '0'
          return (
            <div className="goods-description-qty-grid">
              {uom ? (
                <>
                  <strong>{uom}</strong>
                  <span>:</span>
                  <span>{qtyLine}</span>
                </>
              ) : (
                <span className="goods-description-qty-grid__value-only">{qtyLine}</span>
              )}
              {hasSubQty ? (
                <>
                  <span />
                  <span />
                  <span>{subQty}</span>
                </>
              ) : null}
              {piecesValue ? (
                <>
                  <strong>Pc</strong>
                  <span>:</span>
                  <span>{piecesValue}</span>
                </>
              ) : null}
            </div>
          )
        })()}
      </td>
      <td className="goods-description-table-body-cell text-right" style={pad}>
        {rate || '—'}
      </td>
      <td className="goods-description-table-body-cell text-right" style={pad}>
        {amount || '—'}
      </td>
    </tr>
  )
}
