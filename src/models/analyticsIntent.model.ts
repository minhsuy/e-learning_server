import { z } from 'zod'

/**
 * TMDEMY — GEMINI ANALYTICS INTENT APPLICATION MODELS (TG-04A)
 *
 * Defines Zod schemas and TypeScript types for:
 * - Analytics intent recognition types
 * - Supported date periods (aligned with TG-03A)
 * - Raw Gemini structured output validation
 * - Validated classification results and error handling
 */

/**
 * Canonical Analytics Intent Types:
 * - revenue: Sales, net/gross earnings, discounts, top earners
 * - orders: Order counts, completed/pending/rejected breakdown, conversion rate
 * - students: Learner enrollments, active/completed status, new vs unique students
 * - courses: Catalog breakdown, course status, best-sellers, zero-sales courses
 * - report: Executive dashboard summary (all-time, today, weekly, monthly KPIs)
 * - unsupported: Off-topic, greetings, code generation, administrative attacks, prompt injections
 */
export const AnalyticsIntentTypeSchema = z.enum([
  'revenue',
  'orders',
  'students',
  'courses',
  'report',
  'unsupported'
])
export type AnalyticsIntentType = z.infer<typeof AnalyticsIntentTypeSchema>

/**
 * Canonical Analytics Operations (TG-04C):
 * - lookup: Standard metrics query (default)
 * - compare: Time-period comparison (e.g., this month vs last month)
 * - insight: Deep business analysis and qualitative evaluation
 * - recommendation: Grounded suggestions and performance improvement advice
 */
export const AnalyticsOperationSchema = z.enum([
  'lookup',
  'compare',
  'insight',
  'recommendation'
])
export type AnalyticsOperation = z.infer<typeof AnalyticsOperationSchema>

/**
 * Supported comparison metric targets
 */
export const ComparisonMetricSchema = z.enum(['revenue', 'orders', 'students'])
export type ComparisonMetric = z.infer<typeof ComparisonMetricSchema>

/**
 * Supported course-specific metric targets (TG-04D)
 */
export const CourseMetricSchema = z.enum(['revenue', 'sales', 'students', 'performance'])
export type CourseMetric = z.infer<typeof CourseMetricSchema>

/**
 * Canonical Date Range Periods (reused from TG-03A vocabulary)
 */
export const AnalyticsPeriodSchema = z.enum([
  'today',
  'yesterday',
  'this_week',
  'last_7_days',
  'this_month',
  'last_month',
  'all_time',
  'custom'
])
export type AnalyticsPeriod = z.infer<typeof AnalyticsPeriodSchema>

/**
 * Raw structured output schema expected from Google Gemini model.
 */
export const RawGeminiIntentOutputSchema = z
  .object({
    intent: AnalyticsIntentTypeSchema,
    operation: AnalyticsOperationSchema.optional().default('lookup'),
    period: AnalyticsPeriodSchema.nullable(),
    comparisonPeriod: AnalyticsPeriodSchema.nullable().optional(),
    comparisonMetric: ComparisonMetricSchema.nullable().optional(),
    courseName: z.string().nullable().optional(),
    metric: CourseMetricSchema.nullable().optional(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    confidence: z.number().min(0).max(1),
    explanation: z.string().optional(),
    isMultiIntent: z.boolean().optional()
  })
  .strict()

export type RawGeminiIntentOutput = z.infer<typeof RawGeminiIntentOutputSchema>

/**
 * Result status for the intent classification lifecycle.
 */
export type IntentClassificationStatus =
  | 'RECOGNIZED' // High confidence, valid intent and parameters
  | 'UNSUPPORTED' // Off-topic, prompt injection, or unsupported request
  | 'AMBIGUOUS' // Vague query, low confidence, or multi-intent needing clarification
  | 'ERROR' // Upstream Gemini failure, timeout, or JSON parse error

/**
 * Strongly-typed Intent Recognition Result returned to callers.
 */
export interface AnalyticsIntentResult {
  status: IntentClassificationStatus
  intent: AnalyticsIntentType
  operation?: AnalyticsOperation
  period: AnalyticsPeriod | null
  comparisonPeriod?: AnalyticsPeriod | null
  comparisonMetric?: ComparisonMetric | null
  courseName?: string | null
  metric?: CourseMetric | null
  startDate: string | null
  endDate: string | null
  confidence: number
  rawMessage: string
  explanation?: string
  clarificationPrompt?: string
  errorMessage?: string
  modelUsed?: string
}

