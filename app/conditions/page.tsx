import Link from 'next/link'

export default function ConditionsPage() {
  return (
    <main className="conditions-doc" style={{ padding: '24px', maxWidth: '210mm', margin: '0 auto' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '16px', color: '#1e40af', textDecoration: 'underline' }}>
        ← Back to Quotation
      </Link>

      <h1>STANDARD CONDITIONS OF SALE:</h1>

      <p>
        The following conditions apply to all business conducted by WMW Metal Fabrics Ltd. (&quot;The Company&quot;) with the recipient (&quot;The Buyer&quot;). These conditions are effective on the date of the invoice.
      </p>

      <div className="section">
        <div className="section-title">1. CONTRACT:</div>
        <p><strong>1.1.</strong> All quotations and orders are subject to these conditions. In case of inconsistency, these conditions prevail over the Buyer&apos;s conditions of purchase or supply. The Buyer irrevocably accepts these conditions.</p>
        <p><strong>1.2.</strong> The contract is not assignable. The Buyer cannot withdraw without specific written agreement from the company. Upon withdrawal, the Buyer must pay the full contract price.</p>
      </div>

      <div className="section">
        <div className="section-title">2. DELIVERY:</div>
        <p><strong>2.1.</strong> Goods will be delivered to the specified location on the acceptance of order. Dates are specified by the company. Company not liable for failure to deliver goods if it doesn&apos;t constitute a breach of contract or negligence.</p>
        <p><strong>2.2.</strong> If the Buyer fails to take delivery, the company has the right to charge for handling and storage (1% per week of invoice price, up to 50%) and additional transportation costs.</p>
        <p><strong>2.3.</strong> If delivery is by installment and the Company makes defective deliveries in one or more installments, the Buyer is not entitled to repudiate the whole contract.</p>
        <p><strong>2.4.</strong> If goods are not collected within three months of notification, the company reserves the right to recall and recover the full price.</p>
      </div>

      <div className="section">
        <div className="section-title">3. RISK:</div>
        <p><strong>3.1.</strong> Risk passes to the Buyer as soon as goods are dispatched. Buyer is responsible for all loss, damage, or deterioration.</p>
      </div>

      <div className="section">
        <div className="section-title">4. PRICE:</div>
        <p><strong>4.1.</strong> The price quoted is the current price. The Company reserves the right to adjust the price due to cost increases (e.g., currency fluctuations, wages, materials, transport, overhead).</p>
        <p><strong>4.2.</strong> If the Buyer initiates design or specification changes, the company may adjust the price accordingly.</p>
      </div>

      <div className="section">
        <div className="section-title">5. PAYMENT:</div>
        <p><strong>5.1.</strong> Each consignment is separately invoiced and paid for. Payment is to be made to the Company&apos;s Bank in Jaipur, India.</p>
        <p><strong>5.2.</strong> Payment is due in full upon goods leaving the company or expiry of any agreed extended payment period. If not paid on due date, the outstanding balance becomes immediately due and payable with interest charged at 10% over the bank rate.</p>
      </div>

      <div className="section">
        <div className="section-title">6. CLAIMS:</div>
        <p><strong>6.1.</strong> Buyer is not entitled to claims for repairs/alterations without company&apos;s written consent, or for defects arising from normal wear and tear or accident.</p>
        <p><strong>6.2.</strong> Company&apos;s liability is limited to the ex-factory price of the goods; not liable for consequential or indirect loss or damage. No warranty for performance. Complaints not accepted after 6 months from invoice date. Any liability ceases after 12 months.</p>
        <p><strong>6.3.</strong> Company may rescind the contract or suspend deliveries under specific circumstances:</p>
        <p><strong>6.3.1.</strong> Any sum due from the Buyer to the Company is unpaid.</p>
        <p><strong>6.3.2.</strong> The Buyer is in breach of any contract provision.</p>
        <p><strong>6.3.3.</strong> The Buyer becomes bankrupt, insolvent, or unable to pay debts.</p>
        <p><strong>6.3.4.</strong> The company is unable to deliver goods as per the contract.</p>
      </div>

      <div className="section">
        <div className="section-title">7. SPECIFICATION COPYRIGHT:</div>
        <p><strong>7.1.</strong> Buyer indemnifies the Company against all claims related to work done in accordance with Buyer&apos;s specifications.</p>
        <p><strong>7.2.</strong> If specifications are supplied by the Buyer, the Company will supply such specifications within a specified time frame.</p>
        <p><strong>7.3.</strong> Copyright of all documents (including drawings) furnished to the Buyer remains with the Company. Documents are not to be used for other purposes or disclosed without written consent.</p>
      </div>

      <div className="section">
        <div className="section-title">8. GENERAL PROVISIONS:</div>
        <p><strong>8.1.</strong> Company has a general lien over any Buyer&apos;s property in its possession for unpaid debts. Company can dispose of the property after 14 days&apos; notice to apply proceeds to debt.</p>
        <p><strong>8.2.</strong> Company is not liable for delay in carrying out any part of its agreements for any cause beyond its control.</p>
        <p><strong>8.3.</strong> Buyer warrants that these conditions are accepted with the knowledge that the price charged would be higher if the Company were under liability or potential liability.</p>
      </div>

      <div className="section">
        <div className="section-title">9. LIMITATION OF DAMAGES:</div>
        <p><strong>9.1.</strong> Seller is not liable for special, exemplary, proximate consequential, or incidental damages. Seller&apos;s maximum liability is limited to the contract price of the order giving rise to the claim.</p>
      </div>

      <div className="section">
        <div className="section-title">10. INDEMNIFICATION:</div>
        <p><strong>10.1.</strong> Buyer shall defend, indemnify, and hold harmless the Seller and its directors, officers, and employees from any and all claims, losses, liability, damages, and expenses, including legal fees, related to, or arising from, or connected with, or alleged to arise from or out of any asserted deficiencies or defects the Product caused by any alteration or modification thereof by Buyer with or without Seller&apos;s written consent, or improper handling or storage by Buyer.</p>
      </div>

      <div className="section">
        <div className="section-title">11. ARBITRATION & JURISDICTION:</div>
        <p><strong>11.1.</strong> In case of any dispute, it shall be referred to mutually acceptable arbitration. An umpire and their decision shall be final and binding. The arbitration will be held at Jaipur, India, and jurisdiction for this agreement is Jaipur, India only.</p>
      </div>
    </main>
  )
}
