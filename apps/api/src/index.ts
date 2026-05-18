import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes.ts'
import feedRoutes from './routes/feed.routes.ts'
import articleRoutes from './routes/article.routes.ts'
import bookmarkRoutes from './routes/bookmark.routes.ts'
import highlightRoutes from './routes/highlight.routes.ts'

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
app.use('/bookmarks', bookmarkRoutes)
app.use('/highlights', highlightRoutes)

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})

export default app
