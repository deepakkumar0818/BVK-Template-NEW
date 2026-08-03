import type { SalesOrderData } from '../types'

/**
 * ODS No. 44 "_P" (price-redacted) sibling of sls-ods-no-44.
 * Same 12-column WMW layout, same client, same 13 product lines (Position,
 * SAP No., Delivery Request, Length, Width, Total SQM). Differences from _A:
 *   - Qty / Price / Total Value shown as 0.00 / 0.00 / 0.000 (redacted).
 *   - Price column header is "PRICE / UNIT" (not "PRICE / SQM").
 *   - Page No. is "2 of 2".
 *   - Only 5 term rows shown: DESTINATION, PACKING TYPE, DOCUMENTS REQUIRED,
 *     FREIGHT, DIRECT TRUCK / SMALL. Everything price / GST / HSN related hidden.
 */

const description = 'PET/AISI304L\nHybrid Mesh (Q-17)'
const internalCode = 'FG.PM.OER.TW.25x22.P\nExSS.PExSS.V01'
const application = 'HYDRAULIC FILTER'

export const slsOdsNo44PFixture: SalesOrderData = {
  variant: 'sls-ods-no-44-p',
  logo: {
    src: '/wmw-logo.png',
    alt: 'WMW INDUSTRIES LTD',
    fallbackText: 'WMW\nINDUSTRIES LTD',
    tagline: 'WMW INDUSTRIES LTD',
    taglineSub: 'A BVK Group Company\nWeaving Technical Mesh Solutions',
  },
  internalCodeHeader: 'WMW (I) INTERNAL PRODUCT CODE',
  header: {
    docNo: 'SALES-ODS-F-001',
    docRev: '0',
    pageNo: '2 of 2',
    issueNo: '2',
    issueDate: '01.09.2019',
    odsNo: '44-26',
    odsDate: '30.05.26',
    clientName: 'ARGO-HYTOS PVT. LTD',
  },
  invoice: {
    address:
      'ARGO-HYTOS PVT. LTD\nSF.No. 82B/2B, 85/2, Sandegoundanpalayam,\nKovilpalayam Post, Pollachi Taluk,\nCoimbatore Dist - 642 110, Tamil Nadu, India.',
    cell: '+91 70944 41135',
    contact: 'Mr. K. Sedhupathi',
  },
  delivery: {
    address:
      'ARGO-HYTOS PVT. LTD\nSF.No. 82B/2B, 85/2, Sandegoundanpalayam,\nKovilpalayam Post, Pollachi Taluk,\nCoimbatore Dist - 642 110, Tamil Nadu, India.',
    cell: '+91 70944 41135',
    contact: 'Mr. K. Sedhupathi',
  },
  orderDetails: {
    clientPoNo: '4500044351',
    poDate: '19.05.26',
    qctNo: 'Q 17 Mesh - QH Sheet Dated 10/01/2023',
    qctExtraCell: 'BU-1',
  },
  lines: [
    { internalCode, application, description, position: '00010', sapNo: '44817200', deliveryRequest: '10.06.26', length: '2016.13', width: '0.2480', totalSqm: '500', qtyPcsKg: '0.00', priceUnit: '0.00', totalValue: '0.000' },
    { internalCode, application, description, position: '00020', sapNo: '44849100', deliveryRequest: '30.06.26', length: '1851.85', width: '0.1620', totalSqm: '300', qtyPcsKg: '0.00', priceUnit: '0.00', totalValue: '0.000' },
    { internalCode, application, description, position: '00030', sapNo: '45465000', deliveryRequest: '10.07.26', length: '1340.58', width: '0.1380', totalSqm: '185', qtyPcsKg: '0.00', priceUnit: '0.00', totalValue: '0.000' },
    { internalCode, application, description, position: '00040', sapNo: '45465600', deliveryRequest: '15.06.26', length: '3626.94', width: '0.1930', totalSqm: '700', qtyPcsKg: '0.00', priceUnit: '0.00', totalValue: '0.000' },
    { internalCode, application, description, position: '00050', sapNo: '45465700', deliveryRequest: '15.06.26', length: '3712.87', width: '0.2020', totalSqm: '750', qtyPcsKg: '0.00', priceUnit: '0.00', totalValue: '0.000' },
    { internalCode, application, description, position: '00060', sapNo: '45466000', deliveryRequest: '01.06.26', length: '234.19', width: '0.2135', totalSqm: '50', qtyPcsKg: '0.00', priceUnit: '0.00', totalValue: '0.000' },
    { internalCode, application, description, position: '00070', sapNo: '45466100', deliveryRequest: '01.06.26', length: '11061.95', width: '0.2260', totalSqm: '2500', qtyPcsKg: '0.00', priceUnit: '0.00', totalValue: '0.000' },
    { internalCode, application, description, position: '00080', sapNo: '45466700', deliveryRequest: '01.06.26', length: '1936.03', width: '0.2970', totalSqm: '575', qtyPcsKg: '0.00', priceUnit: '0.00', totalValue: '0.000' },
    { internalCode, application, description, position: '00090', sapNo: '45466800', deliveryRequest: '01.07.26', length: '308.64', width: '0.3240', totalSqm: '100', qtyPcsKg: '0.00', priceUnit: '0.00', totalValue: '0.000' },
    { internalCode, application, description, position: '00100', sapNo: '45466900', deliveryRequest: '01.06.26', length: '764.53', width: '0.3270', totalSqm: '250', qtyPcsKg: '0.00', priceUnit: '0.00', totalValue: '0.000' },
    { internalCode, application, description, position: '00110', sapNo: '45467300', deliveryRequest: '20.06.26', length: '491.40', width: '0.4070', totalSqm: '200', qtyPcsKg: '0.00', priceUnit: '0.00', totalValue: '0.000' },
    { internalCode, application, description, position: '00120', sapNo: '46031400', deliveryRequest: '01.07.26', length: '1250.00', width: '0.1600', totalSqm: '200', qtyPcsKg: '0.00', priceUnit: '0.00', totalValue: '0.000' },
    { internalCode, application, description, position: '00130', sapNo: '44817200', deliveryRequest: '01.07.26', length: '5645.16', width: '0.2480', totalSqm: '1400', qtyPcsKg: '0.00', priceUnit: '0.00', totalValue: '0.000' },
  ],
  gstLabel: 'GST 18%',
  gstAmount: '',
  totalValue: '',
  hideProductFooter: true,
  productHeaders: {
    price: 'PRICE / UNIT',
  },
  terms: {
    destination: 'POLLACHI TALUK , COIMBATORE',
    packingType:
      'PACKED IN WOODEN BOX/CARD BOARD (Polythene or plastic cover used for packing should be as per latest government order. ARGO HYTOS insists the supplier to meet the specification as per the latest government norms . Hazardous waste disposal shall through PCB authorized recyclers. Supplier shall establish und implement ISO 14001',
    documentsRequired: 'TEST CERTIFICATE',
    freight: 'PAID',
    directTruckSmall: 'SMALL',
  },
  termsOrder: [
    { label: 'DESTINATION', key: 'destination' },
    { label: 'PACKING TYPE', key: 'packingType' },
    { label: 'DOCUMENTS REQUIRED', key: 'documentsRequired' },
    { label: 'FREIGHT : TO PAY / PAID', key: 'freight' },
    { label: 'DIRECT TRUCK / SMALL', key: 'directTruckSmall' },
  ],
  remarks:
    "It is necessary to display the customer's SAP number and order number & poision No.on the invoice ,Packing Note & Coil,Pls also mention width in Invoice.\nPlease ensure that for small Qty Joint Invoice value should not be more than 2 Lakhs.\n\nPls stick these details' part inside cone area and outer area as label format\n1.Part number – 8 Digit number.\n2.Part name – To mention that name in should have as per drawing.\n3.Batch number – when that material was manufactured (traceability).\n4.Material size – As per drawing size.\n5.Weight – That one coil weight in Kg.\n6.PO number – That one batch PO number.\n7.Material Grade – As per drawing grade.",
  signerName: '',
}
