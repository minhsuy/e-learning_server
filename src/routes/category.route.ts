import express, { Request, Response } from 'express'
import { getCategoriesController, getCategoryDetailController } from '~/controller/category.controller'
import { getCategoryDetailValidator, listCategoriesValidator } from '~/middlewares/category.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { isAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const categoryRouter = express.Router()

// get list category

// Get list categories (public)
categoryRouter.get('/', listCategoriesValidator, handleValidationErrors, getCategoriesController)

// Get category detail by slug (public)
categoryRouter.get('/:slug', getCategoryDetailValidator, handleValidationErrors, getCategoryDetailController)
export default categoryRouter
