import express from 'express'
import { registerValidator, loginValidator, forgotPasswordValidator,resetPasswordValidator} from '../validators/auth.validator.js'
import {validate} from '../middleware/validate.js'
import {protect} from '../middleware/auth.middleware.js'
import { register, login, refreshToken, forgotPassword, resetPassword, me } from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/register',registerValidator,validate,register)
router.post('/login',loginValidator,validate,login)
router.post('/refresh-token', refreshToken)
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword)
router.post('/reset-password', resetPasswordValidator, validate, resetPassword)
router.get('/me', protect, me)

export default router
