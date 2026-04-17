import { ZohoQuotation, QuotationData, QuotationLineItem, TemplateType } from './types'
import {
  buildWmwJoinedLineRows,
  normalizeLastItemRef,
  pickBlendCategoryFromWmw30Row,
  resolveCategory1WmwHsnCode,
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

/**
 * Zoho `Quotation_Validity` when the field exists on the record; else `Offer_Validity`; else `defaultValue`.
 * If `Quotation_Validity` is present but null, returns '' (empty is intentional, same as SLS template).
 */
export function resolveQuotationValidity(
  rawQuotationData: Record<string, unknown> | null | undefined,
  defaultValue = '7 Days'
): string {
  const raw = rawQuotationData
  if (raw != null && Object.prototype.hasOwnProperty.call(raw, 'Quotation_Validity')) {
    const v = raw.Quotation_Validity
    return v == null ? '' : String(v)
  }
  return String(raw?.Offer_Validity ?? '') || defaultValue
}

/** WMW WMWD1 / Performa summary row when Zoho `Quotation_Validity` and `Offer_Validity` are absent. */
export const DEFAULT_WMW_PERFORMA_QUOTATION_VALIDITY_PHRASE = '07 Days from the date of Quotation'

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

function resolveTotalAfterTax(raw: Record<string, unknown> | null | undefined, fallback: number): number {
  const r = raw ?? {}
  const keys = [
    'Total_Cost_After_Tax_Grand_Total',
    'Overall_Grand_Total_incl_Accessories',
    'Total_After_Tax',
    'Total_Amount_After_GST',
  ] as const
  for (const k of keys) {
    const v = r[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return parseNumericField(v)
    }
  }
  return fallback
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
    totalAfterTax: resolveTotalAfterTax(r, lineItemsTotalFallback),
  }
}

/**
 * Converts number to words
 */
export function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  
  function convertHundreds(n: number): string {
    let result = ''
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred '
      n %= 100
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' '
      n %= 10
    }
    if (n > 0) {
      result += ones[n] + ' '
    }
    return result.trim()
  }
  
  if (num === 0) return 'Zero'
  
  const integerPart = Math.floor(num)
  const decimalPart = Math.round((num - integerPart) * 100)
  
  let words = ''
  
  // Handle thousands
  if (integerPart >= 1000) {
    const thousands = Math.floor(integerPart / 1000)
    words += convertHundreds(thousands) + ' Thousand '
  }
  
  // Handle hundreds
  const remainder = integerPart % 1000
  if (remainder > 0) {
    words += convertHundreds(remainder)
  }
  
  // Handle decimal part (cents/paisa)
  if (decimalPart > 0) {
    words += ` and ${decimalPart}/100`
  }
  
  return words.trim()
}

/**
 * Printable “in words” line for invoices (uses {@link numberToWords}).
 */
