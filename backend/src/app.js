import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import jobRouter from './routes/job.route.js'
import authRoutes from './routes/auth.route.js'
import dashboardRoutes from './routes/dashboard.route.js'
import candidateRouter from './routes/candidate.route.js' 
import rbacRoutes from './routes/rbac.route.js'
import userRoutes from './routes/user.route.js'
import { setupSwagger } from './swagger.js'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://10.4.0.81:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5000',
]

const envAllowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api/jobs', jobRouter)
app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/uploads', express.static('uploads'))
app.use('/api', candidateRouter)
app.use('/api/rbac', rbacRoutes)
app.use('/api/users', userRoutes)

setupSwagger(app)

app.use(errorHandler)
export default app
