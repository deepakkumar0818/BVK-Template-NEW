import type { CSSProperties } from 'react'

/** Grid items default to min-width:auto and overflow visible; long SIZE values then overlap Sqm. */
export const goodsDescGridValueSpan: CSSProperties = {
  minWidth: 0,
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
}

/**
 * Branded description grid: Item | MESH | BRAND | SIZE | Sqm — slightly narrower MESH, wider SIZE
 * than equal `1fr` columns so long SIZE values stay on one line more often.
 */
export const GOODS_DESC_GRID_TEMPLATE_COLUMNS_WMW_BRANDED =
  'minmax(1.5rem, 0.52fr) minmax(2rem, 0.68fr) minmax(0, 0.9fr) minmax(6rem, 1.48fr) minmax(0, 0.92fr)'

/** WMW goods table: Item | Mesh | Brand | SIZE | (L×W) label column | Sqm */
export const GOODS_DESC_GRID_TEMPLATE_COLUMNS_WMW_SIX =
  'minmax(1.5rem, 0.48fr) minmax(2rem, 0.62fr) minmax(0, 0.82fr) minmax(6rem, 1.42fr) minmax(0, 0.42fr) minmax(0, 0.88fr)'

/** Quotation3: Item | MESH | Wire Dia | SIZE | Sqm */
export const GOODS_DESC_GRID_TEMPLATE_COLUMNS_QUOTATION3 =
  'minmax(1.5rem, 0.52fr) minmax(2rem, 0.68fr) minmax(0, 0.82fr) minmax(6rem, 1.52fr) minmax(0, 0.92fr)'

/** Apply to SIZE column spans — prefer single line (use with {@link GOODS_DESC_GRID_TEMPLATE_COLUMNS_WMW_BRANDED}). */
export const goodsDescGridSizeSpanOneLine: CSSProperties = {
  minWidth: 0,
  whiteSpace: 'nowrap',
  overflowWrap: 'normal',
  wordBreak: 'normal',
}
