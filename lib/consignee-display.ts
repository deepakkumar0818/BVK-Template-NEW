/**
 * Consignee / shipped-to display from Zoho shipping master + quotation record.
 * Order: shippingData first, then rawQuotationData. No Parent_Account line.
 */
export interface ConsigneeDisplay {
  name: string
  country: string
  /** Street + city/state/postal joined with newlines (for pre-wrap blocks). */
  addressBlock: string
  street: string
  city: string
  state: string
  postal: string
  cityStatePostalLine: string
}

export function resolveConsigneeDisplay(
  shippingData?: Record<string, unknown> | null,
  rawQuotationData?: Record<string, unknown> | null
): ConsigneeDisplay {
  const s = shippingData ?? undefined
  const r = rawQuotationData ?? undefined

  const name =
    String(s?.Shipping_Address_Name ?? r?.Shipping_Address_Name ?? '').trim() ||
    String(r?.Contact_Name ?? '').trim()

  const street = String(s?.Shipping_Street ?? r?.Shipping_Street ?? '').trim()
  const city = String(s?.Shipping_City ?? r?.Shipping_City ?? '').trim()
  const state = String(s?.Shipping_State ?? r?.Shipping_State ?? '').trim()
  const postal = String(s?.Shipping_Postal_Code ?? r?.Shipping_Postal_Code ?? '').trim()
  const country = String(s?.Shipping_Country ?? r?.Shipping_Country ?? '').trim()

  const cityStatePostalLine = [[city, state].filter(Boolean).join(', '), postal].filter(Boolean).join(' ')

  const addressBlock = [street, cityStatePostalLine]
    .map((x) => x.trim())
    .filter(Boolean)
    .join('\n')

  return {
    name,
    country,
    addressBlock,
    street,
    city,
    state,
    postal,
    cityStatePostalLine,
  }
}

/** Phone for consignee when a template shows it (API only, no hardcoded fallback). */
export function resolveConsigneePhone(
  shippingData?: Record<string, unknown> | null,
  rawQuotationData?: Record<string, unknown> | null
): string {
  const s = shippingData ?? undefined
  const r = rawQuotationData ?? undefined
  return (
    String(s?.Shipping_Phone ?? r?.Shipping_Phone ?? r?.Phone ?? r?.Mobile ?? '').trim()
  )
}
