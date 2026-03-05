/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Dashboard analytics APIs
 */

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Summary metrics }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (missing viewDashboard permission) }
 */

/**
 * @swagger
 * /dashboard/funnel:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get hiring funnel data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Funnel metrics }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (missing viewDashboard permission) }
 */

/**
 * @swagger
 * /dashboard/weekly-stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get weekly hiring stats
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weeks
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 52
 *         description: Number of weeks to include
 *     responses:
 *       200: { description: Weekly metrics }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (missing viewDashboard permission) }
 */

/**
 * @swagger
 * /dashboard/alerts:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get hiring alerts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: endInDays
 *         schema:
 *           type: integer
 *       - in: query
 *         name: transitionDays
 *         schema:
 *           type: integer
 *       - in: query
 *         name: transitionLimit
 *         schema:
 *           type: integer
 *     responses:
 *       200: { description: Alert list }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (missing viewDashboard permission) }
 */
