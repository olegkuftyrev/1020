import router from '@adonisjs/core/services/router'

// Auth routes
router.post('/api/auth/login', '#controllers/auth_controller.login')
router.get('/api/auth/verify', '#controllers/auth_controller.verify')

// Protected routes will go here
// router.get('/api/store/*', [authMiddleware])
