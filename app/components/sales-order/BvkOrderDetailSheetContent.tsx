'use client'

const STATIC = {
  docNo: 'SALES-ODS-F-001',
  docRev: '0',
  pageNo: '1 of 2',
  issueNo: '2',
  issueDate: '01.09.2019',
  odsNo: 'BVK-HDTK-01-26',
  odsDate: '03.04.26',
  clientName: 'Newtrace Private Limited',
  invoiceAddress:
    'Newtrace Private Limited\n1st Floor, Plot No. 53, KIADB Hardware Park\nHuvinayakanahalli, Bengaluru\nBangalore, Karnataka 560048',
  invoiceCell: '9900032010',
  invoiceContact: 'Deenanath Kulkarni',
  deliveryAddress:
    'Newtrace Private Limited\n1st Floor, Plot No. 53, KIADB Hardware Park\nHuvinayakanahalli, Bengaluru\nBangalore, Karnataka 560048',
  deliveryCell: '9900032010',
  deliveryContact: 'Deenanath Kulkarni',
  clientPoNo: '#NPL-PO-25-26-000893',
  poDate: '30.03.26',
  qctNo: 'BU-1',
  lines: [
    {
      internalCode: '',
      application: 'Green Hydrogen',
      description:
        'Mesh size 40\nMaterial SS 316L\nWeave Plain Dutch Weave\nThickness 0.5 mm\nWire Dia. 0.25 mm',
      length: '8.000',
      width: '1.920',
      totalSqm: '15.36',
      pcsKg: '1',
      qtyPcs: '1',
      pricePcs: '92160',
      totalValue: '92160',
    },
    {
      internalCode: '',
      application: 'Green Hydrogen',
      description:
        'Mesh size 40\nMaterial SS 316L\nWeave Plain Dutch Weave\nThickness 0.5 mm\nWire Dia. 0.25 mm',
      length: '6.500',
      width: '1.920',
      totalSqm: '12.48',
      pcsKg: '1',
      qtyPcs: '1',
      pricePcs: '74880',
      totalValue: '74880',
    },
  ],
  gstLabel: 'GST 18%',
  gstAmount: '30067.2',
  totalValue: '197107',
  terms: {
    destination: 'Bangalore, Karnataka 560048',
    packingType: 'PACKED IN WOODEN BOX/CARD BOARD',
    documentsRequired: 'TEST CERTIFICATE',
    paymentTerms: '100% Advance',
    paymentMode: 'THROUGH BANK',
    packingCharges: 'INCLUDED',
    insurance: "Buyer's Responsibility",
    hsnCode: '75081000',
    billingUom: 'PER PCs',
    gst: '29AAHCN8628F1Z2 (18%)',
    incoterms: 'Ex-Works',
    despatchMode: 'BY ROAD',
    roadPermit: 'E WAY BILL REQUIRED',
    directTruckSmall: 'SMALL',
    freight: 'TO Pay',
    applicationCode: '',
  },
  remarks: '',
  signerName: 'Manju',
} as const

const TERM_ROWS: { label: string; key: keyof typeof STATIC.terms }[] = [
  { label: 'DESTINATION', key: 'destination' },
  { label: 'PACKING TYPE', key: 'packingType' },
  { label: 'DOCUMENTS REQUIRED', key: 'documentsRequired' },
  { label: 'PAYMENT TERMS', key: 'paymentTerms' },
  { label: 'PAYMENT MODE', key: 'paymentMode' },
  { label: 'PACKING CHARGES', key: 'packingCharges' },
  { label: 'INSURANCE', key: 'insurance' },
  { label: 'HSN CODE', key: 'hsnCode' },
  { label: 'BILLING UNIT OF MEASUREMENT', key: 'billingUom' },
  { label: 'GST', key: 'gst' },
  { label: 'INCOTERMS', key: 'incoterms' },
  { label: 'DESPATCH MODE', key: 'despatchMode' },
  { label: 'ROAD PERMIT', key: 'roadPermit' },
  { label: 'DIRECT TRUCK / SMALL', key: 'directTruckSmall' },
  { label: 'FREIGHT : TO PAY / PAID', key: 'freight' },
  { label: 'Application Code', key: 'applicationCode' },
]

