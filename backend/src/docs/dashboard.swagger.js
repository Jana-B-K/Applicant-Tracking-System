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
 *     summary: Get hiring funnel data (based on candidate status)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Funnel metrics aggregated from Candidate.status }
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
 *     summary: Get segmented hiring alerts (closing jobs, job aging, stage transitions, completed interviews)
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
 *       - in: query
 *         name: agingDays
 *         schema:
 *           type: integer
 *         description: Minimum days since job creation to consider as job-aging alert
 *       - in: query
 *         name: interviewDoneDays
 *         schema:
 *           type: integer
 *         description: Lookback days for completed interview alerts
 *       - in: query
 *         name: interviewLimit
 *         schema:
 *           type: integer
 *         description: Maximum number of completed interview alerts to return
 *       - in: query
 *         name: newApplicantDays
 *         schema:
 *           type: integer
 *         description: Lookback days for new applicant notifications
 *     responses:
 *       200:
 *         description: Segmented alert payload with summaryCounts, segments and UI-ready grouped alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     filters:
 *                       type: object
 *                       properties:
 *                         endInDays: { type: integer }
 *                         transitionDays: { type: integer }
 *                         transitionLimit: { type: integer }
 *                         agingDays: { type: integer }
 *                         interviewDoneDays: { type: integer }
 *                         interviewLimit: { type: integer }
 *                     summaryCounts:
 *                       type: object
 *                       properties:
 *                         jobsClosingSoon: { type: integer }
 *                         jobAging: { type: integer }
 *                         candidateStageTransitions: { type: integer }
 *                         interviewsCompleted: { type: integer }
 *                     segments:
 *                       type: object
 *                       properties:
 *                         jobsClosingSoon:
 *                           type: array
 *                           items:
 *                             type: object
 *                         jobAging:
 *                           type: array
 *                           items:
 *                             type: object
 *                         candidateStageTransitions:
 *                           type: array
 *                           items:
 *                             type: object
 *                         interviewsCompleted:
 *                           type: array
 *                           items:
 *                             type: object
 *                     uiAlerts:
 *                       type: object
 *                       properties:
 *                         importantAndPriority:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id: { type: string }
 *                               section: { type: string, example: important }
 *                               severity: { type: string, example: high }
 *                               category: { type: string, example: JOBS }
 *                               title: { type: string, example: Job Posting Expiring }
 *                               message: { type: string }
 *                               timestamp: { type: string, format: date-time }
 *                               timeAgo: { type: string, example: 2h ago }
 *                               meta: { type: object }
 *                         generalNotifications:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id: { type: string }
 *                               section: { type: string, example: general }
 *                               severity: { type: string, example: low }
 *                               category: { type: string, example: CANDIDATES }
 *                               title: { type: string, example: Interview Completed }
 *                               message: { type: string }
 *                               timestamp: { type: string, format: date-time }
 *                               timeAgo: { type: string, example: 15m ago }
 *                               meta: { type: object }
 *                     uiSummary:
 *                       type: object
 *                       properties:
 *                         importantNewCount: { type: integer, example: 2 }
 *                         generalNewCount: { type: integer, example: 5 }
 *                         totalNewCount: { type: integer, example: 7 }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (missing viewDashboard permission) }
 */
