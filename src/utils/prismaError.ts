import { Prisma } from '@prisma/client'

export interface MappedDatabaseError {
  statusCode: number
  message: string
  errorCode?: string
  field?: string
}

/**
 * Maps Prisma exceptions to client-friendly HTTP status codes and error messages
 * without exposing internal database structure or credentials.
 */
export function mapPrismaError(error: unknown): MappedDatabaseError | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[]) || []
        const fieldList = Array.isArray(target) ? target.join(', ') : 'field'
        return {
          statusCode: 409,
          errorCode: 'P2002_UNIQUE_VIOLATION',
          message: `Duplicate record: A record with this ${fieldList} already exists`,
          field: Array.isArray(target) && target.length > 0 ? target[0] : undefined
        }
      }
      case 'P2003': {
        const fieldName = (error.meta?.field_name as string) || 'foreign key'
        return {
          statusCode: 400,
          errorCode: 'P2003_FOREIGN_KEY_VIOLATION',
          message: `Invalid reference: Referenced entity for ${fieldName} does not exist`
        }
      }
      case 'P2025': {
        const cause = (error.meta?.cause as string) || 'Record not found'
        return {
          statusCode: 404,
          errorCode: 'P2025_RECORD_NOT_FOUND',
          message: cause
        }
      }
      case 'P2000': {
        return {
          statusCode: 400,
          errorCode: 'P2000_VALUE_TOO_LONG',
          message: 'The provided value exceeds the maximum allowable length for this field'
        }
      }
      case 'P2006': {
        return {
          statusCode: 400,
          errorCode: 'P2006_INVALID_FIELD_VALUE',
          message: 'The provided value is invalid for the field type'
        }
      }
      default: {
        return {
          statusCode: 500,
          errorCode: error.code,
          message: `Database error occurred (${error.code})`
        }
      }
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      statusCode: 400,
      errorCode: 'PRISMA_VALIDATION_ERROR',
      message: 'Invalid data format provided to database query'
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      statusCode: 503,
      errorCode: 'DATABASE_CONNECTION_ERROR',
      message: 'Database service is currently unreachable'
    }
  }

  return null
}
