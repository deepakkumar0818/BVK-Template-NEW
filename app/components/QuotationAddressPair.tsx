/**
 * QuotationAddressPair — WMW / WMW2 / WI address block ("Detail Of
 * Consignee/Shipped To" + "Detail Of Recipient/Billed To").
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  DATA SOURCE RULE — updated per the user's directive
 * ─────────────────────────────────────────────────────────────────────────
 * Every field printed by this block reads STRICTLY from the quotation
 * record (`rawQuotationData.Shipping_*` / `rawQuotationData.Billing_*`).
 *
 *   • No merge with Shipping Master / Billing Master rows.
 *   • No fallback chains ("Shipping_Contact_Name → Contact_Name" etc.).
 *   • No cross-field derivation (State Code is read from Zoho, not
 *     derived from the first two digits of GST).
 *
 * The `shippingData` / `billingData` props remain on the signature so
 * existing call sites (QuotationHeaderThead → PerformaInvoiceContent /
 * QuotationContent / GoodsDescriptionPaginatedBlock) don't need to change,
 * but they are intentionally UNREAD. If a template needs those Master
 * rows for something else (e.g. a GST fallback on BVK/SLS), it must do
 * that work inside its own component — do NOT re-introduce a Master
 * read here.
 *
 * If both the shipping *and* billing sides of the quotation record are
 * completely blank, an "No data available" empty state renders instead
 * of an empty cell.
 */

function strVal(value: unknown): string {
  if (value == null) return ''
  return String(value).trim()
}

function hasAny(...vals: unknown[]): boolean {
  return vals.some((v) => strVal(v).length > 0)
}

function renderAddress(
  name: string,
  street: string,
  city: string,
  state: string,
  postal: string,
  country: string
) {
  if (!hasAny(name, street, city, state, postal, country)) return null
  return (
    <div className="quotation-address-plain">
      {name && (
        <div className="quotation-address-plain__line quotation-address-plain__line--bold">{name}</div>
      )}
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

export default function QuotationAddressPair({
  /** Unused — see file header. */
  shippingData: _shippingData,
  /** Unused — see file header. */
  billingData: _billingData,
  rawQuotationData,
}: {
  /** Unused. Kept on the signature so existing callers don't need to change. */
  shippingData?: any
  /** Unused. Kept on the signature so existing callers don't need to change. */
  billingData?: any
  /** Zoho Creator quotation record — the single source of truth for this block. */
  rawQuotationData?: any
}) {
  const r = rawQuotationData ?? {}

  // Shipping (all from the quotation record, no fallback chains)
  const sName = strVal(r.Shipping_Address_Name)
  const sStreet = strVal(r.Shipping_Street)
  const sCity = strVal(r.Shipping_City)
  const sState = strVal(r.Shipping_State)
  const sPostal = strVal(r.Shipping_Postal_Code)
  const sCountry = strVal(r.Shipping_Country)
  const sStateCode = strVal(r.Shipping_State_Code)
  const sGst = strVal(r.Shipping_GST_No)

  // Billing (all from the quotation record, no fallback chains)
  const bName = strVal(r.Billing_Address_Name)
  const bStreet = strVal(r.Billing_Street)
  const bCity = strVal(r.Billing_City)
  const bState = strVal(r.Billing_State)
  const bPostal = strVal(r.Billing_Postal_Code)
  const bCountry = strVal(r.Billing_Country)
  const bStateCode = strVal(r.Billing_State_Code)
  const bGst = strVal(r.Billing_GST_No)

  const shippingAddress = renderAddress(sName, sStreet, sCity, sState, sPostal, sCountry)
  const billingAddress = renderAddress(bName, bStreet, bCity, bState, bPostal, bCountry)

  return (
    <div className="quotation-stack-segment quotation-address-pair">
      <table className="quotation-address-pair-table">
        <colgroup>
          {/* Shipped To (56%) — align with supplier column above; State value wide enough for a single line */}
          <col style={{ width: '14%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '28%' }} />
          {/* Billed To (44%) — align with meta column above */}
          <col style={{ width: '11%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '21%' }} />
        </colgroup>
        <tbody>
          <tr>
            <th colSpan={4} className="qap-header qap-header--left">Detail Of Consignee/Shipped To</th>
            <th colSpan={4} className="qap-header qap-header--right">Detail Of Recipient/Billed To</th>
          </tr>
          <tr>
            <td colSpan={4} className="qap-address-cell qap-address-cell--left">
              {shippingAddress ?? (
                <div className="quotation-address-pair__empty">No shipping data available</div>
              )}
            </td>
            <td colSpan={4} className="qap-address-cell qap-address-cell--right">
              {billingAddress ?? (
                <div className="quotation-address-pair__empty">No billing data available</div>
              )}
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
