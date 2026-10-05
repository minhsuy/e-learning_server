import { param, CustomValidator } from 'express-validator'

/**
 * Standard UUID regex matching RFC 4122 (supports v1, v3, v4, and v5 UUIDs).
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Validates if a given value is a syntactically valid UUID string.
 */
export function isValidUUID(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return UUID_REGEX.test(value.trim())
}

/**
 * Normalizes a UUID string by trimming whitespace and converting to lowercase.
 * Throws a formatted error if the input is not a valid UUID.
 */
export function normalizeUUID(value: unknown, fieldName = 'ID'): string {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid ${fieldName}: must be a valid UUID string`)
  }
  return (value as string).trim().toLowerCase()
}

/**
 * Express-validator custom validator function for UUID parameters.
 * Replaces legacy `mongoose.Types.ObjectId.isValid` across middlewares.
 */
export const validateUUIDParam: CustomValidator = (value, { req }) => {
  if (!isValidUUID(value)) {
    throw new Error('ID must be a valid UUID')
  }
  return true
}

/**
 * Creates an express-validator middleware chain for validating a route param as UUID.
 */
export function validateRouteUUIDParam(paramName = 'id') {
  return param(paramName)
    .notEmpty()
    .withMessage(`${paramName} is required`)
    .custom(validateUUIDParam)
}

/**
 * Decorates an entity or array of entities with an `_id` alias matching `id`.
 * This guarantees seamless backward compatibility with the Next.js frontend
 * without requiring any frontend code changes.
 */
export function withCompatId<T extends { id: string }>(entity: T): T & { _id: string }
export function withCompatId<T extends { id: string }>(entity: T[]): Array<T & { _id: string }>
export function withCompatId<T extends { id: string }>(entity: null | undefined): null
export function withCompatId<T extends { id: string }>(
  entity: T | T[] | null | undefined
): (T & { _id: string }) | Array<T & { _id: string }> | null {
  if (!entity) return null
  if (Array.isArray(entity)) {
    return entity.map((item) => ({ ...item, _id: item.id }))
  }
  return { ...entity, _id: entity.id }
}
