import type { ReactNode } from 'react'
import { QuotationData } from '@/lib/types'
import {
  formatCurrency,
  formatAmountInWords,
  resolveQuotationValidity,
  DEFAULT_WMW_PERFORMA_QUOTATION_VALIDITY_PHRASE,
} from '@/lib/quotation-utils'
import { isQuotationZohoCheckboxTrue } from '@/lib/wmw-subform-mapping'

export interface QuotationSummarySectionProps {
  data: QuotationData
  /** Pre-formatted line-items total (same as former goods tfoot) */
  totalAmountFormatted: string
  cgstRate: number
  cgstAmount: number
  sgstRate: number
  sgstAmount: number
  igstRate: number
  igstAmount: number
  taxAmount: number
  /** “Total Amount Before Tax” — from Total_Cost_Before_Tax when set, else line-items total */
  totalBeforeTax: number
  totalAfterTax: number
  /** Sum of per-line discount subforms + overall discount scalars ({@link resolveWmwChargeTotals}); defaults to 0 */
  wmwDiscountTotal?: number
  /** From `Discount_Type` + " Discount" — right-hand label for the discount row; default `Discount` */
  wmwDiscountRowLabel?: string
  /** From Category_1_MM_Database_WMW_Other_Charges (summed per line); defaults to 0 */
  wmwFreightChargeTotal?: number
  wmwPackingChargeTotal?: number
  wmwSeamChargeTotal?: number
  /**
   * WMWD1: match goods table with HSN column (7 cols: 28/12/12/8/15/12/13).
   * Freight/Insurance/Packing rows use wide label cells (no static HSN / product codes in summary).
   */
  sevenColumnGoodsLayout?: boolean
  /**
   * When set, replaces the merged left “Notes” block (banner + remarks) with this content only.
   * WMW Performa: static “Remarks :” list in the original left-column position beside tax rows.
   */
  notesMergedSlot?: ReactNode
  /** Zoho raw record: drives “Quotation Valid Till” via `Quotation_Validity` / `Offer_Validity`. */
  rawQuotationData?: Record<string, unknown> | null
  /** When Zoho fields are empty; defaults to {@link DEFAULT_WMW_PERFORMA_QUOTATION_VALIDITY_PHRASE}. */
  quotationValidityDefault?: string
  /** `/wmw/[id]` only: skip the "Quotation Valid Till : …" row (the Total INR cell that sat in this row is also dropped). */
  hideQuotationValidityRow?: boolean
}

/** Show a summary tax row only when its amount is a non-zero finite number. */
function summaryTaxAmountHasValue(amount: number): boolean {
  return Number.isFinite(amount) && amount !== 0
}

/**
 * Summary grid: 4 columns (legacy) or 7 when `sevenColumnGoodsLayout` matches goods + HSN Code.
 * Static “HSN Number” / product code rows are omitted; Freight/Excl cells span the former left block width.
 */
