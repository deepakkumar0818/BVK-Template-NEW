'use client'

import type { CSSProperties, ReactNode } from 'react'
import type { QuotationData, QuotationLineItem } from '@/lib/types'
import {
  chunkLineItemsForPrint,
  chunkLineItemsForPrintWithSummary,
  chunkLineItemsForWmwPrint,
  GOODS_EVEN_DISTRIBUTE_MAX_ROWS,
  GOODS_EVEN_DISTRIBUTE_MIN_ROWS,
  GOODS_PRINT_FILL_MM_PER_MISSING_ROW,
  GOODS_ROWS_PER_PRINT_PAGE,
  GOODS_SUMMARY_SINGLE_PAGE_COMPACT_MAX_ITEMS,
} from '@/lib/quotation-line-item-display'
import GoodsDescriptionLineRow from './GoodsDescriptionLineRow'
import QuotationHeaderThead from './QuotationHeaderThead'

/** We want the master header to repeat on ALL goods segments. */
const MASTER_HEADER_OMIT_LAST_GOODS_SEGMENTS = 0

export interface GoodsDescriptionPaginatedBlockProps {
  lineItems: QuotationLineItem[]
  /** When set, the last segment shows a goods-table tfoot (Performa). */
  totalFoot?: { currency: string; amountFormatted: string; /** omit → `Total {currency}` */ label?: string }
  /** Performa uses 8px cell padding; WI omits for default CSS. */
  cellPaddingPx?: number
  /**
   * WMW quotation: print-only duplicate of the master header before continuation goods segments.
   * (The outer table thead does not repeat when the page break is inside the cell.)
   */
  masterQuotationHeaderProps?: {
    title?: string
    data: QuotationData
    shippingData?: any
    billingData?: any
    rawQuotationData?: any
  }
  /** WMWD1 (WI): extra “HSN Code” column after Description; summary must use matching 7-col layout */
  showHsnCodeColumn?: boolean
  /** Summary + footer rendered once on the last goods segment (print: anchored at page bottom). */
  summaryFollowSlot?: ReactNode
  /** When true (default if `summaryFollowSlot` is set), stretch partial last pages inside the goods table. */
  stretchLastPage?: boolean
  /**
   * WMW `/wmw/[id]` route only: head pages cap at 7 rows, last (footer) page caps at 5 rows;
   * partial head pages (5–6 rows) stretch row heights evenly to fill A4.
   */
  useWmwPagination?: boolean
}

