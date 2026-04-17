function trimGst(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value).trim()
  return s
}

function hasText(value: unknown): boolean {
  return trimGst(value).length > 0
}

/** When Shipping Master is missing, map Creator quotation fields to the same shape as the master row. */
function hasQuotationShippingAddress(raw: any): boolean {
  if (!raw) return false
  return (
    hasText(raw.Shipping_Address_Name) ||
    hasText(raw.Contact_Name) ||
    hasText(raw.Shipping_Street) ||
    hasText(raw.Shipping_City) ||
    hasText(raw.Shipping_State) ||
    hasText(raw.Shipping_Postal_Code) ||
    hasText(raw.Shipping_Country)
  )
}

function quotationShippingAsMasterRow(raw: any): any {
  return {
    Shipping_Address_Name: raw.Shipping_Address_Name || raw.Contact_Name,
    Shipping_Street: raw.Shipping_Street,
    Shipping_City: raw.Shipping_City,
    Shipping_State: raw.Shipping_State,
    Shipping_Postal_Code: raw.Shipping_Postal_Code,
    Shipping_Country: raw.Shipping_Country,
    Shipping_State_Code: raw.Shipping_State_Code,
    Shipping_GST_No: raw.Shipping_GST_No,
    Parent_Account: raw.Parent_Account ?? raw.Shipping_Parent_Account,
  }
}

function hasQuotationBillingAddress(raw: any): boolean {
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

function quotationBillingAsMasterRow(raw: any): any {
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
  }
}

/**
 * WI template: GST on the quotation (Creator) overrides shipping/billing master rows when present.
 */
function resolveShippingGstNo(shippingData: any, rawQuotationData?: any): string {
  return (
    trimGst(rawQuotationData?.Shipping_GST_No) ||
    trimGst(shippingData?.Shipping_GST_No) ||
    ''
  )
}

function resolveBillingGstNo(billingData: any, rawQuotationData?: any): string {
  return (
    trimGst(rawQuotationData?.Billing_GST_Number) ||
    trimGst(rawQuotationData?.Billing_GST_No) ||
    trimGst(billingData?.Billing_GST_No) ||
    trimGst(billingData?.Billing_GST_Number) ||
    ''
  )
}

/** Indian GSTIN: first two characters are the state code (digits). */
function stateCodeFromGstFirstTwoDigits(gstNo: string): string {
  const s = trimGst(gstNo)
  if (s.length < 2) return ''
  return s.slice(0, 2)
}

/** Master row first; quotation record fills gaps (Creator field names). */
function withShippingStateFromQuotation(shippingData: any, rawQuotationData?: any) {
  return {
    ...shippingData,
    Shipping_State:
      trimGst(shippingData?.Shipping_State) || trimGst(rawQuotationData?.Shipping_State) || '',
    Shipping_State_Code:
      trimGst(shippingData?.Shipping_State_Code) ||
      trimGst(rawQuotationData?.Shipping_State_Code) ||
      '',
  }
}

function withBillingStateFromQuotation(billingData: any, rawQuotationData?: any) {
  return {
    ...billingData,
    Billing_State:
      trimGst(billingData?.Billing_State) || trimGst(rawQuotationData?.Billing_State) || '',
    Billing_State_Code:
      trimGst(billingData?.Billing_State_Code) ||
      trimGst(rawQuotationData?.Billing_State_Code) ||
      '',
  }
}

function getAddrText(data: any, kind: 'shipping' | 'billing') {
  if (!data) return null
  const name = kind === 'shipping' ? data.Shipping_Address_Name : data.Billing_Address_Name
  const street = kind === 'shipping' ? data.Shipping_Street : data.Billing_Street
  const city = kind === 'shipping' ? data.Shipping_City : data.Billing_City
  const state = kind === 'shipping' ? data.Shipping_State : data.Billing_State
  const postal = kind === 'shipping' ? data.Shipping_Postal_Code : data.Billing_Postal_Code
  const country = kind === 'shipping' ? data.Shipping_Country : data.Billing_Country

  return (
    <div className="quotation-address-plain">
      {name && <div className="quotation-address-plain__line quotation-address-plain__line--bold">{name}</div>}
      {street && <div className="quotation-address-plain__line">{street}</div>}
      {(city || state || postal) && (
        <div className="quotation-address-plain__line">
          {[city, state].filter(Boolean).join(', ')}
          {postal ? ` ${postal}` : ''}
        </div>
      )}
      {country && <div className="quotation-address-plain__line">{country}</div>}
    </div>
  )
}

