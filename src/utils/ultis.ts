import crypto from 'crypto'
import slugify from 'slugify'
export const hashToken = (raw: string) => crypto.createHash('sha256').update(raw).digest('hex')

export const toBaseSlug = (text: string) => slugify(text, { lower: true, strict: true }).trim()
