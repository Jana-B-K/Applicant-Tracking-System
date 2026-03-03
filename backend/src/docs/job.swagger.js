/**
 * @swagger
 * components:
 *   schemas:
 *     JobInput:
 *       type: object
 *       required:
 *         - jobTitle
 *         - department
 *         - description
 *         - skillsRequired
 *         - location
 *         - salaryRange
 *         - emplyementType
 *         - experienceLevel
 *         - hiringManager
 *         - numberOfOpenings
 *         - targetClosureDate
 *       properties:
 *         jobTitle:
 *           type: string
 *           example: Backend Developer
 *         description:
 *           type: string
 *           example: Responsible for developing and maintaining server-side logic, APIs, and databases.
 *         skillsRequired:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Node.js", "Express", "MongoDB"]
 *         department:
 *           type: string
 *           example: Engineering
 *         location:
 *           type: string
 *           example: Bengaluru
 *         salaryRange:
 *           type: string
 *           example: 10-15 LPA
 *         emplyementType:
 *           type: string
 *           example: Full-time
 *         experienceLevel:
 *           type: string
 *           example: Mid-level
 *         hiringManager:
 *           type: string
 *           example: John Doe
 *         numberOfOpenings:
 *           type: number
 *           example: 3
 *         targetClosureDate:
 *           type: string
 *           format: date-time
 *           example: 2026-04-15T00:00:00.000Z
 *         jobStatus:
 *           type: string
 *           enum: [Open, Closed, On Hold, Cancelled, Filled]
 *           default: Open
 *           example: Open
 *         isDeleted:
 *           type: boolean
 *           default: false
 *           example: false
 *     Job:
 *       allOf:
 *         - $ref: '#/components/schemas/JobInput'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 65f1c7ea7d85a8f7a70b6abc
 *     UpdateJobStatusInput:
 *       type: object
 *       required:
 *         - jobStatus
 *       properties:
 *         jobStatus:
 *           type: string
 *           enum: [Open, Closed, On Hold, Cancelled, Filled]
 *           example: Closed
 *     JobAging:
 *       type: object
 *       properties:
 *         jobId:
 *           type: string
 *           example: 65f1c7ea7d85a8f7a70b6abc
 *         jobTitle:
 *           type: string
 *           example: Backend Developer
 *         createdDate:
 *           type: string
 *           format: date-time
 *           example: 2026-02-01T10:15:00.000Z
 *         aging:
 *           type: number
 *           example: 14
 *     JobCounts:
 *       type: object
 *       properties:
 *         totalJobs:
 *           type: number
 *           example: 50
 *         openJobs:
 *           type: number
 *           example: 20
 *         closedJobs:
 *           type: number
 *           example: 12
 *         onHoldJobs:
 *           type: number
 *           example: 5
 *         cancelledJobs:
 *           type: number
 *           example: 4
 *         filledJobs:
 *           type: number
 *           example: 9
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Job not found
 */

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobInput'
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Get all jobs
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Job'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     summary: Update job details
 *     tags: [Jobs]
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
 *             $ref: '#/components/schemas/JobInput'
 *     responses:
 *       200:
 *         description: Job updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Soft delete a job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job marked as deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /jobs/{id}/status:
 *   put:
 *     summary: Update only job status
 *     tags: [Jobs]
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
 *             $ref: '#/components/schemas/UpdateJobStatusInput'
 *     responses:
 *       200:
 *         description: Job status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /jobs/aging:
 *   get:
 *     summary: Get aging in days (current date - created date) for all non-deleted jobs
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Job aging data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/JobAging'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /jobs/counts:
 *   get:
 *     summary: Get counts by job status
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Aggregated job counts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobCounts'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
