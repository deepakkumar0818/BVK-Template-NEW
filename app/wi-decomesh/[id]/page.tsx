import ForcedTemplatePageContent from '@/app/components/ForcedTemplatePageContent'

/**
 * WI Decomesh — dedicated route.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  DEVELOPER ISOLATION NOTE
 * ─────────────────────────────────────────────────────────────────────────
 * URL: /wi-decomesh/<record-id>
 *
 * This route is intentionally kept as a thin wrapper. All template-specific
 * work happens in:
 *   • app/components/WIDecomeshQuotationContent.tsx
 *   • lib/wi-decomesh-line-display.ts
 *   • the `.wi-decomesh-*` CSS block in app/globals.css
 * Nothing else in the codebase imports from those files (except the single
 * additive branch in QuotationTemplateByType.tsx), so a developer can
 * iterate freely without disturbing any other quotation template.
 */
export default function WiDecomeshQuotationPage() {
  return (
    <ForcedTemplatePageContent
      templateType="WI_DECOMESH"
      documentLabel="WI Decomesh quotation"
    />
  )
}
