const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node')

// This middleware verifies the Clerk JWT and attaches req.auth.userId
const requireAuth = (req, res, next) => {
  const handler = ClerkExpressRequireAuth({
    secretKey: process.env.CLERK_SECRET_KEY,
  })
  
  handler(req, res, (err) => {
    if (err) {
      console.error('🔴 Clerk Auth Error:', err.message)
      console.error('   Auth header present:', !!req.headers.authorization)
      console.error('   Secret key starts with:', process.env.CLERK_SECRET_KEY?.substring(0, 10) + '...')
      return res.status(401).json({ 
        error: 'Authentication failed', 
        details: err.message,
        hasAuthHeader: !!req.headers.authorization
      })
    }
    next()
  })
}

module.exports = requireAuth
