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

/** Line / product fields listed in Product column using exact Zoho API names (SLS-aligned + common WI detail). */
const BVK_MERGED_LINE_KEYS: readonly string[] = [
  'Remarks',
  'Invoice_Dimension_Type',
  'SQM',
  'Pieces',
  'UOM_Billing',
]

/** Product subform fields for BVK product column — not Line_Item_ref; Mesh/Material/Weave are separate rows. */
const BVK_PRODUCT_SUBFORM_KEYS: readonly string[] = [
  'Product_Name',
  'Product_Group',
  'Brand_Category',
  'Supply_Form',
  'Invoice_Form',
  'Supply_Dimension_Type',
  'Conversion_Factor',
  'End_Type',
  'Status',
  'Product_Status',
]

const BVK_FITMENT_DETAIL_KEYS: readonly string[] = [
  'S_No',
  'Product_Name',
  'Product_Group',
  'Description',
  'Item_Name',
  'Brand_Category',
  'Invoice_Dimension_Type',
  'SQM',
  'Pieces',
  'UOM_Billing',
]

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

/** Never show internal line keys in the Product column. */
function stripLineRefLines(lines: Array<{ apiName: string; value: string }>): void {
  const drop = new Set(['Line_Item_ref', 'Last_item_ref', 'last_item_ref'])
  for (let i = lines.length - 1; i >= 0; i--) {
    if (drop.has(lines[i].apiName)) lines.splice(i, 1)
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

function pushDetailLines(
  out: Array<{ apiName: string; value: string }>,
  row: Record<string, unknown>,
  keys: readonly string[]
): void {
  for (const k of keys) {
    const value = strVal(row[k])
    if (value) out.push({ apiName: k, value })
  }
}

function amountFromLine(merged: Record<string, unknown>): number {
  const tsv = strVal(merged.Total_Sale_Value).replace(/,/g, '')
  if (tsv) return parseFloat(tsv) || 0
  const ns = strVal(merged.Net_Selling_Amount).replace(/,/g, '')
  if (ns) return parseFloat(ns) || 0
  const ga = strVal(merged.Gross_Amount).replace(/,/g, '')
  return parseFloat(ga) || 0
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

        const productColumnLines: Array<{ apiName: string; value: string }> = []
        pushDetailLines(productColumnLines, merged, BVK_MERGED_LINE_KEYS)
        pushDetailLines(productColumnLines, pd, BVK_PRODUCT_SUBFORM_KEYS)

        const inv1 = strVal(merged.Invoice_Dimension_1)
        const inv2 = strVal(merged.Invoice_Dimension_2)
        const invSize = inv1 && inv2 ? `${inv1}x${inv2}` : inv1 || inv2
        const s1 = strVal(pd.Supply_Dimension_1)
        const s2 = strVal(pd.Supply_Dimension_2)
        const supplySize = s1 && s2 ? `${s1}x${s2}` : s1 || s2
        const sizeLine = invSize || supplySize
        if (sizeLine) {
          const headIdx = productColumnLines.findIndex(
            (l) => l.apiName === 'Remarks' || l.apiName === 'Product_Name' || l.apiName === 'Product_Group'
          )
          productColumnLines.splice(headIdx >= 0 ? headIdx + 1 : 0, 0, { apiName: 'Size', value: sizeLine })
        }

        stripLineRefLines(productColumnLines)

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
          totalPrice: amountFromLine(merged),
        }
      })
    }
  }

  const fit2 = subformRows(raw, 'Product_Fitments2_0')
  const fit1 = subformRows(raw, 'Product_Fitments')
  const fitRows = fit2.length > 0 ? fit2 : fit1
  if (fitRows.length > 0) {
    return fitRows.map((row) => {
      const productColumnLines: Array<{ apiName: string; value: string }> = []
      pushDetailLines(productColumnLines, row, BVK_FITMENT_DETAIL_KEYS)
      const len = strVal(row.Length_field)
      const wid = strVal(row.Width)
      const fitSize =
        len && wid
          ? `${len}x${wid}`
          : strVal(row.Invoice_Dimension_1) && strVal(row.Invoice_Dimension_2)
            ? `${strVal(row.Invoice_Dimension_1)}x${strVal(row.Invoice_Dimension_2)}`
            : ''
      if (fitSize) {
        const nameIdx = productColumnLines.findIndex(
          (l) => l.apiName === 'Remarks' || l.apiName === 'Product_Name' || l.apiName === 'Description'
        )
        productColumnLines.splice(nameIdx >= 0 ? nameIdx + 1 : 0, 0, { apiName: 'Size', value: fitSize })
      }
      const pc = strVal(row.Product_Code)
      const meshDisplay = bvkMeshFirstNumericFromProductCode(pc)
      const materialDisplay = strVal(row.Material_Code)
      const weaveDisplay = strVal(row.Weave) || strVal(row.Seam_Type)

      const qty = strVal(row.Qty ?? row.Quantity ?? row.Pieces)
      const unitPrice = parseFloat(strVal(row.Selling_Price).replace(/,/g, '')) || 0
      const totalPrice =
        parseFloat(
          strVal(row.Total_Sale_Value ?? row.Net_Selling_Amount ?? row.Gross_Amount ?? row.Total_Price).replace(
            /,/g,
            ''
          )
        ) || 0
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
    const productColumnLines: Array<{ apiName: string; value: string }> = []
    if (item.product) productColumnLines.push({ apiName: 'Remarks', value: item.product })
    if (item.size) productColumnLines.push({ apiName: 'Size', value: item.size })
    if (item.form) productColumnLines.push({ apiName: 'Supply_Form / Invoice_Form (display)', value: item.form })
    if (item.type) productColumnLines.push({ apiName: 'Brand_Category (display)', value: item.type })
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

/** SLS: same row shape as `buildSlsLineItemsFromWi20Subforms` in SLSQuotationContent. */
export function buildSlsLineItemsFromWi20SubformsShared(
  raw: Record<string, unknown> | null | undefined,
  templateField?: string
): Array<{ item: number; product: string; qty: string; unitPrice: number; totalPrice: number }> {
  if (!raw) return []
  const key = resolveSlsWi20SubformKey(templateField)
  const rows = subformRows(raw, key)
  return rows.map((row, index) => {
    const remarks = strVal(row.Remarks)
    const sp = strVal(row.Selling_Price).replace(/,/g, '')
    const tsv = strVal(row.Total_Sale_Value).replace(/,/g, '')
    const qtyRaw = strVal(row.Qty)
    return {
      item: index + 1,
      product: remarks,
      qty: qtyRaw,
      unitPrice: parseFloat(sp) || 0,
      totalPrice: parseFloat(tsv) || 0,
    }
  })
}
