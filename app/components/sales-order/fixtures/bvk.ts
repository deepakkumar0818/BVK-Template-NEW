import type { SalesOrderData } from '../types'

export const bvkOdsFixture: SalesOrderData = {
  variant: 'bvk',
  logo: {
    src: '/hydrotech-logo.png',
    alt: 'BVK HYDROTECH',
    fallbackText: 'BVK\nHYDROTECH',
  },
  internalCodeHeader: 'BVK (I) INTERNAL PRODUCT CODE',
  header: {
    docNo: 'SALES-ODS-F-001',
    docRev: '0',
    pageNo: '1 of 2',
    issueNo: '2',
    issueDate: '01.09.2019',
    odsNo: 'BVK-HDTK-01-26',
    odsDate: '03.04.26',
    clientName: 'Newtrace Private Limited',
  },
  invoice: {
    address:
      'Newtrace Private Limited\n1st Floor, Plot No. 53, KIADB Hardware Park\nHuvinayakanahalli, Bengaluru\nBangalore, Karnataka 560048',
    cell: '9900032010',
    contact: 'Deenanath Kulkarni',
  },
  delivery: {
    address:
      'Newtrace Private Limited\n1st Floor, Plot No. 53, KIADB Hardware Park\nHuvinayakanahalli, Bengaluru\nBangalore, Karnataka 560048',
    cell: '9900032010',
    contact: 'Deenanath Kulkarni',
  },
  orderDetails: {
    clientPoNo: '#NPL-PO-25-26-000893',
    poDate: '30.03.26',
    qctNo: 'BU-1',
  },
  deliveryRequest: {
    notes: ['Urgent', '', '', '', ''],
    commit: '',
  },
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
  signerName: '',
}
