import ForcedTemplatePageContent from '@/app/components/ForcedTemplatePageContent'

/**
 * WI Process Febric — dedicated route.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  DEVELOPER ISOLATION NOTE
 * ─────────────────────────────────────────────────────────────────────────
 * URL: /wi-process-febric/<record-id>
 *
 * This route is intentionally kept as a thin wrapper. All template-specific
 * work happens in:
 *   • app/components/WIProcessFebricQuotationContent.tsx
 *   • lib/wi-process-febric-line-display.ts
 *   • the `.wi-process-febric-*` CSS block in app/globals.css
 * Nothing else in the codebase imports from those files (except the single
 * additive branch in QuotationTemplateByType.tsx), so a second developer
 * can iterate freely without disturbing SLS/BVK/GKD/WMW templates.
 */
export default function WiProcessFebricQuotationPage() {
  return (
    <ForcedTemplatePageContent
      templateType="WI_PROCESS_FEBRIC"
      documentLabel="WI Process Febric quotation"
    />
  )
}
