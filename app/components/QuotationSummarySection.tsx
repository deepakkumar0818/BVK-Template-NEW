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
  /** From Category_1_MM_Database_WMW_Other_Charges (summed per line); defaults to 0 */
  wmwFreightChargeTotal?: number
  wmwPackingChargeTotal?: number
  wmwSeamChargeTotal?: number
  /**
   * WMWD1: match goods table with HSN column (7 cols: 32/8/12/8/15/12/13).
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

function fmtGstRateLabel(rate: number): string {
  if (rate > 0) return `${Number(rate).toFixed(2)}%`
  return '0.00'
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

  const summaryTaxRows: { label: string; value: string; bold?: boolean }[] = [
    { label: 'Total Amount Before Tax', value: formatCurrency(totalBeforeTax, cur), bold: true },
    { label: `Add CGST @ ${fmtGstRateLabel(cgstRate)}`, value: formatCurrency(cgstAmount) },
    { label: `Add SGST @ ${fmtGstRateLabel(sgstRate)}`, value: formatCurrency(sgstAmount) },
    { label: `Add IGST @ ${fmtGstRateLabel(igstRate)}`, value: formatCurrency(igstAmount) },
    { label: 'Tax Amount GST', value: formatCurrency(taxAmount) },
    { label: 'Total Amount After GST', value: totalAfterFormatted, bold: true },
  ]

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
          <col style={{ width: '32%' }} />
          <col style={{ width: '8%' }} />
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
