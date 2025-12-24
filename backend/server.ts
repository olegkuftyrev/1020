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

// Tap into app creation to manually register providers and routes
ignitor.tap(async (app) => {
  await app.init()
  // Manually register the app provider since providers aren't being loaded from .adonisrc.json
  const appProvider = new AppServiceProvider(app)
  appProvider.register()
  // Store provider to boot it later
  app.container.bind('_app_provider', () => appProvider)
  
  // Register routes after app is booted
  app.booted(async () => {
    const router = await app.container.make('router')
    router.post('/api/auth/login', '#controllers/auth_controller.login')
    router.get('/api/auth/verify', '#controllers/auth_controller.verify')
  })
})

try {
  const httpServer = ignitor.httpServer()
  await httpServer.start()
} catch (error) {
  process.exitCode = 1
  prettyPrintError(error)
}
