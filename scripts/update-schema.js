#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const backendPath = join(projectRoot, '..', 'jobs_manager')

function generateSchema() {
  console.log(`Generating schema from ${backendPath}...`)

  const schema = execSync('poetry run python manage.py spectacular --format openapi', {
    cwd: backendPath,
    encoding: 'utf-8',
    timeout: 30000,
  })

  const schemaPath = join(projectRoot, 'schema.yml')
  fs.writeFileSync(schemaPath, schema)
  console.log(`✅ Schema generated successfully`)
}

try {
  generateSchema()
} catch (error) {
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'

  if (isCI) {
    console.log('⚠️  Could not generate schema (CI mode - using existing schema):', error.message)
    process.exit(0)
  } else {
    console.error('❌ Failed to generate schema:', error.message)
    process.exit(1)
  }
}
