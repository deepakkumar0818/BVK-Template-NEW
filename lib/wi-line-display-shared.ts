/**
 * Shared Zoho WI subform helpers: same Category 1 / 2 resolution and field names as the SLS tab
 * (Remarks, Qty, Selling_Price, Total_Sale_Value on WI_2_0, plus merged WI_3_0 + product subform for BVK).
 */

import type { QuotationLineItem, ZohoQuotation } from './types'
import { resolveBvkLineSource } from './quotation-utils'

/** Normalize Zoho subform field to a row array (Creator may return one object). */
export function subformRows(
  raw: Record<string, unknown> | null | undefined,
  key: string
): Record<string, unknown>[] {
  const v = raw?.[key]
  if (v == null) return []
  if (Array.isArray(v)) return v.filter((r) => r != null && typeof r === 'object') as Record<string, unknown>[]
  if (typeof v === 'object') return [v as Record<string, unknown>]
  return []
}

/**
 * Which WI_2_0 subform SLS uses — Zoho `Template` e.g. "Category 2 MM Database WI" → Category_2.
 * (Same logic as {@link SLSQuotationContent} `resolveSlsWi20SubformKey`.)
 */
export function resolveSlsWi20SubformKey(
  templateField?: string
): 'Category_1_MM_Database_WI_2_0' | 'Category_2_MM_Database_WI_2_0' {
  const t = templateField?.trim().toLowerCase() || ''
  if (t.includes('category 2 mm database wi') || t.includes('category 2 wi')) {
    return 'Category_2_MM_Database_WI_2_0'
  }
  return 'Category_1_MM_Database_WI_2_0'
}

export type WiSubformBundle = {
  wi20: 'Category_1_MM_Database_WI_2_0' | 'Category_2_MM_Database_WI_2_0'
  wi30: 'Category_1_MM_Database_WI_3_0' | 'Category_2_MM_Database_WI_3_0'
  product: 'Category_1_MM_Database_WI' | 'Category_2_MM_Database_WI'
}

/** BVK data bundle: matches {@link resolveBvkLineSource} (Cat1 vs Cat2); fitments use no WI bundle. */
export function resolveBvkWiSubformBundle(raw: Record<string, unknown> | null | undefined): WiSubformBundle | null {
  if (!raw) return null
  const src = resolveBvkLineSource(raw as ZohoQuotation)
  if (src === 'fitments') return null
  if (src === 'cat2_wi') {
    return {
      wi20: 'Category_2_MM_Database_WI_2_0',
      wi30: 'Category_2_MM_Database_WI_3_0',
      product: 'Category_2_MM_Database_WI',
    }
  }
  return {
    wi20: 'Category_1_MM_Database_WI_2_0',
    wi30: 'Category_1_MM_Database_WI_3_0',
    product: 'Category_1_MM_Database_WI',
  }
}

function lineRef(row: Record<string, unknown>): string {
  return String(row.Line_Item_ref ?? row.Last_item_ref ?? row.last_item_ref ?? '').trim()
}

function strVal(v: unknown): string {
  if (v == null) return ''
  const s = String(v).trim()
  return s
}

/**
 * BVK Product column shows only **Remarks** per template:
 * - WI: `Category_*_MM_Database_WI_2_0.Remarks`
 * - Product Fitment: `Product_Fitments2_0.Remarks` (else `Product_Fitments.Remarks`)
 * Mesh / Material / Weave render as separate rows beside Remarks.
 */

/** First numeric token in Product_Code (e.g. mesh count from code string). */
export function bvkMeshFirstNumericFromProductCode(productCode?: string): string {
  const s = strVal(productCode)
  if (!s) return ''
  const m = s.match(/\d+(?:\.\d+)?/)
  return m ? m[0] : ''
}

/** Weave on BVK: always from the matching WI 3.0 row (`Category_*_MM_Database_WI_3_0`). */
function bvkWeaveFromWi30Row(wi30Row: Record<string, unknown>): string {
  return strVal(wi30Row.Weave) || strVal(wi30Row.Seam_Type)
}

