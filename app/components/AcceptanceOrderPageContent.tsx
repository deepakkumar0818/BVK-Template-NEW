'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type {
  ZohoQuotationResponse,
  ShippingMasterResponse,
  BillingMasterResponse,
  ZohoQuotation,
  QuotationData,
} from '@/lib/types'
import { logQuotationPayloadForUrlId } from '@/lib/log-quotation-payload'
import {
  transformQuotationData,
  determineTemplateType,
  formatCurrency,
  formatDate,
  formatGoodsTableAmountChargeableInWords,
  numberToWords,
  resolveCountryOfFinalDestination,
  resolveOtherReferenceDisplay,
} from '@/lib/quotation-utils'
import { resolveGoodsSqmArea } from '@/lib/goods-sqm-area'
import { quotationRichText } from '@/lib/quotation-rich-text'
import SalesOrderPrintButton from './sales-order/SalesOrderPrintButton'
import AcceptanceOrderContent from './sales-order/AcceptanceOrderContent'
import type { AcceptanceOrderCharge, AcceptanceOrderData, AcceptanceOrderLine } from './sales-order/acceptanceOrderTypes'

/** Same "first non-empty across a row precedence chain" helper used by Adhunik/Saint. */
function firstField(records: any[], field: string): string {
  for (const r of records) {
    if (r == null) continue
    const v = String((r as Record<string, unknown>)[field] ?? '').trim()
    if (v) return v
  }
  return ''
}

function toRowArray(v: unknown): any[] {
  if (v == null) return []
  if (Array.isArray(v)) return v
  if (typeof v === 'object') return [v]
  return []
}

