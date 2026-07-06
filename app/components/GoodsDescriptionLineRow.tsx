'use client'

import type { ReactNode } from 'react'
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
  /** `/wmw/[id]` + `/quotation/[id]` only: show `Total_SQM` in qty column (accessories use `Qty`). */
  useWmwPagination?: boolean
  /** Accessories doc: show “Accessories” label only on the first line item. */
  accessoriesDescriptionRole?: 'first' | 'continuation'
}

export default function GoodsDescriptionLineRow({
  row,
  cellPaddingPx,
  showHsnCodeColumn = false,
  currency = 'INR',
  useWmwPagination = false,
  accessoriesDescriptionRole,
}: GoodsDescriptionLineRowProps) {
  const pad = cellPaddingPx != null ? ({ padding: `${cellPaddingPx}px` } as const) : undefined

  const product = lineText(row.product)
  const quality = lineText(row.quality)
  const form = lineText(row.form)
  const size = lineText(row.size)
  const type = lineText(row.type)
  const isAccessoriesLine = Boolean(row.isAccessoriesLine)
  const isAccessoriesFirstRow =
    isAccessoriesLine && accessoriesDescriptionRole === 'first'
  const isAccessoriesContinuationRow =
    isAccessoriesLine && accessoriesDescriptionRole === 'continuation'
  const descLabel = isAccessoriesLine ? 'Accessories' : 'Product'
  const hsnCode = lineText(row.hsnCode)
  const delivery = lineText(row.delivery)
  const uom = lineText(row.uom)
  const subQty = lineText(row.subQty)
  const unit = lineText(row.unit)
  const totalSqmRaw = lineText(row.totalSqm)
  const qtyLine =
    useWmwPagination && !isAccessoriesLine
      ? formatQuantityDisplay(totalSqmRaw, currency)
      : formatQuantityDisplay(row.qty, currency)
  const rate = lineText(row.rate)
  const amount = lineText(row.amount)

  const wrapAccessoriesFirstRowData = (node: ReactNode) =>
    isAccessoriesFirstRow ? (
      <div className="goods-description-accessories-data-offset">{node}</div>
    ) : (
      node
    )

  const piecesSource = useWmwPagination ? lineText(row.pieces) : lineText(row.pieces) || unit
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

  const qtyCell = (
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

  return (
    <tr
      className={[
        'goods-description-data-row',
        isAccessoriesLine ? 'goods-description-data-row--accessories' : '',
        isAccessoriesFirstRow ? 'goods-description-data-row--accessories-first' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <td
        className="goods-description-table-body-cell goods-description-table-desc-cell"
        style={pad}
      >
        {isAccessoriesLine ? (
          <div
            className={[
              'goods-description-accessories-stack',
              isAccessoriesFirstRow ? 'goods-description-accessories-stack--first' : '',
              isAccessoriesContinuationRow ? 'goods-description-accessories-stack--continuation' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {isAccessoriesFirstRow ? (
              <strong className="goods-description-accessories-stack__heading">Accessories</strong>
            ) : null}
            <div className="goods-description-accessories-stack__name">{product || '—'}</div>
            {Array.from({ length: isAccessoriesFirstRow ? 3 : 4 }, (_, i) => (
              <div
                key={`acc-band-pad-${i}`}
                className="goods-description-accessories-stack__band-pad"
                aria-hidden="true"
              >
                {'\u00A0'}
              </div>
            ))}
          </div>
        ) : (
          <div className="goods-description-meta-grid">
            <strong>{descLabel}</strong>
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
        )}
      </td>
      {showHsnCodeColumn ? (
        <td className="goods-description-table-body-cell" style={pad}>
          {wrapAccessoriesFirstRowData(hsnCode || '—')}
        </td>
      ) : null}
      <td className="goods-description-table-body-cell" style={pad}>
        {wrapAccessoriesFirstRowData(delivery || '—')}
      </td>
      <td className="goods-description-table-body-cell" style={pad}>
        {wrapAccessoriesFirstRowData(uom || '—')}
      </td>
      <td className="goods-description-table-body-cell" style={pad}>
        {wrapAccessoriesFirstRowData(qtyCell)}
      </td>
      <td className="goods-description-table-body-cell text-right" style={pad}>
        {wrapAccessoriesFirstRowData(rate || '—')}
      </td>
      <td className="goods-description-table-body-cell text-right" style={pad}>
        {wrapAccessoriesFirstRowData(amount || '—')}
      </td>
    </tr>
  )
}
