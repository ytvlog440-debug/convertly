import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const HOST = 'convertlytools.xyz'
const KEY = '8f3b610c85774a3ea30b769bb406cf0a'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const SITEMAP_PATH = path.resolve(__dirname, '../public/sitemap.xml')

if (!fs.existsSync(SITEMAP_PATH)) {
  console.error('[IndexNow Error] sitemap.xml not found. Run npm run build first.')
  process.exit(1)
}

const sitemapContent = fs.readFileSync(SITEMAP_PATH, 'utf-8')
const urlMatches = sitemapContent.match(/<loc>(https:\/\/[^<]+)<\/loc>/g) || []
const urlList = urlMatches.map(m => m.replace('<loc>', '').replace('</loc>', ''))

console.log(`[IndexNow] Discovered ${urlList.length} production URLs to notify Bing/IndexNow.`)

const payload = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: urlList
})

const options = {
  hostname: 'api.indexnow.org',
  port: 443,
  path: '/indexnow',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload)
  }
}

console.log(`[IndexNow] Ready to broadcast ${urlList.length} URLs to https://api.indexnow.org/indexnow`)
console.log(`[IndexNow] Key verified at: ${KEY_LOCATION}`)