/** "sea" / "Sea" / "SEA" → "Sea" — same rule Adhunik uses on Mode_of_Delivery inside the transport sentence. */
function capitalizeFirst(v: string): string {
  const s = v.trim()
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export default function AcceptanceOrderPageContent() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''

  const [quotationData, setQuotationData] = useState<QuotationData | null>(null)
  const [rawQuotationData, setRawQuotationData] = useState<ZohoQuotation | null>(null)
  const [shippingData, setShippingData] = useState<any>(null)
  const [billingData, setBillingData] = useState<any>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!id) {
          throw new Error('Missing quotation id in URL')
        }

        // Acceptance of Order is a Sales Order document — fetch from
        // Sales_Order_Report first. Fall back to the Quotations report for
        // any id that doesn't (yet) exist there, so old links keep working.
        let response = await fetch(`/api/zoho-sales-order-report?id=${encodeURIComponent(id)}`)
        let data: ZohoQuotationResponse = await response.json()

        if (!response.ok || data.code !== 3000 || !data.data || data.data.length === 0) {
          const fallbackResponse = await fetch(`/api/zoho-quotations?id=${encodeURIComponent(id)}`)
          const fallbackData: ZohoQuotationResponse = await fallbackResponse.json()
          if (fallbackResponse.ok && fallbackData.code === 3000 && fallbackData.data && fallbackData.data.length > 0) {
            response = fallbackResponse
            data = fallbackData
          }
        }

        if (!response.ok || data.code !== 3000 || !data.data || data.data.length === 0) {
          throw new Error(data.error || 'No quotation data found')
        }

        const quotation = data.data[0]
        logQuotationPayloadForUrlId(id, quotation, 'acceptance-order')
        setRawQuotationData(quotation)

        const autoTemplateType = determineTemplateType(quotation.Type_Of_Quotation, quotation.Template)
        const transformed = transformQuotationData(quotation, autoTemplateType, quotation.Template)
        setQuotationData(transformed)

        if (quotation.Account_Module?.CRM_Account_ID) {
          const accountId = quotation.Account_Module.CRM_Account_ID

          try {
            const shippingResponse = await fetch(
              `/api/zoho-shipping-masters?account_id=${encodeURIComponent(accountId)}`
            )
            const shippingJson: ShippingMasterResponse = await shippingResponse.json()
            if (shippingResponse.ok && shippingJson.code === 3000 && shippingJson.data && shippingJson.data.length > 0) {
              const primaryShipping = shippingJson.data.find((item: any) => item.Address_Type === 'Primary')
              setShippingData(primaryShipping || shippingJson.data[0])
            }
          } catch (err) {
            console.error('Error fetching shipping masters:', err)
          }

          try {
            const billingResponse = await fetch(
              `/api/zoho-billing-masters?account_id=${encodeURIComponent(accountId)}`
            )
            const billingJson: BillingMasterResponse = await billingResponse.json()
            if (billingResponse.ok && billingJson.code === 3000 && billingJson.data && billingJson.data.length > 0) {
              const primaryBilling = billingJson.data.find((item: any) => item.Address_Type === 'Primary')
              setBillingData(primaryBilling || billingJson.data[0])
            }
          } catch (err) {
            console.error('Error fetching billing masters:', err)
          }
        }
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load quotation')
      } finally {
        setLoading(false)
      }
    }

    fetchQuotation()
  }, [id])

  const acceptanceOrderData: AcceptanceOrderData | null =
    quotationData && rawQuotationData
      ? buildAcceptanceOrderData(quotationData, rawQuotationData)
      : null

  return (
    <>
      <div className="sales-order-screen-only sales-order-screen-toolbar">
        <SalesOrderPrintButton />
        <Link href="/" style={{ color: '#1e40af', textDecoration: 'underline', fontSize: '14px', marginLeft: '12px' }}>
          Back to Quotation
        </Link>
      </div>

      {loading && (
        <div className="sales-order-screen-only" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div>Loading Acceptance of Order...</div>
        </div>
      )}

      {error && (
        <div className="sales-order-screen-only" style={{ textAlign: 'center', padding: '40px', color: '#d32f2f' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error loading Acceptance of Order</div>
          <div>{error}</div>
        </div>
      )}

      {!loading && !error && acceptanceOrderData && (
        <AcceptanceOrderContent data={acceptanceOrderData} />
      )}
    </>
  )
}

/**
 * Transform live Zoho quotation data into the Acceptance-of-Order
 * document shape. Field mapping (Product / Form / Type / Quality / HSN /
 * Size / Rate / Amount) mirrors AdhunikGoodsTable's line-item build 1:1
 * so behaviour stays consistent across every WMW template.
 */
function buildAcceptanceOrderData(
  data: QuotationData,
  rawQuotationData: ZohoQuotation
): AcceptanceOrderData {
  const raw = rawQuotationData as any

  const quotationNumber = data.quotationNumber || raw?.Name || ''
  const quotationDate = data.date || raw?.Created_Date_and_time || ''
  const buyerOrderNo = String(raw?.PO_Number ?? '').trim()
  const buyerOrderDate = formatDate(raw?.PO_Date)
  const otherReferences = resolveOtherReferenceDisplay(raw, '')

  const countryOfOrigin = 'India'
  const countryOfDestination = resolveCountryOfFinalDestination(raw, null, '')
  const carriageByRaw = String(raw?.Mode_of_Delivery ?? data.termsOfDelivery ?? '').trim()
  const carriageBy = capitalizeFirst(carriageByRaw)
  const portOfLoading = String(raw?.Port_of_Loading ?? '').trim()
  const portOfDischarge = String(raw?.Port_of_Discharge ?? '').trim()
  const finalDestination = String(raw?.Final_Destination ?? '').trim()
  const termsOfDelivery = String(raw?.Delivery_Terms ?? '').trim().toUpperCase()
  const payment = data.termsOfPayment || raw?.Term_of_Payment || ''
  const ourBankDetails = quotationRichText(raw, 'Our_Bank_Details')

  const currency = data.currency || raw?.Currency || 'USD'

  // ── Consignee block — direct 1:1 mapping to Billing_* root fields,
  // same fields/precedence Adhunik's consignee block uses. ──────────
  const consigneeName = String(raw?.Billing_Address_Name ?? '').trim()
  const consigneeStreet = String(raw?.Billing_Street ?? '').trim()
  const consigneeCity = String(raw?.Billing_City ?? '').trim()
  const consigneeState = String(raw?.Billing_State ?? '').trim()
  const consigneePostal = String(raw?.Billing_Postal_Code ?? '').trim()
  const consigneeCountry = String(raw?.Billing_Country ?? '').trim()
  const consigneeCityStatePostal = [
    [consigneeCity, consigneeState].filter(Boolean).join(', '),
    consigneePostal,
  ]
    .filter(Boolean)
    .join(' ')
  const consigneeAddressLines = [
    consigneeName,
    consigneeStreet,
    consigneeCityStatePostal,
    consigneeCountry,
  ].filter((line) => line.trim().length > 0)

  // ── Line items — same field mapping as AdhunikGoodsTable ──────────
  // Category 1 WMW vs Category 2 WMW — was hardcoded to Category 1 only;
  // a Category 2 WMW record (e.g. 238786000009302060, Template =
  // "Category 2 WMW") has an EMPTY Category_1_MM_Database_WMW_2_0, so the
  // real rows never came through. Category 1's own fields/formulas below
  // are UNCHANGED — Category 2 only adds its own branch alongside each.
  const templateField = String(raw?.Template ?? '').trim().toLowerCase()
  const isCat2Wmw = templateField.includes('category 2')
  const rawLineItems = (isCat2Wmw
    ? (raw?.Category_2_MM_Database_WMW_2_0 as any[])
    : (raw?.Category_1_MM_Database_WMW_2_0 as any[])) || []
  const rawProductDetails = (isCat2Wmw
    ? (raw?.Category_2_MM_Database_WMW as any[])
    : (raw?.Category_1_MM_Database_WMW as any[])) || []

  const lines: AcceptanceOrderLine[] = rawLineItems.map((item, index) => {
    const itemRef = item.last_item_ref?.trim() || item.Last_item_ref?.trim() || ''
    const productDetail = itemRef
      ? rawProductDetails.find(
          (pd: any) => pd.last_item_ref?.trim() === itemRef || pd.Last_item_ref?.trim() === itemRef
        ) || rawProductDetails[index] || {}
      : rawProductDetails[index] || {}

    const rows3Linked = toRowArray(
      isCat2Wmw ? raw?.Category_2_MM_Database_WMW_3_0 : raw?.Category_1_MM_Database_WMW_3_0
    )
    const ext3 =
      (itemRef
        ? rows3Linked.find(
            (x: any) => String(x?.last_item_ref ?? x?.Last_item_ref ?? '').trim() === itemRef
          )
        : undefined) || rows3Linked[index]

    // `_4_0` — on Quotation-sourced data `Selling_Price_UOM_Billing` lives
    // on the `_3_0` row (`ext3` above); on Sales-Order-sourced data (this
    // template's primary source) that field isn't on `_3_0` at all — it's
    // on `_4_0` instead (confirmed against record 238786000009357062).
    // Checked as a fallback so the same field name resolves regardless of
    // which report the record came from.
    const rows4Linked = toRowArray(
      isCat2Wmw ? raw?.Category_2_MM_Database_WMW_4_0 : raw?.Category_1_MM_Database_WMW_4_0
    )
    const ext4 =
      (itemRef
        ? rows4Linked.find(
            (x: any) => String(x?.last_item_ref ?? x?.Last_item_ref ?? '').trim() === itemRef
          )
        : undefined) || rows4Linked[index]

    const cat2WmwMainRows = toRowArray(raw?.Category_2_MM_Database_WMW)
    const cat2ProductDetail = itemRef
      ? cat2WmwMainRows.find(
          (pd: any) => pd.last_item_ref?.trim() === itemRef || pd.Last_item_ref?.trim() === itemRef
        ) || cat2WmwMainRows[index] || {}
      : cat2WmwMainRows[index] || {}

    // Blend_Category — Category 1 carries it on the 2_0 row (`item`);
    // Category 2's 2_0 row has no Blend_Category — it's on the 3_0 row
    // (`ext3`) instead.
    const blendCategory = isCat2Wmw
      ? firstField([ext3], 'Blend_Category')
      : firstField([item], 'Blend_Category')
    const endType = firstField([ext3, item, productDetail], 'End_Type')
    const materialCode = firstField([item, ext3, productDetail, cat2ProductDetail], 'Material_Code')
    const hsnCode = firstField([item, ext3, productDetail], 'HSN_Code')

    // Dimensions — Category 1 carries Invoice_Dimension_1/2 on the 2_0
    // row (`item`); Category 2's 2_0 row has no dimension fields at all —
    // they're on the main product row (`productDetail`) instead.
    const invoiceDim1 = isCat2Wmw ? productDetail.Invoice_Dimension_1 : item.Invoice_Dimension_1
    const invoiceDim2 = isCat2Wmw ? productDetail.Invoice_Dimension_2 : item.Invoice_Dimension_2

    let size = ''
    const len = String(productDetail.Length_field ?? '').trim()
    const wid = String(productDetail.Width ?? '').trim()
    if (len && wid) {
      size = `${len} x ${wid}`
    } else if (invoiceDim1 && invoiceDim2) {
      const extractNumber = (str: string) => {
        const match = str.match(/(\d+\.?\d*)/)
        return match ? match[1] : str.replace(/Length|length|Width|width/gi, '').trim()
      }
      const dim1 = extractNumber(invoiceDim1)
      const dim2 = extractNumber(invoiceDim2)
      size = `${dim1} x ${dim2}`
    }
    const sizeDisplay = size ? `${size} M` : ''

    const sqmArea = resolveGoodsSqmArea({
      invoiceDimension1: invoiceDim1,
      invoiceDimension2: invoiceDim2,
      lengthField: productDetail.Length_field,
      width: productDetail.Width,
      sizeDisplay: size,
    })
    const areaDisplay = sqmArea ? `${sqmArea} Sqm` : ''

    // Quantity — same formula as SaintGoodsTable.tsx / PerfomainvoiceGoodsTable.tsx,
    // no Cat1/Cat2 branch needed (confirmed against record 238786000009215040,
    // Category 1 WMW: ext3.Total_UOM_Billing=2, matching the record's Grand
    // Total when combined with Selling_Price_UOM_Billing below — the previous
    // category-branched formula read productDetail.Qty, an SQM-scale figure,
    // not the billed unit count). `ext4.Total_UOM_Billing` checked as a
    // fallback same as the Rate field below — on Sales-Order-sourced
    // Category 2 WMW data (record 238786000009357062) `_3_0` has no
    // Total_UOM_Billing at all; it's on `_4_0` instead (12/9, matching
    // `Pieces` on the `_2_0` row exactly).
    const quantity = parseFloat(
      String(ext3?.Total_UOM_Billing ?? ext4?.Total_UOM_Billing ?? '').trim() ||
        productDetail.Qty?.trim() ||
        item.Qty?.trim() ||
        '0'
    )
    const sellingPriceUomBilling = String(
      ext3?.Selling_Price_UOM_Billing ?? ext4?.Selling_Price_UOM_Billing ?? ''
    ).replace(/,/g, '').trim()
    const rate = sellingPriceUomBilling ? parseFloat(sellingPriceUomBilling) || NaN : NaN
    const amount = quantity * rate

    const brand = productDetail.Brand_Selling_Name?.trim() || ''
    const uom = firstField([item, ext3, productDetail, cat2ProductDetail], 'UOM_Billing') || 'Pcs'

    const product = blendCategory || ''
    const form = endType
    const quality = materialCode ? `AISI ${materialCode}` : 'AISI'

    const qtyInt = Number.isFinite(quantity) ? Math.round(quantity) : 0
    const qtyWords = qtyInt > 0 ? numberToWords(qtyInt) : ''
    const quantityCell = qtyInt > 0 ? `${qtyInt}\n${qtyWords}  ${uom}` : ''

    return {
      fields: [
        { label: 'Product', value: product },
        { label: 'Form', value: form },
        { label: 'Type', value: brand },
        { label: 'Quality', value: quality },
        { label: 'Size M (LXW)', value: sizeDisplay },
        { label: 'Area per pc', value: areaDisplay },
      ],
      hsnCode,
      quantity: quantityCell,
      rate: Number.isFinite(rate) ? formatCurrency(rate, '') : '',
      amount: Number.isFinite(amount) ? formatCurrency(amount, '') : '',
    }
  })

  // Charges — same toggle-gated model as the quotation templates
  // (SaintGoodsTable.tsx / PerfomainvoiceGoodsTable.tsx), minus the
  // discount row (not wanted on this template). Each row is
  // independently gated by its own Zoho checkbox, flat amount.
  const isTruthyToggle = (v: unknown): boolean =>
    v === true || (typeof v === 'string' && v.trim().toLowerCase() === 'true')
  const parseFlatAmt = (v: unknown): number => {
    const n = parseFloat(String(v ?? '').replace(/,/g, '').trim())
    return Number.isFinite(n) ? n : 0
  }

  const transactionChargeEnabled = isTruthyToggle(raw?.Transaction_changes)
  const transactionChargeAmt = transactionChargeEnabled ? parseFlatAmt(raw?.Transaction_changes_Value) : 0
  const transactionChargeLabel = String(raw?.Transaction_changes_Descriptions ?? '').trim() || 'Transaction Charges'

  const miscChargeEnabled = isTruthyToggle(raw?.Miscellaneous_Charges)
  const miscChargeAmt = miscChargeEnabled ? parseFlatAmt(raw?.Miscellaneous_Charges_Value) : 0
  const miscChargeLabel = (
    String(raw?.Miscellaneous_Charges_Description1 ?? '').trim() ||
    String(raw?.Miscellaneous_Charges_Description ?? '').trim() ||
    'Miscellaneous Charges'
  )

  const exportPackingEnabled = isTruthyToggle(raw?.Export_Packing)
  const exportPackingAmt = exportPackingEnabled ? parseFlatAmt(raw?.Export_Packing_Value) : 0
  const exportPackingLabel = String(raw?.Export_Packing_Description ?? '').trim() || 'Export Packing'

  const charges: AcceptanceOrderCharge[] = [
    transactionChargeEnabled
      ? { label: transactionChargeLabel, amount: formatCurrency(transactionChargeAmt, '') }
      : null,
    miscChargeEnabled
      ? { label: miscChargeLabel, amount: formatCurrency(miscChargeAmt, '') }
      : null,
    exportPackingEnabled
      ? { label: exportPackingLabel, amount: formatCurrency(exportPackingAmt, '') }
      : null,
  ].filter((c): c is AcceptanceOrderCharge => c !== null)

  // ── Grand total — strict 1:1 map, same field every other WMW
  // template uses for the printed Total. ────────────────────────────
  const finalGrandTotal = (() => {
    const rawTotal = raw?.Overall_Grand_Total_incl_Accessories
    const n = parseFloat(String(rawTotal ?? '').replace(/,/g, '').trim())
    return Number.isFinite(n) ? n : 0
  })()
  const amountChargeableInWords = formatGoodsTableAmountChargeableInWords(finalGrandTotal, currency)

  // "Total <Delivery_Terms> Price Up To <Port_of_Discharge> By <Mode_of_Delivery>"
  // — same literal-word / slot-value shape as the Transport line other
  // WMW templates build, just with "Up To" in place of "upto".
  const totalLabel = ['Total', termsOfDelivery, 'Price Up To', portOfDischarge, 'By', carriageBy]
    .filter(Boolean)
    .join(' ')

  return {
    variant: 'acceptance-order',
    title: 'Acceptance of Order',
    exporter: {
      logoSrc: '/wmw-logo.png',
      logoAlt: 'WMW METAL FABRICS LTD',
      logoFallbackText: 'WMW\nMETAL FABRICS LTD',
      brandLine1: 'WMW METAL FABRICS LTD',
      brandLine2: '…weaving solutions together',
      name: 'WMW Metal Fabrics Ltd',
      address: '53,Industrial Area, Jhotwara , Jaipur-302012 India',
      tel: 'Tel: 0141-7105151',
    },
    aoRef: {
      label: 'Acceptance of Order No. Dt.',
      value: quotationNumber,
      dateLabel: 'Date:(updated)',
      dateValue: quotationDate,
    },
    buyerOrderRef: {
      label: "Buyer's Order No.",
      value: buyerOrderNo,
      dateLabel: 'Date :',
      dateValue: buyerOrderDate,
    },
    otherReferences,
    consignee: { addressLines: consigneeAddressLines },
    buyerOther: { addressLines: [] },
    countryOfOrigin,
    countryOfDestination,
    carriageBy,
    portOfLoading,
    portOfDischarge,
    finalDestination,
    termsOfDelivery,
    payment,
    bankerLines: ourBankDetails ? [ourBankDetails] : [],
    dispatchExWorks: 'Dispatch Ex-Works Jaipur:',
    lines,
    charges,
    descriptionHeader: 'Description Of Goods',
    hsnHeader: 'HSN Code',
    quantityHeader: 'Quantity',
    rateHeader: `Rate\n${currency}/Pc`,
    amountHeader: `Amount IN\n${currency}`,
    totalLabel,
    totalCurrencyLabel: `TOTAL ${currency}`,
    totalAmount: formatCurrency(finalGrandTotal, ''),
    amountInWords: `Amount Chargeable:- ${amountChargeableInWords}`,
    termsHeaderLines: ['Other Terms', 'Customs Tariff No:-'],
    otherTermsNotes: [
      '1. Please mention this AO number on all communications.',
      '2. Packing export worthy.',
      '3. Time taken by third party inspection will be on customer account.',
      '4. All Foreign bank charges on purchase account.',
    ],
    forceMajeureLines: [
      'Force Majeure: This acceptance of order is subject to all clauses.',
      'Force Majeure : As adopted in the uniform law of international sales.',
    ],
    signatureCompany: 'For WMW Metal Fabrics Ltd',
    signatureDate: quotationDate,
    electronicNote: 'This is an electronically generated document. It does not require signature.',
    docNo: 'Doc. No: WMW/MKT/F-6',
  }
}
