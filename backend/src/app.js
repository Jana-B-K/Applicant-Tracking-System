import express from 'express'
import cors from 'cors'
import jobRouter from './routes/job.route.js'
import { setupSwagger } from './swagger.js'
const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));


app.use(express.json())
app.use('/api/jobs', jobRouter)
setupSwagger(app)


//error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});
export default app