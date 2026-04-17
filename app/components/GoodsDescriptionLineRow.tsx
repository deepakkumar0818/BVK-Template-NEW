'use client'

import type { QuotationLineItem } from '@/lib/types'
import { formatCurrency } from '@/lib/quotation-utils'
import { lineText, normalizeQty } from '@/lib/quotation-line-item-display'

interface GoodsDescriptionLineRowProps {
  row: QuotationLineItem
  /** When set, applies uniform padding to body cells (Performa uses 8). */
  cellPaddingPx?: number
  /** WMWD1: HSN column after description */
  showHsnCodeColumn?: boolean
}

export default function GoodsDescriptionLineRow({
  row,
  cellPaddingPx,
  showHsnCodeColumn = false,
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
  const qtyLine = formatCurrency(normalizeQty(row.qty))
  const rate = lineText(row.rate)
  const amount = lineText(row.amount)
  const qtyFirstLine = [uom, subQty].filter(Boolean).join(' ')

  return (
    <tr>
      <td
        className="goods-description-table-body-cell goods-description-table-desc-cell"
        style={{ verticalAlign: 'top', ...pad }}
      >
        <div>
          <strong>Product</strong>: {product || '—'}
        </div>
        {quality ? (
          <div>
            <strong>Quality</strong>: {quality}
          </div>
        ) : null}
        {form ? (
          <div>
            <strong>Form</strong>: {form}
          </div>
        ) : null}
        {size ? (
          <div>
            <strong>Size</strong>: {size}
          </div>
        ) : null}
        {type ? (
          <div>
            <strong>Type</strong>: {type}
          </div>
        ) : null}
      </td>
      {showHsnCodeColumn ? (
        <td className="goods-description-table-body-cell" style={{ verticalAlign: 'top', ...pad }}>
          {hsnCode || '—'}
        </td>
      ) : null}
      <td className="goods-description-table-body-cell" style={pad}>
        {delivery || '—'}
      </td>
      <td className="goods-description-table-body-cell" style={pad}>
        {uom || '—'}
      </td>
      <td className="goods-description-table-body-cell" style={{ verticalAlign: 'top', ...pad }}>
        {qtyFirstLine ? (
          <>
            {qtyFirstLine}
            <br />
          </>
        ) : null}
        {qtyLine}
        {unit ? (
          <>
            <br />
            {unit}
          </>
        ) : null}
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
