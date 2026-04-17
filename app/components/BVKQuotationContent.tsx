'use client'

import { QuotationData } from '@/lib/types'
import { resolveConsigneeDisplay } from '@/lib/consignee-display'
import { formatCurrency, resolveQuotationValidity } from '@/lib/quotation-utils'
import { buildBvkQuotationTableRows } from '@/lib/wi-line-display-shared'
import PrintButton from './PrintButton'

interface BVKQuotationContentProps {
  data: QuotationData
  shippingData?: any
  billingData?: any
  rawQuotationData?: any
}

/** BVK tab: show mesh count with `/Inch` suffix when a value exists. */
function bvkMeshCellValue(meshDisplay?: string): string {
  const m = meshDisplay?.trim() ?? ''
  if (!m) return '---------'
  return m.endsWith('/Inch') ? m : `${m}/Inch`
}

export default function BVKQuotationContent({ data, shippingData, billingData, rawQuotationData }: BVKQuotationContentProps) {
  // Format date for BVK (DD.MM.YY format)
  const formatBVKDate = (dateString?: string): string => {
    if (!dateString) {
      // Fallback to today's date if no date provided
      const today = new Date()
      const day = String(today.getDate()).padStart(2, '0')
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const year = String(today.getFullYear()).slice(-2)
      return `${day}.${month}.${year}`
    }
    
    try {
      const dateMatch = dateString.match(/(\d{2})-(\w{3})-(\d{4})/)
      if (dateMatch) {
        const [, day, month, year] = dateMatch
        const monthMap: { [key: string]: string } = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
          'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        }
        const monthNum = monthMap[month] || '01'
        const shortYear = year.slice(-2)
        return `${day}.${monthNum}.${shortYear}`
      }
      return dateString
    } catch {
      // Fallback to today's date
      const today = new Date()
      const day = String(today.getDate()).padStart(2, '0')
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const year = String(today.getFullYear()).slice(-2)
      return `${day}.${month}.${year}`
    }
  }

  const quotationDate = formatBVKDate(data.date || rawQuotationData?.Created_Date_and_time)
  const quotationRef = data.quotationNumber || rawQuotationData?.Name || ''
  
  const consignee = resolveConsigneeDisplay(shippingData, rawQuotationData)
  const recipientName =
    consignee.name ||
    String(billingData?.Billing_Address_Name ?? rawQuotationData?.Billing_Address_Name ?? '').trim()
  const recipientAddressShipping = [consignee.addressBlock, consignee.country].filter(Boolean).join('\n')
  const recipientAddressBilling = billingData?.Billing_Street
    ? `${billingData.Billing_Street || rawQuotationData?.Billing_Street || ''}, ${billingData.Billing_City || rawQuotationData?.Billing_City || ''}, ${billingData.Billing_State || rawQuotationData?.Billing_State || ''} ${billingData.Billing_Postal_Code || rawQuotationData?.Billing_Postal_Code || ''}`
    : ''
  const recipientAddress = recipientAddressShipping || recipientAddressBilling
  const recipientAddressPreWrap = Boolean(recipientAddressShipping)

  const displayCurrency = data.currency || rawQuotationData?.Currency || 'INR'
  const bvkTableRows = buildBvkQuotationTableRows(
    rawQuotationData as Record<string, unknown> | null | undefined,
    data.lineItems ?? []
  )

  const totalAmount =
    bvkTableRows.length > 0
      ? bvkTableRows.reduce((sum, row) => sum + row.totalPrice, 0)
      : data.totalAmount ||
        (data.lineItems ?? []).reduce((sum, item) => {
          const amount = parseFloat(String(item.amount).replace(/,/g, '')) || 0
          return sum + amount
        }, 0)

  return (
    <>
      <div className="bvk-quotation-container" style={{ maxWidth: '210mm', margin: '0 auto', padding: '20mm', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.6' }}>
        <table className="bvk-print-table" style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
          {/* Header - Repeats on every page in print */}
          <thead className="bvk-print-header-row">
            <tr className="print-page-top-spacer" aria-hidden="true">
              <td colSpan={2} />
            </tr>
            <tr>
              <td colSpan={2} style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                <div className="bvk-print-header" style={{ marginBottom: '20px' }}>
                  {/* Top green line */}
                  <div style={{ borderTop: '2px solid #00a651', marginBottom: '10px' }}></div>
                  
                  {/* Header content */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {/* Left: Green lines decoration */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                      <div style={{ width: '20px', height: '2px', backgroundColor: '#00a651' }}></div>
                      <div style={{ width: '30px', height: '2px', backgroundColor: '#00a651' }}></div>
                      <div style={{ width: '30px', height: '2px', backgroundColor: '#00a651' }}></div>
                      <div style={{ width: '30px', height: '2px', backgroundColor: '#00a651' }}></div>
                    </div>
                    
                    {/* Right: Logo and Date */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ width: '150px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                          <img 
                            src="/hydrotech-logo.png" 
                            alt="BVK Hydrotech Logo" 
                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                            onError={(e) => {
                              console.error('Hydrotech Logo failed to load:', e);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                          Date : - {quotationDate}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </thead>

          {/* Main Content */}
          <tbody>
            <tr>
              <td colSpan={2} style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                {/* Recipient Section */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ marginBottom: '8px' }}>To,</div>
                  <div style={{ marginBottom: '4px' }}>Mr. ---------</div>
                  <div style={{ marginBottom: '15px' }}>{recipientName}</div>
                  {recipientAddress && (
                    <div
                      style={{
                        marginBottom: '15px',
                        whiteSpace: recipientAddressPreWrap ? 'pre-wrap' : undefined,
                      }}
                    >
                      {recipientAddress}
                    </div>
                  )}
                  <div style={{ borderTop: '1px dashed #000', marginBottom: '15px' }}></div>
                </div>

                {/* Quotation Reference */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    Quotation Ref. No.: {quotationRef}
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    With reference to our discussions / your inquiry vide your email, we are pleased to quote our price hereunder.
                  </div>
                  <div style={{ borderTop: '1px solid #000', marginBottom: '15px' }}></div>
                </div>

                {/* Item Table */}
                <div style={{ marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed', wordWrap: 'break-word' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '5%' }}>Item</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '45%' }}>Product</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '12%' }}>Qty/Pcs</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '18%' }}>{`Unit Price / ${displayCurrency}`}</th>
                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '20%' }}>{`Total Price / ${displayCurrency}`}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bvkTableRows.map((row, index) => (
                        <tr key={index}>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>{index + 1}.</td>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
                            {row.productColumnLines.length === 0 ? (
                              <div style={{ marginBottom: '4px' }}>---------</div>
                            ) : (
                              row.productColumnLines.map((line, i) => (
                                <div key={`${line.apiName}-${i}`} style={{ marginBottom: '4px' }}>
                                  <span style={{ fontWeight: 'bold' }}>{line.apiName}</span>
                                  {' : '}
                                  {line.value}
                                </div>
                              ))
                            )}
                            <div style={{ marginBottom: '4px' }}>Mesh : {bvkMeshCellValue(row.meshDisplay)}</div>
                            <div style={{ marginBottom: '4px' }}>
                              Material : {row.materialDisplay?.trim() || '---------'}
                            </div>
                            <div>Weave : {row.weaveDisplay?.trim() || '---------'}</div>
                          </td>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
                            {row.qty ? `${row.qty} Pcs` : '--- Pcs'}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
                            {row.unitPrice > 0 ? formatCurrency(row.unitPrice, displayCurrency) : ''}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
                            {row.totalPrice > 0 ? formatCurrency(row.totalPrice, displayCurrency) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tolerances Section */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ borderTop: '1px solid #000', marginBottom: '15px' }}></div>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Tolerances :</div>
                  <div style={{ marginBottom: '8px', marginLeft: '20px' }}>
                    (+) 0.00 mm, (-) 3.00 m
                  </div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Note :</div>
                  <div style={{ marginLeft: '20px', marginBottom: '15px' }}>
                    If any other tolerances are required, can be discussed, defined and agreed.
                  </div>
                </div>

                {/* Exclusions Section */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ borderTop: '1px solid #000', marginBottom: '15px' }}></div>
                  <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>
                    The following is not included in this quotation:
                  </div>
                  <ul style={{ marginLeft: '20px', marginBottom: '15px', paddingLeft: '20px' }}>
                    <li style={{ marginBottom: '6px' }}>Material Test Certificate (If needed will be charged Rs. 5000).</li>
                    <li style={{ marginBottom: '6px' }}>The Mesh will be without any post coating treatment.</li>
                    <li style={{ marginBottom: '6px' }}>Any third-party test report required by you, will be charged separately.</li>
                    <li style={{ marginBottom: '6px' }}>Any fixture, gasket etc. for making of stack.</li>
                    <li style={{ marginBottom: '6px' }}>Special sample testing.</li>
                    <li style={{ marginBottom: '6px' }}>Charges towards supply of samples for testing</li>
                    <li style={{ marginBottom: '6px' }}>Disposal of all packing materials.</li>
                    <li style={{ marginBottom: '6px' }}>Any financial charges related to the order.</li>
                  </ul>
                </div>

                {/* Terms and Conditions Section */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ borderTop: '1px solid #000', marginBottom: '15px' }}></div>
                  
                  {/* All items not mentioned */}
                  <div style={{ marginBottom: '12px', marginLeft: '20px' }}>
                    All items not mentioned, insurance, Taxes & Duties, Freight, Demurrage, Detention charges.
                  </div>

                  {/* Transit Insurance */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Transit Insurance:</div>
                    <div style={{ marginLeft: '20px' }}>By Customer</div>
                  </div>

                  {/* Warranty */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Warranty</div>
                    <div style={{ marginLeft: '20px' }}>
                      BVK Hydrotech will extend standard warranty towards manufacturing defects Only. We declare that our products are wearing parts. Therefore, they are excluded from any warranty regulation.
                    </div>
                  </div>

                  {/* Packing and Transport Cost */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Packing and Transport Cost:</div>
                    <div style={{ marginLeft: '20px', marginBottom: '4px' }}>Packing: Included.</div>
                    <div style={{ marginLeft: '20px', marginBottom: '4px' }}>Incoterms: Ex-Works, BVK Hydrotech</div>
                    <div style={{ marginLeft: '20px' }}>Freight cost to site: To be paid as per actual by the client directly.</div>
                  </div>

                  {/* Delivery time */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Delivery time</div>
                    <div style={{ marginLeft: '20px' }}>35 to 40 Days from the date of PO along with advance payment.</div>
                  </div>

                  {/* Payment conditions */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Payment conditions:</div>
                    <div style={{ marginLeft: '20px' }}>100% Advance with an acceptance of offer and a confirmed purchase order of the total invoice value.</div>
                  </div>

                  {/* Quotation Validity */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Quotation Validity</div>
                    <div style={{ marginLeft: '20px' }}>
                      {resolveQuotationValidity(
                        rawQuotationData as Record<string, unknown> | undefined,
                        '15 Days from the date of quotation.'
                      )}
                    </div>
                  </div>

                  {/* Quantity Validity */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Quantity Validity</div>
                    <div style={{ marginLeft: '20px' }}>Price valid for the quantity mentioned above in the quotation only.</div>
                  </div>

                  {/* Taxes and Duties */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Taxes and Duties**:</div>
                    <ul style={{ marginLeft: '20px', paddingLeft: '20px' }}>
                      <li style={{ marginBottom: '4px' }}>Will be Extra as applicable over and above the Ex-factory prices quoted.</li>
                      <li style={{ marginBottom: '4px' }}>18% IGST will be applicable extra.</li>
                      <li style={{ marginBottom: '4px' }}>However, if there is any change in Tax and any New Statutory Levies is introduced by Government at the time of delivery of the same will be billed as per actual.</li>
                      <li style={{ marginBottom: '4px' }}>Octroi, Entry Tax and any other taxes/ duties, if any, have to be borne by the Buyer as per the actual.</li>
                    </ul>
                  </div>

                  {/* General Remarks */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>General Remarks:</div>
                    <ul style={{ marginLeft: '20px', paddingLeft: '20px' }}>
                      <li style={{ marginBottom: '4px' }}>Receipt of damaged material/quality deviation will be informed to BVK Hydrotech by ------ within 3 days of receipt of material.</li>
                      <li style={{ marginBottom: '4px' }}>All prices are net, excluding any duties, taxes and alike.</li>
                      <li style={{ marginBottom: '4px' }}>Prices are valid for this single total order.</li>
                    </ul>
                  </div>

                  {/* General Conditions */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ borderTop: '1px solid #000', marginTop: '15px', marginBottom: '15px' }}></div>
                    <ul style={{ marginLeft: '20px', paddingLeft: '20px' }}>
                      <li style={{ marginBottom: '4px' }}>If the specifications are changed as the project develops, prices & deliveries may change.</li>
                      <li style={{ marginBottom: '4px' }}>The above quotation is valid for the Mesh quantities, dimensions and total quantity.</li>
                      <li style={{ marginBottom: '4px' }}>Only customer will be responsible for unloading and storing material safely and securely without any damage to boxes / material.</li>
                    </ul>
                    <div style={{ marginTop: '8px', marginLeft: '20px' }}>
                      Our general conditions of sales and standard terms of supply apply, the copy of same is available on our website, please see www.bvkgroup.in\hydrotech
                    </div>
                  </div>

                  {/* Additional Remarks */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ borderTop: '1px solid #000', marginTop: '15px', marginBottom: '15px' }}></div>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Additional remarks:</div>
                    <div style={{ marginBottom: '8px', marginLeft: '20px' }}>
                      The confirmed delivery schedule will be subject to the following conditions and non-compliance of any of these conditions will result in revision of schedule.
                    </div>
                    <ol style={{ marginLeft: '20px', paddingLeft: '20px' }}>
                      <li style={{ marginBottom: '4px' }}>Receipt of Purchase Order.</li>
                      <li style={{ marginBottom: '4px' }}>Receipt of payment as per agreed terms.</li>
                      <li style={{ marginBottom: '4px' }}>Receipt of approved drawings and quality harmonization documents*.</li>
                      <li style={{ marginBottom: '4px' }}>No further changes affecting design and detailing after the approval of specifications and drawings.</li>
                      <li style={{ marginBottom: '4px' }}>Receipt of complete disc dimensions.</li>
                    </ol>
                    <div style={{ marginTop: '8px', marginLeft: '20px', fontSize: '10px' }}>
                      *Approved Drawings, Quality Harmonization Documents (Receipt of Signed off drawings with design and Quality Harmonization Document detailing from the customer).
                    </div>
                  </div>

                  {/* Closing Statement */}
                  <div style={{ marginBottom: '20px', marginLeft: '20px' }}>
                    We hope that the above quotation is of interest and will gladly be of further help for any request you may have.
                  </div>

                  {/* Contact Person */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 'bold' }}>BVK Hydrotech India Pvt. Ltd..</div>
                    <div style={{ marginTop: '4px' }}>
                      Contact Person : <strong>Mr. Milap Verma</strong> (9358584002)
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>

          {/* Footer - Repeats on every page in print */}
          <tfoot className="bvk-print-footer-row">
            <tr>
              <td colSpan={2} style={{ border: 'none', padding: 0, verticalAlign: 'bottom' }}>
                <div className="bvk-print-footer" style={{ marginTop: '20px', paddingTop: '15px', fontSize: '10px' }}>
                  {/* Company Information */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>BVK Hydrotech India Pvt. Ltd.</div>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#00a651' }}>Reg. Office:</span> Imax Imperial, Room No. 1C, 1st Floor, 101/5, S.N. Banerjee Road, Taltala, Kolkata - 700014, West Bengal, India
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#00a651' }}>CIN:</span> U46103WB2024PTC269415 | <span style={{ color: '#00a651' }}>GSTIN:</span> 08AAMCB4592K1Z3
                    </div>
                    <div>
                      <span style={{ color: '#00a651' }}>Correspondence Address:</span> 54-B.1, Industrial Area, Jhotwara, Jaipur - 302012, Rajasthan, India
                    </div>
                  </div>
                  
                  {/* Bottom green line and tagline */}
                  <div style={{ borderTop: '2px solid #00a651', marginTop: '10px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: '60%' }}></div>
                    <div style={{ color: '#00a651', fontSize: '10px', textAlign: 'right' }}>
                      Woven Solutions for Electrolyzers and Fuel Cells
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}
