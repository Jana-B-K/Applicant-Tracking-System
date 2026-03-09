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
 *       200:
 *         description: Last report details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     lastReportDate:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     lastReport:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         reportDate: { type: string, format: date-time }
 *                         triggeredBy: { type: string, enum: [cron, manual] }
 *                         triggeredByUser: { type: string, nullable: true }
 *                         recipientEmails:
 *                           type: array
 *                           items: { type: string, format: email }
 *                         totalJobs: { type: integer, example: 12 }
 *                         fileName: { type: string, example: weekly-report-2026-03-09.pdf }
 *                         format: { type: string, enum: [xlsx, pdf] }
 *                         status: { type: string, enum: [success] }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (missing viewDashboard permission) }
 */

/**
 * @swagger
 * /weekly-report/history:
 *   get:
 *     tags: [WeeklyReport]
 *     summary: Get historical weekly report logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *         description: Filter reportDate from this date.
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *         description: Filter reportDate up to this date.
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [xlsx, pdf] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [success, failed] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 200, default: 50 }
 *     responses:
 *       200:
 *         description: Historical weekly report logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total: { type: integer, example: 15 }
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           reportDate: { type: string, format: date-time }
 *                           triggeredBy: { type: string, enum: [cron, manual] }
 *                           triggeredByUser: { type: string, nullable: true }
 *                           recipientEmails:
 *                             type: array
 *                             items: { type: string, format: email }
 *                           totalJobs: { type: integer, example: 12 }
 *                           fileName: { type: string, example: weekly-report-2026-03-09.xlsx }
 *                           format: { type: string, enum: [xlsx, pdf] }
 *                           status: { type: string, enum: [success, failed] }
 *                           errorMessage: { type: string, nullable: true }
 *                           filters: { type: object, additionalProperties: true }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (missing viewDashboard permission) }
 */

/**
 * @swagger
 * /weekly-report/send-now/excel:
 *   post:
 *     tags: [WeeklyReport]
 *     summary: Manually trigger weekly report email in Excel format
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department: { type: string, example: Engineering }
 *               jobTitle: { type: string, example: Backend Developer }
 *               recruiter: { type: string, example: recruiter@ats.local }
 *               location: { type: string, example: Chennai }
 *               dateFrom: { type: string, format: date, example: 2026-03-01 }
 *               dateTo: { type: string, format: date, example: 2026-03-31 }
 *     responses:
 *       200:
 *         description: Weekly Excel report sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Weekly Excel report sent successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     reportDate: { type: string, format: date-time }
 *                     totalJobs: { type: integer, example: 8 }
 *                     recipients:
 *                       type: array
 *                       items: { type: string, format: email }
 *                     fileName: { type: string, example: weekly-report-2026-03-09.xlsx }
 *                     format: { type: string, enum: [xlsx], example: xlsx }
 *                     filters:
 *                       type: object
 *                       additionalProperties: true
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (superadmin only) }
 *       400: { description: Missing weekly report config }
 */

/**
 * @swagger
 * /weekly-report/send-now/pdf:
 *   post:
 *     tags: [WeeklyReport]
 *     summary: Manually trigger weekly report email in PDF format
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department: { type: string, example: Engineering }
 *               jobTitle: { type: string, example: Backend Developer }
 *               recruiter: { type: string, example: recruiter@ats.local }
 *               location: { type: string, example: Chennai }
 *               dateFrom: { type: string, format: date, example: 2026-03-01 }
 *               dateTo: { type: string, format: date, example: 2026-03-31 }
 *     responses:
 *       200:
 *         description: Weekly PDF report sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Weekly PDF report sent successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     reportDate: { type: string, format: date-time }
 *                     totalJobs: { type: integer, example: 8 }
 *                     recipients:
 *                       type: array
 *                       items: { type: string, format: email }
 *                     fileName: { type: string, example: weekly-report-2026-03-09.pdf }
 *                     format: { type: string, enum: [pdf], example: pdf }
 *                     filters:
 *                       type: object
 *                       additionalProperties: true
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (superadmin only) }
 *       400: { description: Missing weekly report config }
 */
