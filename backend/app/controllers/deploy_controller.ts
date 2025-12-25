import type { HttpContext } from '@adonisjs/core/http'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import env from '#start/env'

const execAsync = promisify(exec)

export default class DeployController {
  async webhook(ctx: HttpContext) {
    // Get webhook secret from environment
    const webhookSecret = env.WEBHOOK_SECRET
    const providedSecret = ctx.request.header('x-webhook-secret') || ctx.request.qs().secret

    // Verify secret
    if (providedSecret !== webhookSecret) {
      return ctx.response.status(401).json({ error: 'Unauthorized' })
    }

    const APP_DIR = '/var/www/panda-express-dashboard'
    const DEPLOY_SCRIPT = `${APP_DIR}/deploy-webhook.sh`

    try {
      // Run deployment script
      const { stdout, stderr } = await execAsync(
        `bash ${DEPLOY_SCRIPT}`,
        { 
          timeout: 300000, // 5 minutes timeout
          cwd: APP_DIR,
        }
      )

      return ctx.response.json({
        success: true,
        message: 'Deployment completed',
        output: stdout,
        errors: stderr,
      })
    } catch (error: any) {
      return ctx.response.status(500).json({
        success: false,
        error: error.message,
        output: error.stdout,
        errors: error.stderr,
      })
    }
  }
}

