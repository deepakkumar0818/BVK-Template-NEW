import type { AcceptanceOfOrderData } from '../types'

export const wackerAoFixture: AcceptanceOfOrderData = {
  variant: 'wacker-ao',
  logo: {
    src: '/wmw-logo.png',
    alt: 'WMW INDUSTRIES LTD',
    fallbackText: 'WMW\nINDUSTRIES LTD',
    brandName: 'WMW\nINDUSTRIES LTD',
    tagline: '…weaving solutions together',
  },
  title: 'Acceptance of order',
  date: '17.06.26',
  recipient: {
    salutationPrefix: 'Mr.',
    name: 'Pritam Halder',
    company: 'M/s.: Wacker Metroark Chemicals Pvt Ltd',
    addressLines: [
      'DH Road Chandi,24 Parganas(S) Amtala.',
      'West Bengal Region-19,743503-India',
    ],
    phone: 'Ph.: 033-24072100',
  },
  subject: 'Sub: Acceptance of Order no. 9107273914-3671-617dt.28.05.26',
  greeting: 'Dear sir,',
  bodyOpening: 'We thankfully acknowledge the receipt of your above-mentioned order',
  lines: [
    {
      item: '1',
      product:
        'FILTER SCREEN DOUBLE LAYER WITH ALUMINIUM FRAME\nOPENING 160 MIC ONE SIDE AND 50 MI ANOTHER SIDE\nDIA OF FRAME :250/234mm,\nFILTER SCREEN MOC :SS316',
      pcs: '1500',
      unitPriceInr: '699.00',
      totalValue: '1048500',
    },
  ],
  bodyClosingParas: [
    'GST will be extra and other terms and conditions would be as per our quotation.',
    'Delivery: Estimated delivery 8-10 weeks',
    'Assuring you of the best services, always.\nThanking You,',
  ],
  yoursTruly: 'Yours truly,',
  companySignature: 'For WMW Industries Limited',
  signerRole: '(Sales Coordinator)',
  footerLeft: {
    companyName: 'WMW INDUSTRIES LIMITED',
    formerName: '""',
    address: '52, Industrial Area, Jhotwara, Jaipur - 302012, India',
    contactLine: '+91 141 7105100 • query@wmwindia.com • www.wmwindia.com',
    cin: 'U51909WB2011PLC163277',
    gst: '08AAECG2743F1ZS',
  },
  footerRight: {
    groupLine: 'A BVK Group Company',
    registeredOfficeLabel: 'Registered Office:',
    registeredOfficeLines: [
      '#101/5;',
      'IMAX-1C, S.N. Banerjee Road,',
      'Kolkata-700014, India',
    ],
  },
}
