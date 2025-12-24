import { Logger } from '@adonisjs/core/logger'
import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * The container bindings middleware binds classes to their container
 * bindings. The container bindings are defined in the contracts/container.ts
 * file.
 */
export default class ContainerBindingsMiddleware {
  handle(ctx: HttpContext, next: NextFn) {
    ctx.logger = ctx.logger.child({})
    return next()
  }
}
