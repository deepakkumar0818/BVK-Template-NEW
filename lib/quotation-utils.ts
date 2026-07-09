import { ZohoQuotation, QuotationData, QuotationLineItem, TemplateType } from './types'
import { deliveryDisplayFromRecords, endTypeDisplayFromRecords } from './goods-description-form'
import {
  buildJoinedLineRowsForWmwPerforma,
  buildWmwJoinedLineRows,
  desiredDateForRef,
  isQuotationDiscountSummaryEnabled,
  type WmwJoinedLineDisplayRow,
  normalizeLastItemRef,
  numericSegmentFromInvoiceDimension,
  pickBlendCategoryFromWmw30Row,
  resolveCategory1WmwHsnCode,
  wmwMaterialCodeForDescriptionQuality,
} from './wmw-subform-mapping'

/**
 * Formats a date string from Zoho format to display format
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return ''
  
  try {
    // Handle formats like "19-Feb-2026" or "19-Feb-2026 11:40:35"
    // Zoho date format: DD-MMM-YYYY or DD-MMM-YYYY HH:MM:SS
    const dateMatch = dateString.match(/(\d{2})-(\w{3})-(\d{4})/)
    if (dateMatch) {
      const [, day, month, year] = dateMatch
      // Convert month name to number (Jan=0, Feb=1, etc.)
      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      }
      const monthNum = monthMap[month] ?? 0
      const date = new Date(parseInt(year), monthNum, parseInt(day))
      if (!isNaN(date.getTime())) {
        // Format as DD/MM/YYYY
        return `${day}/${String(monthNum + 1).padStart(2, '0')}/${year}`
      }
    }
    
    // Fallback: try standard Date parsing
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }
    
    return dateString
  } catch {
    return dateString
  }
}

/**
 * Line-item delivery cell: Zoho `Delivery` text (e.g. "1 Week") when present; otherwise formatted desired-date / header control.
 */
export function resolveQuotationDeliveryCell(
  deliveryApiText: string | undefined,
  desiredDateRaw: string | undefined,
  deliveryDateControl: string | undefined
): string {
  const api = String(deliveryApiText ?? '').trim()
  if (api !== '') return api
  const desired = String(desiredDateRaw ?? '').trim()
  if (desired !== '') return formatDate(desired)
  return formatDate(deliveryDateControl)
}

function pickWmw30RowForKey(
  zohoData: ZohoQuotation,
  key: 'Category_1_MM_Database_WMW_3_0' | 'Category_2_MM_Database_WMW_3_0',
  refNormalized: string
): Record<string, unknown> | undefined {
  const rows = ((zohoData as Record<string, unknown>)[key] as any[]) || []
  const r = refNormalized.trim()
  if (!r) return undefined
  const found = rows.find(
    (x: any) => String(x?.last_item_ref ?? x?.Last_item_ref ?? '').trim() === r
  )
  return found as Record<string, unknown> | undefined
}

function pickWi30Cat1Row(zohoData: ZohoQuotation, lineRef: string): Record<string, unknown> | undefined {
  const rows = ((zohoData as any).Category_1_MM_Database_WI_3_0 as any[]) || []
  const r = String(lineRef ?? '').trim()
  if (!r) return undefined
  const found = rows.find((x: any) => String(x.Line_Item_ref ?? '').trim() === r)
  return found as Record<string, unknown> | undefined
}

function pickWi30Cat2Row(zohoData: ZohoQuotation, lineRef: string): Record<string, unknown> | undefined {
  const rows = ((zohoData as any).Category_2_MM_Database_WI_3_0 as any[]) || []
  const r = String(lineRef ?? '').trim()
  if (!r) return undefined
  const found = rows.find((x: any) => String(x.Line_Item_ref ?? '').trim() === r)
  return found as Record<string, unknown> | undefined
}

/** Zoho `Material_Code` only: WI line (2_0) → WI tax/detail (3_0) → product main row. */
function wiMaterialCodeForQualityChain(wi20Like: unknown, wi30Like: unknown, productMain: unknown): string {
  const one = (r: unknown) => {
    if (r == null || typeof r !== 'object') return ''
    const v = (r as Record<string, unknown>).Material_Code
    return v == null ? '' : String(v).trim()
  }
  return one(wi20Like) || one(wi30Like) || one(productMain)
}

/**
 * Formats a number with Indian number formatting (commas)
 */
