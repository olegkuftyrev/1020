import env from '#start/env'

export default {
  default: 'app',
  loggers: {
    app: {
      enabled: true,
      name: env.NODE_ENV === 'production' ? 'production' : 'development',
      level: env.LOG_LEVEL || 'info',
      destination: 'stdout',
    },
  },
}

