/**
 * TypeScript interfaces for Zoho Creator API responses
 */

export interface ZohoLineItem {
  ID: string
  Line_Item_ref?: string
  last_item_ref?: string
  Blend_Category?: string
  End_Type?: string
  Material_Code?: string
  Material?: string
  /** WMW 3.0 linked row (Seamp / export layouts) */
  delivery?: string
  Delivery?: string
  Discount?: string
  Discount1?: string
  UOM_Billing?: string
  Invoice_Dimension_Type?: string
  Selling_Price?: string
  Discount_Value?: string
  SQM?: string
  Invoice_Dimension_2?: string
  Invoice_Dimension_1?: string
  Qty?: string
  Total_Sale_Value?: string
  Gross_Amount?: string
  Total_Cost?: string
  Net_Selling_Amount?: string
  Conversion_per_SQM?: string
  Last_item_ref?: string
  Target_Price_UOM?: string
  Current_Purchase_Price_UOM?: string
  List_Price?: string
  Total_SQM?: string
  Pieces?: string
  zc_display_value?: string
  [key: string]: any
}

export interface AccountModule {
  ID: string
  zc_display_value?: string
  CRM_Account_ID?: string
}

export interface ZohoQuotation {
  ID: string
  Name?: string
  Created_Date_and_time?: string
  Quotation_Status?: string
  Method_of_Payment?: string
  Invoice_Account?: string
  Mode_of_Delivery?: string
  Delivery_Date_Control?: string
  Delivery_Terms?: string
  Term_of_Payment?: string
  /** Bank / payment instructions shown under Terms of Payment when mapped in templates */
  Our_Bank_Details?: string
  Follow_up_Date?: string
  Due_Date?: string
  Sales_Required_Date?: string
  Customer_Required_Date?: string
  Customer_Reference_Date?: string
  customer_Reference?: string
  Customer_Zone?: string
  Currency?: string
  Remarks?: string
  Type_Of_Quotation?: string
  Template?: string
  /** Consignee GST from quotation record (Zoho Creator) */
  Shipping_GST_No?: string
  /** Recipient GST from quotation — also see Billing_GST_Number if your form uses that API name */
  Billing_GST_No?: string
  Billing_GST_Number?: string
  Account_Module?: AccountModule
  Category_1_MM_Database_WI_2_0?: ZohoLineItem[]
  /** Second line-items subform for Category 1 WI (merged with WI_2_0 for display) */
  Category_1_MM_Database_WI_3_0?: ZohoLineItem[]
  Category_1_MM_Database_WI?: Array<{
    ID: string
    Product_Group?: string
    Product_Name?: string
    Product_Code?: string
    Brand_Category?: string
    Supply_Form?: string
    Invoice_Form?: string
    Supply_Dimension_Type?: string
    Supply_Dimension_1?: string
    Supply_Dimension_2?: string
    Invoice_Dimension_Type?: string
    Invoice_Dimension_1?: string
    Invoice_Dimension_2?: string
    Conversion_Factor?: string
    Seam_Type?: string
    End_Type?: string
    Status?: string
    Product_Status?: string
    [key: string]: any
  }>
  Category_1_MM_Database_WMW_2_0?: ZohoLineItem[]
  /** Linked tax / HSN lines for Category 1 WMW (join on last_item_ref) */
  Category_1_MM_Database_WMW_3_0?: ZohoLineItem[]
  /** Per-line or global other charges (match Name; optional last_item_ref) */
  Category_1_MM_Database_WMW_Other_Charges?: Array<{
    ID?: string
    Name?: string
    Price?: string
    last_item_ref?: string
    Last_item_ref?: string
    zc_display_value?: string
    [key: string]: any
  }>
  /** Delivery schedule lines (join on last_item_ref) */
  Category_1_MM_Database_WMW_Desired_Date?: Array<{
    ID?: string
    Date_field?: string
    last_item_ref?: string
    No_of_Items?: string
    zc_display_value?: string
    [key: string]: any
  }>
  Category_1_MM_Database_WMW?: Array<{
    ID: string
    /** Preferred source for WMWD1 “Product” when set (over Product_Group) */
    Blend_Category?: string
    Product_Group?: string
    Product_Name?: string
    Product_Master?: string
    Product_Code?: string
    Brand_Category?: string
    Brand_Selling_Name?: string
    Supply_Form?: string
    Invoice_Form?: string
    Supply_Dimension_Type?: string
    Supply_Dimension_1?: string
    Supply_Dimension_2?: string
    Invoice_Dimension_Type?: string
    Invoice_Dimension_1?: string
    Invoice_Dimension_2?: string
    Conversion_Factor?: string
    Seam_Type?: string
    End_Type?: string
    Status?: string
    Product_Status?: string
    Length_field?: string
    Width?: string
    /** Shown as “AISI {code}” on Adhunik export quotation when set */
    Material_Code?: string
    Material?: string
    Pieces?: string
    Qty?: string
    SQM?: string
    Total_SQM?: string
    Total_Price?: string
    List_Price?: string
    last_item_ref?: string
    [key: string]: any
  }>
  Category_2_MM_Database_WMW_2_0?: ZohoLineItem[]
  /** Linked detail lines for Category 2 WMW (e.g. Blend_Category); join on last_item_ref when present */
  Category_2_MM_Database_WMW_3_0?: ZohoLineItem[]
  Category_2_MM_Database_WMW?: Array<{
    ID: string
    Blend_Category?: string
    Product_Group?: string
    Product_Name?: string
    Product_Master?: string
    Product_Code?: string
    Brand_Category?: string
    Brand_Selling_Name?: string
    Supply_Form?: string
    Invoice_Form?: string
    Supply_Dimension_Type?: string
    Supply_Dimension_1?: string
    Supply_Dimension_2?: string
    Invoice_Dimension_Type?: string
    Invoice_Dimension_1?: string
    Invoice_Dimension_2?: string
    Conversion_Factor?: string
    Conversion_per_SQM?: string
    Seam_Type?: string
    End_Type?: string
    Status?: string
    Product_Status?: string
    Length_field?: string
    Width?: string
    Pieces?: string
    Qty?: string
    SQM?: string
    Total_SQM?: string
    Total_Price?: string
    List_Price?: string
    Price_Master_Name?: string
    Machine_ID?: string
    Last_item_ref?: string
    last_item_ref?: string
    Line_Item_ref?: string
    UOM_Billing?: string
    [key: string]: any
  }>
  Category_2_MM_Database_WI_2_0?: ZohoLineItem[]
  /** Second line-items subform for Category 2 WI (merged with WI_2_0 for display) */
  Category_2_MM_Database_WI_3_0?: ZohoLineItem[]
  Category_2_MM_Database_WI?: Array<{
    ID: string
    Product_Group?: string
    Product_Name?: string
    Product_Code?: string
    Brand_Category?: string
    Supply_Form?: string
    Invoice_Form?: string
    Supply_Dimension_Type?: string
    Supply_Dimension_1?: string
    Supply_Dimension_2?: string
    Invoice_Dimension_Type?: string
    Invoice_Dimension_1?: string
    Invoice_Dimension_2?: string
    Conversion_Factor?: string
    Seam_Type?: string
    End_Type?: string
    Status?: string
    Product_Status?: string
    Line_Item_ref?: string
    Last_item_ref?: string
    last_item_ref?: string
    [key: string]: any
  }>
  /** Product fitments (legacy / alternate subform name) */
  Product_Fitments?: Array<Record<string, unknown>>
  /** Product fitments line items (2.0 subform) */
  Product_Fitments2_0?: Array<Record<string, unknown>>
  Total_Net_Sale_Value_Before_Tax?: string
  Total_CGST?: string
  Total_SGST?: string
  Total_Cost_Before_Tax?: string
  Total_IGST?: string
  Total_Tax_Amount_IGST_CGST?: string
  Total_Cost_After_Tax_Grand_Total?: string
  Overall_Grand_Total_incl_Accessories?: string
  Total_Freight_Charges?: string
  Total_Packing_Charges?: string
  Total_Seam_Charges?: string
  Other_Charges?: string
  Type_of_Other_Charges?: string
  /** Everite — multiline body under “Performance warranty” (Zoho API spelling) */
  Performance_Warrenty?: string
  /** Everite — multiline body under “Payment Schedule” */
  Payment_Schedule?: string
  /** Primary gross weight field (Zoho API name) */
  Gross_Weight?: string
  Total_Gross_Weight?: string
  Total_Net_Weight?: string
  Net_Weight_Per_Pcs?: string
  [key: string]: any
}

