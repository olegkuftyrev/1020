import env from '#start/env'

export default {
  app: {
    appKey: env.APP_KEY,
    http: {
      allowMethodSpoofing: false,
      trustProxy: false,
      forceContentNegotiationTo: 'application/json',
    },
  },
}
