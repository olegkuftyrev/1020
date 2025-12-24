import env from '#start/env'

export default {
  appKey: env.APP_KEY,
  http: {
    allowMethodSpoofing: false,
    trustProxy: false,
    forceContentNegotiationTo: 'application/json',
  },
}