export function formatAmountInWords(amount: number, currency: string = 'INR'): string {
  const safe = Number.isFinite(amount) ? amount : 0
  const words = numberToWords(safe)
  const cur = (currency || 'INR').trim().toUpperCase()
  let unit: string
  if (cur === 'USD') unit = 'US Dollars'
  else if (cur === 'INR') unit = 'Rupees'
  else if (cur === 'EUR') unit = 'Euro'
  else unit = cur
  return `${words} ${unit} Only`.replace(/\s+/g, ' ').trim()
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
 * Transforms Zoho quotation data to quotation display format
 */
export function transformQuotationData(
  zohoData: ZohoQuotation, 
  templateType: TemplateType = 'WI',
  templateField?: string
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

  /**
   * Extracts Quality from Product_Code by splitting on '.' and getting second-to-last segment
   * Example: FG.PM.OER.PDW.30x150.SSxSS.316L.V01 -> 316L
   */
  const extractQualityFromProductCode = (productCode?: string): string => {
    if (!productCode) return ''
    const parts = productCode.split('.')
    if (parts.length >= 2) {
      // Get second-to-last element
      return parts[parts.length - 2] || ''
    }
    return ''
  }

  /**
   * WI quotation layout, but line data lives in Category 1 WMW + linked subforms (last_item_ref).
   * Reuses the same join as WMW/Export so Product / Form / Size / Type / Delivery / UOM / Qty / Rate / Amount match Creator.
   */
  if (templateType === 'WI') {
    const joinedWmw = buildWmwJoinedLineRows(zohoData)
    if (joinedWmw.length > 0) {
      const currency = zohoData.Currency || 'INR'
      joinedWmw.forEach((row) => {
        const qty = String(row.quantity ?? '0').trim()
        const qtyNum = parseFloat(qty.replace(/,/g, '')) || 0
        const unit =
          qtyNum === 1
            ? 'One Pc'
            : qtyNum === 2
              ? 'Two Pc'
              : qtyNum === 3
                ? 'Three Pc'
                : qtyNum === 4
                  ? 'Four Pc'
                  : qtyNum > 0
                    ? `${qtyNum} Pc`
                    : ''

        const amtNum = parseFloat(String(row.amountDisplay || '').replace(/,/g, '')) || 0
        totalAmount += amtNum

        lineItems.push({
          product: row.productLabel?.trim() || 'N/A',
          quality: '',
          form: row.supplyForm?.trim() || '',
          size: row.size?.trim() || '',
          type: row.seamType?.trim() || '',
          hsnCode: row.hsnCode?.trim() || '',
          delivery: row.deliveryDate?.trim()
            ? formatDate(row.deliveryDate)
            : formatDate(zohoData.Delivery_Date_Control),
          uom: row.uom?.trim() || 'SQMT',
          qty,
          subQty: '',
          unit,
          pieces: '',
          rate: formatCurrency(row.ratePerSqmDisplay, currency),
          amount: formatCurrency(row.amountDisplay, currency),
        })
      })
    }
  }

  // Check if we're using WMW category fields (for GKD, SLS, BVK that might use WMW data)
  const isUsingWMWCategories = categoryFields && categoryFields.lineItemsField
    ? String(categoryFields.lineItemsField).includes('WMW')
    : (templateType === 'WMW' || templateType === 'WMW2')

  if (lineItems.length > 0 && templateType === 'WI') {
    // WI + WMW join already populated lineItems; skip WI/WMW legacy branches
  } else if (templateType === 'WMW' || templateType === 'WMW2' || isUsingWMWCategories) {
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
      
      // Quality: Extract from Product_Code (second-to-last segment when split by '.')
      const quality = extractQualityFromProductCode(productDetail.Product_Code) || ''
      
      // Form: Different mapping for WMW2 (Category 2)
      const form = templateType === 'WMW2'
        ? (productDetail.Invoice_Form || productDetail.Supply_Form || item.Invoice_Dimension_Type || '')
        : (productDetail.Invoice_Form || productDetail.Supply_Form || '')
      
      // Size: Use Length_field and Width, or dimensions
      const size = productDetail.Length_field && productDetail.Width
        ? `${productDetail.Length_field}x${productDetail.Width}`
        : productDetail.Invoice_Dimension_1 && productDetail.Invoice_Dimension_2
        ? `${productDetail.Invoice_Dimension_1}x${productDetail.Invoice_Dimension_2}`
        : productDetail.Supply_Dimension_1 && productDetail.Supply_Dimension_2
        ? `${productDetail.Supply_Dimension_1}x${productDetail.Supply_Dimension_2}`
        : productDetail.Length_field || productDetail.Invoice_Dimension_1 || productDetail.Supply_Dimension_1 || ''

      // Map quantities and pricing for WMW
      const qty = item.Qty?.trim() || productDetail.Qty?.trim() || '0'
      const subQty = item.SQM?.trim() || productDetail.SQM?.trim() || productDetail.Total_SQM?.trim() || '0'
      // Rate must come only from Zoho `Selling_Price` (no fallbacks). Empty string when missing.
      const rate = item.Selling_Price?.trim() || ''
      // Use Total_Cost for WMW2, Gross_Amount for WMW, fallback to Total_Price or Total_Sale_Value
      const amount = templateType === 'WMW2'
        ? (item.Total_Cost?.trim() || item.Gross_Amount?.trim() || productDetail.Total_Price?.trim() || item.Total_Sale_Value?.trim() || '0')
        : (item.Gross_Amount?.trim() || productDetail.Total_Price?.trim() || item.Total_Sale_Value?.trim() || '0')
      
      // Calculate unit description
      const qtyNum = parseFloat(qty.replace(/,/g, '')) || 0
      const unit = qtyNum === 1 ? 'One Pc' : 
                   qtyNum === 2 ? 'Two Pc' : 
                   qtyNum === 3 ? 'Three Pc' : 
                   qtyNum === 4 ? 'Four Pc' : 
                   qtyNum > 0 ? `${qtyNum} Pc` : ''

      // Pieces from line item or product detail
      const pieces = item.Pieces?.trim() || productDetail.Pieces?.trim() || ''

      const hsnCodeForWmwTab =
        templateType === 'WMW'
          ? resolveCategory1WmwHsnCode(
              zohoData,
              item as Record<string, unknown>,
              productDetail as Record<string, unknown>,
              normalizeLastItemRef(itemRef)
            )
          : ''

      lineItems.push({
        product,
        quality,
        form,
        size,
        type,
        ...(templateType === 'WMW' ? { hsnCode: hsnCodeForWmwTab } : {}),
        delivery: formatDate(zohoData.Delivery_Date_Control),
        uom: item.UOM_Billing?.trim() || productDetail.UOM_Billing?.trim() || 'SQMT',
        qty,
        subQty,
        unit,
        pieces: pieces && subQty ? `${subQty}, ${unit}` : (pieces || ''),
        rate: rate ? formatCurrency(rate) : '',
        amount: formatCurrency(amount),
      })

      // Add to total using Total_Cost for WMW2, Gross_Amount for WMW
      const amountNum = parseFloat(amount.toString().replace(/,/g, '')) || 0
      totalAmount += amountNum
    })
  } else if (
    templateType === 'BVK' &&
    bvkZohoSource === 'cat2_wi' &&
    (mergedCategory2WiLines.size > 0 || ((zohoData.Category_2_MM_Database_WI as any[]) || []).length > 0)
  ) {
    const productDetailsCat2 = (zohoData.Category_2_MM_Database_WI as any[]) || []
    const usedLineKeysCat2 = new Set<string>()
    const pushCat2WiRow = (productDetail: any, item: any) => {
      const product = productDetail.Product_Name || productDetail.Product_Group || 'N/A'
      const type = productDetail.Brand_Category || item.Line_Item_ref || ''
      const quality =
        extractQualityFromProductCode(productDetail.Product_Code) ||
        String(productDetail.Material ?? '').trim() ||
        ''
      const form =
        item.Invoice_Dimension_Type ||
        productDetail.Invoice_Form ||
        productDetail.Supply_Form ||
        ''
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
      const unit =
        qtyNum === 1
          ? 'One Pc'
          : qtyNum === 2
            ? 'Two Pc'
            : qtyNum === 3
              ? 'Three Pc'
              : qtyNum === 4
                ? 'Four Pc'
                : qtyNum > 0
                  ? `${qtyNum} Pc`
                  : ''

      const pieces = item.Pieces?.trim() || ''
      const mesh = meshInchFromProductCode(productDetail.Product_Code)
      const weave = String(productDetail.Seam_Type ?? '').trim()

      lineItems.push({
        product,
        quality,
        form,
        size,
        type,
        delivery: formatDate(zohoData.Delivery_Date_Control),
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
    fitRows.forEach((row: any) => {
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
        extractQualityFromProductCode(pc) || String(row.Material ?? row.Material_Code ?? '').trim() || ''
      const form = String(row.Invoice_Form ?? row.Supply_Form ?? row.Invoice_Dimension_Type ?? '').trim()
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
      const unit =
        qtyNum === 1
          ? 'One Pc'
          : qtyNum === 2
            ? 'Two Pc'
            : qtyNum === 3
              ? 'Three Pc'
              : qtyNum === 4
                ? 'Four Pc'
                : qtyNum > 0
                  ? `${qtyNum} Pc`
                  : ''
      const pieces = String(row.Pieces ?? '').trim()
      const mesh = meshInchFromProductCode(pc)
      const weave = String(row.Seam_Type ?? row.Weave ?? '').trim()
      const amountNum = parseFloat(amount.replace(/,/g, '')) || 0
      totalAmount += amountNum
      lineItems.push({
        product,
        quality,
        form,
        size,
        type,
        delivery: formatDate(zohoData.Delivery_Date_Control),
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

      const product = productDetail.Product_Name || productDetail.Product_Group || 'N/A'
      const type = productDetail.Brand_Category || item.Line_Item_ref || ''
      const quality = extractQualityFromProductCode(productDetail.Product_Code) || ''
      const form =
        item.Invoice_Dimension_Type ||
        productDetail.Invoice_Form ||
        productDetail.Supply_Form ||
        ''
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
      const unit =
        qtyNum === 1
          ? 'One Pc'
          : qtyNum === 2
            ? 'Two Pc'
            : qtyNum === 3
              ? 'Three Pc'
              : qtyNum === 4
                ? 'Four Pc'
                : qtyNum > 0
                  ? `${qtyNum} Pc`
                  : ''

      const pieces = item.Pieces?.trim() || ''
      const mesh = meshInchFromProductCode(productDetail.Product_Code)
      const weave = String(productDetail.Seam_Type ?? '').trim()

      lineItems.push({
        product,
        quality,
        form,
        size,
        type,
        delivery: formatDate(zohoData.Delivery_Date_Control),
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
      const quality = extractQualityFromProductCode(productDetail.Product_Code) || ''
      const form =
        item.Invoice_Dimension_Type ||
        productDetail.Invoice_Form ||
        productDetail.Supply_Form ||
        ''
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
      const unit =
        qtyNum === 1
          ? 'One Pc'
          : qtyNum === 2
            ? 'Two Pc'
            : qtyNum === 3
              ? 'Three Pc'
              : qtyNum === 4
                ? 'Four Pc'
                : qtyNum > 0
                  ? `${qtyNum} Pc`
                  : ''

      const pieces = item.Pieces?.trim() || ''
      const mesh = meshInchFromProductCode(item.Product_Code)
      const weave = String(item.Seam_Type ?? productDetail.Seam_Type ?? '').trim()

      lineItems.push({
        product,
        quality,
        form,
        size,
        type,
        delivery: formatDate(zohoData.Delivery_Date_Control),
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

      const product = productDetail.Product_Name || productDetail.Product_Group || 'N/A'
      const type = productDetail.Brand_Category || item.Line_Item_ref || ''
      const quality = extractQualityFromProductCode(productDetail.Product_Code) || ''
      const form =
        item.Invoice_Dimension_Type ||
        productDetail.Invoice_Form ||
        productDetail.Supply_Form ||
        ''
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
      const unit =
        qtyNum === 1
          ? 'One Pc'
          : qtyNum === 2
            ? 'Two Pc'
            : qtyNum === 3
              ? 'Three Pc'
              : qtyNum === 4
                ? 'Four Pc'
                : qtyNum > 0
                  ? `${qtyNum} Pc`
                  : ''

      const pieces = item.Pieces?.trim() || ''
      const mesh = meshInchFromProductCode(productDetail.Product_Code || (item as any).Product_Code)
      const weave = String(productDetail.Seam_Type ?? '').trim()

      lineItems.push({
        product,
        quality,
        form,
        size,
        type,
        delivery: formatDate(zohoData.Delivery_Date_Control),
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
