/**
 * Purely visual navigation configuration for job tabs.
 */

import { z } from 'zod'

export const JobTabsSchema = z.enum([
  'estimate',
  'quote',
  'actual',
  'financial',
  'costAnalysis',
  // prob. a few more tabs, keeping it simple for now because that's not the scope of this task AND this needs alignment
])

export type JobTabKey = z.infer<typeof JobTabsSchema>
