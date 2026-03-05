/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and profile APIs
 *
 * components:
 *   schemas:
 *     RegisterInput:
 *       type: object
 *       required: [firstName, lastName, email, password, role]
 *       properties:
 *         firstName: { type: string, example: John }
 *         lastName: { type: string, example: Doe }
 *         email: { type: string, format: email, example: john@example.com }
 *         password: { type: string, example: Passw0rd! }
 *         role:
 *           type: string
 *           enum: [superadmin, hrrecruiter, hiringmanager, interviewpanel, management]
 *         permissions:
 *           type: object
 *           additionalProperties:
 *             type: boolean
 *     LoginInput:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email: { type: string, format: email, example: john@example.com }
 *         password: { type: string, example: Passw0rd! }
 *     UpdateProfileInput:
 *       type: object
 *       properties:
 *         firstName: { type: string, example: John }
 *         lastName: { type: string, example: Doe }
 *         email: { type: string, format: email, example: john@example.com }
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new user (superadmin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201: { description: User registered successfully }
 *       400: { description: Validation/User already exists }
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user and return access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using refresh token
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Access token refreshed }
 *       401: { description: Invalid refresh token }
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Current user info }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /auth/update:
 *   put:
 *     tags: [Auth]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileInput'
 *     responses:
 *       200: { description: Profile updated successfully }
 *       401: { description: Unauthorized }
 */
