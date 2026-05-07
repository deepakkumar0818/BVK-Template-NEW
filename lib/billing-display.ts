/**
 * Billing / billed-to display from Zoho billing master + quotation record.
 * Merge rules match {@link QuotationAddressPair} (Recipient/Billed To).
 */

function trimGst(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function hasText(value: unknown): boolean {
  return trimGst(value).length > 0
}

function hasQuotationBillingAddress(raw: Record<string, unknown> | null | undefined): boolean {
  if (!raw) return false
  return (
    hasText(raw.Billing_Address_Name) ||
    hasText(raw.Billing_Contact_Name) ||
    hasText(raw.Invoice_Account) ||
    hasText(raw.Billing_Street) ||
    hasText(raw.Billing_City) ||
    hasText(raw.Billing_State) ||
    hasText(raw.Billing_Postal_Code) ||
    hasText(raw.Billing_Country)
  )
}

function quotationBillingAsMasterRow(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    Billing_Address_Name: raw.Billing_Address_Name || raw.Billing_Contact_Name || raw.Invoice_Account,
    Billing_Street: raw.Billing_Street,
    Billing_City: raw.Billing_City,
    Billing_State: raw.Billing_State,
    Billing_Postal_Code: raw.Billing_Postal_Code,
    Billing_Country: raw.Billing_Country,
    Billing_State_Code: raw.Billing_State_Code,
    Billing_GST_No: raw.Billing_GST_No,
    Billing_GST_Number: raw.Billing_GST_Number,
    Parent_Account: raw.Parent_Account ?? raw.Billing_Parent_Account,
    Billing_Contact_Name: raw.Billing_Contact_Name,
  }
}

function withBillingStateFromQuotation(
  billingData: Record<string, unknown>,
  rawQuotationData?: Record<string, unknown> | null
): Record<string, unknown> {
  return {
    ...billingData,
    Billing_State: trimGst(billingData.Billing_State) || trimGst(rawQuotationData?.Billing_State) || '',
    Billing_State_Code:
      trimGst(billingData.Billing_State_Code) || trimGst(rawQuotationData?.Billing_State_Code) || '',
  }
}

export function resolveBillingGstNo(
  billingData: Record<string, unknown> | null | undefined,
  rawQuotationData?: Record<string, unknown> | null
): string {
  return (
    trimGst(rawQuotationData?.Billing_GST_Number) ||
    trimGst(rawQuotationData?.Billing_GST_No) ||
    trimGst(billingData?.Billing_GST_No) ||
    trimGst(billingData?.Billing_GST_Number) ||
    ''
  )
}

export interface BillingDisplay {
  name: string
  country: string
  /** Street + city/state/postal (newlines), same shape as consignee block. */
  addressBlock: string
  gstNo: string
}

export function resolveBillingDisplay(
  billingData?: Record<string, unknown> | null,
  rawQuotationData?: Record<string, unknown> | null
): BillingDisplay {
  const raw = rawQuotationData ?? undefined
  const billingBase =
    billingData ??
    (raw && hasQuotationBillingAddress(raw) ? quotationBillingAsMasterRow(raw) : null)

  if (!billingBase) {
    return { name: '', country: '', addressBlock: '', gstNo: '' }
  }

  const merged = withBillingStateFromQuotation(billingBase, raw)
  const gstNo = resolveBillingGstNo(billingBase, raw)

  const name =
    trimGst(merged.Billing_Address_Name) ||
    trimGst(merged.Billing_Contact_Name) ||
    trimGst(raw?.Invoice_Account)

  const street = trimGst(merged.Billing_Street)
  const city = trimGst(merged.Billing_City)
  const state = trimGst(merged.Billing_State)
  const postal = trimGst(merged.Billing_Postal_Code)
  const country = trimGst(merged.Billing_Country)

  const cityStatePostalLine = [[city, state].filter(Boolean).join(', '), postal].filter(Boolean).join(' ')
  const addressBlock = [street, cityStatePostalLine].map((x) => x.trim()).filter(Boolean).join('\n')

  return { name, country, addressBlock, gstNo }
}