export type TemplateType = 'WI' | 'WMW' | 'WMW2' | 'EXPORT' | 'WMWE1' | 'SLS' | 'GKD' | 'BVK'

export interface ShippingMaster {
  ID: string
  [key: string]: any
}

export interface BillingMaster {
  ID: string
  [key: string]: any
}

export interface ShippingMasterResponse {
  code: number
  data?: ShippingMaster[]
  error?: string
}

export interface BillingMasterResponse {
  code: number
  data?: BillingMaster[]
  error?: string
}

export interface ZohoQuotationResponse {
  code: number
  data?: ZohoQuotation[]
  error?: string
}

/**
 * Transformed quotation data for display
 */
export interface QuotationData {
  quotationNumber: string
  date: string
  buyerEnquiryNo: string
  termsOfPayment: string
  incoTerms: string
  termsOfDelivery: string
  deliveryDate: string
  followUpDate: string
  dueDate: string
  customerReference: string
  customerReferenceDate: string
  currency: string
  remarks: string
  lineItems: QuotationLineItem[]
  totalAmount: number
}

export interface QuotationLineItem {
  product: string
  quality: string
  form: string
  size: string
  type: string
  /** Category_1_MM_Database_WMW_3_0 HSN_Code (WI / WMW join) */
  hsnCode?: string
  /** Optional; Seamp fallback from transformed data */
  delivery?: string
  /** BVK Hydrotech — mesh from Product_Code (e.g. N/Inch) */
  mesh?: string
  /** BVK — weave / seam from product subform */
  weave?: string
  uom: string
  qty: string
  subQty: string
  unit: string
  pieces?: string
  rate: string
  amount: string
}
