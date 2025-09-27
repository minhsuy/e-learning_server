import express, { Request, Response } from 'express'
import { getCategoriesController, getCategoryDetailController } from '~/controller/category.controller'
import { getCategoryDetailValidator, listCategoriesValidator } from '~/middlewares/category.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { isAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const categoryRouter = express.Router()

// Get list categories (public) GET /api/categories
categoryRouter.get('/', listCategoriesValidator, handleValidationErrors, getCategoriesController)

// Get category detail by slug (public) GET /api/categories/:slug
categoryRouter.get('/:slug', getCategoryDetailValidator, handleValidationErrors, getCategoryDetailController)
export default categoryRouter
