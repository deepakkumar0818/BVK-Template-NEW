import type { TemplateType } from './types'

/** Test templates from the home page — each has `/[path]/[id]` for deep links. */
export const TEST_TEMPLATE_ROUTES: readonly {
  templateType: TemplateType
  path: string
  label: string
}[] = [
  { templateType: 'WI', path: 'wmwd1', label: 'WMWD1' },
  { templateType: 'WMW', path: 'wmw', label: 'WMW' },
  { templateType: 'WMW2', path: 'wmw2', label: 'WMW2' },
  { templateType: 'EXPORT', path: 'export', label: 'EXPORT' },
  { templateType: 'WMWE1', path: 'wmwe1', label: 'WMWE1' },
  { templateType: 'SLS', path: 'sls', label: 'SLS' },
  { templateType: 'GKD', path: 'gkd', label: 'GKD' },
  { templateType: 'BVK', path: 'bvk', label: 'BVK' },
] as const