/**
 * Unified table layout for Consignee & Recipient
 * Ensures strict row alignment across left and right sides.
 */
export default function QuotationAddressPair({
  shippingData,
  billingData,
  rawQuotationData,
}: {
  shippingData?: any
  billingData?: any
  /** Zoho Creator quotation record — GST + Shipping_State / Billing_State fallbacks on WI template */
  rawQuotationData?: any
}) {
  const shippingBase =
    shippingData ??
    (hasQuotationShippingAddress(rawQuotationData) ? quotationShippingAsMasterRow(rawQuotationData) : null)
  const billingBase =
    billingData ??
    (hasQuotationBillingAddress(rawQuotationData) ? quotationBillingAsMasterRow(rawQuotationData) : null)

  const shippingMerged = shippingBase
    ? withShippingStateFromQuotation(shippingBase, rawQuotationData)
    : null
  const billingMerged = billingBase
    ? withBillingStateFromQuotation(billingBase, rawQuotationData)
    : null

  const sGst = resolveShippingGstNo(shippingBase, rawQuotationData)
  const bGst = resolveBillingGstNo(billingBase, rawQuotationData)

  const sStateCode =
    stateCodeFromGstFirstTwoDigits(sGst) || shippingMerged?.Shipping_State_Code || ''
  const sState = shippingMerged?.Shipping_State ?? ''

  const bStateCode =
    stateCodeFromGstFirstTwoDigits(bGst) || billingMerged?.Billing_State_Code || ''
  const bState = billingMerged?.Billing_State ?? ''

  return (
    <div className="quotation-stack-segment">
      <table className="quotation-address-pair-table">
        <colgroup>
          {/* Shipped To (50%) */}
          <col style={{ width: '12%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '13%' }} />
          {/* Billed To (50%) */}
          <col style={{ width: '12%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '13%' }} />
        </colgroup>
        <tbody>
          <tr>
            <th colSpan={4} className="qap-header qap-header--left">Detail Of Consignee/Shipped To</th>
            <th colSpan={4} className="qap-header qap-header--right">Detail Of Recipient/Billed To</th>
          </tr>
          <tr>
            <td colSpan={4} className="qap-address-cell qap-address-cell--left">
              {shippingMerged ? getAddrText(shippingMerged, 'shipping') : <div className="quotation-address-pair__empty">No shipping data available</div>}
            </td>
            <td colSpan={4} className="qap-address-cell qap-address-cell--right">
              {billingMerged ? getAddrText(billingMerged, 'billing') : <div className="quotation-address-pair__empty">No billing data available</div>}
            </td>
          </tr>
          <tr>
            <th className="qap-label qap-cell--left">State Code</th>
            <td className="qap-value qap-cell--left">{sStateCode}</td>
            <th className="qap-label qap-cell--left">State</th>
            <td className="qap-value qap-cell--left">{sState}</td>

            <th className="qap-label qap-cell--right">State Code</th>
            <td className="qap-value qap-cell--right">{bStateCode}</td>
            <th className="qap-label qap-cell--right">State</th>
            <td className="qap-value qap-cell--right">{bState}</td>
          </tr>
          <tr>
            <th className="qap-label qap-cell--left">GST Number</th>
            <td colSpan={3} className="qap-value qap-cell--left">{sGst}</td>
            
            <th className="qap-label qap-cell--right">GST Number</th>
            <td colSpan={3} className="qap-value qap-cell--right">{bGst}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
