import express from 'express'
import { registerValidator, loginValidator, socialLoginValidator, forgotPasswordValidator,resetPasswordValidator} from '../validators/auth.validator.js'
import {validate} from '../middleware/validate.js'
import { register, login, googleLogin, microsoftLogin, refreshToken, forgotPassword, resetPassword } from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/register',registerValidator,validate,register)
router.post('/login',loginValidator,validate,login)
router.post('/google-login', socialLoginValidator, validate, googleLogin)
router.post('/microsoft-login', socialLoginValidator, validate, microsoftLogin)
router.post('/refresh-token', refreshToken)
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword)
router.post('/reset-password', resetPasswordValidator, validate, resetPassword)

export default router