/**
 * BVK mesh / material / weave sources (Zoho subforms):
 * - Cat1: Product_Code on Category_1_MM_Database_WI; Material_Code on Category_1_MM_Database_WI_2_0;
 *   Weave on Category_1_MM_Database_WI_3_0 only (`Weave`, else `Seam_Type`).
 * - Cat2: Product_Code on Category_2_MM_Database_WI; Material_Code from Category_1_MM_Database_WI_3_0
 *   then Category_2_MM_Database_WI_3_0; Weave **only** on Category_2_MM_Database_WI_3_0 (same ref/index).
 */
function bvkMeshMaterialWeaveFromWiRows(
  bundle: WiSubformBundle,
  row20: Record<string, unknown>,
  row30: Record<string, unknown>,
  productRow: Record<string, unknown>,
  /** For Cat2 only: matched row from Category_1_MM_Database_WI_3_0 (material only) */
  cat1Wi30Row: Record<string, unknown>
): { mesh: string; material: string; weave: string } {
  const mesh = bvkMeshFirstNumericFromProductCode(strVal(productRow.Product_Code))
  const isCat1 = bundle.product === 'Category_1_MM_Database_WI'
  if (isCat1) {
    return {
      mesh,
      material: strVal(row20.Material_Code),
      weave: bvkWeaveFromWi30Row(row30),
    }
  }
  const materialCat1 = strVal(cat1Wi30Row.Material_Code)
  const materialCat2 = strVal(row30.Material_Code)
  return {
    mesh,
    material: materialCat1 || materialCat2,
    weave: bvkWeaveFromWi30Row(row30),
  }
}

export interface BvkQuotationTableRow {
  /** Upper product column: API name + value (excludes Line_Item_ref; Mesh/Material/Weave are below). */
  productColumnLines: Array<{ apiName: string; value: string }>
  /** Mesh: first number in Product_Code on Category_*_MM_Database_WI */
  meshDisplay: string
  /** Cat1: WI_2_0 Material_Code. Cat2: Category_1_MM_Database_WI_3_0 Material_Code, else Cat2 WI_3_0 */
  materialDisplay: string
  /** Weave: `Weave` or `Seam_Type` on the matching Category_*_MM_Database_WI_3_0 row only */
  weaveDisplay: string
  /** Same as SLS: WI_2_0 `Qty` */
  qty: string
  /** Raw numeric for {@link formatCurrency} */
  unitPrice: number
  /** Raw numeric for {@link formatCurrency} */
  totalPrice: number
}

/** Product column on BVK reads from Zoho `Remarks` but the visible label is `Product`. */
function buildRemarksOnlyProductLines(remarks: string): Array<{ apiName: string; value: string }> {
  const v = remarks.trim()
  return v ? [{ apiName: 'Product', value: v }] : []
}

function unitPriceFromLine(merged: Record<string, unknown>): number {
  const sp = strVal(merged.Selling_Price).replace(/,/g, '')
  return parseFloat(sp) || 0
}

/**
 * BVK table rows: Product column uses Zoho API names; Qty / unit / total use SLS fields (`Qty`, `Selling_Price`, `Total_Sale_Value`).
 */
