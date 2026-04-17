'use client'

import { Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { QuotationData } from '@/lib/types'
import { formatCurrency, numberToWords } from '@/lib/quotation-utils'

const txBlue = '#000000' // Changed from blue per screenshot, though original had some blue. Keeping black to match screenshot where most text is black

/** Full cell border */
const bd: CSSProperties = { border: '1px solid #000' }

/** Left & right rules only */
const bdSides: CSSProperties = {
  borderLeft: '1px solid #000',
  borderRight: '1px solid #000',
}

const bdTitleRow: CSSProperties = {
  ...bdSides,
  borderTop: 'none',
  borderBottom: '1px solid #000',
}

interface Quotation3GoodsTableProps {
  data: QuotationData
  rawQuotationData?: any
  shippingData?: any
  headerNode?: ReactNode
  footerNode?: ReactNode
}

const descGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 2fr 2fr 3fr 3fr',
  columnGap: '8px',
  rowGap: '2px',
  alignItems: 'center',
  width: '100%',
  textAlign: 'left',
}

export default function Quotation3GoodsTable({ data, rawQuotationData, shippingData, headerNode, footerNode }: Quotation3GoodsTableProps) {
  const currency = data.currency || rawQuotationData?.Currency || 'USD'
  
  const chunks = [1]; // just one page chunk for dummy data

  const dummyBlocks = [
    {
      title: 'Panel-1',
      ref: '98PXL17000231',
      qty: 1000,
      uom: 'Pannel',
      rate: 15.85,
      amount: 15850.00,
      subgroups: [
        {
          quality: 'AISI 304',
          items: [
            { id: 1, mesh: '30/Inch', wireDia: '0.0075', size: '1.270 x 0.762', sqm: '0.9677' }
          ]
        },
        {
          quality: 'AISI 316L',
          items: [
            { id: 2, mesh: '125x75/Inch', wireDia: '0.0021', size: '1.270 x 0.762', sqm: '0.9677' },
            { id: 3, mesh: '187x187/Inch', wireDia: '0.0015', size: '1.270 x 0.762', sqm: '0.9677' }
          ]
        }
      ]
    },
    {
      title: 'Panel-2',
      ref: '98PXL20000231',
      qty: 1000,
      uom: 'Pannel',
      rate: 16.96,
      amount: 16960.00,
      subgroups: [
        {
          quality: 'AISI 304',
          items: [
            { id: 1, mesh: '30/Inch', wireDia: '0.0075', size: '1.270 x 0.762', sqm: '0.9677' }
          ]
        },
        {
          quality: 'AISI 316L',
          items: [
            { id: 2, mesh: '150x90/Inch', wireDia: '0.0019', size: '1.270 x 0.762', sqm: '0.9677' },
            { id: 3, mesh: '225x225/Inch', wireDia: '0.0013', size: '1.270 x 0.762', sqm: '0.9677' }
          ]
        }
      ]
    },
    {
      title: 'Panel-3',
      ref: '98ED30000123',
      qty: 1000,
      uom: 'Pannel',
      rate: 17.80,
      amount: 17800.00,
      subgroups: [
        {
          quality: 'AISI 304',
          items: [
            { id: 1, mesh: '30/Inch', wireDia: '0.0065', size: '1.270 x 0.762', sqm: '0.9677' }
          ]
        },
        {
          quality: 'AISI 316L',
          items: [
            { id: 2, mesh: '145x90/Inch', wireDia: '0.0019', size: '1.270 x 0.762', sqm: '0.9677' },
            { id: 3, mesh: '280x180/Inch', wireDia: '0.001', size: '1.270 x 0.762', sqm: '0.9677' }
          ]
        }
      ]
    }
  ];

  const totalAmount = 50610.00;

  return (
    <div className="quotation-goods-pages-stack">
      {chunks.map((chunk, pageIdx) => {
        const isLastChunk = pageIdx === chunks.length - 1;

        return (
          <div
            key={pageIdx}
            className={`quotation-goods-pages-segment ${!isLastChunk ? 'quotation-goods-pages-break' : ''}`}
            style={{ pageBreakInside: 'avoid', marginTop: pageIdx > 0 ? '-1px' : '0' }}
          >
            <div className="quotation-seamless-stack">
              {headerNode}
              
              <table
                className="goods-description-table quotation-stack-table quotation3-goods-table"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #000',
                  marginTop: 0,
                  tableLayout: 'fixed',
                  fontSize: '11px',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                <colgroup>
                  <col style={{ width: '35%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>
                <tbody>
                  <tr className="quotation3-goods-title-row">
                    <td colSpan={2} style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                      Description of Goods
                    </td>
                    <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                      Quantity
                      <br />
                      UOM
                    </td>
                    <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                      Rate
                      <br />
                      USD / Pannel
                      <br />
                      Ex-Work
                    </td>
                    <td style={{ ...bdTitleRow, padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                      Amount
                      <br />
                      USD
                    </td>
                  </tr>

                  {/* Top static headers */}
                  <tr>
                    <td colSpan={2} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '10px 10px 4px 10px', verticalAlign: 'top' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '70px 10px auto', marginBottom: '3px', fontWeight: 'bold' }}>
                        <span>Product</span><span>:</span><span>Stainless Steel Wire Cloth</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '70px 10px auto', fontWeight: 'bold' }}>
                        <span>Form</span><span>:</span><span>Panel</span>
                      </div>
                    </td>
                    <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                    <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                    <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                  </tr>

                  {dummyBlocks.map((block, idx) => {
                    const totalRowsInBlock = block.subgroups.reduce((acc, sg) => acc + 1 + sg.items.length, 0) + 2; // +1 for title, +1 for headers

                    return (
                      <Fragment key={idx}>
                        {/* Title Row */}
                        <tr>
                          <td colSpan={2} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '6px 10px 2px 10px', fontWeight: 'bold' }}>
                            <div style={{ fontSize: '12px' }}>{block.title}</div>
                            <div style={{ fontSize: '12px' }}>{block.ref}</div>
                          </td>
                          <td rowSpan={totalRowsInBlock} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '6px', textAlign: 'center', verticalAlign: 'middle' }}>
                            {block.qty}&nbsp;&nbsp;&nbsp;{block.uom}
                          </td>
                          <td rowSpan={totalRowsInBlock} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '6px', textAlign: 'right', verticalAlign: 'middle' }}>
                            {block.rate.toFixed(2)}
                          </td>
                          <td rowSpan={totalRowsInBlock} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '6px 8px', textAlign: 'right', verticalAlign: 'middle' }}>
                            {block.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        
                        {/* Header Row */}
                        <tr>
                          <td colSpan={2} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '4px 10px' }}>
                            <div style={{ ...descGrid, fontWeight: 'bold', fontSize: '10px' }}>
                              <span>Item</span>
                              <span>MESH</span>
                              <span>Wire Dia.</span>
                              <span>SIZE [Mtrs] (LxW)</span>
                              <span>Sqm Area / PC</span>
                            </div>
                          </td>
                        </tr>

                        {/* Subgroups */}
                        {block.subgroups.map((sg, sgIdx) => (
                          <Fragment key={sgIdx}>
                            <tr>
                              <td colSpan={2} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '4px 10px 2px 10px' }}>
                                <div style={{ textDecoration: 'underline', fontSize: '10px', display: 'flex' }}>
                                  <div style={{ width: '70px' }}>Quality</div> <div>: {sg.quality}</div>
                                </div>
                              </td>
                            </tr>
                            {sg.items.map((item, iIdx) => (
                              <tr key={iIdx}>
                                <td colSpan={2} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '2px 10px' }}>
                                  <div style={{ ...descGrid, fontSize: '10px' }}>
                                    <span style={{ textAlign: 'center' }}>{item.id}</span>
                                    <span>{item.mesh}</span>
                                    <span>{item.wireDia}</span>
                                    <span>{item.size}</span>
                                    <span>{item.sqm}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        ))}
                      </Fragment>
                    )
                  })}

                  <tr aria-hidden className="quotation3-goods-spacer">
                    <td colSpan={2} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '6px 0', lineHeight: 0, fontSize: 0 }} />
                    <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '6px 0', lineHeight: 0, fontSize: 0 }} />
                    <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '6px 0', lineHeight: 0, fontSize: 0 }} />
                    <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '6px 0', lineHeight: 0, fontSize: 0 }} />
                  </tr>

                  {/* MOQ info */}
                  <tr>
                    <td colSpan={2} style={{ ...bdSides, borderTop: 'none', borderBottom: 'none', padding: '6px 10px', fontWeight: 'bold' }}>
                      * MOQ- 1000 Panel each size
                    </td>
                    <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                    <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                    <td style={{ ...bdSides, borderTop: 'none', borderBottom: 'none' }} />
                  </tr>
                  
                  <tr aria-hidden className="quotation3-goods-spacer">
                    <td colSpan={2} style={{ ...bdSides, borderTop: 'none', borderBottom: '1px solid #000', padding: '6px 0', lineHeight: 0, fontSize: 0 }} />
                    <td style={{ ...bdSides, borderTop: 'none', borderBottom: '1px solid #000', padding: '6px 0', lineHeight: 0, fontSize: 0 }} />
                    <td style={{ ...bdSides, borderTop: 'none', borderBottom: '1px solid #000', padding: '6px 0', lineHeight: 0, fontSize: 0 }} />
                    <td style={{ ...bdSides, borderTop: 'none', borderBottom: '1px solid #000', padding: '6px 0', lineHeight: 0, fontSize: 0 }} />
                  </tr>

                  {/* Footer blocks matching screenshot */}
                  <tr>
                    <td colSpan={3} style={{ ...bd, padding: '5px 10px', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000' }}>Remarks</td>
                    <td style={{ ...bd, padding: '5px 6px', borderTop: 'none', borderBottom: 'none' }} />
                    <td style={{ ...bd, padding: '5px 6px', borderTop: 'none', borderBottom: 'none' }} />
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ ...bd, padding: '5px 10px', textAlign: 'center', borderRight: '1px solid #000' }}>Packing considsred for 1000 pannels / Box</td>
                    <td style={{ ...bd, padding: '5px 6px', borderTop: 'none', borderBottom: 'none' }} />
                    <td style={{ ...bd, padding: '5px 6px', borderTop: 'none', borderBottom: 'none' }} />
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ ...bd, padding: '5px 10px', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000' }}>Transport</td>
                    <td style={{ ...bd, padding: '5px 6px', borderTop: 'none', borderBottom: 'none' }} />
                    <td style={{ ...bd, padding: '5px 6px', borderTop: 'none', borderBottom: 'none' }} />
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ ...bd, padding: '5px 10px', textAlign: 'center', borderRight: '1px solid #000' }}>Ex-work Jaipur Price</td>
                    <td style={{ ...bd, padding: '5px 6px', borderTop: 'none', borderBottom: 'none' }} />
                    <td style={{ ...bd, padding: '5px 6px', borderTop: 'none', borderBottom: 'none' }} />
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ ...bd, padding: '5px 10px', textAlign: 'center', fontSize: '10px', borderRight: '1px solid #000', color: '#333' }}>
                      <span style={{ fontWeight: 'normal' }}>
                         Note : If the total order value is less than USD 2500,<br/>
                         transaction fee of USD 100 per invoice shall be charged extra
                      </span>
                    </td>
                    <td style={{ ...bd, padding: '5px 6px', fontWeight: 'bold', textAlign: 'right', verticalAlign: 'bottom' }}>USD</td>
                    <td style={{ ...bd, padding: '5px 8px', fontWeight: 'bold', textAlign: 'right', verticalAlign: 'bottom' }}>
                      <span className="quotation-grand-total-amount">
                        {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={1} style={{ ...bd, padding: '6px 10px', fontSize: '10px', verticalAlign: 'top', width: '15%' }}>
                      <div style={{ fontWeight: 'bold' }}>
                        Amount<br />
                        Chargeable<br />
                        (In words) :
                      </div>
                    </td>
                    <td colSpan={2} style={{ ...bd, padding: '6px 10px', fontSize: '12px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 'bold', color: '#444' }}>
                        US Dollar : Fifty Thousand Six Hundred And Ten Only
                      </div>
                    </td>
                    <td style={{ ...bd, padding: '8px 10px', fontWeight: 'bold', textAlign: 'right', verticalAlign: 'middle', fontSize: '13px' }}>Total:-</td>
                    <td style={{ ...bd, padding: '8px 8px', fontWeight: 'bold', textAlign: 'right', verticalAlign: 'middle', fontSize: '13px' }}>
                      <span className="quotation-grand-total-amount">
                        {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {isLastChunk && footerNode}
            </div>
          </div>
        );
      })}
    </div>
  )
}
