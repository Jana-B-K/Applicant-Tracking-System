import connectDB from './src/config/dbconfig.js'
import dotenv from 'dotenv'
import app from './src/app.js'
dotenv.config()
await connectDB()

const PORT = process.env.PORT || 5000

app.listen( PORT , () => {
    console.log(`Server is running on localhost:${PORT}`)
})