'use client'

import { resolveBillingDisplay } from '@/lib/billing-display'

export interface BillingConsigneeHeaderFieldsProps {
  billingData?: Record<string, unknown> | null
  rawQuotationData?: Record<string, unknown> | null
}

/**
 * Consignee block driven by billing master + quotation billing fields (same as Ekamas).
 * Renders nothing when {@link resolveBillingDisplay} has no usable content.
 */
export default function BillingConsigneeHeaderFields({
  billingData,
  rawQuotationData,
}: BillingConsigneeHeaderFieldsProps) {
  const billing = resolveBillingDisplay(billingData, rawQuotationData)
  const billingHasContent =
    Boolean(billing.name) ||
    Boolean(billing.addressBlock) ||
    Boolean(billing.country) ||
    Boolean(billing.gstNo)

  if (!billingHasContent) return null

  return (
    <>
      <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '6px' }}>Consignee</div>
      {billing.name ? (
        <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{billing.name}</div>
      ) : null}
      {billing.addressBlock ? (
        <div style={{ fontSize: '11px', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{billing.addressBlock}</div>
      ) : null}
      {billing.country ? (
        <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '4px' }}>{billing.country}</div>
      ) : null}
      {billing.gstNo ? (
        <div style={{ fontSize: '11px', marginTop: '8px' }}>GST Number: {billing.gstNo}</div>
      ) : null}
    </>
  )
}
