/**
 * @swagger
 * tags:
 *   - name: WeeklyReport
 *     description: Weekly report APIs
 */

/**
 * @swagger
 * /weekly-report/last-report-date:
 *   get:
 *     tags: [WeeklyReport]
 *     summary: Get last successful weekly report date
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Last report details }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (missing viewDashboard permission) }
 */

/**
 * @swagger
 * /weekly-report/send-now:
 *   post:
 *     tags: [WeeklyReport]
 *     summary: Manually trigger weekly report email
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Weekly report sent successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (superadmin only) }
 *       400: { description: Missing weekly report config }
 */
