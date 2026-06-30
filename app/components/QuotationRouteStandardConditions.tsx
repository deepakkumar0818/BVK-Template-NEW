/** Shared body: Standard Conditions of Sale for `/quotation/[id]` (print) and `/conditions` (screen). */
export function QuotationRouteStandardConditionsBody() {
  const sectionStyle = { marginBottom: '16px' } as const
  const titleStyle = { fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' } as const
  const paraStyle = { marginBottom: '8px', lineHeight: 1.6 } as const

  return (
    <>
      <h1 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '16px' }}>
        STANDARD CONDITIONS OF SALE
      </h1>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>
          1. CONTRACT
        </div>
        <p style={paraStyle}>
          <strong>1.1</strong> All quotations, orders, invoices and supplies made by WMW Metal Fabrics Ltd.
          (&quot;Seller&quot;) are subject to these Standard Conditions of Sale unless otherwise agreed in writing.
        </p>
        <p style={paraStyle}>
          <strong>1.2</strong> No order accepted by the Seller may be cancelled or modified by the Buyer without the
          Seller&apos;s prior written consent. The Buyer shall reimburse the Seller for all reasonable costs, expenses and
          losses incurred up to the date of cancellation.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>
          2. PRICE
        </div>
        <p style={paraStyle}>
          <strong>2.1</strong> Prices are exclusive of GST and other applicable taxes unless otherwise stated.
        </p>
        <p style={paraStyle}>
          <strong>2.2</strong> The Seller reserves the right to revise prices prior to dispatch where there is a material
          increase in the cost of raw materials, freight, duties, taxes, exchange rates or other direct costs affecting
          performance of the contract.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>
          3. DELIVERY
        </div>
        <p style={paraStyle}>
          <strong>3.1</strong>   Delivery dates are estimates only and shall not be of the essence unless specifically agreed
          in writing.
        </p>
        <p style={paraStyle}>
          <strong>3.2</strong> The Seller shall not be liable for delays caused by circumstances beyond its reasonable
          control.
        </p>
        <p style={paraStyle}>
          <strong>3.3</strong> If the Buyer fails to take delivery when goods are ready, the Seller may recover reasonable
          storage, handling, insurance and transportation charges incurred.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>
          4. RISK AND TITLE
        </div>
        <p style={paraStyle}>
          <strong>4.1</strong> Risk in the Goods shall pass to the Buyer upon dispatch, delivery to carrier, or collection
          by the Buyer, whichever occurs first.
        </p>
        <p style={paraStyle}>
          <strong>4.2</strong> Ownership of the Goods shall remain with the Seller until full payment of all amounts due in
          respect of the Goods has been received.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>
          5. PAYMENT
        </div>
        <p style={paraStyle}>
          <strong>5.1</strong> Payment shall be made in accordance with the terms stated on the invoice.
        </p>
        <p style={paraStyle}>
          <strong>5.2</strong> In the event of delay in payment, interest shall be payable at the rate of 18% per annum or
          the maximum rate permitted by law, whichever is lower, from the due date until realization.
        </p>
        <p style={paraStyle}>
          <strong>5.3</strong> The Seller may suspend further supplies if any payment remains overdue.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>
          6. INSPECTION AND CLAIMS
        </div>
        <p style={paraStyle}>
          <strong>6.1</strong> The Buyer shall inspect the Goods upon delivery and notify the Seller in writing of any
          visible defect, shortage or damage within 15 days of delivery.
        </p>
        <p style={paraStyle}>
          <strong>6.2</strong> Claims relating to manufacturing defects must be notified in writing within 6 months from the
          date of invoice.
        </p>
        <p style={paraStyle}>
          <strong>6.3</strong> No claim shall be entertained in respect of Goods altered, repaired, mishandled, improperly
          stored or misused by the Buyer without the Seller&apos;s written approval.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>
          7. LIMITATION OF LIABILITY
        </div>
        <p style={paraStyle}>
          <strong>7.1</strong> Except in cases of fraud or wilful misconduct, the Seller&apos;s total liability arising out
          of any supply shall not exceed the invoice value of the Goods giving rise to the claim.
        </p>
        <p style={paraStyle}>
          <strong>7.2</strong> The Seller shall not be liable for any indirect, consequential, special or incidental loss,
          including loss of profit, production or business opportunity.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>
          8. INTELLECTUAL PROPERTY
        </div>
        <p style={paraStyle}>
          Where Goods are manufactured to the Buyer&apos;s design, drawing or specification, the Buyer shall indemnify and
          hold harmless the Seller against any claim arising from infringement of intellectual property rights.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>
          9. FORCE MAJEURE
        </div>
        <p style={paraStyle}>
          The Seller shall not be liable for any delay or failure in performance caused by events beyond its reasonable
          control, including acts of God, natural disasters, war, governmental actions, labour disputes, transportation
          disruptions, shortage of materials or utility failures.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>
          10. DISPUTE RESOLUTION
        </div>
        <p style={paraStyle}>
          Any dispute arising out of or relating to the sale of Goods shall be referred to arbitration in accordance with
          the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be Jaipur, Rajasthan, India.
          The proceedings shall be conducted by a sole arbitrator mutually appointed by the parties.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>
          11. GOVERNING LAW AND JURISDICTION
        </div>
        <p style={paraStyle}>
          These Conditions shall be governed by the laws of India. Subject to the arbitration clause, courts at Jaipur,
          Rajasthan shall have exclusive jurisdiction.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>
          12. ACCEPTANCE
        </div>
        <p style={paraStyle}>
          Receipt, acceptance, use of Goods, or payment against this invoice shall constitute acceptance of these Standard
          Conditions of Sale.
        </p>
      </div>
    </>
  )
}

/** Print-only wrapper after `/quotation/[id]` body (hidden on screen via `.conditions-for-print`). */
export default function QuotationRouteStandardConditions() {
  return (
    <div className="conditions-for-print conditions-doc" style={{ border: '1px solid #000', padding: '16px', marginTop: '24px' }}>
      <QuotationRouteStandardConditionsBody />
    </div>
  )
}