function AddressBlock({
  title,
  address,
  cell,
  contact,
}: {
  title: string
  address: string
  cell: string
  contact: string
}) {
  return (
    <table className="ods-table ods-table--nested" role="presentation">
      <tbody>
        <tr>
          <td className="ods-section-label">{title}</td>
        </tr>
        <tr>
          <td className="ods-address-body">
            {address}
            {'\n\n'}
            <span className="ods-label">CELL NO.</span> {cell}
            {'\n'}
            <span className="ods-label">CONTACT PERSON</span> {contact}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export default function BvkOrderDetailSheetContent() {
  return (
    <div className="sales-order-print-sheet">
      <table className="ods-table ods-master-table" role="presentation">
        <tbody>
          <tr>
            <td colSpan={2} className="ods-title-cell">
              ORDER DETAIL SHEET
            </td>
          </tr>

          <tr>
            <td style={{ width: '58%', padding: 0, verticalAlign: 'top' }}>
              <table className="ods-table ods-table--nested" role="presentation">
                <tbody>
                  <tr>
                    <td className="ods-label" style={{ width: '22%' }}>
                      ODS NO.
                    </td>
                    <td>{STATIC.odsNo}</td>
                    <td className="ods-label" style={{ width: '18%' }}>
                      ODS DATE
                    </td>
                    <td style={{ width: '22%' }}>{STATIC.odsDate}</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td style={{ width: '42%', padding: 0, verticalAlign: 'top' }}>
              <table className="ods-table ods-table--nested" role="presentation">
                <tbody>
                  <tr>
                    <td style={{ padding: 0, verticalAlign: 'top' }}>
                      <table className="ods-table ods-table--nested ods-doc-control" role="presentation">
                        <tbody>
                          <tr>
                            <td className="ods-label">DOC. NO.</td>
                            <td>
                              {STATIC.docNo} Rev : {STATIC.docRev}
                            </td>
                          </tr>
                          <tr>
                            <td className="ods-label">Page No.</td>
                            <td>{STATIC.pageNo}</td>
                          </tr>
                          <tr>
                            <td className="ods-label">Issue No.</td>
                            <td>{STATIC.issueNo}</td>
                          </tr>
                          <tr>
                            <td className="ods-label">Issue Date</td>
                            <td>{STATIC.issueDate}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td className="ods-logo-wrap" style={{ width: '42%' }}>
                      <img
                        src="/hydrotech-logo.png"
                        alt="BVK HYDROTECH"
                        className="ods-logo-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const fallback = e.currentTarget.nextElementSibling
                          if (fallback instanceof HTMLElement) fallback.style.display = 'block'
                        }}
                      />
                      <div className="ods-logo-fallback" style={{ display: 'none' }}>
                        BVK
                        <br />
                        HYDROTECH
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td colSpan={2} style={{ padding: 0 }}>
              <table className="ods-table ods-table--nested" role="presentation">
                <tbody>
                  <tr>
                    <td className="ods-label" style={{ width: '18%' }}>
                      CLIENT NAME
                    </td>
                    <td>{STATIC.clientName}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td colSpan={2} style={{ padding: 0 }}>
              <table className="ods-table ods-table--nested" role="presentation">
                <tbody>
                  <tr>
                    <td style={{ width: '50%', padding: 0, verticalAlign: 'top' }}>
                      <AddressBlock
                        title="INVOICE ADDRESS"
                        address={STATIC.invoiceAddress}
                        cell={STATIC.invoiceCell}
                        contact={STATIC.invoiceContact}
                      />
                    </td>
                    <td style={{ width: '50%', padding: 0, verticalAlign: 'top' }}>
                      <AddressBlock
                        title="DELIVERY ADDRESS"
                        address={STATIC.deliveryAddress}
                        cell={STATIC.deliveryCell}
                        contact={STATIC.deliveryContact}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td colSpan={2} style={{ padding: 0 }}>
              <table className="ods-table ods-table--nested" role="presentation">
                <tbody>
                  <tr>
                    <td colSpan={6} className="ods-section-label ods-section-label--center">
                      ORDER DETAILS
                    </td>
                  </tr>
                  <tr>
                    <td className="ods-label" style={{ width: '16%' }}>
                      CLIENT PO NO.
                    </td>
                    <td style={{ width: '28%' }}>{STATIC.clientPoNo}</td>
                    <td className="ods-label" style={{ width: '12%' }}>
                      P.O. DATE
                    </td>
                    <td style={{ width: '16%' }}>{STATIC.poDate}</td>
                    <td className="ods-label" style={{ width: '12%' }}>
                      QCT NO.
                    </td>
                    <td style={{ width: '16%' }}>{STATIC.qctNo}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td colSpan={2} style={{ padding: 0 }}>
              <table className="ods-table ods-table--nested" role="presentation">
                <tbody>
                  <tr>
                    <td rowSpan={5} className="ods-delivery-label-col">
                      DELIVERY REQUEST{' '}
                      <span className="ods-delivery-helper">(Please provide complete delivery schedule if any)</span>
                    </td>
                    <td className="ods-delivery-line">Urgent</td>
                  </tr>
                  <tr>
                    <td className="ods-delivery-line">&nbsp;</td>
                  </tr>
                  <tr>
                    <td className="ods-delivery-line">&nbsp;</td>
                  </tr>
                  <tr>
                    <td className="ods-delivery-line">&nbsp;</td>
                  </tr>
                  <tr>
                    <td className="ods-delivery-line">&nbsp;</td>
                  </tr>
                  <tr>
                    <td className="ods-delivery-label-col">DELIVERY COMMIT</td>
                    <td className="ods-delivery-commit">&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td colSpan={2} style={{ padding: 0 }}>
              <table className="ods-table ods-table--nested ods-product-table" role="presentation">
                <colgroup>
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '26%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '15%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th colSpan={10} className="ods-section-label ods-section-label--center">
                      PRODUCT DETAILS
                    </th>
                  </tr>
                  <tr>
                    <th>BVK (I) INTERNAL PRODUCT CODE</th>
                    <th>APPLICATION</th>
                    <th>EXCISE TARRIF CODE &amp; BILLING DESCRIPTION</th>
                    <th>LENGTH (Meter)</th>
                    <th>WIDTH (Meter) (+0/-1)</th>
                    <th>TOTAL SQM</th>
                    <th>PCS / Kg</th>
                    <th>QNTY. PCs</th>
                    <th>PRICE / PCS</th>
                    <th>TOTAL VALUE INR</th>
                  </tr>
                </thead>
                <tbody>
                  {STATIC.lines.map((line, idx) => (
                    <tr key={idx}>
                      <td>{line.internalCode || '\u00A0'}</td>
                      <td>{line.application || '\u00A0'}</td>
                      <td className="ods-desc">{line.description || '\u00A0'}</td>
                      <td className="ods-num">{line.length}</td>
                      <td className="ods-num">{line.width}</td>
                      <td className="ods-num">{line.totalSqm}</td>
                      <td className="ods-num">{line.pcsKg}</td>
                      <td className="ods-num">{line.qtyPcs}</td>
                      <td className="ods-amount">{line.pricePcs}</td>
                      <td className="ods-amount">{line.totalValue}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={8} className="ods-product-foot-label">
                      {STATIC.gstLabel}
                    </td>
                    <td colSpan={2} className="ods-product-foot-value">
                      {STATIC.gstAmount}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={8} className="ods-product-foot-label">
                      Total Value
                    </td>
                    <td colSpan={2} className="ods-product-foot-value">
                      {STATIC.totalValue}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td colSpan={2} style={{ padding: 0 }}>
              <table className="ods-table ods-table--nested" role="presentation">
                <tbody>
                  {TERM_ROWS.map((row) => (
                    <tr key={row.key}>
                      <td className="ods-terms-label">{row.label}</td>
                      <td>{STATIC.terms[row.key] || '\u00A0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td colSpan={2} style={{ padding: 0 }}>
              <table className="ods-table ods-table--nested" role="presentation">
                <tbody>
                  <tr>
                    <td className="ods-label">REMARKS :</td>
                  </tr>
                  <tr>
                    <td className="ods-remarks-body">{STATIC.remarks || '\u00A0'}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr className="ods-signatures">
            <td>
              <div className="ods-sign-line">&nbsp;</div>
              <div className="ods-sign-name">{STATIC.signerName}</div>
            </td>
            <td>
              <div className="ods-sign-line">&nbsp;</div>
              <div className="ods-sign-name">&nbsp;</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
