import { defineConfig } from '@adonisjs/core/bodyparser'

export default defineConfig({
  form: {
    convertEmptyStringsToNull: true,
    types: ['application/x-www-form-urlencoded'],
  },
  json: {
    types: ['application/json', 'text/json'],
  },
  raw: {
    types: ['text/*'],
  },
  multipart: {
    autoProcess: true,
    processManually: [],
    maxFields: 1000,
    types: ['multipart/form-data'],
  },
})

