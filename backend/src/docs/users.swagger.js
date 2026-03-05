/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User management APIs (admin)
 *
 * components:
 *   schemas:
 *     UserItem:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         firstName: { type: string }
 *         lastName: { type: string }
 *         email: { type: string, format: email }
 *         empId: { type: string }
 *         role:
 *           type: string
 *           enum: [superadmin, hrrecruiter, hiringmanager, interviewpanel, management]
 *         assignedPermissions:
 *           type: object
 *           additionalProperties:
 *             type: boolean
 *         permissions:
 *           type: object
 *           additionalProperties:
 *             type: boolean
 *         isActive: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateUserInput:
 *       type: object
 *       required: [firstName, lastName, email, password, role]
 *       properties:
 *         firstName: { type: string }
 *         lastName: { type: string }
 *         email: { type: string, format: email }
 *         password: { type: string, example: Passw0rd! }
 *         empId: { type: string }
 *         role:
 *           type: string
 *           enum: [superadmin, hrrecruiter, hiringmanager, interviewpanel, management]
 *         isActive: { type: boolean }
 *         permissions:
 *           type: object
 *           additionalProperties:
 *             type: boolean
 *     UpdateUserInput:
 *       type: object
 *       properties:
 *         firstName: { type: string }
 *         lastName: { type: string }
 *         email: { type: string, format: email }
 *         empId: { type: string }
 *         role:
 *           type: string
 *           enum: [superadmin, hrrecruiter, hiringmanager, interviewpanel, management]
 *         isActive: { type: boolean }
 *         permissions:
 *           type: object
 *           additionalProperties:
 *             type: boolean
 */

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create user (superadmin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       201: { description: User created }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (superadmin only) }
 *   get:
 *     tags: [Users]
 *     summary: Get users list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [superadmin, hrrecruiter, hiringmanager, interviewpanel, management]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200: { description: Users fetched }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (missing manageUsers permission) }
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200: { description: User fetched }
 *       404: { description: User not found }
 *   put:
 *     tags: [Users]
 *     summary: Update user by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *     responses:
 *       200: { description: User updated }
 *       400: { description: Validation error }
 *       404: { description: User not found }
 *   delete:
 *     tags: [Users]
 *     summary: Delete user by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200: { description: User deleted }
 *       404: { description: User not found }
 */
