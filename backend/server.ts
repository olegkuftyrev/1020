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
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)

/**
 * The ignitor sets up the AdonisJS application and can
 * optionally mount the application in a Node.js HTTP server.
 */
const ignitor = new Ignitor(APP_ROOT, { importer: (url) => import(url) })

try {
  // Ensure .adonisrc.json is read by manually setting rc contents
  const app = ignitor.createApp('web')
  const rcPath = join(fileURLToPath(APP_ROOT), 'backend', '.adonisrc.json')
  const rcContents = JSON.parse(readFileSync(rcPath, 'utf-8'))
  app.rcContents(rcContents)
  
  const httpServer = ignitor.httpServer()
  await httpServer.start()
} catch (error) {
  process.exitCode = 1
  prettyPrintError(error)
}
