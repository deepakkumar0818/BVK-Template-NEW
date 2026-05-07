/**
 * Build Product Fitment–driven line rows for branded goods tables
 * (Item / MESH / BRAND / SIZE [Mtrs] / Sqm) matching Zoho
 * `Product_Fitments` + `Product_Fitments2_0` + `Product_Fitments_Desired_Date` joins
 * (same ref-key rules as `buildWmwJoinedLineRows` in wmw-subform-mapping).
 */
import type { ZohoQuotation } from './types'
import { meshInchFromProductCode } from './quotation-utils'
import {
  groupRowsByLastItemRef,
  pickFirstRowForRef,
  PRODUCT_FITMENT_SUBFORM_KEYS,
  stringifyField,
  normalizeLastItemRef,
} from './wmw-subform-mapping'
import { resolveGoodsSqmArea } from './goods-sqm-area'

type UnknownRecord = Record<string, unknown>

function isRecord(v: unknown): v is UnknownRecord {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function toRowArray(raw: ZohoQuotation | null | undefined, key: string): UnknownRecord[] {
  if (!raw || !isRecord(raw as unknown)) return []
  const v = (raw as UnknownRecord)[key]
  if (v == null) return []
  if (Array.isArray(v)) return v.filter(isRecord) as UnknownRecord[]
  if (isRecord(v)) return [v as UnknownRecord]
  return []
}

function refFromRow(row: UnknownRecord): string {
  return normalizeLastItemRef(
    row.last_item_ref ?? row.Last_item_ref ?? row.Line_Item_ref ?? row.Sr_No ?? row.S_No
  )
}

function coalesceMainFirst(
  main: UnknownRecord | undefined,
  row2: UnknownRecord | undefined,
  row3: UnknownRecord | undefined,
  field: string
): string {
  const m = main ? stringifyField(main[field]) : ''
  if (m !== '') return m
  const a = row2 ? stringifyField(row2[field]) : ''
  if (a !== '') return a
  return row3 ? stringifyField(row3[field]) : ''
}

function coalesceLinkedFirst(
  row2: UnknownRecord | undefined,
  row3: UnknownRecord | undefined,
  main: UnknownRecord | undefined,
  field: string
): string {
  const a = row2 ? stringifyField(row2[field]) : ''
  if (a !== '') return a
  const b = row3 ? stringifyField(row3[field]) : ''
  if (b !== '') return b
  return main ? stringifyField(main[field]) : ''
}

function mainRowsForFitment(raw: ZohoQuotation): UnknownRecord[] {
  const fromMain = toRowArray(raw, PRODUCT_FITMENT_SUBFORM_KEYS.MAIN)
  if (fromMain.length > 0) return fromMain
  const from20 = toRowArray(raw, PRODUCT_FITMENT_SUBFORM_KEYS.LINK_2_0)
  if (from20.length > 0) return from20
  return []
}

function parseNumericValue(value: unknown): number {
  const s = stringifyField(value).replace(/,/g, '')
  if (!s) return NaN
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : NaN
}

function firstFieldString(records: (UnknownRecord | null | undefined)[], field: string): string {
  for (const r of records) {
    if (r == null) continue
    const v = stringifyField(r[field])
    if (v) return v
  }
  return ''
}

function desiredDateForRef(desiredRows: UnknownRecord[], refNormalized: string): string {
  if (!desiredRows.length) return ''
  const row = pickFirstRowForRef(groupRowsByLastItemRef(desiredRows), refNormalized)
  return row ? stringifyField((row as UnknownRecord).Date_field) : ''
}

/** One Product Fitment line, aligned with branded *GoodsTable row shapes. */
export interface ProductFitmentBrandedGoodsRow {
  product: string
  form: string
  quality: string
  hsnCode: string
  mesh: string
  brand: string
  size: string
  sqmArea: string
  quantity: number
  rate: number
  amount: number
  perPc: number
  totalWeight: number
  /** Delivery: Product_Fitments_Desired_Date (same ref as line). */
  delivery: string
  /** For Ekamas-style: mesh column from Brand_Category when no mesh from code. */
  brandCategoryForMeshCol: string
}

/**
 * When Zoho has Product_Fitment rows, returns one branded row per main line; otherwise [].
 * Join keys match `buildJoinedLineRowsForSubformBundle` (isProductFitment) in wmw-subform-mapping.
 */
export function buildProductFitmentBrandedGoodsBlock(
  raw: ZohoQuotation | null | undefined
): ProductFitmentBrandedGoodsRow[] {
  if (!raw) return []
  const mainRows = mainRowsForFitment(raw)
  if (mainRows.length === 0) return []

  const keys = PRODUCT_FITMENT_SUBFORM_KEYS
  const rows2 = toRowArray(raw, keys.LINK_2_0)
  const byRef2 = groupRowsByLastItemRef(rows2)
  const desiredRows = toRowArray(raw, keys.DESIRED_DATE)
  return mainRows.map((main, idx) => {
    const lastItemRef = refFromRow(main)
    const ext2 = pickFirstRowForRef(byRef2, lastItemRef)
    const ext3 = undefined as UnknownRecord | undefined

    const blendProductLabel =
      stringifyField(ext2?.Blend_Category) ||
      stringifyField(main.Blend_Category) ||
      stringifyField(main.Product_Group) ||
      stringifyField(main.Product_Name) ||
      stringifyField(main.Product_Master) ||
      stringifyField(main.Price_Master)

    /** Form: `End_Type` from `Product_Fitments2_0` (linked row) first, then main `Product_Fitments`. */
    const form = coalesceLinkedFirst(ext2, ext3, main, 'End_Type')

    const materialCode = firstFieldString([ext2, main], 'Material_Code')
    const quality = materialCode ? `AISI ${materialCode}` : 'AISI'

    const hsnCode = coalesceLinkedFirst(ext2, ext3, main, 'HSN_Code')
    const brand = coalesceMainFirst(main, ext2, ext3, 'Brand_Selling_Name') || firstFieldString([ext2, main], 'Brand_Category')

    const lenS = firstFieldString([main, ext2], 'Length_field')
    const widS = firstFieldString([main, ext2], 'Width')
    let size = ''
    if (lenS && widS) size = `${lenS} x ${widS}`
    else {
      const sd = coalesceLinkedFirst(ext2, ext3, main, 'Supply_Dimension_Type')
      if (sd) size = sd
    }

    const sqmArea = resolveGoodsSqmArea({
      lengthField: (main as UnknownRecord).Length_field ?? (ext2 as UnknownRecord | undefined)?.Length_field,
      width: (main as UnknownRecord).Width ?? (ext2 as UnknownRecord | undefined)?.Width,
      sizeDisplay: size,
    })

    const productCode = firstFieldString([ext2, main], 'Product_Code')
    const mesh = meshInchFromProductCode(productCode)
    const brandCategoryForMeshCol = firstFieldString([main, ext2], 'Brand_Category')

    /** Same rule as Ekamas goods: `UOM_Billing` === SQM → quantity from `Pieces` on `Product_Fitments` / 2_0 (main first). */
    const quantity = (() => {
      const uomBilling = coalesceMainFirst(main, ext2, ext3, 'UOM_Billing').trim().toUpperCase()
      const piecesStr = firstFieldString([main, ext2, ext3 as UnknownRecord | undefined], 'Pieces')
      if (uomBilling === 'SQM' && piecesStr.trim() !== '') {
        const qp = parseNumericValue(piecesStr)
        if (Number.isFinite(qp)) return qp
      }
      const q = parseNumericValue(coalesceMainFirst(main, ext2, ext3, 'Qty'))
      if (Number.isFinite(q) && q > 0) return q
      const p = parseNumericValue(coalesceMainFirst(main, ext2, ext3, 'Pieces'))
      return Number.isFinite(p) ? p : 0
    })()

    const rateStr = coalesceMainFirst(main, ext2, ext3, 'Selling_Price')
    const rateParsed = rateStr ? parseNumericValue(rateStr) : NaN
    const rate = Number.isFinite(rateParsed) ? rateParsed : Number.NaN

    const netSales = firstFieldString([ext2, main, ext3 as UnknownRecord | undefined], 'Net_sales_value')
    const ga = firstFieldString([ext2, main, ext3 as UnknownRecord | undefined], 'Gross_Amount')
    const totalPriceField = firstFieldString([ext2, main, ext3 as UnknownRecord | undefined], 'Total_Price')
    const amountFromLine =
      parseNumericValue(
        firstFieldString([ext2, main, ext3 as UnknownRecord | undefined], 'Net_Selling_Amount')
      ) || parseNumericValue(
        firstFieldString([ext2, main, ext3 as UnknownRecord | undefined], 'Gross_Amount')
      ) ||
      0
    const totalPriceParsed = totalPriceField ? parseNumericValue(totalPriceField) : NaN
    const computedAmount = Number.isFinite(rate) ? quantity * rate : NaN

    let amount: number
    if (Number.isFinite(computedAmount)) {
      amount = computedAmount
    } else if (netSales) {
      amount = parseNumericValue(netSales) || 0
    } else if (ga) {
      amount = parseNumericValue(ga) || 0
    } else if (Number.isFinite(totalPriceParsed)) {
      amount = totalPriceParsed
    } else {
      const rForCalc =
        parseNumericValue(coalesceMainFirst(main, ext2, ext3, 'Total_SQM')) ||
        parseNumericValue(coalesceMainFirst(main, ext2, ext3, 'Selling_Price'))
      const c = quantity * (Number.isFinite(rForCalc) ? rForCalc : 0)
      amount = c > 0 ? c : (amountFromLine > 0 ? amountFromLine : 0)
    }

    const perPc = parseNumericValue(
      firstFieldString([ext2, main, ext3 as UnknownRecord | undefined], 'Net_Weight') ||
        firstFieldString([ext2, main, ext3 as UnknownRecord | undefined], 'Net_Weight_Per_Pcs')
    )
    const perPcN = Number.isFinite(perPc) && perPc >= 0 ? perPc : 0
    const totalWeight = perPcN * quantity

    const delivery =
      coalesceLinkedFirst(ext2, ext3, main, 'Delivery') ||
      desiredDateForRef(desiredRows, lastItemRef) ||
      firstFieldString([ext2, main], 'delivery')

    return {
      product: blendProductLabel,
      form: form || '',
      quality,
      hsnCode,
      mesh,
      brand,
      size: size || '',
      sqmArea,
      quantity,
      rate,
      amount,
      perPc: perPcN,
      totalWeight,
      delivery,
      brandCategoryForMeshCol,
    }
  })
}

/** Zoho has at least one Product_Fitment driver row. */
export function hasProductFitmentForGoodsTable(raw: ZohoQuotation | null | undefined): boolean {
  return buildProductFitmentBrandedGoodsBlock(raw).length > 0
}

/**
 * Merges WMW 2.0–mapped line rows with Product_Fitment block rows, renumbering `item` 1..n.
 * Pass `reindex` only the objects that have `item: number` on each row.
 */
export function renumberMergedGoodsItems<T extends { item: number }>(rows: T[]): T[] {
  return rows.map((r, i) => ({ ...r, item: i + 1 })) as T[]
}
