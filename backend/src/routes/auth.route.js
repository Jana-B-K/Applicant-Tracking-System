import express from 'express'
import { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator, verifyResetTokenValidator } from '../validators/auth.validator.js'
import {validate} from '../middleware/validate.js'
import {allowSuperadminOrBootstrap, protect} from '../middleware/auth.middleware.js'
import { register, login, refreshToken, forgotPassword, resetPassword, verifyResetToken, me } from '../controllers/auth.controller.js'
import { updateProfile } from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/register', allowSuperadminOrBootstrap, registerValidator, validate, register)
router.post('/login',loginValidator,validate,login)
router.post('/refresh-token', refreshToken)
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword)
router.post('/verify-reset-token', verifyResetTokenValidator, validate, verifyResetToken)
router.post('/reset-password', resetPasswordValidator, validate, resetPassword)
router.get('/me', protect, me)
router.put('/update',protect,updateProfile)
export default router
