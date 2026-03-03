import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import jobRouter from './routes/job.route.js'
import authRoutes from './routes/auth.route.js'
import { setupSwagger } from './swagger.js'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api/jobs', jobRouter)
app.use('/api/auth', authRoutes)
setupSwagger(app)

app.use(errorHandler)

export default app
