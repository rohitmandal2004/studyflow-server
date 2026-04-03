const router    = require('express').Router()
const requireAuth = require('../middleware/clerkAuth')
const supabase  = require('../supabase')

// GET /api/sessions?from=2025-04-01&to=2025-04-30
router.get('/', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const { from, to } = req.query
  let query = supabase.from('sessions').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: false })
  if (from) query = query.gte('session_date', from)
  if (to)   query = query.lte('session_date', to)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/sessions
router.post('/', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const { subject, topic, duration_minutes, session_date, notes } = req.body
  const { data, error } = await supabase
    .from('sessions')
    .insert({ clerk_user_id: userId, subject, topic, duration_minutes, session_date: session_date || new Date().toISOString().split('T')[0], notes })
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// DELETE /api/sessions/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const { error } = await supabase.from('sessions').delete().eq('id', req.params.id).eq('clerk_user_id', userId)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

module.exports = router
