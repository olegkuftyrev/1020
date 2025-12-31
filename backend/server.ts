/*
|--------------------------------------------------------------------------
| HTTP server entrypoint
|--------------------------------------------------------------------------
|
| The "server.ts" file is the entrypoint for starting the AdonisJS HTTP
| server. Either you can run this file directly or use the "serve"
| command to run this file and monitor file changes
|
*/
import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'
import AppServiceProvider from '@adonisjs/core/providers/app_provider'

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('./', import.meta.url)

/**
 * The ignitor sets up the AdonisJS application and can
 * optionally mount the application in a Node.js HTTP server.
 */
const ignitor = new Ignitor(APP_ROOT, { importer: (url) => import(url) })

// Tap into app creation to manually register providers
ignitor.tap(async (app) => {
  await app.init()
  // Manually register the app provider since providers aren't being loaded from .adonisrc.json
  const appProvider = new AppServiceProvider(app)
  appProvider.register()
  
  // Boot provider after app is booted
  app.booted(async () => {
    await appProvider.boot()
  })
  
  // Register routes and middleware when app starts (this happens in HttpServerProcess.app.start())
  const originalStart = app.start.bind(app)
  app.start = async (callback) => {
    // Get router and server
    const router = await app.container.make('router')
    const server = await app.container.make('server')
    
    // Add CORS middleware - register it as a function that returns middleware
    server.use([
      () => Promise.resolve({
        default: class {
          async handle(ctx: any, next: any) {
            ctx.response.header('Access-Control-Allow-Origin', '*')
            ctx.response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ctx.response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            
            if (ctx.request.method() === 'OPTIONS') {
              return ctx.response.noContent()
            }
            
            await next()
          }
        }
      })
    ])
    
    // Ensure bodyparser middleware is registered on router
    router.use([
      () => import('@adonisjs/core/bodyparser_middleware'),
    ])
    
    // Register error handler
    server.errorHandler(() => import('#exceptions/handler'))
    
    // Register server middleware
    server.use([
      () => import('#middleware/container_bindings_middleware'),
    ])
    
    // Register routes before the server starts
    router.post('/api/auth/login', '#controllers/auth_controller.login')
    router.get('/api/auth/verify', '#controllers/auth_controller.verify')
    
    // Products routes - specific routes must come before parameterized routes
    router.get('/api/products', '#controllers/products_controller.index')
    router.post('/api/products/sync', '#controllers/products_controller.sync')
    router.get('/api/products/metadata/pdf', '#controllers/products_controller.getPdfMetadata')
    router.get('/api/products/statistics', '#controllers/products_controller.getStatistics')
    router.get('/api/products/category-summary', '#controllers/products_controller.getCategorySummary')
    router.get('/api/products/:productNumber', '#controllers/products_controller.show')
    router.put('/api/products/:productNumber/conversion', '#controllers/products_controller.updateConversion')
    
    // Settings routes
    router.get('/api/settings/:key', '#controllers/settings_controller.get')
    router.put('/api/settings/:key', '#controllers/settings_controller.set')
    
    // Gem routes
    router.get('/api/gem', '#controllers/gem_controller.index')
    router.post('/api/gem', '#controllers/gem_controller.store')
    
    // P&L routes - order matters: more specific routes first
    router.get('/api/pl/years', '#controllers/pl_controller.getYears')
    router.get('/api/pl/latest', '#controllers/pl_controller.getLatestPeriod')
    router.post('/api/pl/sync', '#controllers/pl_controller.sync')
    // DELETE must come before ALL GET routes with parameters to avoid route conflicts
    // Place DELETE before any route that could match /api/pl/:year/:period pattern
    router.delete('/api/pl/:year/:period', '#controllers/pl_controller.destroy')
    // Fixed route for periods (must come after DELETE to avoid conflicts)
    router.get('/api/pl/:year/periods', '#controllers/pl_controller.getPeriods')
    router.get('/api/pl/:year/:period', '#controllers/pl_controller.show')
    router.get('/api/pl/:year', '#controllers/pl_controller.index')
    
    // P&L Questions routes
    router.get('/api/pl-questions', '#controllers/pl_questions_controller.index')
    router.get('/api/pl-questions/:id', '#controllers/pl_questions_controller.show')
    router.post('/api/pl-questions/bulk', '#controllers/pl_questions_controller.bulkCreateQuestions')
    router.get('/api/pl-questions-sets', '#controllers/pl_questions_controller.getSets')
    router.get('/api/pl-questions-sets/:id', '#controllers/pl_questions_controller.getSet')
    router.post('/api/pl-questions-sets', '#controllers/pl_questions_controller.createSet')
    router.post('/api/pl-questions-sets/:id/submit', '#controllers/pl_questions_controller.submitAnswers')
    router.get('/api/pl-questions-sets/:id/results', '#controllers/pl_questions_controller.getResults')
    router.delete('/api/pl-questions-sets/:id', '#controllers/pl_questions_controller.deleteSet')
    
    // Deploy webhook route
    router.post('/api/deploy/webhook', '#controllers/deploy_controller.webhook')
    
    // Call original start
    return originalStart(callback)
  }
})

try {
  const httpServer = ignitor.httpServer()
  await httpServer.start()
} catch (error) {
  process.exitCode = 1
  prettyPrintError(error)
}
