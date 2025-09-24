import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req).formatWith(({ msg }) => msg)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.mapped() })
    return
  }
  next()
}
