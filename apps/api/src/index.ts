import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes.ts'
import feedRoutes from './routes/feed.routes.ts'
import articleRoutes from './routes/article.routes.ts'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/auth', authRoutes)
app.use('/feeds', feedRoutes)
app.use('/articles', articleRoutes)

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})

export default app
