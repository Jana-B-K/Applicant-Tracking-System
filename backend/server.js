import dotenv from 'dotenv'
import connectDB from './src/config/dbconfig.js'
import app from './src/app.js'
import { startJobCleanupCron } from './src/cron/jobCleanup.cron.js'

dotenv.config()

await connectDB()
startJobCleanupCron()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
