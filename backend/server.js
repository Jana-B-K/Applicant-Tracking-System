import dotenv from 'dotenv'
import connectDB from './src/config/dbconfig.js'
import app from './src/app.js'
import { startJobCleanupCron } from './src/cron/jobCleanup.cron.js'

dotenv.config()

await connectDB()
startJobCleanupCron()

const PORT = process.env.PORT || 5000
const HOST = process.env.HOST || '0.0.0.0'

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`)
})