export default function QuotationSummarySection({
  data,
  totalAmountFormatted,
  cgstRate,
  cgstAmount,
  sgstRate,
  sgstAmount,
  igstRate,
  igstAmount,
  taxAmount,
  totalBeforeTax,
  totalAfterTax,
  wmwDiscountTotal = 0,
  wmwDiscountRowLabel = 'Discount',
  wmwFreightChargeTotal = 0,
  wmwPackingChargeTotal = 0,
  wmwSeamChargeTotal = 0,
  sevenColumnGoodsLayout = false,
  notesMergedSlot,
  rawQuotationData,
  quotationValidityDefault = DEFAULT_WMW_PERFORMA_QUOTATION_VALIDITY_PHRASE,
  hideQuotationValidityRow = false,
}: QuotationSummarySectionProps) {
  const quotationValidityDisplay = resolveQuotationValidity(rawQuotationData ?? undefined, quotationValidityDefault)
  const cur = data.currency || 'INR'
  const totalAfterFormatted = formatCurrency(totalAfterTax, cur)

  const wmwChargeVisible = (n: number) => Number.isFinite(n) && n !== 0

  type WmwBandRow = {
    leftMain: ReactNode
    leftSub: string
    label: string
    value: string
    /** Render the row text in red; reserved for the Discount band. */
    isDiscount?: boolean
    /** WMWD1: checkbox-only Incl. band (no amount) — wide layout aligned to tax/amount column. */
    wideLeftBandOnly?: boolean
  }

  const wmwBandRows: WmwBandRow[] = []
  if (wmwChargeVisible(wmwDiscountTotal)) {
    wmwBandRows.push({
      leftMain: 'Discount',
      leftSub: 'Less',
      label: wmwDiscountRowLabel,
      value: formatCurrency(wmwDiscountTotal, cur),
      isDiscount: true,
    })
  }
  const freightHasAmount = wmwChargeVisible(wmwFreightChargeTotal)
  const freightInclOnly =
    !freightHasAmount && isQuotationZohoCheckboxTrue(rawQuotationData ?? undefined, 'Freight_Charge')
  if (freightHasAmount || freightInclOnly) {
    wmwBandRows.push({
      leftMain: 'Freight',
      leftSub: freightInclOnly ? 'Incl.' : 'Excl.',
      label: 'Freight Charge',
      value: freightHasAmount ? formatCurrency(wmwFreightChargeTotal, cur) : '',
      wideLeftBandOnly: freightInclOnly,
    })
  }
  const packingHasAmount = wmwChargeVisible(wmwPackingChargeTotal)
  const packingInclOnly =
    !packingHasAmount && isQuotationZohoCheckboxTrue(rawQuotationData ?? undefined, 'Packing_Charge')
  if (packingHasAmount || packingInclOnly) {
    wmwBandRows.push({
      leftMain: <strong>Packing</strong>,
      leftSub: 'Incl.',
      label: 'Packing Charges',
      value: packingHasAmount ? formatCurrency(wmwPackingChargeTotal, cur) : '',
      wideLeftBandOnly: packingInclOnly,
    })
  }
  if (wmwChargeVisible(wmwSeamChargeTotal)) {
    wmwBandRows.push({
      leftMain: <strong>Seam</strong>,
      leftSub: 'Incl.',
      label: 'Seam Charges',
      value: formatCurrency(wmwSeamChargeTotal, cur),
    })
  }

  // Standard GST split: CGST 9% + SGST 9% = IGST 18%; rate labels are fixed when an amount exists, rows are hidden otherwise.
  const summaryTaxRows: { label: string; value: string; bold?: boolean }[] = [
    { label: 'Total Amount Before Tax', value: formatCurrency(totalBeforeTax, cur), bold: true },
  ]
  if (summaryTaxAmountHasValue(cgstAmount)) {
    summaryTaxRows.push({ label: 'Add CGST @ 9%', value: formatCurrency(cgstAmount) })
  }
  if (summaryTaxAmountHasValue(sgstAmount)) {
    summaryTaxRows.push({ label: 'Add SGST @ 9%', value: formatCurrency(sgstAmount) })
  }
  if (summaryTaxAmountHasValue(igstAmount)) {
    summaryTaxRows.push({ label: 'Add IGST @ 18%', value: formatCurrency(igstAmount) })
  }
  if (summaryTaxAmountHasValue(taxAmount)) {
    summaryTaxRows.push({ label: 'Tax Amount GST', value: formatCurrency(taxAmount) })
  }
  summaryTaxRows.push({ label: 'Total Amount After GST', value: totalAfterFormatted, bold: true })

  const notesRowSpan = summaryTaxRows.length

  /**
   * WMWD1: notes occupy cols 1–4 (desc+hsn+del+uom). Tax/charge labels start at col 5 (Qty —
   * third column from the right in the goods table) and span cols 5–6; amounts stay in col 7.
   * Legacy 6→4 col summary: single cells in widened first two columns + tax pair.
   */
  const leftLabelColSpan = sevenColumnGoodsLayout ? 3 : 1
  const leftExclColSpan = sevenColumnGoodsLayout ? 1 : 1
  const validityColSpan = sevenColumnGoodsLayout ? 4 : 2
  const notesColSpan = sevenColumnGoodsLayout ? 4 : 2
  const taxLabelColSpan = sevenColumnGoodsLayout ? 2 : 1
  const amountWordsColSpan = sevenColumnGoodsLayout ? 7 : 4
  /** Align charge-band split with tax rows: cols 1–(notes+label) | amount col. */
  const chargeBandMainColSpan = notesColSpan + taxLabelColSpan
  const chargeBandRightColSpan = 1

  return (
    <table className="quotation-stack-table quotation-summary-block">
      {sevenColumnGoodsLayout ? (
        <colgroup>
          <col style={{ width: '28%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '13%' }} />
        </colgroup>
      ) : (
        <colgroup>
          <col style={{ width: '35.625%' }} />
          <col style={{ width: '21.375%' }} />
          <col style={{ width: '26%' }} />
          <col style={{ width: '13.18%' }} />
        </colgroup>
      )}
      <tbody>
        {hideQuotationValidityRow ? null : (
          <tr>
            <td className="qs-cell qs-cell--validity" colSpan={validityColSpan}>
              <strong>Quotation Valid Till :</strong> {quotationValidityDisplay}
            </td>
            <td className="qs-cell qs-cell--total-inr" colSpan={sevenColumnGoodsLayout ? taxLabelColSpan : 1}>
              Total {cur}
            </td>
            <td className="qs-cell qs-cell--total-amt">{totalAmountFormatted}</td>
          </tr>
        )}

        {wmwBandRows.map((band, bandIdx) => {
          const discountColor = band.isDiscount ? ({ color: '#c00000' } as const) : undefined
          const wideLeft = Boolean(band.wideLeftBandOnly)
          const hideAmountCell = wideLeft && !band.value
          if (wideLeft) {
            return (
              <tr key={`wmw-band-${bandIdx}`} className="qs-hsn-tax-row">
                <td className="qs-cell qs-hsn-grid__col-label" colSpan={chargeBandMainColSpan} style={discountColor}>
                  {hideAmountCell ? (
                    band.leftMain
                  ) : (
                    <span className="qs-charge-band-main-row">
                      <span>{band.leftMain}</span>
                      <span>{band.leftSub}</span>
                    </span>
                  )}
                </td>
                {hideAmountCell ? (
                  <td
                    className="qs-cell qs-hsn-grid__col-excl qs-charge-band-incl-cell"
                    colSpan={chargeBandRightColSpan}
                    style={discountColor}
                  >
                    {band.leftSub}
                  </td>
                ) : (
                  <td className="qs-cell qs-tax-num" colSpan={chargeBandRightColSpan} style={discountColor}>
                    {band.value}
                  </td>
                )}
              </tr>
            )
          }
          return (
            <tr key={`wmw-band-${bandIdx}`} className="qs-hsn-tax-row">
              <td className="qs-cell qs-hsn-grid__col-label" colSpan={leftLabelColSpan} style={discountColor}>
                {band.leftMain}
              </td>
              <td className="qs-cell qs-hsn-grid__col-excl" colSpan={leftExclColSpan} style={discountColor}>
                {band.leftSub}
              </td>
              <td className="qs-cell qs-tax-label" colSpan={taxLabelColSpan} style={discountColor}>
                {band.label}
              </td>
              <td className="qs-cell qs-tax-num" style={discountColor}>
                {band.value}
              </td>
            </tr>
          )
        })}

        {summaryTaxRows.map((row, i) => (
          <tr key={row.label} className={row.bold ? 'qs-tax-row--bold' : undefined}>
            {i === 0 ? (
              <td className="qs-cell qs-notes-merged" colSpan={notesColSpan} rowSpan={notesRowSpan}>
                {notesMergedSlot !== undefined ? (
                  notesMergedSlot
                ) : (
                  <>
                    <div className="qs-notes-banner">Notes</div>
                    <div className="qs-notes-fill">{data.remarks || ''}</div>
                  </>
                )}
              </td>
            ) : null}
            <td className="qs-cell qs-tax-label" colSpan={taxLabelColSpan}>
              {row.label}
            </td>
            <td className="qs-cell qs-tax-num">{row.value}</td>
          </tr>
        ))}

        <tr>
          <td className="qs-cell qs-cell--amount-words" colSpan={amountWordsColSpan}>
            <strong>Amount Chargeable (In words):-</strong>{' '}
            <span className="qs-amount-words-inline">
              {formatAmountInWords(totalAfterTax, data.currency || 'INR')}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  )
}
