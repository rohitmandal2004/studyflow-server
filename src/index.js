require('dotenv').config()
const express     = require('express')
const cors        = require('cors')
const helmet      = require('helmet')
const rateLimit   = require('express-rate-limit')

const profileRoutes  = require('./routes/profile')
const tasksRoutes    = require('./routes/tasks')
const habitsRoutes   = require('./routes/habits')
const sessionsRoutes = require('./routes/sessions')
const monthlyRoutes  = require('./routes/monthly')

const app = express()

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim())
app.use(helmet())
app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }, 
  credentials: true 
}))
app.use(express.json())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }))

app.use('/api/profile',   profileRoutes)
app.use('/api/tasks',     tasksRoutes)
app.use('/api/habits',    habitsRoutes)
app.use('/api/sessions',  sessionsRoutes)
app.use('/api/monthly',   monthlyRoutes)

app.get('/api/health', (_, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`StudyFlow server running on :${PORT}`))
