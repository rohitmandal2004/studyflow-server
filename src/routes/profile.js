const router    = require('express').Router()
const requireAuth = require('../middleware/clerkAuth')
const supabase  = require('../supabase')

// GET /api/profile
router.get('/', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()
  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message })
  res.json(data || null)
})

// POST /api/profile  (create or update)
router.post('/', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const { name, goal, institution, subjects, daily_target_hours, target_date } = req.body
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ clerk_user_id: userId, name, goal, institution, subjects, daily_target_hours, target_date, updated_at: new Date().toISOString() }, { onConflict: 'clerk_user_id' })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router
