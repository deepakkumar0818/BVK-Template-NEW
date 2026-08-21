import type { MultiOrderAcceptanceOfOrderData } from '../types'

/**
 * Clone of argo-multi-ao with the header logo swapped to BVK Hydrotech.
 * Everything else — rows, subject, body, signature, footer — is identical.
 */

export const argoMultiAoHydrotechFixture: MultiOrderAcceptanceOfOrderData = {
  variant: 'argo-multi-ao-hydrotech',
  logo: {
    src: '/hydrotech-logo.png',
    alt: 'BVK HYDROTECH',
    fallbackText: 'BVK\nHYDROTECH',
    brandName: '',
    tagline: '',
  },
  title: 'Acceptance of Order',
  date: '07-04-2026',
  recipient: {
    toLabel: 'TO,',
    companyLabel: 'M/s.:',
    companyName: 'ARGO-HYTOS PVT. LTD',
    addressLines: [
      'SF.No. 82B/2B, Sandegoundanpalayam,',
      'Kovilpalayam Post, Pollachi Taluk,',
      'Coimbatore Dist - 642 110, Tamil Nadu, India.',
    ],
  },
  subject: 'Sub: Acceptance of Orders mentioned below',
  greeting: 'Dear sir,',
  bodyOpening: 'We thankfully acknowledge the receipt of your orders.',
  columnHeaders: {
    poNo: 'Po. No.',
    sapNo: 'SAP No.',
    quality: 'Quality',
    tentativeDispatchDate: 'Tentative Dispatch Date',
    orderQty: 'Order Qty/Sqm',
    rate: 'Rate/Sqm',
    totalValue: 'Total Value / INR',
  },
  rows: [
    { poNo: '4500039641', sapNo: '44737900', quality: 'Hybrid Mesh 593.00 mm', tentativeDispatchDate: '20-05-2026', orderQty: '1800', rate: '205', totalValue: '369000' },
    { poNo: '4500039642', sapNo: '45465700', quality: 'Hybrid Mesh 202.00 mm', tentativeDispatchDate: '20-05-2026', orderQty: '500', rate: '205', totalValue: '102500' },
    { poNo: '4500039853', sapNo: '45465600', quality: 'Hybrid Mesh 193.00 mm', tentativeDispatchDate: '20-05-2026', orderQty: '800', rate: '205', totalValue: '164000' },
    { poNo: '4500039854', sapNo: '45465600', quality: 'Hybrid Mesh 193.00 mm', tentativeDispatchDate: '20-05-2026', orderQty: '800', rate: '205', totalValue: '164000' },
    { poNo: '4500039855', sapNo: '45467000', quality: 'Hybrid Mesh 342.00 mm', tentativeDispatchDate: '20-05-2026', orderQty: '250', rate: '205', totalValue: '51250' },
    { poNo: '4500039856', sapNo: '45467000', quality: 'Hybrid Mesh 342.00 mm', tentativeDispatchDate: '30-05-2026', orderQty: '2400', rate: '205', totalValue: '492000' },
    { poNo: '4500039857', sapNo: '45465700', quality: 'Hybrid Mesh 202.00 mm', tentativeDispatchDate: '20-05-2026', orderQty: '700', rate: '205', totalValue: '143500' },
    { poNo: '4500039858', sapNo: '45465700', quality: 'Hybrid Mesh 202.00 mm', tentativeDispatchDate: '30-05-2026', orderQty: '600', rate: '205', totalValue: '123000' },
    { poNo: '4500039861', sapNo: '45466000', quality: 'Hybrid Mesh 2135.00 mm', tentativeDispatchDate: '30-05-2026', orderQty: '120', rate: '205', totalValue: '24600' },
    { poNo: '4500039862', sapNo: '45466100', quality: 'Hybrid Mesh 226.00 mm', tentativeDispatchDate: '30-05-2026', orderQty: '1400', rate: '205', totalValue: '287000' },
    { poNo: '4500039863', sapNo: '45466100', quality: 'Hybrid Mesh 226.00 mm', tentativeDispatchDate: '20-06-2026', orderQty: '1300', rate: '205', totalValue: '266500' },
    { poNo: '4500039864', sapNo: '45466400', quality: 'Hybrid Mesh 241.00 mm', tentativeDispatchDate: '30-05-2026', orderQty: '150', rate: '205', totalValue: '30750' },
    { poNo: '4500039865', sapNo: '45466400', quality: 'Hybrid Mesh 241.00 mm', tentativeDispatchDate: '30-05-2026', orderQty: '180', rate: '205', totalValue: '36900' },
    { poNo: '4500039866', sapNo: '45466700', quality: 'Hybrid Mesh 297.00 mm', tentativeDispatchDate: '20-06-2026', orderQty: '200', rate: '205', totalValue: '41000' },
    { poNo: '4500039867', sapNo: '45466800', quality: 'Hybrid Mesh 324.00 mm', tentativeDispatchDate: '20-05-2026', orderQty: '200', rate: '205', totalValue: '41000' },
    { poNo: '4500039868', sapNo: '45466800', quality: 'Hybrid Mesh 324.00 mm', tentativeDispatchDate: '20-06-2026', orderQty: '100', rate: '205', totalValue: '20500' },
    { poNo: '4500039869', sapNo: '45466900', quality: 'Hybrid Mesh 327.00 mm', tentativeDispatchDate: '30-05-2026', orderQty: '400', rate: '205', totalValue: '82000' },
    { poNo: '4500039870', sapNo: '45466900', quality: 'Hybrid Mesh 327.00 mm', tentativeDispatchDate: '20-06-2026', orderQty: '900', rate: '205', totalValue: '184500' },
    { poNo: '4500039871', sapNo: '45467300', quality: 'Hybrid Mesh 407.00 mm', tentativeDispatchDate: '30-05-2026', orderQty: '400', rate: '205', totalValue: '82000' },
    { poNo: '4500039872', sapNo: '45663600', quality: 'Hybrid Mesh 239.00 mm', tentativeDispatchDate: '20-05-2026', orderQty: '30', rate: '205', totalValue: '6150' },
    { poNo: '4500039873', sapNo: '46031400', quality: 'Hybrid Mesh 160.00 mm', tentativeDispatchDate: '20-06-2026', orderQty: '150', rate: '205', totalValue: '30750' },
    { poNo: '4500039874', sapNo: '44849100', quality: 'Hybrid Mesh 162.00 mm', tentativeDispatchDate: '20-06-2026', orderQty: '200', rate: '205', totalValue: '41000' },
    { poNo: '4500039875', sapNo: '45465000', quality: 'Hybrid Mesh 138.00 mm', tentativeDispatchDate: '20-06-2026', orderQty: '125', rate: '205', totalValue: '25625' },
    { poNo: '4500039876', sapNo: '45465200', quality: 'Hybrid Mesh 151.00 mm', tentativeDispatchDate: '30-05-2026', orderQty: '200', rate: '205', totalValue: '41000' },
    { poNo: '4500039877', sapNo: '45465200', quality: 'Hybrid Mesh 151.00 mm', tentativeDispatchDate: '20-06-2026', orderQty: '300', rate: '205', totalValue: '61500' },
    { poNo: '4500039878', sapNo: '47008431', quality: 'Hybrid Mesh 597.00 mm', tentativeDispatchDate: '30-05-2026', orderQty: '820', rate: '205', totalValue: '168100' },
  ],
  bodyClosingParas: [
    'GST will be extra and other terms and conditions would be as per our quotation.',
    'Please note that we have delivery issues with our current supplier for PET, therefore you must give us the approval of additional suppliers to mitigate the risk. We would need more than one additional supplier approval.',
    'Always Assure you the best services.',
  ],
  signatureLines: [
    'Thank you,',
    'Yours truly,',
    'For WMW Industries Limited',
    '(Sales Coordinator)',
  ],
  footerLeft: {
    companyName: 'WMW INDUSTRIES LIMITED',
    formerName: '""',
    address: '52, Industrial Area: Jhotwara, Jaipur - 302012, India',
    contactLine: '+91 141 7105100 | query@wmwindia.com | www.wmwindia.com',
    cin: 'U51909WB2011PLC163277',
    gst: '08AAECG2743F1ZS',
  },
  footerRight: {
    groupLine: 'A BVK Group Company',
    registeredOfficeLabel: 'Registered Office: #101/5;',
    registeredOfficeLines: [
      'IMAX-1C, S.N. Banerjee Road,',
      'Kolkata-700014, India',
    ],
  },
}
