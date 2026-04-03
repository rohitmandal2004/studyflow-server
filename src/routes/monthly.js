const router    = require('express').Router()
const requireAuth = require('../middleware/clerkAuth')
const supabase  = require('../supabase')

// GET /api/monthly/:month  e.g. /api/monthly/2025-04
// Computes stats on the fly from raw data — no snapshot needed
router.get('/:month', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const { month } = req.params
  const [year, m] = month.split('-')
  const from = `${month}-01`
  const lastDay = new Date(year, m, 0).getDate()
  const to   = `${month}-${lastDay}`

  const [tasks, sessions, habitCompletions] = await Promise.all([
    supabase.from('tasks').select('*').eq('clerk_user_id', userId).gte('task_date', from).lte('task_date', to),
    supabase.from('sessions').select('*').eq('clerk_user_id', userId).gte('session_date', from).lte('session_date', to),
    supabase.from('habit_completions').select('completed_date').eq('clerk_user_id', userId).gte('completed_date', from).lte('completed_date', to),
  ])

  // Compute subject breakdown
  const subjectBreakdown = {}
  for (const s of sessions.data || []) {
    subjectBreakdown[s.subject] = (subjectBreakdown[s.subject] || 0) + s.duration_minutes / 60
  }

  // Compute hours per day
  const hoursPerDay = {}
  for (const s of sessions.data || []) {
    hoursPerDay[s.session_date] = (hoursPerDay[s.session_date] || 0) + s.duration_minutes / 60
  }

  const bestDay = Object.entries(hoursPerDay).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  const totalHours = Object.values(hoursPerDay).reduce((a, b) => a + b, 0)
  const tasksDone  = (tasks.data || []).filter(t => t.done).length
  const tasksTotal = (tasks.data || []).length

  res.json({
    month,
    total_hours: Math.round(totalHours * 10) / 10,
    tasks_done: tasksDone,
    tasks_total: tasksTotal,
    subject_breakdown: subjectBreakdown,
    hours_per_day: hoursPerDay,
    best_day: bestDay,
    habits_complete_days: new Set((habitCompletions.data || []).map(h => h.completed_date)).size,
  })
})

// PATCH /api/monthly/:month/mood  — log mood for a specific day
router.patch('/:month/mood', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const { month }  = req.params
  const { date, mood } = req.body  // date: "2025-04-01", mood: "great"|"good"|"average"|"rough"

  const { data: existing } = await supabase.from('monthly_snapshots').select('mood_log').eq('clerk_user_id', userId).eq('month', month).single()
  const moodLog = existing?.mood_log || {}
  moodLog[date] = mood

  const { data, error } = await supabase
    .from('monthly_snapshots')
    .upsert({ clerk_user_id: userId, month, mood_log: moodLog, updated_at: new Date().toISOString() }, { onConflict: 'clerk_user_id,month' })
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router
