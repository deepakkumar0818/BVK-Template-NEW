import ForcedTemplatePageContent from '@/app/components/ForcedTemplatePageContent'

/** Same layout as `/wmw/[id]`; master header title shows “QUOTATION” instead of “PERFORMA INVOICE”. */
export default function QuotationWmwReplicaPage() {
  return (
    <ForcedTemplatePageContent
      templateType="WMW"
      documentLabel="Quotation"
      wmwd1DocumentTitle="QUOTATION"
      wmwd1NotesRemarksFromApi
      useWmwPagination
    />
  )
}
