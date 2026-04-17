'use client'

import ExportQuotationContent from './ExportQuotationContent'
import { QuotationData } from '@/lib/types'

interface Wmwe1QuotationContentProps {
  data: QuotationData
  shippingData?: any
  billingData?: any
  rawQuotationData?: any
}

/**
 * WMWE1 — same layout and data pipeline as {@link ExportQuotationContent} (QUOTATION / exporter / consignee / goods grid / totals / footer).
 * Uses CPT on the transport total row to match the WMWE1 spreadsheet; behaviour otherwise matches export.
 */
export default function Wmwe1QuotationContent(props: Wmwe1QuotationContentProps) {
  return <ExportQuotationContent {...props} priceHeaderIncoterm="CPT" />
}