export function buildBvkQuotationTableRows(
  raw: Record<string, unknown> | null | undefined,
  fallbackLineItems: QuotationLineItem[]
): BvkQuotationTableRow[] {
  if (!raw) {
    return mapFallbackLineItems(fallbackLineItems)
  }

  const bundle = resolveBvkWiSubformBundle(raw)
  if (bundle) {
    const wi20 = subformRows(raw, bundle.wi20)
    if (wi20.length > 0) {
      const wi30 = subformRows(raw, bundle.wi30)
      const products = subformRows(raw, bundle.product)
      const cat1Wi30All =
        bundle.product === 'Category_2_MM_Database_WI' ? subformRows(raw, 'Category_1_MM_Database_WI_3_0') : []
      return wi20.map((row20, index) => {
        const ref = lineRef(row20)
        const row30 =
          (ref ? wi30.find((r) => lineRef(r) === ref) : undefined) ?? wi30[index] ?? {}
        const cat1Row30 =
          cat1Wi30All.length > 0
            ? (ref ? cat1Wi30All.find((r) => lineRef(r) === ref) : undefined) ?? cat1Wi30All[index] ?? {}
            : {}
        const merged: Record<string, unknown> = { ...row20, ...row30 }
        const pd: Record<string, unknown> =
          (ref ? products.find((p) => lineRef(p) === ref) : undefined) ?? products[index] ?? {}

        const productColumnLines = buildRemarksOnlyProductLines(strVal(row20.Remarks))

        const { mesh: meshDisplay, material: materialDisplay, weave: weaveDisplay } = bvkMeshMaterialWeaveFromWiRows(
          bundle,
          row20,
          row30,
          pd,
          cat1Row30
        )

        const qty = strVal(merged.Qty)
        return {
          productColumnLines,
          meshDisplay,
          materialDisplay,
          weaveDisplay,
          qty,
          unitPrice: unitPriceFromLine(merged),
          totalPrice: slsLineTotalFromRow(merged),
        }
      })
    }
  }

  const fit2 = subformRows(raw, 'Product_Fitments2_0')
  const fit1 = subformRows(raw, 'Product_Fitments')
  const fit3 = subformRows(raw, 'Product_Fitments3_0')
  const useFit2 = fit2.length > 0
  const fitRows = useFit2 ? fit2 : fit1
  if (fitRows.length > 0) {
    return fitRows.map((row, index) => {
      const productColumnLines = buildRemarksOnlyProductLines(strVal(row.Remarks))

      const mainRow = useFit2 ? matchProductFitmentsMainRow(fit1, row, index) : row
      const fit3Row = useFit2 ? matchProductFitments3Row(fit3, row, index) : undefined

      const productCode = strVal(mainRow?.Product_Code) || strVal(row.Product_Code)
      const meshDisplay = bvkMeshFirstNumericFromProductCode(productCode)
      const materialDisplay =
        strVal(row.Material_Code) || (mainRow ? strVal(mainRow.Material_Code) : '')
      const weaveDisplay =
        strVal(fit3Row?.Weave) || strVal(row.Weave) || strVal(row.Seam_Type)

      const qty = useFit2
        ? qtyFromProductFitmentsMainRow(fit1, row, index) || strVal(row.Qty) || strVal(row.Pieces)
        : strVal(row.Qty) || strVal(row.Pieces)
      const { unitPrice, totalPrice } = slsProductFitmentUnitAndTotal(useFit2, fit1, row, index)
      return {
        productColumnLines,
        meshDisplay,
        materialDisplay,
        weaveDisplay,
        qty,
        unitPrice,
        totalPrice,
      }
    })
  }

  return mapFallbackLineItems(fallbackLineItems)
}

function mapFallbackLineItems(items: QuotationLineItem[]): BvkQuotationTableRow[] {
  return items.map((item) => {
    const productColumnLines = buildRemarksOnlyProductLines(item.product ?? '')
    const meshDisplay = item.mesh?.trim() || ''
    const materialDisplay = item.quality || ''
    const weaveDisplay = item.weave?.trim() || ''
    const qty = item.qty || ''
    const unitPrice = parseFloat(String(item.rate).replace(/,/g, '')) || 0
    const totalPrice = parseFloat(String(item.amount).replace(/,/g, '')) || 0
    return {
      productColumnLines,
      meshDisplay,
      materialDisplay,
      weaveDisplay,
      qty,
      unitPrice,
      totalPrice,
    }
  })
}

/**
 * Product Fitment: align `Product_Fitments2_0` lines with `Product_Fitments` by `S_No` ↔ `Sr_No` (or `S_No`),
 * else same index.
 */
function matchProductFitmentsMainRow(
  fitMain: Record<string, unknown>[],
  fit20Row: Record<string, unknown>,
  index: number
): Record<string, unknown> | undefined {
  if (fitMain.length === 0) return undefined
  const serial = strVal(fit20Row.S_No)
  const match =
    serial !== ''
      ? fitMain.find((r) => {
          const sr = strVal(r.Sr_No)
          const sn = strVal(r.S_No)
          return sr === serial || sn === serial
        })
      : undefined
  return match ?? fitMain[index]
}

/** Align `Product_Fitments3_0` rows to `Product_Fitments2_0` by `S_No`; falls back to same index. */
function matchProductFitments3Row(
  fit3: Record<string, unknown>[],
  fit20Row: Record<string, unknown>,
  index: number
): Record<string, unknown> | undefined {
  if (fit3.length === 0) return undefined
  const serial = strVal(fit20Row.S_No)
  const match =
    serial !== ''
      ? fit3.find((r) => strVal(r.S_No) === serial || strVal(r.Sr_No) === serial)
      : undefined
  return match ?? fit3[index]
}

