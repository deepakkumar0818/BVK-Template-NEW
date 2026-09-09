import type { ExportAoExporter, ExportAoLabeledRef, ExportAoParty } from './types'

/**
 * Acceptance of Order (WMW) — same bordered international-form shape as
 * `ExportAcceptanceOfOrderData`, but with an explicit HSN Code column in
 * the product table (the export-ao-ekamas variant has no HSN column) and
 * populated from live Zoho data rather than a static fixture.
 */
export type AcceptanceOrderVariant = 'acceptance-order'

export interface AcceptanceOrderDescriptionField {
  label: string
  value: string
}

export interface AcceptanceOrderLine {
  fields: AcceptanceOrderDescriptionField[]
  hsnCode: string
  /** Multi-line quantity cell (e.g. "2\nTwo Pcs"). */
  quantity: string
  rate: string
  amount: string
}

export interface AcceptanceOrderData {
  variant: AcceptanceOrderVariant
  title: string
  exporter: ExportAoExporter
  aoRef: ExportAoLabeledRef
  buyerOrderRef: ExportAoLabeledRef
  otherReferences: string
  consignee: ExportAoParty
  buyerOther?: ExportAoParty
  countryOfOrigin: string
  countryOfDestination: string
  carriageBy: string
  portOfLoading: string
  portOfDischarge: string
  finalDestination: string
  termsOfDelivery: string
  payment: string
  bankerLines: string[]
  dispatchExWorks: string
  lines: AcceptanceOrderLine[]
  descriptionHeader: string
  hsnHeader: string
  quantityHeader: string
  rateHeader: string
  amountHeader: string
  totalLabel: string
  totalCurrencyLabel: string
  totalAmount: string
  amountInWords: string
  /** e.g. ["Other Terms", "Customs Tariff No:-"] — stacked labels before the numbered notes. */
  termsHeaderLines: string[]
  otherTermsNotes: string[]
  forceMajeureLines: string[]
  qualityHarmonisationNumber?: string
  qualityHarmonisationDate?: string
  signatureCompany: string
  signatureDate: string
  electronicNote: string
  docNo: string
}
