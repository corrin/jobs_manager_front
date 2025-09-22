#!/usr/bin/env node

import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

async function fetchSchema() {
  // Read the API URL from .env file
  const envPath = join(projectRoot, '.env')
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const match = envContent.match(/^VITE_API_BASE_URL=(.+)$/m)

  const apiUrl = match[1].trim()
  const schemaUrl = `${apiUrl}/api/schema/`

  console.log(`Fetching schema from ${schemaUrl}...`)
  const response = await fetch(schemaUrl, {
    signal: AbortSignal.timeout(10000), // 10 second timeout
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const schema = await response.text()
  const schemaPath = join(projectRoot, 'schema.yml')
  fs.writeFileSync(schemaPath, schema)
  console.log(`✅ Schema fetched successfully`)
}

fetchSchema().catch((error) => {
  console.log('⚠️  Could not fetch schema:', error.message)
  // Don't fail the build - just continue with existing schema
  process.exit(0)
})
