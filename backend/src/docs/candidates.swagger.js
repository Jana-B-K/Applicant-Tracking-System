/**
 * @swagger
 * tags:
 *   - name: Candidates
 *     description: API endpoints for managing candidates
 *
 * components:
 *   schemas:
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
 *         status:
 *           type: string
 *           enum: [Applied, Screened, Shortlisted, Technical Interview 1, Technical Interview 2, HR Interview, Selected, Rejected]
 *           example: Applied
 *
 *     Candidate:
 *       allOf:
 *         - $ref: '#/components/schemas/CandidateInput'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 65f1c7ea7d85a8f7a70b6def
 *             statusHistory:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [Applied, Screened, Shortlisted, Technical Interview 1, Technical Interview 2, HR Interview, Selected, Rejected]
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *             notes:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   text:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
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
 *           enum: [Applied, Screened, Shortlisted, Technical Interview 1, Technical Interview 2, HR Interview, Selected, Rejected]
 *           example: Screened
 *
 *     CandidateNoteInput:
 *       type: object
 *       required:
 *         - note
 *       properties:
 *         note:
 *           type: string
 *           example: Good communication, proceed to next round.
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Candidate not found
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Get candidates (optionally by jobId)
 *     tags: [Candidates]
 *     parameters:
 *       - in: query
 *         name: jobId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter candidates by job ID
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       404:
 *         description: Candidate not found
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
 *         description: Candidate updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       404:
 *         description: Candidate not found
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
 * /candidate/{id}/status:
 *   patch:
 *     summary: Update candidate status and append status history
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
 *         description: Candidate status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       400:
 *         description: Missing status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Candidate not found
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
 * /candidate/{id}/note:
 *   post:
 *     summary: Add note to candidate with timestamp
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
 *             $ref: '#/components/schemas/CandidateNoteInput'
 *     responses:
 *       200:
 *         description: Note added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       400:
 *         description: Missing note
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Candidate not found
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
 *         description: Resume uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       400:
 *         description: Missing resume file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Candidate not found
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

