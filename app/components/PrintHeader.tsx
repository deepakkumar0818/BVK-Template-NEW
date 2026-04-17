export default function PrintHeader() {
  return (
    <div className="print-header" aria-hidden="true">
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
        <tbody>
          <tr>
            <td style={{ width: '55%', verticalAlign: 'top', border: '1px solid #000', padding: '12px' }}>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Supplier</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '48px', height: '48px', background: '#1e40af', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>wmw</div>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>METAL FABRICS</div>
              </div>
              <div style={{ fontWeight: 'bold' }}>WMW Metal Fabrics Ltd</div>
              <div>53, Industrial Area, Jhotwara, Jaipur-302012, Rajasthan, India</div>
              <div>Tel: +91.141.7105151</div>
              <div>www.wmwindia.com</div>
              <div>info@wmwindia.com</div>
              <div>GSTIN: 08AAACW2620D1Z8</div>
              <div>CIN: U27109WB1995PLC068681</div>
            </td>
            <td style={{ width: '45%', verticalAlign: 'top', border: '1px solid #000', padding: '12px' }}>
              <table style={{ width: '100%', border: 'none' }}>
                <tbody>
                  <tr><td style={{ border: 'none', padding: '4px 0' }}><strong>Quotation No</strong></td><td style={{ border: 'none', padding: '4px 0' }}>ARQT/23-24/0098</td></tr>
                  <tr><td style={{ border: 'none', padding: '4px 0' }}><strong>Date</strong></td><td style={{ border: 'none', padding: '4px 0' }}>2/4/2026</td></tr>
                  <tr><td style={{ border: 'none', padding: '4px 0' }}><strong>Buyer&apos;s Enquiry No</strong></td><td style={{ border: 'none', padding: '4px 0' }}></td></tr>
                  <tr><td style={{ border: 'none', padding: '4px 0' }}><strong>Terms Of Payment</strong></td><td style={{ border: 'none', padding: '4px 0' }}>0 Days / Direct Credit</td></tr>
                  <tr><td style={{ border: 'none', padding: '4px 0' }}><strong>Inco Terms</strong></td><td style={{ border: 'none', padding: '4px 0' }}></td></tr>
                  <tr><td style={{ border: 'none', padding: '4px 0' }}><strong>Terms Of Delivery</strong></td><td style={{ border: 'none', padding: '4px 0' }}></td></tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
