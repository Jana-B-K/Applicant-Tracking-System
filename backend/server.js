import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import connectDB from './src/config/dbconfig.js'
import app from './src/app.js'
import { startJobCleanupCron } from './src/cron/jobCleanup.cron.js'
import { startWeeklyReportCron } from './src/cron/weeklyReport.cron.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

await connectDB()
startJobCleanupCron()
startWeeklyReportCron()

const PORT = process.env.PORT || 5000
const HOST = process.env.HOST || '0.0.0.0'

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`)
})
