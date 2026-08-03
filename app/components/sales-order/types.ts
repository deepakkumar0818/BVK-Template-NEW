export type OdsVariant =
  | 'bvk'
  | 'sls-ods-no-44'
  | 'sls-ods-44-hydrotech'
  | 'sls-ods-no-44-p'
  | 'sls-ods-44-p-hydrotech'
  | 'sls-ods-50-a'
  | 'sls-ods-50-p'

export interface OdsLogo {
  src: string
  alt: string
  fallbackText: string
  tagline?: string
  taglineSub?: string
}

/**
 * Address block. Prefer `lines: string[]` for new fixtures — it lets each
 * customer render their own address+contact ordering (some put "CONTACT PERSON"
 * before phone, others after). The legacy `{ address, cell, contact }` shape is
 * still supported so existing BVK / SLS-44 fixtures keep working unchanged.
 */
export type OdsAddress =
  | { lines: string[] }
  | { address: string; cell: string; contact: string }

export interface OdsLine {
  internalCode: string
  application: string
  description: string
  /* SLS-ODS-44 extras */
  position?: string
  sapNo?: string
  deliveryRequest?: string
  /* Dimensions */
  length: string
  width: string
  totalSqm: string
  /* Qty columns (BVK-style split OR merged wmw/sls-50 col) */
  pcsKg?: string
  qtyPcs?: string
  qtyPcsKg?: string
  /* Price (varies by variant: pricePcs, priceSqm, or generic priceUnit) */
  pricePcs?: string
  priceSqm?: string
  priceUnit?: string
  totalValue: string
}

export interface OdsTerms {
  destination?: string
  packingType?: string
  documentsRequired?: string
  paymentTerms?: string
  paymentMode?: string
  packingCharges?: string
  insurance?: string
  hsnCode?: string
  billingUom?: string
  gst?: string
  gstRate?: string
  incoterms?: string
  despatchMode?: string
  roadPermit?: string
  transporter?: string
  directTruckSmall?: string
  freight?: string
  applicationCode?: string
  industrialCode?: string
}

export interface OdsDeliveryRequestBlock {
  notes: string[]
  commit: string
}

export interface OdsHeader {
  docNo: string
  docRev: string
  pageNo: string
  issueNo: string
  issueDate: string
  odsNo: string
  odsDate: string
  clientName: string
  /** Left-side label for the top-right doc identifier. Defaults to `'DOC. NO. :'`. */
  docLabel?: string
}

export interface OdsOrderDetails {
  clientPoNo: string
  poDate: string
  qctNo: string
  qctExtraCell?: string
}

/**
 * Per-variant overrides for product-table column header labels. Any key omitted
 * falls back to a variant-appropriate default.
 */
export interface OdsProductHeaders {
  size?: string
  qty?: string
  price?: string
}

export interface OdsTermRow {
  label: string
  key: keyof OdsTerms
}

export interface SalesOrderData {
  variant: OdsVariant
  logo: OdsLogo
  internalCodeHeader: string
  header: OdsHeader
  invoice: OdsAddress
  delivery: OdsAddress
  orderDetails: OdsOrderDetails
  deliveryRequest?: OdsDeliveryRequestBlock
  lines: OdsLine[]
  gstLabel: string
  gstAmount: string
  totalValue: string
  terms: OdsTerms
  /** If provided, overrides the default term-row order for this variant. */
  termsOrder?: OdsTermRow[]
  /** If provided, overrides one or more product-table column header labels. */
  productHeaders?: OdsProductHeaders
  /** When true, skip the two `GST` / `Total Value` rows at the bottom of the product table. */
  hideProductFooter?: boolean
  /** Optional Quality Harmonisation Number — rendered as its own row before REMARKS. */
  qualityHarmonisationNumber?: string
  /** Optional Quality Harmonisation Date — rendered as its own row before REMARKS. */
  qualityHarmonisationDate?: string
  remarks: string
  signerName: string
}

/* ── Acceptance-of-Order (letter format) ─────────────────────────── */

export type AoVariant = 'wacker-ao'

export interface AoLogo {
  src: string
  alt: string
  fallbackText: string
  brandName: string
  tagline: string
}

export interface AoRecipient {
  salutationPrefix: string
  name: string
  company: string
  addressLines: string[]
  phone: string
}

export interface AoLine {
  item: string
  product: string
  pcs: string
  unitPriceInr: string
  totalValue: string
}

export interface AoFooterLeft {
  companyName: string
  formerName: string
  address: string
  contactLine: string
  cin: string
  gst: string
}

export interface AoFooterRight {
  groupLine: string
  registeredOfficeLabel: string
  registeredOfficeLines: string[]
}

export interface AcceptanceOfOrderData {
  variant: AoVariant
  logo: AoLogo
  title: string
  date: string
  recipient: AoRecipient
  subject: string
  greeting: string
  bodyOpening: string
  lines: AoLine[]
  bodyClosingParas: string[]
  qualityHarmonisationNumber?: string
  qualityHarmonisationDate?: string
  yoursTruly: string
  companySignature: string
  signerRole: string
  footerLeft: AoFooterLeft
  footerRight: AoFooterRight
}

/* ── Secondary Sales Order Detail Sheet (17-col wire details + RNA + credit limit) ─── */

