import type { ZohoQuotation } from './types'

/**
 * Logs the raw Zoho quotation record for the id used in the current request (browser devtools).
 * Pass a short `context` (route or template name) so you can tell which page produced the log.
 */
export function logQuotationPayloadForUrlId(
  id: string,
  quotation: ZohoQuotation,
  context?: string
): void {
  const label = context
    ? `[Zoho quotation · id=${id} · ${context}]`
    : `[Zoho quotation · id=${id}]`
  // eslint-disable-next-line no-console -- intentional debug output for any template route
  console.log(label, quotation)
}
