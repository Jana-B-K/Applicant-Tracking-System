/**
 * @swagger
 * tags:
 *   - name: RBAC
 *     description: Role-based access control policy APIs
 *
 * components:
 *   schemas:
 *     RbacPermissionsPatch:
 *       type: object
 *       properties:
 *         permissions:
 *           type: object
 *           additionalProperties:
 *             type: object
 *             additionalProperties:
 *               type: boolean
 *           example:
 *             viewJobs:
 *               hrrecruiter: true
 *               hiringmanager: false
 */

/**
 * @swagger
 * /rbac/policy:
 *   get:
 *     tags: [RBAC]
 *     summary: Get RBAC permission matrix
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: RBAC policy }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (missing manageUsers permission) }
 *   put:
 *     tags: [RBAC]
 *     summary: Update RBAC permission matrix (partial updates supported)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RbacPermissionsPatch'
 *     responses:
 *       200: { description: Policy updated }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (missing manageUsers permission) }
 */

/**
 * @swagger
 * /rbac/policy/reset:
 *   post:
 *     tags: [RBAC]
 *     summary: Reset RBAC policy to defaults
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Policy reset }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (missing manageUsers permission) }
 */
