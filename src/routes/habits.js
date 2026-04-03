const router    = require('express').Router()
const requireAuth = require('../middleware/clerkAuth')
const supabase  = require('../supabase')

// GET /api/habits  — returns habits + last 90 days completions
router.get('/', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const [habitsResult, completionsResult] = await Promise.all([
    supabase.from('habits').select('*').eq('clerk_user_id', userId).order('created_at'),
    supabase.from('habit_completions').select('*').eq('clerk_user_id', userId).gte('completed_date', ninetyDaysAgo.toISOString().split('T')[0])
  ])

  if (habitsResult.error) return res.status(500).json({ error: habitsResult.error.message })
  res.json({ habits: habitsResult.data, completions: completionsResult.data })
})

// POST /api/habits
router.post('/', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const { name, emoji, target_days, color } = req.body
  const { data, error } = await supabase.from('habits').insert({ clerk_user_id: userId, name, emoji, target_days, color }).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/habits/:id/complete  — mark today done (toggle)
router.post('/:id/complete', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const { date } = req.body  // "YYYY-MM-DD"
  const today = date || new Date().toISOString().split('T')[0]

  // Check if already completed today
  const { data: existing } = await supabase
    .from('habit_completions')
    .select('id')
    .eq('habit_id', req.params.id)
    .eq('completed_date', today)
    .single()

  if (existing) {
    // Undo: delete the completion
    await supabase.from('habit_completions').delete().eq('id', existing.id)
    return res.json({ action: 'removed' })
  }

  // Mark complete
  const { data, error } = await supabase
    .from('habit_completions')
    .insert({ habit_id: req.params.id, clerk_user_id: userId, completed_date: today })
    .select().single()

  // Recalculate streak
  await recalculateStreak(req.params.id, userId)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ action: 'added', data })
})

// DELETE /api/habits/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { userId } = req.auth
  const { error } = await supabase.from('habits').delete().eq('id', req.params.id).eq('clerk_user_id', userId)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

async function recalculateStreak(habitId, userId) {
  const { data } = await supabase
    .from('habit_completions')
    .select('completed_date')
    .eq('habit_id', habitId)
    .order('completed_date', { ascending: false })

  let streak = 0
  const today = new Date(); today.setHours(0,0,0,0)
  for (let i = 0; i < (data?.length || 0); i++) {
    const d = new Date(data[i].completed_date)
    const expected = new Date(today); expected.setDate(today.getDate() - i)
    if (d.getTime() === expected.getTime()) streak++
    else break
  }
  await supabase.from('habits').update({ streak }).eq('id', habitId).eq('clerk_user_id', userId)
}

module.exports = router
