/**
 * @swagger
 * tags:
 *   - name: Password
 *     description: Password reset APIs
 *
 * components:
 *   schemas:
 *     ForgotPasswordInput:
 *       type: object
 *       required: [email]
 *       properties:
 *         email: { type: string, format: email, example: john@example.com }
 *     VerifyResetTokenInput:
 *       type: object
 *       required: [email]
 *       properties:
 *         email: { type: string, format: email, example: john@example.com }
 *         token: { type: string, example: "123456" }
 *         otp: { type: string, example: "123456" }
 *     ResetPasswordInput:
 *       type: object
 *       required: [email, newPassword]
 *       properties:
 *         email: { type: string, format: email, example: john@example.com }
 *         token: { type: string, example: "123456" }
 *         otp: { type: string, example: "123456" }
 *         newPassword: { type: string, example: NewPassw0rd! }
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Password]
 *     summary: Send password reset OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordInput'
 *     responses:
 *       200: { description: OTP sent }
 *       400: { description: Validation error }
 */

/**
 * @swagger
 * /auth/verify-reset-token:
 *   post:
 *     tags: [Password]
 *     summary: Verify password reset OTP/token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyResetTokenInput'
 *     responses:
 *       200: { description: Token verified }
 *       400: { description: Invalid token/OTP }
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Password]
 *     summary: Reset password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordInput'
 *     responses:
 *       200: { description: Password reset successful }
 *       400: { description: Invalid request }
 */
