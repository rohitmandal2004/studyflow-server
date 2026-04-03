const router    = require('express').Router()
const requireAuth = require('../middleware/clerkAuth')
const supabase  = require('../supabase')

// GET /api/tasks?date=2025-04-01
router.get('/', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const { date } = req.query
  let query = supabase.from('tasks').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: true })
  if (date) query = query.eq('task_date', date)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/tasks
router.post('/', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const { title, subject, priority, task_date } = req.body
  const { data, error } = await supabase
    .from('tasks')
    .insert({ clerk_user_id: userId, title, subject, priority, task_date: task_date || new Date().toISOString().split('T')[0] })
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// PATCH /api/tasks/:id  (toggle done, edit)
router.patch('/:id', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const { data, error } = await supabase
    .from('tasks')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('clerk_user_id', userId)
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// DELETE /api/tasks/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const { error } = await supabase.from('tasks').delete().eq('id', req.params.id).eq('clerk_user_id', userId)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

module.exports = router