export default function GoodsDescriptionPaginatedBlock({
  lineItems,
  totalFoot,
  cellPaddingPx,
  masterQuotationHeaderProps,
  showHsnCodeColumn = false,
  summaryFollowSlot,
  stretchLastPage,
  useWmwPagination = false,
}: GoodsDescriptionPaginatedBlockProps) {
  const items = lineItems ?? []
  const documentCurrency =
    totalFoot?.currency ?? masterQuotationHeaderProps?.data?.currency ?? 'INR'
  const chunks = useWmwPagination
    ? chunkLineItemsForWmwPrint(items)
    : summaryFollowSlot
      ? chunkLineItemsForPrintWithSummary(items, GOODS_ROWS_PER_PRINT_PAGE)
      : chunkLineItemsForPrint(items, GOODS_ROWS_PER_PRINT_PAGE)
  const colCount = showHsnCodeColumn ? 7 : 6
  const summaryCompactFirstPage =
    !useWmwPagination &&
    Boolean(summaryFollowSlot) &&
    chunks.length === 1 &&
    items.length > 0 &&
    items.length <= GOODS_SUMMARY_SINGLE_PAGE_COMPACT_MAX_ITEMS
  const shouldStretchLastPage =
    stretchLastPage === false
      ? false
      : summaryCompactFirstPage
        ? false
        : Boolean(summaryFollowSlot) && (stretchLastPage ?? true)
  /** WI+HSN: keep total width 100% aligned with quotation-summary-block */
  const w = showHsnCodeColumn
    ? { d: '28%', h: '12%', del: '12%', u: '8%', q: '15%', r: '12%', a: '13%' }
    : { d: '40%', h: '0%', del: '12%', u: '8%', q: '15%', r: '12%', a: '13%' }

  const showInjectedMasterHeader = (pageIdx: number) => {
    if (!masterQuotationHeaderProps || pageIdx === 0) return false
    const n = chunks.length
    if (n < MASTER_HEADER_OMIT_LAST_GOODS_SEGMENTS + 1) return true
    const tailStart = n - MASTER_HEADER_OMIT_LAST_GOODS_SEGMENTS
    return pageIdx < tailStart
  }

  return (
    <div className="quotation-goods-pages-stack">
      {chunks.map((chunk, pageIdx) => {
        const isLastChunk = pageIdx === chunks.length - 1
        const injectedMaster = showInjectedMasterHeader(pageIdx)
        const missingRows = Math.max(0, GOODS_ROWS_PER_PRINT_PAGE - chunk.length)
        const isPartialDistributeRange =
          chunk.length >= GOODS_EVEN_DISTRIBUTE_MIN_ROWS &&
          chunk.length <= GOODS_EVEN_DISTRIBUTE_MAX_ROWS &&
          missingRows > 0
        // Even a "full" 7-row WMW head page leaves empty space below the rows once the master
        // header is shrunk — apply distribute-rows to those pages too so rows spread vertically.
        const isWmwFullHeadChunkForDistribute =
          useWmwPagination && !isLastChunk && chunk.length === GOODS_ROWS_PER_PRINT_PAGE
        const distributeEvenRowsThisChunk =
          (isPartialDistributeRange &&
            (
              (Boolean(summaryFollowSlot) && isLastChunk) ||
              (useWmwPagination && !isLastChunk)
            )) ||
          isWmwFullHeadChunkForDistribute
        const stretchThisChunk =
          isLastChunk &&
          shouldStretchLastPage &&
          chunk.length > 0 &&
          missingRows > 0 &&
          !distributeEvenRowsThisChunk &&
          // WMW pagination: stretch-last only for 1-3 item last chunks (room to spare for the
          // spacer to push the footer to the page bottom). 4-5 items already fill the page —
          // adding a spacer would overflow.
          (!useWmwPagination || chunk.length <= 3)
        // Stretch-last spacer height per missing row. Standard 11mm overshoots when 7 items naturally fill a page,
        // but for the shrunk WMW pagination layout with 1-3 items + footer, we need a bigger per-missing budget
        // so the spacer pushes the summary all the way to the page bottom.
        const stretchMmPerMissing =
          useWmwPagination && stretchThisChunk && chunk.length <= 3
            ? chunk.length === 1
              ? 15
              : chunk.length === 2
                ? 13
                : 11.5
            : 11
        const stretchStyle = stretchThisChunk
          ? ({
              '--goods-stretch-missing-rows': missingRows,
              '--goods-stretch-mm-per-missing': `${stretchMmPerMissing}mm`,
            } as CSSProperties)
          : undefined
        // Distribute-rows pad: standard formula = (missing × 11mm) / (2 × rows). That works when
        // the chunk would naturally fit a full 7-row page; for WMW non-last partial pages the
        // rows need to spread further to cover the available area below the (shrunk) master header.
        // Override the pad calculation with a "fill target" so 5-6 rows reach the page bottom.
        const distributeEvenPadMm = (() => {
          if (!distributeEvenRowsThisChunk) return 0
          if (useWmwPagination && !isLastChunk) {
            // Target area available for goods rows (A4 − bottom margins − master − thead/tfoot).
            const WMW_GOODS_AREA_TARGET_MM = 185
            const NATURAL_ROW_MM = 22
            const targetRowMm = WMW_GOODS_AREA_TARGET_MM / chunk.length
            const extraRowMm = Math.max(0, targetRowMm - NATURAL_ROW_MM)
            return extraRowMm / 2
          }
          return (missingRows * GOODS_PRINT_FILL_MM_PER_MISSING_ROW) / (2 * chunk.length)
        })()
        const distributeTableStyle = distributeEvenRowsThisChunk
          ? ({
              '--goods-even-pad-mm': `${distributeEvenPadMm}mm`,
              ...(cellPaddingPx != null
                ? {
                    '--goods-cell-pad-x': `${cellPaddingPx}px`,
                    '--goods-cell-pad-y': `${cellPaddingPx}px`,
                  }
                : {}),
            } as CSSProperties)
          : undefined
        const lastChunkCellPadding =
          stretchThisChunk && cellPaddingPx != null
            ? cellPaddingPx + Math.min(missingRows * 2, 12)
            : cellPaddingPx

        return (
          <div
            key={pageIdx}
            className={[
              'quotation-goods-pages-segment',
              !isLastChunk ? 'quotation-goods-pages-break' : '',
              isLastChunk ? 'quotation-goods-pages-segment--last' : '',
              isLastChunk && summaryFollowSlot ? 'quotation-goods-pages-segment--last-with-summary' : '',
              isLastChunk && summaryCompactFirstPage ? 'quotation-goods-pages-segment--summary-compact-first-page' : '',
              injectedMaster ? 'quotation-goods-pages-segment--master-header-continuation' : '',
              useWmwPagination && !isLastChunk && distributeEvenRowsThisChunk
                ? 'quotation-goods-pages-segment--wmw-fill-page'
                : '',
              useWmwPagination ? 'quotation-goods-pages-segment--wmw' : '',
              // Pin footer to page bottom only when the last chunk has 1–3 items
              // (content is naturally short enough to have leftover vertical space to fill).
              useWmwPagination && isLastChunk && chunk.length >= 1 && chunk.length <= 3
                ? 'quotation-goods-pages-segment--wmw-pin-bottom'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={isLastChunk && summaryFollowSlot && !summaryCompactFirstPage ? stretchStyle : undefined}
          >
            {injectedMaster ? (
              <table
                className={[
                  'quotation-header-master-table',
                  'quotation-goods-continuation-inline',
                  showHsnCodeColumn ? 'quotation-header-master-table--wmwd1' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ width: '100%', borderCollapse: 'collapse', pageBreakInside: 'avoid' }}
              >
                <QuotationHeaderThead
                  title={masterQuotationHeaderProps!.title}
                  data={masterQuotationHeaderProps!.data}
                  shippingData={masterQuotationHeaderProps!.shippingData}
                  billingData={masterQuotationHeaderProps!.billingData}
                  rawQuotationData={masterQuotationHeaderProps!.rawQuotationData}
                  singleLineGstinCinInSupplier={showHsnCodeColumn}
                />
              </table>
            ) : null}
            <div className={isLastChunk && summaryFollowSlot ? 'quotation-goods-last-page-body' : undefined}>
              <table
                className={[
                  'goods-description-table',
                  'quotation-stack-table',
                  stretchThisChunk ? 'goods-description-table--stretch-last' : '',
                  distributeEvenRowsThisChunk ? 'goods-description-table--distribute-rows' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #000',
                  marginTop: injectedMaster ? '-1px' : '0',
                  tableLayout: 'fixed',
                  wordWrap: 'break-word',
                  ...stretchStyle,
                  ...distributeTableStyle,
                }}
              >
                <thead style={{ display: 'table-header-group' }}>
                  <tr>
                    <th
                      style={{
                        width: w.d,
                        textAlign: 'left',
                        border: '1px solid #000',
                        padding: '8px',
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        display: 'table-cell',
                      }}
                    >
                      Description Of Goods
                    </th>
                    {showHsnCodeColumn ? (
                      <th
                        style={{
                          width: w.h,
                          textAlign: 'left',
                          border: '1px solid #000',
                          padding: '8px',
                          backgroundColor: '#f5f5f5',
                          fontWeight: 'bold',
                          display: 'table-cell',
                        }}
                      >
                        HSN Code
                      </th>
                    ) : null}
                    <th
                      style={{
                        width: w.del,
                        border: '1px solid #000',
                        padding: '8px',
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        display: 'table-cell',
                      }}
                    >
                      Delivery
                    </th>
                    <th
                      style={{
                        width: w.u,
                        border: '1px solid #000',
                        padding: '8px',
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        display: 'table-cell',
                      }}
                    >
                      UOM
                    </th>
                    <th
                      style={{
                        width: w.q,
                        border: '1px solid #000',
                        padding: '8px',
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        display: 'table-cell',
                      }}
                    >
                      Quantity
                    </th>
                    <th
                      style={{
                        width: w.r,
                        textAlign: 'right',
                        border: '1px solid #000',
                        padding: '8px',
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        display: 'table-cell',
                      }}
                    >
                      Rate/SQM
                    </th>
                    <th
                      style={{
                        width: w.a,
                        textAlign: 'right',
                        border: '1px solid #000',
                        padding: '8px',
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        display: 'table-cell',
                      }}
                    >
                      Amount INR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.length > 0 ? (
                    chunk.map((row, i) => (
                      <GoodsDescriptionLineRow
                        key={`${pageIdx}-${i}`}
                        row={row}
                        cellPaddingPx={lastChunkCellPadding}
                        showHsnCodeColumn={showHsnCodeColumn}
                        currency={documentCurrency}
                        useWmwPagination={useWmwPagination}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={colCount}
                        className="goods-description-table-body-cell"
                        style={{ textAlign: 'center', padding: '20px', color: '#666' }}
                      >
                        No line items found
                      </td>
                    </tr>
                  )}
                  {stretchThisChunk ? (
                    <tr className="goods-description-stretch-spacer" aria-hidden="true">
                      {Array.from({ length: colCount }, (_, cellIdx) => (
                        <td key={cellIdx} className="goods-description-stretch-spacer-cell" />
                      ))}
                    </tr>
                  ) : null}
                </tbody>
                {totalFoot && isLastChunk ? (
                  <tfoot>
                    <tr>
                      <td
                        colSpan={showHsnCodeColumn ? 6 : 5}
                        className="goods-description-table-foot-cell text-right font-bold"
                        style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}
                      >
                        {totalFoot.label ?? `Total ${totalFoot.currency}`}
                      </td>
                      <td
                        className="goods-description-table-foot-cell text-right font-bold"
                        style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}
                      >
                        {totalFoot.amountFormatted}
                      </td>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
              {isLastChunk && summaryFollowSlot ? (
                <div className="quotation-goods-last-page-summary quotation-seamless-stack">
                  {summaryFollowSlot}
                </div>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
