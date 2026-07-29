/**
 * Standard Conditions of Sale — single source of truth used by both
 * `/wmw/[id]` and `/quotation/[id]` (inline print block + the "View Standard
 * Conditions of Sale" link pages `/conditions` and `/conditions/quotation`).
 *
 * Two exports:
 *   • `StandardConditionsOfSaleBody`  — bare content (18 sections + heading).
 *     Use this inside a page that already provides its own outer wrapper.
 *   • default `StandardConditionsOfSale` — wraps the body in the print-styled
 *     `.conditions-for-print .conditions-doc` box. Use this inline in the
 *     print sheet (after the goods table).
 */

export function StandardConditionsOfSaleBody() {
  const sectionStyle = { marginBottom: '16px' } as const
  const titleStyle = { fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' } as const
  const paraStyle = { marginBottom: '8px', lineHeight: 1.6 } as const

  return (
    <>
      <h1
        style={{
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}
      >
        STANDARD CONDITIONS OF SALE
      </h1>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>1. CONTRACT</div>
        <p style={paraStyle}>
          <strong>1.1</strong> All quotations, orders, invoices and supplies made by WMW Metal Fabrics Ltd. (&quot;Seller&quot;) are subject to these Standard Conditions of Sale unless otherwise agreed in writing.
        </p>
        <p style={paraStyle}>
          <strong>1.2</strong> No order accepted by the Seller may be cancelled or modified by the Buyer without the Seller&apos;s prior written consent. The Buyer shall reimburse the Seller for all reasonable costs, expenses and losses incurred up to the date of cancellation.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>2. PRICE</div>
        <p style={paraStyle}>
          <strong>2.1</strong> Prices are exclusive of GST and other applicable taxes unless otherwise stated.
        </p>
        <p style={paraStyle}>
          <strong>2.2</strong> The Seller reserves the right to revise prices prior to dispatch where there is a material increase in the cost of raw materials, freight, duties, taxes, exchange rates or other direct costs affecting performance of the contract.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>3. DELIVERY</div>
        <p style={paraStyle}>
          <strong>3.1</strong> Delivery dates are estimates only and shall not be of the essence unless specifically agreed in writing.
        </p>
        <p style={paraStyle}>
          <strong>3.2</strong> The Seller shall not be liable for delays caused by circumstances beyond its reasonable control.
        </p>
        <p style={paraStyle}>
          <strong>3.3</strong> If the Buyer fails to take delivery when goods are ready, the Seller may recover reasonable storage, handling, insurance and transportation charges incurred.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>4. RISK AND TITLE</div>
        <p style={paraStyle}>
          <strong>4.1</strong> Risk in the Goods shall pass to the Buyer upon dispatch, delivery to carrier, or collection by the Buyer, whichever occurs first.
        </p>
        <p style={paraStyle}>
          <strong>4.2</strong> Ownership of the Goods shall remain with the Seller until full payment of all amounts due in respect of the Goods has been received.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>5. PAYMENT</div>
        <p style={paraStyle}>
          <strong>5.1</strong> Payment shall be made in accordance with the terms stated on the invoice.
        </p>
        <p style={paraStyle}>
          <strong>5.2</strong> In the event of delay in payment, interest shall be payable at the rate of 18% per annum or the maximum rate permitted by law, whichever is lower, from the due date until realization.
        </p>
        <p style={paraStyle}>
          <strong>5.3</strong> The Seller may suspend further supplies if any payment remains overdue.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>6. MSME (DELAYED PAYMENT) PROVISIONS</div>
        <p style={paraStyle}>
          If and so long as the supplying entity is registered as a micro or small enterprise under the MSMED Act 2006, the following apply notwithstanding any contrary term: payment is due within 45 days of acceptance or deemed acceptance of the Goods (no written objection within 15 days of delivery being deemed acceptance); late payment carries compound interest, with monthly rests, at three times the RBI bank rate (s.16); such interest is not allowable as a deduction to the Buyer (s.23); disputes over sums due may be referred by the Company to the Micro and Small Enterprises Facilitation Council, Jaipur (s.18), which prevails over the arbitration clause to the extent of any inconsistency; and these statutory rights cannot be waived.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>7. GOODS AND SERVICES TAX (GST)</div>
        <p style={paraStyle}>
          All prices are exclusive of GST unless otherwise stated. GST shall be charged at the applicable rate prevailing on the date of invoice. The Buyer shall provide a valid GSTIN and all information required for GST compliance. The Buyer shall verify the GST details appearing on the invoice and notify the Company of any discrepancy within 7 days. Input Tax Credit (ITC) shall be available to the Buyer only in accordance with the provisions of the CGST Act, SGST Act, IGST Act, and applicable rules. In the event of reversal or denial of ITC due to the Buyer&apos;s default, incorrect information, or non-compliance, the Buyer shall indemnify and reimburse the Company for the tax, interest, penalty, and other related costs.
        </p>
        <p style={paraStyle}>
          Any increase in GST, duties, levies or other statutory taxes after the date of quotation or order confirmation shall be borne by the Buyer.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>8. DATA PROTECTION AND PRIVACY</div>
        <p style={paraStyle}>
          Each party shall comply with all applicable data protection and privacy laws. Any personal or business information exchanged during the transaction shall be used only for the purpose of fulfilling contractual obligations. Neither party shall disclose confidential information to any third party except where required by law or with prior written consent. The Company may retain customer information for accounting, taxation, legal compliance, warranty, and business record purposes. Appropriate administrative, technical, and organizational measures shall be implemented to protect confidential and personal data from unauthorized access, disclosure, alteration, or destruction.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>9. INTELLECTUAL PROPERTY</div>
        <p style={paraStyle}>
          Where Goods are manufactured to the Buyer&apos;s design, drawing or specification, the Buyer shall indemnify and hold harmless the Seller against any claim arising from infringement of intellectual property rights.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>10. SUSTAINABILITY AND ETHICAL BUSINESS PRACTICES</div>
        <p style={paraStyle}>
          The Company is committed to conducting its business in a responsible, ethical, and environmentally conscious manner. The Buyer shall comply with all applicable environmental, labour, occupational health and safety, human rights, anti-bribery and anti-corruption laws and regulations in connection with the Goods supplied by the Company. The Buyer shall not engage in child labour, forced labour, human trafficking, unlawful discrimination, bribery, corruption, or other unethical business practices in relation to such Goods. The Company may, where commercially and technically practicable, implement measures intended to reduce the environmental impact of its manufacturing, packaging, logistics and other operational activities. The Buyer is encouraged to adopt responsible environmental and sustainability practices within its own operations and supply chain where commercially practicable. To support the Company&apos;s sustainability initiatives, customer commitments and applicable reporting, disclosure or due diligence obligations, the Buyer agrees, upon reasonable request, to provide information and documentation relating to environmental, social, governance, sustainability or product-related matters that are relevant to the Goods supplied by the Company. Such cooperation shall be provided within a reasonable timeframe and subject to the protection of the Buyer&apos;s confidential or proprietary information.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>11. INSPECTION AND CLAIMS</div>
        <p style={paraStyle}>
          <strong>11.1</strong> The Buyer shall inspect the Goods on delivery. Transport or packing damage must be reported to the Company in writing within 24 hours of receipt, with photographic proof and full shipment details (carrier, consignment / LR / AWB / Bill of Lading number, and condition of packing). The Buyer shall preserve the Goods and their packaging intact and shall fully support the Company&apos;s insurance process, including providing documentation and proof and permitting survey, audit and inspection. Where the Buyer fails to report within this period or to provide such support, the Company is not responsible for any transport or packing damage.
        </p>
        <p style={paraStyle}>
          <strong>11.2</strong> Any other visible defect or shortage must be notified to the Company in writing within 15 days of delivery.
        </p>
        <p style={paraStyle}>
          <strong>11.3</strong> No complaint or claim shall be entertained after 3 months from receipt of the Goods, after which the Goods are deemed accepted and used, unless otherwise specially agreed in writing with the Buyer. This notification requirement is a condition precedent to any claim and does not, of itself, extinguish any statutory right of suit under the Limitation Act 1963. No claim lies for Goods altered, repaired, mishandled, improperly stored, installed or misused without the Company&apos;s written approval.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>12. LIMITATION OF LIABILITY</div>
        <p style={paraStyle}>
          <strong>12.1</strong> Except in cases of fraud or wilful misconduct, the Seller&apos;s total liability arising out of any supply shall not exceed the invoice value of the Goods giving rise to the claim.
        </p>
        <p style={paraStyle}>
          <strong>12.2</strong> The Seller shall not be liable for any indirect, consequential, special or incidental loss, including loss of profit, production or business opportunity. Nothing in these Conditions shall exclude or limit any liability which cannot be excluded or limited under applicable law.
        </p>
        <p style={paraStyle}>
          <strong>12.3</strong> Nothing in these Conditions shall exclude or limit any liability which cannot be excluded or limited under applicable law.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>13. FORCE MAJEURE</div>
        <p style={paraStyle}>
          The Seller shall not be liable for any delay or failure in performance caused by events beyond its reasonable control, including acts of God, natural disasters, war, governmental actions, labour disputes, transportation disruptions, shortage of materials or utility failures. The affected party shall promptly notify the other party of the Force Majeure event and use reasonable efforts to mitigate its effects.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>14. DISPUTE RESOLUTION</div>
        <p style={paraStyle}>
          Any dispute arising out of or relating to the sale of Goods shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be Jaipur, Rajasthan, India. The proceedings shall be conducted by a sole arbitrator mutually appointed by the parties. The arbitration proceedings shall be conducted in the English language.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>15. GOVERNING LAW AND JURISDICTION</div>
        <p style={paraStyle}>
          These Conditions shall be governed by the laws of India. Subject to the arbitration clause, courts at Jaipur, Rajasthan shall have exclusive jurisdiction.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>16. ENTIRE AGREEMENT</div>
        <p style={paraStyle}>
          These Standard Conditions of Sale constitute the entire agreement between the parties relating to the sale of the Goods and supersede all prior discussions, negotiations, representations and understandings relating thereto.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>17. ACCEPTANCE</div>
        <p style={paraStyle}>
          Receipt, acceptance, use of Goods, or payment against this invoice shall constitute acceptance of these Standard Conditions of Sale.
        </p>
      </div>

      <div className="section" style={sectionStyle}>
        <div className="section-title" style={titleStyle}>18. SEVERABILITY</div>
        <p style={paraStyle}>
          If any provision of these Conditions is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
        </p>
      </div>
    </>
  )
}

/** Print-inline wrapper — used at the end of a print sheet after the goods table. */
export default function StandardConditionsOfSale() {
  return (
    <div
      className="conditions-for-print conditions-doc"
      style={{ border: '1px solid #000', padding: '16px', marginTop: '24px' }}
    >
      <StandardConditionsOfSaleBody />
    </div>
  )
}