function qtyFromProductFitmentsMainRow(
  fitMain: Record<string, unknown>[],
  fit20Row: Record<string, unknown>,
  index: number
): string {
  const mainRow = matchProductFitmentsMainRow(fitMain, fit20Row, index)
  if (!mainRow) return ''
  return strVal(mainRow.Qty) || strVal(mainRow.Pieces)
}

/** Prefer non-empty `Gross_Amount`, then legacy line-total fields (older WI / fitment payloads). */
function slsLineTotalFromRow(row: Record<string, unknown>): number {
  const ga = strVal(row.Gross_Amount).replace(/,/g, '')
  if (ga !== '') {
    const n = parseFloat(ga)
    if (Number.isFinite(n)) return n
  }
  for (const k of ['Total_Sale_Value', 'Net_sales_value', 'Net_Selling_Amount', 'Total_Price'] as const) {
    const v = strVal(row[k]).replace(/,/g, '')
    if (v === '') continue
    const n = parseFloat(v)
    if (Number.isFinite(n)) return n
  }
  return 0
}

/** Unit / line total for Product Fitment: `Selling_Price` and `Gross_Amount` on matched `Product_Fitments` row. */
function slsProductFitmentUnitAndTotal(
  useFit20: boolean,
  fitMain: Record<string, unknown>[],
  row: Record<string, unknown>,
  index: number
): { unitPrice: number; totalPrice: number } {
  const mainRow = useFit20 ? matchProductFitmentsMainRow(fitMain, row, index) : row
  const primary = mainRow ?? row
  const unitPrice = parseFloat(strVal(primary.Selling_Price).replace(/,/g, '')) || 0
  let totalPrice = slsLineTotalFromRow(primary)
  if (useFit20) {
    const u2 = parseFloat(strVal(row.Selling_Price).replace(/,/g, '')) || 0
    const t2 = slsLineTotalFromRow(row)
    return {
      unitPrice: unitPrice || u2,
      totalPrice: totalPrice || t2,
    }
  }
  return { unitPrice, totalPrice }
}

/** SLS: same row shape as `buildSlsLineItemsFromWi20Subforms` in SLSQuotationContent. */
export function buildSlsLineItemsFromWi20SubformsShared(
  raw: Record<string, unknown> | null | undefined,
  templateField?: string
): Array<{ item: number; product: string; qty: string; unitPrice: number; totalPrice: number }> {
  if (!raw) return []
  const t = String(templateField ?? '').trim().toLowerCase()
  if (t.includes('product fitment')) {
    const fit20 = subformRows(raw, 'Product_Fitments2_0')
    const fitMain = subformRows(raw, 'Product_Fitments')
    const useFit20 = fit20.length > 0
    const rows = useFit20 ? fit20 : fitMain
    return rows.map((row, index) => {
      const product =
        strVal(row.Remarks) ||
        strVal(row.Price_Master) ||
        strVal(row.Product_Name) ||
        strVal(row.Product_Group) ||
        strVal(row.Item_Name)
      const qtyRaw = useFit20
        ? qtyFromProductFitmentsMainRow(fitMain, row, index) || strVal(row.Qty) || strVal(row.Pieces)
        : strVal(row.Qty) || strVal(row.Pieces)
      const { unitPrice, totalPrice } = slsProductFitmentUnitAndTotal(useFit20, fitMain, row, index)
      return {
        item: index + 1,
        product,
        qty: qtyRaw,
        unitPrice,
        totalPrice,
      }
    })
  }
  const key = resolveSlsWi20SubformKey(templateField)
  const rows = subformRows(raw, key)
  return rows.map((row, index) => {
    const remarks = strVal(row.Remarks)
    const sp = strVal(row.Selling_Price).replace(/,/g, '')
    const qtyRaw = strVal(row.Qty)
    const unitPrice = parseFloat(sp) || 0
    const totalPrice = slsLineTotalFromRow(row)
    return {
      item: index + 1,
      product: remarks,
      qty: qtyRaw,
      unitPrice,
      totalPrice,
    }
  })
}
