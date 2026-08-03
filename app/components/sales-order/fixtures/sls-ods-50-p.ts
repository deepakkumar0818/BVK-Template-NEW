import type { SalesOrderData } from '../types'

const description =
  'GKD FILTER SCREEN 160 X 50 MIC ALU-FRAME\n' +
  'NEAT AND CLEAN PACKAGING\n' +
  'ALUMINIUM FRAME TO BE MAKED WITH\n' +
  '   FILTER SCREEN OPENING SIZE 160 X 50 MIC\n' +
  'FILTER SCREEN DOUBLE LAYER WITH ALUMINIUM\n' +
  'FRAME\n' +
  'OPENING 160 MIC ONE SIDE AND 50 MIC ANOTHER\n' +
  'SIDE\n' +
  'DIA OF FRAME :250/234mm,\n' +
  'FILTER SCREEN MOC :SS316\n' +
  'ULTRASONICALLY CLEANED'

export const slsOds50PFixture: SalesOrderData = {
  variant: 'sls-ods-50-p',
  logo: {
    src: '/wmw-logo.png',
    alt: 'WMW INDUSTRIES LTD',
    fallbackText: 'WMW\nINDUSTRIES LTD',
    tagline: 'WMW INDUSTRIES LTD',
    taglineSub: 'A BVK Group Company\nWeaving Technical Mesh Solutions',
  },
  internalCodeHeader: 'WMW (I) INTERNAL PRODUCT CODE',
  header: {
    docLabel: 'Format No.',
    docNo: 'SALES-ODS-F-001',
    docRev: '',
    pageNo: '2 of 2',
    issueNo: '2',
    issueDate: '01.09.2019',
    odsNo: 'WMW-50-26',
    odsDate: '18.06.26',
    clientName: 'WACKER METROARK CHEMICALS PVT.LTD.',
  },
  invoice: {
    lines: [
      'WACKER METROARK CHEMICALS PVT.LTD.',
      'D.H. ROAD,CHANDI,24 PARGANAS(S)',
      'West Bengal-743503',
      'INDIA',
      'M:91 9073364471',
      'CONTACT PERSON- PRITAM HALDAR',
      '0',
    ],
  },
  delivery: {
    lines: [
      'WACKER METROARK CHEMICALS PVT.LTD.',
      'VILL & POST CHANDI(S) D H ROAD PS BISHN',
      '24 PARGANAS(S) West Bengal Region 19',
      '743503 India',
      'Place of Supply: West Bengal Region 19',
      'CONTACT PERSON- PRITAM HALDAR',
      'M: 91 9073364471',
    ],
  },
  orderDetails: {
    clientPoNo: '9107273914-3671-617',
    poDate: '29.05.26',
    qctNo: '',
    qctExtraCell: 'BU-1',
  },
  deliveryRequest: {
    notes: ['12.08.26', '', '', '', ''],
    commit: '',
  },
  lines: [
    {
      internalCode: '0',
      application: 'Chemical',
      description,
      length: '0',
      width: '0',
      totalSqm: '0',
      pcsKg: '500',
      qtyPcs: 'Pcs',
      priceUnit: '0.00',
      totalValue: '0.00',
    },
    {
      internalCode: '0',
      application: 'Chemical',
      description,
      length: '0',
      width: '0',
      totalSqm: '0',
      pcsKg: '1000',
      qtyPcs: 'Pcs',
      priceUnit: '0.00',
      totalValue: '0.00',
    },
  ],
  gstLabel: 'GST 18%',
  gstAmount: '',
  totalValue: '',
  hideProductFooter: true,
  terms: {
    destination: 'WEST BENGAL REGION 19',
    packingType: 'PACKED IN CARD BOARD / WOODEN BOX',
    documentsRequired: 'MTC REQUIRED',
    despatchMode: 'BY ROAD',
    transporter: 'ANY',
    freight: 'PAID',
    industrialCode: '130',
  },
  termsOrder: [
    { label: 'DESTINATION', key: 'destination' },
    { label: 'PACKING TYPE', key: 'packingType' },
    { label: 'DOCUMENTS REQUIRED', key: 'documentsRequired' },
    { label: 'DESPATCH MODE', key: 'despatchMode' },
    { label: 'TRANSPORTER', key: 'transporter' },
    { label: 'FREIGHT : TO PAY / PAID', key: 'freight' },
    { label: 'INDUSTRIAL CODE', key: 'industrialCode' },
  ],
  remarks:
    'Please Note: 1.NEAT AND CLEAN PACKAGING\n' +
    '     2. ALUMINIUM FRAME TO BE MAKED WITH FILTER SCREEN OPENING SIZE 160 X 50 MIC\n' +
    '     3. Number of our Purchase Order as well as the respective line item number has to be stated on the shipping documents.',
  signerName: '',
}