export function formatCurrency(value: string | number | undefined, currency: string = 'INR'): string {
  if (!value) return '0.00'
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
  if (isNaN(num)) return '0.00'
  // Use en-US locale for USD, en-IN for INR
  const locale = currency === 'USD' ? 'en-US' : 'en-IN'
  return num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Whole currency units (paise rounded off) for Amount / summary totals on WMW quotation docs. */
export function formatCurrencyRounded(value: string | number | undefined, currency: string = 'INR'): string {
  if (value === null || value === undefined || value === '') return '0'
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
  if (!Number.isFinite(num)) return '0'
  const rounded = Math.round(num)
  const locale = currency === 'USD' ? 'en-US' : 'en-IN'
  return rounded.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/** WMWD1 goods “Quantity” column: fixed 4 fractional digits; locale matches {@link formatCurrency}. */
export function formatQuantityDisplay(value: unknown, currency: string = 'INR'): string {
  if (value === null || value === undefined || value === '') return '0.0000'
  const num =
    typeof value === 'number' && !Number.isNaN(value)
      ? value
      : parseFloat(String(value).replace(/,/g, ''))
  if (!Number.isFinite(num)) return '0.0000'
  const locale = currency === 'USD' ? 'en-US' : 'en-IN'
  return num.toLocaleString(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 })
}

/**
 * Zoho `Quotation_Validity` when the field exists on the record; else `Offer_Validity`; else `defaultValue`.
 * If `Quotation_Validity` is present but null, returns '' (empty is intentional, same as SLS template).
 */
export function resolveQuotationValidity(
  rawQuotationData: Record<string, unknown> | null | undefined,
  defaultValue = ' '
): string {
  const raw = rawQuotationData
  if (raw != null && Object.prototype.hasOwnProperty.call(raw, 'Expiry_Date')) {
    const v = raw.Expiry_Date
    return v == null ? '' : String(v)
  }
  return String(raw?.Expiry_Date ?? '') || defaultValue
}

/** WMW WMWD1 / Performa summary row when Zoho `Quotation_Validity` and `Offer_Validity` are absent. */
export const DEFAULT_WMW_PERFORMA_QUOTATION_VALIDITY_PHRASE = '07 Days from the date of Quotation'

/**
 * “Country of Final Destination” label: Zoho `Final_Destination` on the quotation first,
 * then `Shipping_Country` on quotation / shipping master, then `fallback` when all absent.
 */
export function resolveCountryOfFinalDestination(
  rawQuotationData?: Record<string, unknown> | null,
  shippingData?: Record<string, unknown> | null,
  fallback = ''
): string {
  const fromFinal = String(rawQuotationData?.Final_Destination ?? '').trim()
  if (fromFinal) return fromFinal
  const fromShip =
    String(rawQuotationData?.Shipping_Country ?? '').trim() ||
    String(shippingData?.Shipping_Country ?? '').trim()
  if (fromShip) return fromShip
  return String(fallback ?? '').trim()
}

/**
 * Header “Dispatch Ex-Works”: Zoho `Sales_Proposed_Date_Dispatch_Ex_Works`, then
 * `Delivery_Date_Control`, then transformed `deliveryDate`, then `fallback`.
 */
export function resolveDispatchExWorksDisplay(
  rawQuotationData?: Record<string, unknown> | null,
  deliveryDateFromTransform?: string | null,
  fallback = ''
): string {
  const sales = String(rawQuotationData?.Sales_Proposed_Date_Dispatch_Ex_Works ?? '').trim()
  if (sales) return sales
  const deliveryControl = String(rawQuotationData?.Delivery_Date_Control ?? '').trim()
  if (deliveryControl) return deliveryControl
  const d = String(deliveryDateFromTransform ?? '').trim()
  if (d) return d
  return String(fallback ?? '').trim()
}

/**
 * “Other Reference (s)” header: Zoho `Other_Reference`, then legacy `Additional_info`, then `fallback`.
 */
export function resolveOtherReferenceDisplay(
  rawQuotationData?: Record<string, unknown> | null,
  fallback = ''
): string {
  const primary = String(rawQuotationData?.Other_Reference ?? '').trim()
  if (primary) return primary
  const legacy = String(rawQuotationData?.Additional_info ?? '').trim()
  if (legacy) return legacy
  return String(fallback ?? '').trim()
}

/**
 * Line under the “Transport” header: Zoho `Transport` when non-empty; otherwise `fallback`
 * (the template’s existing incoterm / destination / mode sentence).
 */
export function resolveTransportDisplayLine(
  rawQuotationData: Record<string, unknown> | null | undefined,
  fallback: string
): string {
  const r = rawQuotationData ?? {}
  const t = String(r.Transport ?? (r as { transport?: unknown }).transport ?? '').trim()
  return t || fallback
}

/** Mesh column: first numeric segment after the 4th dot in Product_Code, shown as `value/Inch` (BVK / WMW-style codes). */
export function meshInchFromProductCode(productCode?: string): string {
  const s = String(productCode ?? '').trim()
  if (!s) return ''
  const parts = s.split('.')
  if (parts.length < 5) return ''
  const tail = parts.slice(4).join('.')
  const m = tail.match(/\d+(?:\.\d+)?/)
  return m ? `${m[0]}/Inch` : ''
}

/** Which Zoho subform bundle supplies line items for the BVK Hydrotech tab (first non-empty wins: Cat1 WI → Cat2 WI → fitments). */
export type BvkZohoLineSource = 'cat1_wi' | 'cat2_wi' | 'fitments'

export function resolveBvkLineSource(zohoData: ZohoQuotation): BvkZohoLineSource {
  // Zoho returns empty placeholder rows in WI subforms even when the quote is Product Fitment;
  // trust `Template` first, then `Subform_Breakdown` totals, before falling back to row counts.
  const template = String((zohoData as any).Template ?? '')
    .trim()
    .toLowerCase()
  if (template.includes('product fitment')) return 'fitments'
  if (template.includes('category 2 mm database wi') || template.includes('category 2 wi')) {
    return 'cat2_wi'
  }
  if (template.includes('category 1 mm database wi') || template.includes('category 1 wi')) {
    return 'cat1_wi'
  }

  const breakdown = ((zohoData as any).Subform_Breakdown as any[]) || []
  const breakdownTotal = (name: string): number => {
    const target = name.trim().toLowerCase()
    let total = 0
    for (const row of breakdown) {
      const sub = String(row?.Subform ?? '').trim().toLowerCase()
      if (sub !== target) continue
      const before = parseFloat(String(row?.Cost_Before_Tax ?? '0').replace(/,/g, '')) || 0
      const after = parseFloat(String(row?.Cost_After_Tax ?? '0').replace(/,/g, '')) || 0
      const sale = parseFloat(String(row?.Total_Sale_Value ?? '0').replace(/,/g, '')) || 0
      total += before + after + sale
    }
    return total
  }
  const bdFitment = breakdownTotal('product fitment')
  const bdCat1 = breakdownTotal('category 1 wi')
  const bdCat2 = breakdownTotal('category 2 wi')
  if (bdFitment > 0 && bdFitment >= bdCat1 && bdFitment >= bdCat2) return 'fitments'
  if (bdCat1 > 0 && bdCat1 >= bdCat2) return 'cat1_wi'
  if (bdCat2 > 0) return 'cat2_wi'

  const c1p = ((zohoData.Category_1_MM_Database_WI as any[]) || []).length
  const c120 = ((zohoData.Category_1_MM_Database_WI_2_0 as any[]) || []).length
  const c130 = ((zohoData.Category_1_MM_Database_WI_3_0 as any[]) || []).length
  const c2p = ((zohoData.Category_2_MM_Database_WI as any[]) || []).length
  const c220 = ((zohoData.Category_2_MM_Database_WI_2_0 as any[]) || []).length
  const c230 = ((zohoData.Category_2_MM_Database_WI_3_0 as any[]) || []).length
  const pf2 = ((zohoData.Product_Fitments2_0 as any[]) || []).length
  const pf = ((zohoData.Product_Fitments as any[]) || []).length

  const hasCat1 = c1p > 0 || c120 > 0 || c130 > 0
  const hasCat2 = c2p > 0 || c220 > 0 || c230 > 0
  const hasFit = pf2 > 0 || pf > 0

  if (hasCat1) return 'cat1_wi'
  if (hasCat2) return 'cat2_wi'
  if (hasFit) return 'fitments'
  return 'cat1_wi'
}

function parseNumericField(value: unknown): number {
  const x = parseFloat(String(value ?? '').replace(/,/g, ''))
  return Number.isFinite(x) ? x : 0
}

function amountFromTotalOrLegacy(
  raw: Record<string, unknown> | null | undefined,
  totalKey: string,
  legacyKey: string
): number {
  const r = raw ?? {}
  const t = r[totalKey]
  if (t !== undefined && t !== null && String(t).trim() !== '') {
    return parseNumericField(t)
  }
  return parseNumericField(r[legacyKey])
}

/**
 * Tax rows for quotation / performa summary: Creator rollups (Total_*) with legacy field fallback.
 */
function resolveTotalCostBeforeTax(
  r: Record<string, unknown> | null | undefined,
  lineItemsTotalFallback: number
): number {
  const v = r?.Total_Cost_Before_Tax
  if (v !== undefined && v !== null && String(v).trim() !== '') {
    return parseNumericField(v)
  }
  return lineItemsTotalFallback
}

export function parseQuotationTaxForSummary(raw: unknown, lineItemsTotalFallback: number) {
  const r = raw as Record<string, unknown> | null | undefined
  return {
    cgstRate: parseNumericField(r?.CGST_Rate),
    cgstAmount: amountFromTotalOrLegacy(r, 'Total_CGST', 'CGST_Amount'),
    sgstRate: parseNumericField(r?.SGST_Rate),
    sgstAmount: amountFromTotalOrLegacy(r, 'Total_SGST', 'SGST_Amount'),
    igstRate: parseNumericField(r?.IGST_Rate),
    igstAmount: amountFromTotalOrLegacy(r, 'Total_IGST', 'IGST_Amount'),
    taxAmount: amountFromTotalOrLegacy(r, 'Total_Tax_Amount_IGST_CGST', 'Tax_Amount'),
    totalBeforeTax: resolveTotalCostBeforeTax(r, lineItemsTotalFallback),
    /** Zoho `Overall_Grand_Total_incl_Accessories` only (no other keys, no line-sum fallback). */
    totalAfterTax: parseOverallGrandTotalInclAccessories(r ?? undefined),
  }
}

/**
 * Zoho document grand total: `Overall_Grand_Total_incl_Accessories` only (parse number; no derived fallback).
 */
export function parseOverallGrandTotalInclAccessories(
  raw: Record<string, unknown> | null | undefined
): number {
  if (!raw) return NaN
  const v = raw.Overall_Grand_Total_incl_Accessories
  if (v === undefined || v === null || String(v).trim() === '') return NaN
  const n = parseFloat(String(v).replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : NaN
}

/**
 * Converts a non-negative integer &lt; 1000 to words (hundreds + tens + ones).
 */
function convertBelowThousand(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  let x = Math.floor(Math.abs(n)) % 1000
  let result = ''
  if (x >= 100) {
    result += ones[Math.floor(x / 100)] + ' Hundred '
    x %= 100
  }
  if (x >= 20) {
    result += tens[Math.floor(x / 10)] + ' '
    x %= 10
  }
  if (x > 0) {
    result += ones[x] + ' '
  }
  return result.trim()
}

/**
 * Indian numbering: Crore → Lakh → Thousand → remainder (&lt; 1000), each chunk via {@link convertBelowThousand}.
 */
function numberToWordsIndianInteger(n: number): string {
  if (!Number.isFinite(n) || n < 0) return 'Zero'
  const num = Math.floor(Math.abs(n))
  if (num === 0) return 'Zero'

  const parts: string[] = []
  let rem = num

  const crore = Math.floor(rem / 10000000)
  rem %= 10000000
  if (crore > 0) {
    parts.push(`${convertBelowThousand(crore)} Crore`.trim())
  }

  const lakh = Math.floor(rem / 100000)
  rem %= 100000
  if (lakh > 0) {
    parts.push(`${convertBelowThousand(lakh)} Lakh`.trim())
  }

  const thousand = Math.floor(rem / 1000)
  rem %= 1000
  if (thousand > 0) {
    parts.push(`${convertBelowThousand(thousand)} Thousand`.trim())
  }

  if (rem > 0) {
    parts.push(convertBelowThousand(rem))
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

/** Integer part only: international grouping (thousand / million / …). */
function numberToWordsInternationalInteger(num: number): string {
  if (!Number.isFinite(num)) return 'Zero'
  const n = Math.floor(Math.abs(num))
  if (n === 0) return 'Zero'

  const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion', 'Quintillion']
  const parts: string[] = []
  let x = n
  let scaleIdx = 0
  while (x > 0 && scaleIdx < scales.length) {
    const chunk = x % 1000
    if (chunk > 0) {
      const chunkWords = convertBelowThousand(chunk)
      const suffix = scales[scaleIdx]
      parts.push(suffix ? `${chunkWords} ${suffix}` : chunkWords)
    }
    x = Math.floor(x / 1000)
    scaleIdx++
  }
  if (x > 0) {
    parts.push(String(x))
  }

  return parts.reverse().join(' ').replace(/\s+/g, ' ').trim()
}

/** Lowercase words + hyphenated tens-one (e.g. eighty-seven) for USD/EUR sentence-style lines. */
function convertBelowThousandSentence(n: number): string {
  const ones = [
    '',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ]
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

  let x = Math.floor(Math.abs(n)) % 1000
  const parts: string[] = []
  if (x >= 100) {
    parts.push(`${ones[Math.floor(x / 100)]} hundred`)
    x %= 100
  }
  if (x >= 20) {
    const t = Math.floor(x / 10)
    const o = x % 10
    parts.push(o > 0 ? `${tens[t]}-${ones[o]}` : tens[t])
  } else if (x > 0) {
    parts.push(ones[x])
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function capitalizeFirstLetterSentence(s: string): string {
  const t = s.trim()
  if (!t) return ''
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** Integer only: international grouping in lowercase (thousand, million, …). */
function numberToWordsInternationalSentence(num: number): string {
  if (!Number.isFinite(num)) return 'zero'
  const n = Math.floor(Math.abs(num))
  if (n === 0) return 'zero'

  const scales = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion']
  const parts: string[] = []
  let x = n
  let scaleIdx = 0
  while (x > 0 && scaleIdx < scales.length) {
    const chunk = x % 1000
    if (chunk > 0) {
      const chunkWords = convertBelowThousandSentence(chunk)
      const suffix = scales[scaleIdx]
      parts.push(suffix ? `${chunkWords} ${suffix}` : chunkWords)
    }
    x = Math.floor(x / 1000)
    scaleIdx++
  }
  if (x > 0) {
    parts.push(String(x))
  }

  return parts.reverse().join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Body only (no “US Dollars” prefix): e.g. `Sixteen thousand five hundred eighty-seven dollars and fourteen cents only`.
 */
function formatUsdEurDecimalAmountSentence(
  amount: number,
  singularMainUnit: string,
  pluralMainUnit: string
): string {
  const safe = Number.isFinite(amount) ? amount : 0
  const negative = safe < 0
  const abs = Math.abs(safe)
  const totalCents = Math.round(abs * 100 + Number.EPSILON)
  const mainAmount = Math.floor(totalCents / 100)
  const cents = totalCents % 100

  const intLower = numberToWordsInternationalSentence(mainAmount)
  let phrase = capitalizeFirstLetterSentence(intLower)
  const mainUnitLabel = mainAmount === 1 ? singularMainUnit : pluralMainUnit

  if (cents === 0) {
    phrase = `${phrase} ${mainUnitLabel} only`
  } else {
    const centsWords = convertBelowThousandSentence(cents)
    const centLabel = cents === 1 ? 'cent' : 'cents'
    phrase = `${phrase} ${mainUnitLabel} and ${centsWords} ${centLabel} only`
  }

  phrase = phrase.replace(/\s+/g, ' ').trim()
  return negative ? `Minus ${phrase}` : phrase
}

function formatAmountInWordsUsd(amount: number): string {
  return `US Dollars ${formatUsdEurDecimalAmountSentence(amount, 'dollar', 'dollars')}`
}

function formatAmountInWordsEur(amount: number): string {
  return `Euros ${formatUsdEurDecimalAmountSentence(amount, 'euro', 'euros')}`
}

/**
 * INR amount in words: Indian lakhs/crores + optional paisa (not "/100").
 */
function formatAmountInWordsInr(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0
  const negative = safe < 0
  const abs = Math.abs(safe)
  const totalPaise = Math.round(abs * 100 + Number.EPSILON)
  const rupees = Math.floor(totalPaise / 100)
  const paise = totalPaise % 100

  let main = numberToWordsIndianInteger(rupees)
  if (negative) main = `Minus ${main}`

  if (paise === 0) {
    return `${main} Rupees Only`.replace(/\s+/g, ' ').trim()
  }
  const pw = convertBelowThousand(paise).trim()
  return `${main} Rupees and ${pw} Paisa Only`.replace(/\s+/g, ' ').trim()
}

/**
 * Converts number to words (integer chunked by thousands → Million / Billion …).
 * The previous implementation only supported amounts &lt; ~1M and produced the literal "undefined"
 * for larger values because {@link convertBelowThousand} was fed numbers ≥ 1000.
 */
export function numberToWords(num: number): string {
  if (!Number.isFinite(num)) return 'Zero'
  if (num === 0) return 'Zero'

  const negative = num < 0
  const abs = Math.abs(num)
  const integerPart = Math.floor(abs)
  const decimalPart = Math.round((abs - integerPart) * 100)

  const intWords =
    integerPart === 0 ? (decimalPart > 0 ? '' : 'Zero') : numberToWordsInternationalInteger(integerPart)

  let words = (negative ? 'Minus ' : '') + intWords

  if (decimalPart > 0) {
    words += ` and ${decimalPart}/100`
  }

  return words.trim()
}

/**
 * Printable “in words” line for invoices.
 * **INR:** Lakh/Crore + Paisa; **USD / EUR:** international scales + Dollars/Euro + Cents (no `XX/100`).
 */
export function formatAmountInWords(amount: number, currency: string = 'INR'): string {
  const cur = (currency || 'INR').trim().toUpperCase()
  const safe = Number.isFinite(amount) ? amount : 0

  if (cur === 'INR') {
    return formatAmountInWordsInr(safe)
  }
  if (cur === 'USD') {
    return formatAmountInWordsUsd(safe)
  }
  if (cur === 'EUR' || cur === 'EURO') {
    return formatAmountInWordsEur(safe)
  }

  const words = numberToWords(safe)
  return `${words} ${cur} Only`.replace(/\s+/g, ' ').trim()
}

/**
 * Goods-table “Amount Chargeable (In words)” line: USD/EUR use cents spelled out (sentence style);
 * other currencies keep `{currencyWords} {numberToWords} Only` (e.g. INR).
 */
export function formatGoodsTableAmountChargeableInWords(amount: number, currency: string): string {
  const cur = (currency || '').trim().toUpperCase()
  const safe = Number.isFinite(amount) ? amount : 0
  if (cur === 'USD') return formatAmountInWordsUsd(safe)
  if (cur === 'EUR' || cur === 'EURO') return formatAmountInWordsEur(safe)
  const cw = cur === 'INR' ? 'Indian Rupees' : currency
  return `${cw} ${numberToWords(safe)} Only`
}

/** USD/EUR body only (no “US Dollars” prefix) — for captions like `US Dollar : …`. */
export function formatUsdEurAmountBodyInWords(amount: number, currency: string): string {
  const cur = (currency || '').trim().toUpperCase()
  const safe = Number.isFinite(amount) ? amount : 0
  if (cur === 'USD') return formatUsdEurDecimalAmountSentence(safe, 'dollar', 'dollars')
  if (cur === 'EUR' || cur === 'EURO') return formatUsdEurDecimalAmountSentence(safe, 'euro', 'euros')
  return numberToWords(safe)
}

/** Stable key for merging WI_2_0 / WI_3_0 rows (same Line_Item_ref → one logical line) */
function wiLineMergeKey(row: any, seq: number): string {
  const r =
    row?.Line_Item_ref?.trim() ||
    row?.Last_item_ref?.trim() ||
    row?.last_item_ref?.trim()
  if (r) return r
  return `__noref_${row?.ID ?? 'x'}_${seq}`
}

/**
 * Merge WI_2_0 and WI_3_0 line subforms by ref (Category 1 or Category 2).
 * Rows with the same Line_Item_ref become one object (3_0 fields overlay 2_0).
 */
function mergeWiLineSubformsByRef(wi20: any[], wi30: any[]): Map<string, any> {
  const map = new Map<string, any>()
  const ingest = (row: any, seq: number) => {
    const key = wiLineMergeKey(row, seq)
    const prev = map.get(key)
    map.set(key, prev ? { ...prev, ...row } : { ...row })
  }
  ;(wi20 || []).forEach((row, i) => ingest(row, i))
  ;(wi30 || []).forEach((row, i) => ingest(row, i + 10000))
  return map
}

function wiProductRef(pd: any): string | null {
  const r =
    pd?.Line_Item_ref?.trim() ||
    pd?.Last_item_ref?.trim() ||
    pd?.last_item_ref?.trim()
  return r || null
}

/**
 * Pick merged line row for a product subform row without double-using the same billing line.
 */
function pickMergedLineForWiProduct(
  pd: any,
  index: number,
  mergedByRef: Map<string, any>,
  wi20: any[],
  usedLineKeys: Set<string>
): any {
  const pdR = wiProductRef(pd)
  if (pdR && mergedByRef.has(pdR) && !usedLineKeys.has(pdR)) {
    usedLineKeys.add(pdR)
    return mergedByRef.get(pdR)!
  }
  const ordinal = String(index + 1)
  if (mergedByRef.has(ordinal) && !usedLineKeys.has(ordinal)) {
    usedLineKeys.add(ordinal)
    return mergedByRef.get(ordinal)!
  }
  const row20 = wi20[index]
  if (row20) {
    const k = wiLineMergeKey(row20, index)
    if (mergedByRef.has(k) && !usedLineKeys.has(k)) {
      usedLineKeys.add(k)
      return mergedByRef.get(k)!
    }
  }
  if (index === 0 && mergedByRef.size === 1) {
    const onlyKey = Array.from(mergedByRef.keys())[0]
    if (!usedLineKeys.has(onlyKey)) {
      usedLineKeys.add(onlyKey)
      return mergedByRef.get(onlyKey)!
    }
  }
  return {}
}

/**
 * Maps Template field value to Category data field names
 * Returns object with lineItemsField and productDetailsField
 */
export function getCategoryFieldsFromTemplate(templateField?: string, zohoData?: ZohoQuotation): {
  lineItemsField: keyof ZohoQuotation
  productDetailsField: keyof ZohoQuotation
} {
  if (!templateField) {
    return {
      lineItemsField: 'Category_1_MM_Database_WI_2_0',
      productDetailsField: 'Category_1_MM_Database_WI'
    }
  }

  const template = templateField.trim().toLowerCase()
  if (template.includes('product fitment')) {
    return {
      lineItemsField: 'Product_Fitments2_0',
      productDetailsField: 'Product_Fitments',
    }
  }
  
  // Map Template field to Category fields
  if (template.includes('gkd')) {
    // For GKD, check which category has data - prefer WMW if it has items, otherwise use WI
    if (zohoData) {
      const wmwItems = (zohoData.Category_1_MM_Database_WMW_2_0 as any[]) || []
      const wiItems = (zohoData.Category_1_MM_Database_WI_2_0 as any[]) || []
      
      if (wmwItems.length > 0) {
        return {
          lineItemsField: 'Category_1_MM_Database_WMW_2_0',
          productDetailsField: 'Category_1_MM_Database_WMW'
        }
      } else if (wiItems.length > 0) {
        return {
          lineItemsField: 'Category_1_MM_Database_WI_2_0',
          productDetailsField: 'Category_1_MM_Database_WI'
        }
      }
    }
    // Default to WI if no data found
    return {
      lineItemsField: 'Category_1_MM_Database_WI_2_0',
      productDetailsField: 'Category_1_MM_Database_WI'
    }
  } else if (template.includes('wmwe1')) {
    return {
      lineItemsField: 'Category_1_MM_Database_WI_2_0',
      productDetailsField: 'Category_1_MM_Database_WI'
    }
  } else if (template.includes('sls')) {
    return {
      lineItemsField: 'Category_1_MM_Database_WI_2_0',
      productDetailsField: 'Category_1_MM_Database_WI'
    }
  } else if (template.includes('bvk')) {
    return {
      lineItemsField: 'Category_1_MM_Database_WI_2_0',
      productDetailsField: 'Category_1_MM_Database_WI'
    }
  } else if (template.includes('category 2 wmw') || template === 'category 2 wmw') {
    return {
      lineItemsField: 'Category_2_MM_Database_WMW_2_0',
      productDetailsField: 'Category_2_MM_Database_WMW'
    }
  } else if (template.includes('category 1 mm database wmw') || template === 'category 1 mm database wmw') {
    return {
      lineItemsField: 'Category_1_MM_Database_WMW_2_0',
      productDetailsField: 'Category_1_MM_Database_WMW'
    }
  } else if (template.includes('category 2 mm database wi') || template.includes('category 2 wi')) {
    return {
      lineItemsField: 'Category_2_MM_Database_WI_2_0',
      productDetailsField: 'Category_2_MM_Database_WI'
    }
  } else if (template.includes('category 1 mm database wi') || template.includes('category 1 wi')) {
    return {
      lineItemsField: 'Category_1_MM_Database_WI_2_0',
      productDetailsField: 'Category_1_MM_Database_WI'
    }
  }
  
  // Default fallback
  return {
    lineItemsField: 'Category_1_MM_Database_WI_2_0',
    productDetailsField: 'Category_1_MM_Database_WI'
  }
}

/**
 * Determines template type from Type_Of_Quotation and Template fields
 */
export function determineTemplateType(
  typeOfQuotation?: string,
  templateField?: string
): TemplateType {
  const typeOfQuot = typeOfQuotation?.trim().toLowerCase() || ''
  const template = templateField?.trim().toLowerCase() || ''

  if (template.includes('wmwe1')) {
    return 'WMWE1'
  }

  // If Type_Of_Quotation is "Export" or "Import" AND Template is "Category 1 WI" or "Category 2 WI", use SLS template
  if ((typeOfQuot === 'export' || typeOfQuot === 'import') && 
      (template.includes('category 1 wi') || template.includes('category 2 wi') || 
       template.includes('category 1 mm database wi') || template.includes('category 2 mm database wi'))) {
    return 'SLS'
  }
  
  // If Type_Of_Quotation is "Export" AND Template is "Category 1 WMW", use EXPORT template
  if (typeOfQuot === 'export' && 
      (template.includes('category 1 wmw') || template.includes('category 1 mm database wmw'))) {
    return 'EXPORT'
  }
  
  // If Type_Of_Quotation is "Export" (and not matching conditions above), use EXPORT template
  if (typeOfQuot === 'export') {
    return 'EXPORT'
  }
  
  // For Import or other types, determine from Template field
  if (!templateField) {
    return 'WI' // Default
  }
  
  // Map Template field to template type
  if (template.includes('gkd')) {
    return 'GKD'
  } else if (template.includes('sls')) {
    return 'SLS'
  } else if (template.includes('bvk')) {
    return 'BVK'
  } else if (template.includes('category 2 wmw') || template === 'category 2 wmw') {
    return 'WMW2'
  } else if (template.includes('category 1 mm database wmw') || template === 'category 1 mm database wmw') {
    return 'WMW'
  } else if (template.includes('category 1 mm database wi') || template.includes('category 1 wi')) {
    return 'WI'
  }
  
  // Default fallback
  return 'WI'
}

/**
 * Pieces are whole units — strip any trailing decimals from a display value.
 * "1.000" → "1", "12,345.6789" → "12345", "2 Pc" → "2 Pc", non-numeric → returned as-is.
 */
export function formatPiecesInteger(value: unknown): string {
  if (value == null) return ''
  const s = String(value).trim()
  if (!s) return ''
  // Strip existing Pc/Pcs suffix so we can re-apply consistently
  const trailingPcs = /\s*(pcs?)\s*$/i.exec(s)
  const suffix = trailingPcs ? ` ${trailingPcs[1]}` : ''
  const numeric = trailingPcs ? s.slice(0, trailingPcs.index).trim() : s
  const match = numeric.match(/^(-?[\d,]+)(?:\.\d+)?/)
  if (!match) return s
  const numStr = match[1].replace(/,/g, '')
  const n = parseInt(numStr, 10)
  if (!Number.isFinite(n)) return s
  return `${n}${suffix}`
}

/** Append a space + `Pc` after Zoho `Pieces`; pieces value rendered as integer (decimals dropped). */
function formatPiecesWithPcSuffix(piecesFromApi: string): string {
  const p = String(piecesFromApi ?? '').trim()
  if (!p) return ''
  if (/\s*pcs?$/i.test(p)) return formatPiecesInteger(p)
  const intPart = formatPiecesInteger(p)
  return intPart ? `${intPart} Pc` : ''
}

/**
 * Prefer Zoho `Pieces` for the quantity-column piece line (`pieces` on {@link QuotationLineItem});
 * only synthesize `One Pc` / `N Pc` in `unit` when `Pieces` is empty.
 */
function unitAndPiecesFromQty(qtyNum: number, piecesFromApi: string): { unit: string; pieces: string } {
  const p = String(piecesFromApi ?? '').trim()
  if (p) return { unit: '', pieces: formatPiecesWithPcSuffix(p) }
  const intQty = Math.trunc(qtyNum)
  const unit =
    intQty === 1
      ? 'One Pc'
      : intQty === 2
        ? 'Two Pc'
        : intQty === 3
          ? 'Three Pc'
          : intQty === 4
            ? 'Four Pc'
            : intQty > 0
              ? `${intQty} Pc`
              : ''
  return { unit, pieces: '' }
}

/**
 * Pushes {@link buildWmwJoinedLineRows} output into `lineItems` (Category 1 WMW + Product Fitment),
 * using the same mapping as the WI template branch in {@link transformQuotationData}.
 * @returns sum of parsed line amounts to add to `totalAmount`
 */
function addQuotationLineItemsFromWmwJoin(
  joinedWmw: WmwJoinedLineDisplayRow[],
  zohoData: ZohoQuotation,
  lineItems: QuotationLineItem[],
  currency: string
): number {
  let totalAdd = 0
  for (const row of joinedWmw) {
    const isAccessoriesLine = row.lineKind === 'accessories'
    const qty = String(row.quantity ?? '0').trim()
    const qtyNum = parseFloat(qty.replace(/,/g, '')) || 0
    const piecesStr = String(row.piecesDisplay ?? '').trim()
    const { unit, pieces } = unitAndPiecesFromQty(qtyNum, piecesStr)

    const amtNum = parseFloat(String(row.amountDisplay || '').replace(/,/g, '')) || 0
    totalAdd += amtNum

    lineItems.push({
      product: row.productLabel?.trim() || '',
      quality: isAccessoriesLine ? '' : row.materialCode?.trim() || '',
      form: isAccessoriesLine ? '' : row.supplyForm?.trim() || '',
      size: isAccessoriesLine ? '' : row.size?.trim() || '',
      type: isAccessoriesLine ? '' : row.seamType?.trim() || '',
      hsnCode: row.hsnCode?.trim() || '',
      delivery: resolveQuotationDeliveryCell(
        row.deliveryApi,
        row.deliveryDate,
        zohoData.Delivery_Date_Control
      ),
      uom: row.uom?.trim() || 'SQMT',
      qty,
      subQty: '',
      totalSqm: (row.totalSqm?.trim() || '').replace(/,/g, '') || undefined,
      unit,
      pieces,
      rate: formatCurrency(row.ratePerSqmDisplay, currency),
      amount: formatCurrencyRounded(row.amountDisplay, currency),
      ...(isAccessoriesLine ? { isAccessoriesLine: true } : {}),
    })
  }
  return totalAdd
}

function parseLineItemAmountNumber(amount: string | undefined): number {
  const n = parseFloat(String(amount ?? '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : 0
}

function parseDiscountValueNumber(value: string | undefined): number {
  const n = parseFloat(String(value ?? '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : 0
}

/**
 * WMWD1 / WMW pagination: when quotation `Discount` is `false`, subtract each joined line’s
 * `Discount_Value` from the goods amount and return the net line total for summary bands.
 */
export function applyWmwd1LineDiscountAbsorption(
  lineItems: QuotationLineItem[],
  raw: ZohoQuotation | null | undefined,
  currency: string
): { lineItems: QuotationLineItem[]; netTotal: number } {
  if (isQuotationDiscountSummaryEnabled(raw)) {
    const netTotal = lineItems.reduce((sum, item) => sum + parseLineItemAmountNumber(item.amount), 0)
    return { lineItems, netTotal }
  }

  const joined = buildJoinedLineRowsForWmwPerforma(raw)
  let netTotal = 0
  const adjusted = lineItems.map((item, index) => {
    const joinedRow = joined[index]
    const gross = parseLineItemAmountNumber(item.amount)
    const discountValue = joinedRow ? parseDiscountValueNumber(joinedRow.discountValueDisplay) : 0
    const net = gross - discountValue
    const roundedNet = Math.round(net)
    netTotal += roundedNet
    return {
      ...item,
      amount: formatCurrencyRounded(roundedNet, currency),
    }
  })

  return { lineItems: adjusted, netTotal }
}

/**
 * Transforms Zoho quotation data to quotation display format
 */
export function transformQuotationData(
  zohoData: ZohoQuotation, 
  templateType: TemplateType = 'WI',
  templateField?: string,
  /** `/wmw/[id]` + `/quotation/[id]`: enable Accessories join when WMW lines are absent. */
  wmwPerformaRoute = false
): QuotationData {
  const lineItems: QuotationLineItem[] = []
  let totalAmount = 0

  // Get Category fields based on templateField if provided, otherwise use templateType
  let zohoLineItems: any[] = []
  let productDetails: any[] = []
  let categoryFields: { lineItemsField: keyof ZohoQuotation; productDetailsField: keyof ZohoQuotation } | null = null
  
  if (templateField) {
    // Use templateField to determine Category fields
    categoryFields = getCategoryFieldsFromTemplate(templateField, zohoData)
    zohoLineItems = (zohoData[categoryFields.lineItemsField] as any[]) || []
    productDetails = (zohoData[categoryFields.productDetailsField] as any[]) || []
    if (categoryFields.lineItemsField === 'Product_Fitments2_0' && zohoLineItems.length === 0) {
      zohoLineItems = (zohoData.Product_Fitments as any[]) || []
    }
  } else {
    // Fallback to original logic based on templateType
    zohoLineItems = templateType === 'WI' 
      ? (zohoData.Category_1_MM_Database_WI_2_0 || [])
      : templateType === 'WMW2'
      ? (zohoData.Category_2_MM_Database_WMW_2_0 || [])
      : templateType === 'EXPORT' || templateType === 'WMWE1'
      ? (zohoData.Category_1_MM_Database_WI_2_0 || [])
      : templateType === 'SLS'
      ? (zohoData.Category_1_MM_Database_WI_2_0 || [])
      : templateType === 'GKD'
      ? (zohoData.Category_1_MM_Database_WI_2_0 || [])
      : templateType === 'BVK'
      ? (zohoData.Category_1_MM_Database_WI_2_0 || [])
      : (zohoData.Category_1_MM_Database_WMW_2_0 || [])
    
    productDetails = templateType === 'WI'
      ? (zohoData.Category_1_MM_Database_WI || [])
      : templateType === 'WMW2'
      ? (zohoData.Category_2_MM_Database_WMW || [])
      : templateType === 'EXPORT' || templateType === 'WMWE1'
      ? (zohoData.Category_1_MM_Database_WI || [])
      : templateType === 'SLS'
      ? (zohoData.Category_1_MM_Database_WI || [])
      : templateType === 'GKD'
      ? (zohoData.Category_1_MM_Database_WI || [])
      : templateType === 'BVK'
      ? (zohoData.Category_1_MM_Database_WI || [])
      : (zohoData.Category_1_MM_Database_WMW || [])
  }

  // Category 1 WI: merge both line-item subforms (WI_2_0 + WI_3_0) against product subform Category_1_MM_Database_WI
  const usesCategory1WiLineAndProduct =
    categoryFields?.lineItemsField === 'Category_1_MM_Database_WI_2_0' &&
    categoryFields?.productDetailsField === 'Category_1_MM_Database_WI'
  const fallbackUsesCategory1WiLines =
    !categoryFields &&
    (templateType === 'WI' ||
      templateType === 'EXPORT' ||  
      templateType === 'WMWE1' ||
      templateType === 'SLS' ||
      templateType === 'GKD' ||
      templateType === 'BVK')

  const wi20Category1 = (zohoData.Category_1_MM_Database_WI_2_0 as any[]) || []
  const wi30Category1 = (zohoData.Category_1_MM_Database_WI_3_0 as any[]) || []
  const wi20Category2 = (zohoData.Category_2_MM_Database_WI_2_0 as any[]) || []
  const wi30Category2 = (zohoData.Category_2_MM_Database_WI_3_0 as any[]) || []
  const isCategory1WiBundle = usesCategory1WiLineAndProduct || fallbackUsesCategory1WiLines
  const mergedCategory1WiLines = isCategory1WiBundle
    ? mergeWiLineSubformsByRef(wi20Category1, wi30Category1)
    : null
  const mergedCategory2WiLines = mergeWiLineSubformsByRef(wi20Category2, wi30Category2)
  const bvkZohoSource: BvkZohoLineSource | null =
    templateType === 'BVK' ? resolveBvkLineSource(zohoData) : null
  const currency = zohoData.Currency || 'INR'
  const wmwDesiredRows = ((zohoData as any).Category_1_MM_Database_WMW_Desired_Date as any[]) || []
  const wiDesiredRowsCat1 = ((zohoData as any).Category_1_MM_Database_WI_Desired_Date as any[]) || []
  const wiDesiredRowsCat2 = ((zohoData as any).Category_2_MM_Database_WI_Desired_Date as any[]) || []
  const fitmentDesiredRows = ((zohoData as any).Product_Fitments_Desired_Date as any[]) || []
  /** Single WMW+Product_Fitment join for this quotation — used by WI, WMW/WMW2, and SLS/GKD when we prefer the same pipeline as Export. */
  const joinedWmwForTransform = wmwPerformaRoute && templateType === 'WMW'
    ? buildJoinedLineRowsForWmwPerforma(zohoData)
    : buildWmwJoinedLineRows(zohoData)

  /**
   * WI quotation layout, but line data lives in Category 1 WMW + linked subforms (last_item_ref)
   * and Product Fitment — same join as Export/WMW quotation tab.
   */
  if (templateType === 'WI' && joinedWmwForTransform.length > 0) {
    totalAmount += addQuotationLineItemsFromWmwJoin(
      joinedWmwForTransform,
      zohoData,
      lineItems,
      currency
    )
  }

  // Check if we're using WMW category fields (for GKD, SLS, BVK that might use WMW data)
  const isUsingWMWCategories = categoryFields && categoryFields.lineItemsField
    ? String(categoryFields.lineItemsField).includes('WMW')
    : (templateType === 'WMW' || templateType === 'WMW2')

  if (lineItems.length > 0 && templateType === 'WI') {
    // WI + WMW join already populated lineItems; skip WI/WMW legacy branches
  } else if (templateType === 'WMW' || templateType === 'WMW2' || isUsingWMWCategories) {
    if (joinedWmwForTransform.length > 0) {
      totalAmount += addQuotationLineItemsFromWmwJoin(
        joinedWmwForTransform,
        zohoData,
        lineItems,
        currency
      )
    } else {
    // WMW template uses different structure (also used by GKD/SLS/BVK when they have WMW data)
    zohoLineItems.forEach((item, index) => {
      // Try to find matching product detail by Last_item_ref (capital L) or last_item_ref (lowercase) or Line_Item_ref
      const itemRef = (item as any).Last_item_ref?.trim() || item.last_item_ref?.trim() || item.Line_Item_ref?.trim()
      const productDetail = itemRef
        ? productDetails.find((pd: any) => 
            pd.Last_item_ref?.trim() === itemRef || 
            pd.last_item_ref?.trim() === itemRef || 
            pd.Line_Item_ref?.trim() === itemRef
          ) || productDetails[index] || {}
        : productDetails[index] || {}
      
      // Map product information - different for WMW2 (Category 2)
      let product = templateType === 'WMW2'
        ? (productDetail.Product_Name || productDetail.Product_Group || item.Line_Item_ref || 'N/A')
        : (productDetail.Product_Master || productDetail.Product_Name || productDetail.Product_Group || 'N/A')

      // WMWD1 tab (WI) with WMW category rows: prefer Blend_Category from WMW 3.0 subform or main line
      if (templateType === 'WI' && isUsingWMWCategories && categoryFields) {
        const refNorm = normalizeLastItemRef(itemRef)
        const useCat2 = String(categoryFields.lineItemsField).includes('Category_2')
        const blend30 = pickBlendCategoryFromWmw30Row(zohoData, refNorm, useCat2 ? '2' : '1')
        const blendMain =
          productDetail.Blend_Category != null && String(productDetail.Blend_Category).trim() !== ''
            ? String(productDetail.Blend_Category).trim()
            : ''
        const blend = blend30 || blendMain
        if (blend) product = blend
      }
      
      // Type: Use Brand_Selling_Name or Brand_Category
      const type = productDetail.Brand_Selling_Name || productDetail.Brand_Category || item.Line_Item_ref || ''

      const wmw30Key =
        templateType === 'WMW2' ? 'Category_2_MM_Database_WMW_3_0' : 'Category_1_MM_Database_WMW_3_0'
      const wmw30Rows = ((zohoData as Record<string, unknown>)[wmw30Key] as any[]) || []
      const refNorm = String(itemRef ?? '').trim()
      const ext30Row =
        refNorm !== ''
          ? wmw30Rows.find(
              (x: any) => String(x?.last_item_ref ?? x?.Last_item_ref ?? '').trim() === refNorm
            )
          : undefined
      const ext30 = ext30Row ?? wmw30Rows[index]
      const form = endTypeDisplayFromRecords(ext30, item, productDetail)

      // Quality: Zoho `Material_Code` only (WMW_2_0 → WMW_3_0 → main), same as join pipeline
      const quality = wmwMaterialCodeForDescriptionQuality(
        item as Record<string, unknown>,
        ext30 as Record<string, unknown> | undefined,
        productDetail as Record<string, unknown>
      )

      // Size: Invoice Dimension 1 & 2 (3_0 → 2_0 → main), numeric token only (e.g. "4.1 Length" → "4.1")
      const inv1 = numericSegmentFromInvoiceDimension(
        ext30?.Invoice_Dimension_1 ?? item.Invoice_Dimension_1 ?? productDetail.Invoice_Dimension_1
      )
      const inv2 = numericSegmentFromInvoiceDimension(
        ext30?.Invoice_Dimension_2 ?? item.Invoice_Dimension_2 ?? productDetail.Invoice_Dimension_2
      )
      const size =
        inv1 && inv2
          ? `${inv1} x ${inv2}`
          : inv1 || inv2
            ? inv1 || inv2
            : productDetail.Length_field && productDetail.Width
              ? `${productDetail.Length_field}x${productDetail.Width}`
              : productDetail.Supply_Dimension_1 && productDetail.Supply_Dimension_2
                ? `${productDetail.Supply_Dimension_1}x${productDetail.Supply_Dimension_2}`
                : productDetail.Length_field ||
                  numericSegmentFromInvoiceDimension(productDetail.Invoice_Dimension_1) ||
                  productDetail.Supply_Dimension_1 ||
                  ''

      // Map quantities and pricing for WMW
      const qty = item.Qty?.trim() || productDetail.Qty?.trim() || '0'
      const subQty = item.SQM?.trim() || productDetail.SQM?.trim() || productDetail.Total_SQM?.trim() || '0'
      // Rate must come only from Zoho `Selling_Price` (no fallbacks). Empty string when missing.
      const rate = item.Selling_Price?.trim() || ''
      // Use Total_Cost for WMW2, Gross_Amount for WMW, fallback to Total_Price or Total_Sale_Value
      const amount = templateType === 'WMW2'
        ? (item.Total_Cost?.trim() || item.Gross_Amount?.trim() || productDetail.Total_Price?.trim() || item.Total_Sale_Value?.trim() || '0')
        : (item.Gross_Amount?.trim() || productDetail.Total_Price?.trim() || item.Total_Sale_Value?.trim() || '0')
      
      const qtyNum = parseFloat(qty.replace(/,/g, '')) || 0
      const piecesFromApi = String(item.Pieces ?? productDetail.Pieces ?? '').trim()
      const { unit, pieces } = unitAndPiecesFromQty(qtyNum, piecesFromApi)

      const hsnCodeForWmwTab =
        templateType === 'WMW'
          ? resolveCategory1WmwHsnCode(
              zohoData,
              item as Record<string, unknown>,
              productDetail as Record<string, unknown>,
              normalizeLastItemRef(itemRef)
            )
          : ''

      const deliveryDesiredWmw =
        templateType === 'WMW' ? desiredDateForRef(wmwDesiredRows, refNorm) : ''

      lineItems.push({
        product,
        quality,
        form,
        size,
        type,
        ...(templateType === 'WMW' ? { hsnCode: hsnCodeForWmwTab } : {}),
        delivery: resolveQuotationDeliveryCell(
          deliveryDisplayFromRecords(ext30, item, productDetail),
          deliveryDesiredWmw,
          zohoData.Delivery_Date_Control
        ),
        uom: item.UOM_Billing?.trim() || productDetail.UOM_Billing?.trim() || 'SQMT',
        qty,
        subQty,
        totalSqm:
          (productDetail.Total_SQM?.trim() ||
            (item as any).Total_SQM?.trim() ||
            '').replace(/,/g, '') || undefined,
        unit,
        pieces,
        rate: rate ? formatCurrency(rate) : '',
        amount: formatCurrency(amount),
      })

      // Add to total using Total_Cost for WMW2, Gross_Amount for WMW
      const amountNum = parseFloat(amount.toString().replace(/,/g, '')) || 0
      totalAmount += amountNum
    })
    }
  } else if (
    templateType === 'BVK' &&
    bvkZohoSource === 'cat2_wi' &&
    (mergedCategory2WiLines.size > 0 || ((zohoData.Category_2_MM_Database_WI as any[]) || []).length > 0)
  ) {
    const productDetailsCat2 = (zohoData.Category_2_MM_Database_WI as any[]) || []
    const usedLineKeysCat2 = new Set<string>()
    const pushCat2WiRow = (productDetail: any, item: any) => {
      const refDel =
        productDetail.Line_Item_ref?.trim() ||
        item.Line_Item_ref?.trim() ||
        ''
      const ext30c2 =
        refDel !== ''
          ? wi30Category2.find((x: any) => String(x.Line_Item_ref ?? '').trim() === refDel)
          : undefined
      const product = productDetail.Product_Name || productDetail.Product_Group || 'N/A'
      const type = productDetail.Brand_Category || item.Line_Item_ref || ''
      const quality = wiMaterialCodeForQualityChain(item, ext30c2, productDetail)
      const form = endTypeDisplayFromRecords(item, productDetail)
      const size =
        item.Invoice_Dimension_1 && item.Invoice_Dimension_2
          ? `${item.Invoice_Dimension_1}x${item.Invoice_Dimension_2}`
          : productDetail.Supply_Dimension_1 && productDetail.Supply_Dimension_2
            ? `${productDetail.Supply_Dimension_1}x${productDetail.Supply_Dimension_2}`
            : item.Invoice_Dimension_1 || productDetail.Supply_Dimension_1 || ''

      const qty = item.Qty?.trim() || '0'
      const subQty = item.SQM?.trim() || '0'
      const rate = item.Selling_Price?.trim() || ''
      const amount =
        item.Total_Sale_Value?.trim() ||
        item.Net_Selling_Amount?.trim() ||
        item.Gross_Amount?.trim() ||
        '0'

      const qtyNum = parseFloat(qty.replace(/,/g, '')) || 0
      const piecesFromApi = String(item.Pieces ?? productDetail.Pieces ?? '').trim()
      const { unit, pieces } = unitAndPiecesFromQty(qtyNum, piecesFromApi)
      const mesh = meshInchFromProductCode(productDetail.Product_Code)
      const weave = String(productDetail.Seam_Type ?? '').trim()

      const deliveryDesiredCat2 =
        refDel !== '' ? desiredDateForRef(wiDesiredRowsCat2, normalizeLastItemRef(refDel)) : ''

      lineItems.push({
        product,
        quality,
        form,
        size,
        type,
        delivery: resolveQuotationDeliveryCell(
          deliveryDisplayFromRecords(ext30c2, item, productDetail),
          deliveryDesiredCat2,
          zohoData.Delivery_Date_Control
        ),
        uom: item.UOM_Billing?.trim() || 'SQMT',
        qty,
        subQty,
        unit,
        pieces,
        rate: rate ? formatCurrency(rate, currency) : '',
        amount: formatCurrency(amount, currency),
        ...(mesh ? { mesh } : {}),
        ...(weave ? { weave } : {}),
      })

      const amountNum = parseFloat(amount.toString().replace(/,/g, '')) || 0
      totalAmount += amountNum
    }

    if (productDetailsCat2.length > 0) {
      productDetailsCat2.forEach((productDetail, index) => {
        const item = pickMergedLineForWiProduct(
          productDetail,
          index,
          mergedCategory2WiLines,
          wi20Category2,
          usedLineKeysCat2
        )
        pushCat2WiRow(productDetail, item)
      })
    } else {
      mergedCategory2WiLines.forEach((item) => {
        pushCat2WiRow({}, item)
      })
    }
  } else if (templateType === 'BVK' && bvkZohoSource === 'fitments') {
    const rows2 = (zohoData.Product_Fitments2_0 as any[]) || []
    const rows1 = (zohoData.Product_Fitments as any[]) || []
    const fitRows = rows2.length > 0 ? rows2 : rows1
    fitRows.forEach((row: any, idx: number) => {
      const ref =
        String(row.Last_item_ref ?? row.last_item_ref ?? '').trim() ||
        String(row.S_No ?? row.Sr_No ?? '').trim()
      const row20 =
        (ref
          ? rows2.find(
              (r: any) =>
                String(r.Last_item_ref ?? r.last_item_ref ?? '').trim() === ref ||
                String(r.S_No ?? r.Sr_No ?? '').trim() === ref
            )
          : undefined) || rows2[idx]
      const mainRow =
        (ref
          ? rows1.find(
              (m: any) =>
                String(m.Last_item_ref ?? m.last_item_ref ?? '').trim() === ref ||
                String(m.S_No ?? m.Sr_No ?? '').trim() === ref
            )
          : undefined) || rows1[idx]
      const product =
        String(
          row.Product_Name ??
            row.Product_Group ??
            row.Description ??
            row.Item_Name ??
            row.zc_display_value ??
            ''
        ).trim() || 'N/A'
      const pc = String(row.Product_Code ?? '').trim()
      const quality =
        wmwMaterialCodeForDescriptionQuality(
          row20 as Record<string, unknown> | undefined,
          undefined,
          mainRow as Record<string, unknown> | undefined
        ) || String(row.Material_Code ?? '').trim()
      const form = endTypeDisplayFromRecords(row20, mainRow)
      const type = String(row.Brand_Category ?? '').trim()
      const size =
        [row.Length_field, row.Width].filter(Boolean).join('x').trim() ||
        [row.Invoice_Dimension_1, row.Invoice_Dimension_2].filter(Boolean).join('x').trim() ||
        [row.Supply_Dimension_1, row.Supply_Dimension_2].filter(Boolean).join('x').trim() ||
        ''
      const qty = String(row.Qty ?? row.Quantity ?? row.Pieces ?? '').trim() || '0'
      const subQty = String(row.SQM ?? '').trim() || '0'
      const rate = String(row.Selling_Price ?? '').trim()
      const amount = String(
        row.Total_Sale_Value ?? row.Net_Selling_Amount ?? row.Gross_Amount ?? row.Total_Price ?? '0'
      ).trim()
      const qtyNum = parseFloat(qty.replace(/,/g, '')) || 0
      const piecesFromApi = String(row.Pieces ?? '').trim()
      const { unit, pieces } = unitAndPiecesFromQty(qtyNum, piecesFromApi)
      const mesh = meshInchFromProductCode(pc)
      const weave = String(row.Seam_Type ?? row.Weave ?? '').trim()
      const amountNum = parseFloat(amount.replace(/,/g, '')) || 0
      totalAmount += amountNum
      const deliveryDesiredFit =
        ref !== '' ? desiredDateForRef(fitmentDesiredRows, normalizeLastItemRef(ref)) : ''
      lineItems.push({
        product,
        quality,
        form,
        size,
        type,
        delivery: resolveQuotationDeliveryCell(
          deliveryDisplayFromRecords(row20, mainRow),
          deliveryDesiredFit,
          zohoData.Delivery_Date_Control
        ),
        uom: String(row.UOM_Billing ?? 'SQMT').trim() || 'SQMT',
        qty,
        subQty,
        unit,
        pieces,
        rate: rate ? formatCurrency(rate, currency) : '',
        amount: formatCurrency(amount, currency),
        ...(mesh ? { mesh } : {}),
        ...(weave ? { weave } : {}),
      })
    })
  } else if (
    (templateType === 'SLS' || templateType === 'GKD') &&
    joinedWmwForTransform.length > 0
  ) {
    // Same WMW + Product_Fitment join as WI / Export when Zoho has Category_1 WMW and/or fitment subform rows
    totalAmount += addQuotationLineItemsFromWmwJoin(
      joinedWmwForTransform,
      zohoData,
      lineItems,
      currency
    )
  } else if (mergedCategory1WiLines && productDetails.length > 0) {
    // One table row per Category_1_MM_Database_WI product; merge WI_2_0 + WI_3_0 by Line_Item_ref (no duplicate rows)
    const usedLineKeys = new Set<string>()
    productDetails.forEach((productDetail, index) => {
      const item = pickMergedLineForWiProduct(
        productDetail,
        index,
        mergedCategory1WiLines,
        wi20Category1,
        usedLineKeys
      )

      const refWi = wiProductRef(productDetail) || String(item.Line_Item_ref ?? '').trim() || ''
      const wi30Row =
        refWi !== ''
          ? wi30Category1.find((x: any) => String(x.Line_Item_ref ?? '').trim() === refWi)
          : undefined
      const wi20Row =
        refWi !== ''
          ? wi20Category1.find((x: any) => String(x.Line_Item_ref ?? '').trim() === refWi)
          : undefined

      const product = productDetail.Product_Name || productDetail.Product_Group || 'N/A'
      const type = productDetail.Brand_Category || item.Line_Item_ref || ''
      const quality = wiMaterialCodeForQualityChain(wi20Row || item, wi30Row, productDetail)
      const form = endTypeDisplayFromRecords(item, productDetail)
      const size =
        item.Invoice_Dimension_1 && item.Invoice_Dimension_2
          ? `${item.Invoice_Dimension_1}x${item.Invoice_Dimension_2}`
          : productDetail.Supply_Dimension_1 && productDetail.Supply_Dimension_2
            ? `${productDetail.Supply_Dimension_1}x${productDetail.Supply_Dimension_2}`
            : item.Invoice_Dimension_1 || productDetail.Supply_Dimension_1 || ''

      const qty = item.Qty?.trim() || '0'
      const subQty = item.SQM?.trim() || '0'
      const rate = item.Selling_Price?.trim() || ''
      const amount =
        item.Total_Sale_Value?.trim() ||
        item.Net_Selling_Amount?.trim() ||
        item.Gross_Amount?.trim() ||
        '0'

      const qtyNum = parseFloat(qty.replace(/,/g, '')) || 0
      const piecesFromApi = String(item.Pieces ?? productDetail.Pieces ?? '').trim()
      const { unit, pieces } = unitAndPiecesFromQty(qtyNum, piecesFromApi)
      const mesh = meshInchFromProductCode(productDetail.Product_Code)
      const weave = String(productDetail.Seam_Type ?? '').trim()

      const refForDesired =
        wiProductRef(productDetail) || item.Line_Item_ref?.trim() || ''
      const deliveryDesiredWi1 =
        refForDesired !== ''
          ? desiredDateForRef(wiDesiredRowsCat1, normalizeLastItemRef(refForDesired))
          : ''

      lineItems.push({
        product,
        quality,
        form,
        size,
        type,
        delivery: resolveQuotationDeliveryCell(
          deliveryDisplayFromRecords(item),
          deliveryDesiredWi1,
          zohoData.Delivery_Date_Control
        ),
        uom: item.UOM_Billing?.trim() || 'SQMT',
        qty,
        subQty,
        unit,
        pieces,
        rate: rate ? formatCurrency(rate, currency) : '',
        amount: formatCurrency(amount, currency),
        ...(mesh ? { mesh } : {}),
        ...(weave ? { weave } : {}),
      })

      const amountNum = parseFloat(amount.toString().replace(/,/g, '')) || 0
      totalAmount += amountNum
    })
  } else if (mergedCategory1WiLines && mergedCategory1WiLines.size > 0) {
    // Product subform empty but merged WI_2_0 + WI_3_0 rows exist — show one row per merged line
    mergedCategory1WiLines.forEach((item) => {
      const productDetail: any = {}
      const product = productDetail.Product_Name || productDetail.Product_Group || 'N/A'
      const type = productDetail.Brand_Category || item.Line_Item_ref || ''
      const quality = String(item.Material_Code ?? '').trim()
      const form = endTypeDisplayFromRecords(item, productDetail)
      const size =
        item.Invoice_Dimension_1 && item.Invoice_Dimension_2
          ? `${item.Invoice_Dimension_1}x${item.Invoice_Dimension_2}`
          : item.Invoice_Dimension_1 || productDetail.Supply_Dimension_1 || ''

      const qty = item.Qty?.trim() || '0'
      const subQty = item.SQM?.trim() || '0'
      const rate = item.Selling_Price?.trim() || ''
      const amount =
        item.Total_Sale_Value?.trim() ||
        item.Net_Selling_Amount?.trim() ||
        item.Gross_Amount?.trim() ||
        '0'

      const qtyNum = parseFloat(qty.replace(/,/g, '')) || 0
      const piecesFromApi = String(item.Pieces ?? '').trim()
      const { unit, pieces } = unitAndPiecesFromQty(qtyNum, piecesFromApi)
      const mesh = meshInchFromProductCode(item.Product_Code)
      const weave = String(item.Seam_Type ?? productDetail.Seam_Type ?? '').trim()

      const refForDesiredOnly = item.Line_Item_ref?.trim() || ''
      const deliveryDesiredWi1Only =
        refForDesiredOnly !== ''
          ? desiredDateForRef(wiDesiredRowsCat1, normalizeLastItemRef(refForDesiredOnly))
          : ''

      lineItems.push({
        product,
        quality,
        form,
        size,
        type,
        delivery: resolveQuotationDeliveryCell(
          deliveryDisplayFromRecords(item),
          deliveryDesiredWi1Only,
          zohoData.Delivery_Date_Control
        ),
        uom: item.UOM_Billing?.trim() || 'SQMT',
        qty,
        subQty,
        unit,
        pieces,
        rate: rate ? formatCurrency(rate, currency) : '',
        amount: formatCurrency(amount, currency),
        ...(mesh ? { mesh } : {}),
        ...(weave ? { weave } : {}),
      })

      const amountNum = parseFloat(amount.toString().replace(/,/g, '')) || 0
      totalAmount += amountNum
    })
  } else {
    // WI (and similar): line-item–only when no product subform rows, or non–Category-1-WI
    zohoLineItems.forEach((item, index) => {
      const ref =
        item.Line_Item_ref?.trim() ||
        (item as any).Last_item_ref?.trim() ||
        (item as any).last_item_ref?.trim()
      const productDetail = ref
        ? productDetails.find(
            (pd: any) =>
              pd.Line_Item_ref?.trim() === ref ||
              pd.Last_item_ref?.trim() === ref ||
              pd.last_item_ref?.trim() === ref
          ) || productDetails[index] || {}
        : productDetails[index] || {}

      const refNormDel = normalizeLastItemRef(ref || '')
      const refStrDel = String(ref ?? '').trim()
      const extWmw30c1 = pickWmw30RowForKey(zohoData, 'Category_1_MM_Database_WMW_3_0', refNormDel)
      const extWmw30c2 = pickWmw30RowForKey(zohoData, 'Category_2_MM_Database_WMW_3_0', refNormDel)
      const extWi30c1 = pickWi30Cat1Row(zohoData, refStrDel)
      const extWi30c2 = pickWi30Cat2Row(zohoData, refStrDel)
      const wi30ForQuality = extWi30c1 || extWi30c2

      const product = productDetail.Product_Name || productDetail.Product_Group || 'N/A'
      const type = productDetail.Brand_Category || item.Line_Item_ref || ''
      const quality = wiMaterialCodeForQualityChain(item, wi30ForQuality, productDetail)
      const form = endTypeDisplayFromRecords(item, productDetail)
      const size =
        item.Invoice_Dimension_1 && item.Invoice_Dimension_2
          ? `${item.Invoice_Dimension_1}x${item.Invoice_Dimension_2}`
          : productDetail.Supply_Dimension_1 && productDetail.Supply_Dimension_2
            ? `${productDetail.Supply_Dimension_1}x${productDetail.Supply_Dimension_2}`
            : item.Invoice_Dimension_1 || productDetail.Supply_Dimension_1 || ''

      const qty = item.Qty?.trim() || '0'
      const subQty = item.SQM?.trim() || '0'
      const rate = item.Selling_Price?.trim() || ''
      const amount =
        item.Total_Sale_Value?.trim() ||
        item.Net_Selling_Amount?.trim() ||
        item.Gross_Amount?.trim() ||
        '0'

      const qtyNum = parseFloat(qty.replace(/,/g, '')) || 0
      const piecesFromApi = String(item.Pieces ?? productDetail.Pieces ?? '').trim()
      const { unit, pieces } = unitAndPiecesFromQty(qtyNum, piecesFromApi)
      const mesh = meshInchFromProductCode(productDetail.Product_Code || (item as any).Product_Code)
      const weave = String(productDetail.Seam_Type ?? '').trim()

      const deliveryDesiredGeneric =
        refNormDel !== ''
          ? desiredDateForRef(wiDesiredRowsCat1, refNormDel) ||
            desiredDateForRef(wiDesiredRowsCat2, refNormDel)
          : ''

      lineItems.push({
        product,
        quality,
        form,
        size,
        type,
        delivery: resolveQuotationDeliveryCell(
          deliveryDisplayFromRecords(extWmw30c1, extWmw30c2, extWi30c1, extWi30c2, item, productDetail),
          deliveryDesiredGeneric,
          zohoData.Delivery_Date_Control
        ),
        uom: item.UOM_Billing?.trim() || 'SQMT',
        qty,
        subQty,
        unit,
        pieces,
        rate: rate ? formatCurrency(rate, currency) : '',
        amount: formatCurrency(amount, currency),
        ...(mesh ? { mesh } : {}),
        ...(weave ? { weave } : {}),
      })

      const amountNum = parseFloat(amount.toString().replace(/,/g, '')) || 0
      totalAmount += amountNum
    })
  }

  return {
    quotationNumber: zohoData.Name || `QT-${zohoData.ID}`,
    date: formatDate(zohoData.Created_Date_and_time),
    buyerEnquiryNo: zohoData.customer_Reference || '',
    termsOfPayment: zohoData.Term_of_Payment || zohoData.Method_of_Payment || '',
    incoTerms: '',
    termsOfDelivery: zohoData.Delivery_Terms || zohoData.Mode_of_Delivery || '',
    deliveryDate: formatDate(zohoData.Delivery_Date_Control),
    followUpDate: formatDate(zohoData.Follow_up_Date),
    dueDate: formatDate(zohoData.Due_Date),
    customerReference: zohoData.customer_Reference || '',
    customerReferenceDate: formatDate(zohoData.Customer_Reference_Date),
    currency: zohoData.Currency || 'INR',
    remarks: zohoData.Remarks || '',
    lineItems,
    totalAmount,
  }
}
