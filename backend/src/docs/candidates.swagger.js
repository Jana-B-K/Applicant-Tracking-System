/**
 * @swagger
 * tags:
 *   - name: Candidates
 *     description: Candidate management and interview workflow APIs
 *
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Candidate not found
 *
 *     CandidateInput:
 *       type: object
 *       required:
 *         - name
 *         - jobID
 *         - email
 *         - contactDetails
 *         - location
 *         - skills
 *         - experience
 *         - education
 *         - noticePeriod
 *       properties:
 *         name:
 *           type: string
 *           example: Jane Doe
 *         jobID:
 *           type: string
 *           example: 65f1c7ea7d85a8f7a70b6abc
 *         email:
 *           type: string
 *           format: email
 *           example: jane@example.com
 *         contactDetails:
 *           type: string
 *           example: +91-9876543210
 *         location:
 *           type: string
 *           example: Bengaluru
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Node.js", "MongoDB"]
 *         experience:
 *           type: number
 *           example: 3
 *         education:
 *           type: string
 *           example: B.Tech
 *         noticePeriod:
 *           type: number
 *           example: 30
 *         referal:
 *           type: string
 *           example: Employee referral
 *         role:
 *           type: string
 *           example: Backend Developer
 *         status:
 *           type: string
 *           enum: [Applied, Screened, Shortlisted, Technical Interview 1, Technical Interview 2, HR Round, HR Interview, Selected, Offered, Offer Accepted, Offer Declined, Offer Revoked, BGV, Cancelled, No Answer, Candidate Not Interested, Joined, Rejected Technical Interview 1, Rejected Technical Interview 2, Rejected, On Hold, Withdrawn]
 *           example: Applied
 *
 *     CandidateStatusHistoryItem:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [Applied, Screened, Shortlisted, Technical Interview 1, Technical Interview 2, HR Round, HR Interview, Selected, Offered, Offer Accepted, Offer Declined, Offer Revoked, BGV, Cancelled, No Answer, Candidate Not Interested, Joined, Rejected Technical Interview 1, Rejected Technical Interview 2, Rejected, On Hold, Withdrawn]
 *         comment:
 *           type: string
 *           example: Candidate requested 2 days to confirm availability.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         updatedBy:
 *           type: string
 *         updatedByName:
 *           type: string
 *         updatedByEmail:
 *           type: string
 *           format: email
 *         updatedByRole:
 *           type: string
 *
 *     CandidateInterview:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         stage:
 *           type: string
 *           enum: [Screening, Technical Interview 1, Technical Interview 2, Technical Interview 3, HR Interview, Managerial Round, Final Interview]
 *         interviewer:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             role:
 *               type: string
 *         coInterviewers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *         duration:
 *           type: number
 *           example: 60
 *         meetingLink:
 *           type: string
 *         location:
 *           type: string
 *         completedAt:
 *           type: string
 *           format: date-time
 *         actualDuration:
 *           type: number
 *         result:
 *           type: string
 *           enum: [Pending, Passed, Failed, On Hold, No Show, Rescheduled]
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         skillRatings:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               skill:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *         feedback:
 *           type: string
 *         strengths:
 *           type: string
 *         weaknesses:
 *           type: string
 *         additionalNotes:
 *           type: string
 *         createdBy:
 *           type: string
 *         createdByName:
 *           type: string
 *         updatedBy:
 *           type: string
 *         updatedByName:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CandidateMetrics:
 *       type: object
 *       properties:
 *         averageRating:
 *           type: number
 *         totalInterviewsScheduled:
 *           type: number
 *         totalInterviewsCompleted:
 *           type: number
 *         totalInterviewsPassed:
 *           type: number
 *         currentRound:
 *           type: string
 *         daysInPipeline:
 *           type: number
 *
 *     Candidate:
 *       allOf:
 *         - $ref: '#/components/schemas/CandidateInput'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             statusHistory:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CandidateStatusHistoryItem'
 *             interviews:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CandidateInterview'
 *             resume:
 *               type: object
 *               properties:
 *                 fileName:
 *                   type: string
 *                 filePath:
 *                   type: string
 *                 mimeType:
 *                   type: string
 *                 uploadedAt:
 *                   type: string
 *                   format: date-time
 *             applicationMetrics:
 *               $ref: '#/components/schemas/CandidateMetrics'
 *             lastActivityAt:
 *               type: string
 *               format: date-time
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 *
 *     CandidateStatusInput:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [Applied, Screened, Shortlisted, Technical Interview 1, Technical Interview 2, HR Round, HR Interview, Selected, Offered, Offer Accepted, Offer Declined, Offer Revoked, BGV, Cancelled, No Answer, Candidate Not Interested, Joined, Rejected Technical Interview 1, Rejected Technical Interview 2, Rejected, On Hold, Withdrawn]
 *         comment:
 *           type: string
 *         updatedBy:
 *           type: string
 *           description: Required only if auth middleware does not set req.user
 *
 *     CandidateInterviewInput:
 *       type: object
 *       required:
 *         - stage
 *         - interviewerId
 *         - scheduledAt
 *       properties:
 *         stage:
 *           type: string
 *           enum: [Screening, Technical Interview 1, Technical Interview 2, Technical Interview 3, HR Interview, Managerial Round, Final Interview]
 *         interviewerId:
 *           type: string
 *         coInterviewerIds:
 *           type: array
 *           items:
 *             type: string
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *           description: IST input supported, example 2026-03-10T14:30
 *         duration:
 *           type: number
 *         meetingLink:
 *           type: string
 *         location:
 *           type: string
 *         createdBy:
 *           type: string
 *           description: Required only if auth middleware does not set req.user
 *
 *     CandidateInterviewUpdateInput:
 *       type: object
 *       properties:
 *         stage:
 *           type: string
 *           enum: [Screening, Technical Interview 1, Technical Interview 2, Technical Interview 3, HR Interview, Managerial Round, Final Interview]
 *         interviewerId:
 *           type: string
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *         duration:
 *           type: number
 *         meetingLink:
 *           type: string
 *         location:
 *           type: string
 *         result:
 *           type: string
 *           enum: [Pending, Passed, Failed, On Hold, No Show, Rescheduled]
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         feedback:
 *           type: string
 *         strengths:
 *           type: string
 *         weaknesses:
 *           type: string
 *         additionalNotes:
 *           type: string
 *         skillRatings:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               skill:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *         completedAt:
 *           type: string
 *           format: date-time
 *         actualDuration:
 *           type: number
 *         updatedBy:
 *           type: string
 *           description: Required only if auth middleware does not set req.user
 */