export type SecondarySalesOdsVariant = 'sls-ods-0254'

export interface SecondarySalesOdsHeader {
  odsNo: string
  odsDate: string
  clientName: string
  salesCategory: string
  fileNo: string
  custCode: string
  location: string
  creditLimit: string
  noOfCd: string
  gstNo: string
  tinNo: string
}

export interface SecondarySalesOdsOrderDetails {
  customerPoNo: string
  poDate: string
  deliveryRequested: string
  deliveryCommit: string
  consValues: string
  tillDateSold: string
  targetValue: string
  zone: string
  industryType: string
  osAsOn: string
  odsInHand: string
  pdcAmountInHand: string
}

export interface WireDetailRow {
  sno: string
  itemName: string
  wire: string
  type: string
  len: string
  wid: string
  qty: string
  unit: string
  priceStd: string
  priceAgreed: string
  priceBilled: string
  itemCode: string
  brand: string
  dDate: string
  quality: string
  valuesInr: string
  hsnCode: string
}

export interface SecondarySalesOdsTerms {
  paymentTerms: string
  paymentMode: string
  packingCharges: string
  insurance: string
  bankerName: string
  destination: string
  roadPermit: string
  transporter: string
  directTruckSmall: string
  freightToPayPaid: string
  freightCharges: string
  transactionCharges: string
}

export interface RnaRow {
  label: string
  amount: string
}

export interface SecondarySalesOdsRnaBlock {
  heading: string
  rnaHeader: string
  amountHeader: string
  rows: RnaRow[]
}

export interface ChecklistItem {
  label: string
  checked: boolean
}

export interface CreditLimitExceededBlock {
  title: string
  openBalance: string
  currentOrder: string
  otherPendingOrder: string
  newBalance: string
  creditLimit: string
  processingLimit: string
  creditExcess: string
}

export interface SecondarySalesOdsData {
  variant: SecondarySalesOdsVariant
  logo: OdsLogo
  title: string
  header: SecondarySalesOdsHeader
  orderDetails: SecondarySalesOdsOrderDetails
  wireDetails: WireDetailRow[]
  qtyTotal: string
  terms: SecondarySalesOdsTerms
  totalAmount: string
  qualityHarmonisationNumber?: string
  qualityHarmonisationDate?: string
  remarks: string
  remarksIfAnyLabel: string
  rnaBlock: SecondarySalesOdsRnaBlock
  checklist: ChecklistItem[]
  creditLimitExceeded: CreditLimitExceededBlock
  systemTimestamp: string
}

/* ── Multi-Order Acceptance of Order (letter with data table) ─────── */

export type MultiOrderAoVariant = 'argo-multi-ao' | 'argo-multi-ao-hydrotech'

export interface MultiOrderAoRecipient {
  toLabel: string
  companyLabel: string
  companyName: string
  addressLines: string[]
}

export interface MultiOrderAoRow {
  poNo: string
  sapNo: string
  quality: string
  tentativeDispatchDate: string
  orderQty: string
  rate: string
  totalValue: string
}

export interface MultiOrderAoColumnHeaders {
  poNo: string
  sapNo: string
  quality: string
  tentativeDispatchDate: string
  orderQty: string
  rate: string
  totalValue: string
}

export interface MultiOrderAcceptanceOfOrderData {
  variant: MultiOrderAoVariant
  logo: AoLogo
  title: string
  date: string
  recipient: MultiOrderAoRecipient
  subject: string
  greeting: string
  bodyOpening: string
  columnHeaders: MultiOrderAoColumnHeaders
  rows: MultiOrderAoRow[]
  bodyClosingParas: string[]
  qualityHarmonisationNumber?: string
  qualityHarmonisationDate?: string
  /** Bold sign-off lines rendered stacked after the closing paragraphs. */
  signatureLines: string[]
  footerLeft: AoFooterLeft
  footerRight: AoFooterRight
}

/* ── Export Acceptance-of-Order (bordered international form) ─────── */

export type ExportAoVariant = 'export-ao-ekamas'

export interface ExportAoExporter {
  logoSrc: string
  logoAlt: string
  logoFallbackText: string
  /** Line 1 shown next to / under the logo (e.g. "WMW METAL FABRICS LTD"). */
  brandLine1?: string
  /** Line 2 shown under `brandLine1` (e.g. "…weaving solutions together"). */
  brandLine2?: string
  name: string
  address: string
  tel: string
}

export interface ExportAoLabeledRef {
  label: string
  value: string
  dateLabel: string
  dateValue: string
}

export interface ExportAoParty {
  addressLines: string[]
}

export interface ExportAoDescriptionField {
  label: string
  value: string
}

export interface ExportAoLine {
  fields: ExportAoDescriptionField[]
  /** Multi-line quantity cell (e.g. "2\nTwo  Pcs"). */
  quantity: string
  rate: string
  amount: string
}

export interface ExportAcceptanceOfOrderData {
  variant: ExportAoVariant
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
  lines: ExportAoLine[]
  descriptionHeader: string
  quantityHeader: string
  rateHeader: string
  amountHeader: string
  totalLabel: string
  totalCurrencyLabel: string
  totalAmount: string
  amountInWords: string
  /** e.g. ["Other Terms", "Customs Tariff No:-"]  — rendered as stacked labels before the numbered notes. */
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
