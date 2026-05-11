import type { ReactNode } from 'react'
import { QuotationData } from '@/lib/types'
import {
  formatCurrency,
  formatAmountInWords,
  resolveQuotationValidity,
  DEFAULT_WMW_PERFORMA_QUOTATION_VALIDITY_PHRASE,
} from '@/lib/quotation-utils'

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
  /** Zoho raw record: drives “QUOTATION VALIDITY” via `Quotation_Validity` / `Offer_Validity`. */
  rawQuotationData?: Record<string, unknown> | null
  /** When Zoho fields are empty; defaults to {@link DEFAULT_WMW_PERFORMA_QUOTATION_VALIDITY_PHRASE}. */
  quotationValidityDefault?: string
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
}: QuotationSummarySectionProps) {
  const quotationValidityDisplay = resolveQuotationValidity(rawQuotationData ?? undefined, quotationValidityDefault)
  const totalAfterFormatted = formatCurrency(totalAfterTax)
  const cur = data.currency || 'INR'

  const wmwChargeVisible = (n: number) => Number.isFinite(n) && n !== 0

  type WmwBandRow = {
    leftMain: ReactNode
    leftSub: string
    label: string
    value: string
  }

  const wmwBandRows: WmwBandRow[] = []
  if (wmwChargeVisible(wmwDiscountTotal)) {
    wmwBandRows.push({
      leftMain: 'Discount',
      leftSub: 'Less',
      label: wmwDiscountRowLabel,
      value: formatCurrency(wmwDiscountTotal, cur),
    })
  }
  if (wmwChargeVisible(wmwFreightChargeTotal)) {
    wmwBandRows.push({
      leftMain: 'Freight',
      leftSub: 'Excl.',
      label: 'Freight Charge',
      value: formatCurrency(wmwFreightChargeTotal, cur),
    })
  }
  if (wmwChargeVisible(wmwPackingChargeTotal)) {
    wmwBandRows.push({
      leftMain: <strong>Insurance</strong>,
      leftSub: 'Incl.',
      label: 'Packing Charges',
      value: formatCurrency(wmwPackingChargeTotal, cur),
    })
  }
  if (wmwChargeVisible(wmwSeamChargeTotal)) {
    wmwBandRows.push({
      leftMain: <strong>Packing</strong>,
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
   * WMWD1: first 5 goods cols (desc+hsn+del+uom+qty) split 3+2 so Freight/Excl occupy that whole band.
   * Legacy 6→4 col summary: single cells in widened first two columns + tax pair.
   */
  const leftLabelColSpan = sevenColumnGoodsLayout ? 3 : 1
  const leftExclColSpan = sevenColumnGoodsLayout ? 2 : 1
  const validityColSpan = sevenColumnGoodsLayout ? 5 : 2
  const notesColSpan = sevenColumnGoodsLayout ? 5 : 2
  const amountWordsColSpan = sevenColumnGoodsLayout ? 7 : 4

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
        <tr>
          <td className="qs-cell qs-cell--validity" colSpan={validityColSpan}>
            <strong>QUOTATION VALIDITY :</strong> {quotationValidityDisplay}
          </td>
          <td className="qs-cell qs-cell--total-inr">Total INR</td>
          <td className="qs-cell qs-cell--total-amt">{totalAmountFormatted}</td>
        </tr>

        {wmwBandRows.map((band, bandIdx) => (
          <tr key={`wmw-band-${bandIdx}`} className="qs-hsn-tax-row">
            <td className="qs-cell qs-hsn-grid__col-label" colSpan={leftLabelColSpan}>
              {band.leftMain}
            </td>
            <td className="qs-cell qs-hsn-grid__col-excl" colSpan={leftExclColSpan}>
              {band.leftSub}
            </td>
            <td className="qs-cell qs-tax-label">{band.label}</td>
            <td className="qs-cell qs-tax-num">{band.value}</td>
          </tr>
        ))}

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
            <td className="qs-cell qs-tax-label">{row.label}</td>
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
