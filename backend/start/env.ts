import { Secret } from '@adonisjs/core/helpers'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Load .env file manually
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const envPath = join(__dirname, '../../.env')
try {
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach((line) => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const match = trimmedLine.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    }
  })
} catch (error) {
  // .env file doesn't exist, use defaults
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

export default {
  PORT: Number(process.env.PORT || 3333),
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_KEY: new Secret(process.env.APP_KEY || 'change-me-in-production-use-a-secure-random-key-at-least-32-characters-long'),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  DATABASE_URL: getEnvVar('DATABASE_URL', 'postgresql://user:password@localhost:5432/panda_express_db?schema=public'),
  AUTH_PASSWORD: getEnvVar('AUTH_PASSWORD', '123456'),
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'change-me-in-production-webhook-secret',
} as const
