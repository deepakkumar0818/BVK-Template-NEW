import type { CSSProperties } from 'react'

/** Grid items default to min-width:auto and overflow visible; long SIZE values then overlap Sqm. */
export const goodsDescGridValueSpan: CSSProperties = {
  minWidth: 0,
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
}