/**
 * @swagger
 * /candidates:
 *   post:
 *     summary: Create a new candidate
 *     tags: [Candidates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CandidateInput'
 *     responses:
 *       201:
 *         description: Candidate created successfully
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get candidates with optional filters
 *     tags: [Candidates]
 *     parameters:
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Case-insensitive partial match on candidate name
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Case-insensitive partial match on candidate email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Applied, Screened, Shortlisted, Technical Interview 1, Technical Interview 2, HR Round, HR Interview, Selected, Offered, Offer Accepted, Offer Declined, Offer Revoked, BGV, Cancelled, No Answer, Candidate Not Interested, Joined, Rejected Technical Interview 1, Rejected Technical Interview 2, Rejected, On Hold, Withdrawn]
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Candidate role exact match
 *     responses:
 *       200:
 *         description: List of candidates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Candidate'
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /candidate/{id}:
 *   get:
 *     summary: Get candidate by ID
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Candidate details
 *       404:
 *         description: Candidate not found
 *   put:
 *     summary: Update candidate details
 *     tags: [Candidates]
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
 *             $ref: '#/components/schemas/CandidateInput'
 *     responses:
 *       200:
 *         description: Candidate updated
 *       404:
 *         description: Candidate not found
 */

/**
 * @swagger
 * /candidate/{id}/status:
 *   patch:
 *     summary: Update candidate status with actor tracking
 *     tags: [Candidates]
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
 *             $ref: '#/components/schemas/CandidateStatusInput'
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Candidate/User not found
 */

/**
 * @swagger
 * /candidate/{id}/upload-resume:
 *   post:
 *     summary: Upload candidate resume
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - resume
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resume uploaded
 *       400:
 *         description: Missing file
 *       404:
 *         description: Candidate not found
 */

/**
 * @swagger
 * /candidate/{id}/interviews:
 *   get:
 *     summary: Get all interview rounds for one candidate
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Interview rounds
 *       404:
 *         description: Candidate not found
 */

/**
 * @swagger
 * /candidate/{id}/interview:
 *   post:
 *     summary: Schedule a new interview round
 *     tags: [Candidates]
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
 *             $ref: '#/components/schemas/CandidateInterviewInput'
 *     responses:
 *       200:
 *         description: Interview added
 *       400:
 *         description: Invalid payload/interviewer/date
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Candidate not found
 */

/**
 * @swagger
 * /candidate/{id}/interview/{interviewId}:
 *   patch:
 *     summary: Update interview result/feedback/details
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CandidateInterviewUpdateInput'
 *     responses:
 *       200:
 *         description: Interview updated
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Candidate or interview not found
 */

/**
 * @swagger
 * /candidate/{id}/timeline:
 *   get:
 *     summary: Get candidate timeline (status + interviews merged)
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Candidate timeline
 *       404:
 *         description: Candidate not found
 */

/**
 * @swagger
 * /analytics/interviews:
 *   get:
 *     summary: Get interview analytics (optionally filtered by jobId)
 *     tags: [Candidates]
 *     parameters:
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics by interview stage
 *       500:
 *         description: Internal server error
 */
