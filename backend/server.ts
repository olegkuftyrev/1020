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
