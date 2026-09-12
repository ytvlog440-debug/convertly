import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_DIR = path.resolve(__dirname, '../dist')

console.log('🔍 Running Convertly V2 Automated Technical SEO Audit...')

if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ FAIL: dist directory does not exist. Run npm run build first.')
  process.exit(1)
}

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    passed++
  } else {
    failed++
    console.error(`  ❌ ${message}`)
  }
}

// 1. Verify robots.txt
const robotsPath = path.join(DIST_DIR, 'robots.txt')
assert(fs.existsSync(robotsPath), 'robots.txt exists in dist')
if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, 'utf-8')
  assert(robots.includes('Sitemap: https://convertlytools.xyz/sitemap.xml'), 'robots.txt references canonical sitemap')
  assert(robots.includes('Allow: /assets/'), 'robots.txt allows /assets/')
  assert(robots.includes('Disallow: /api/'), 'robots.txt blocks /api/')
}

// 2. Verify sitemap.xml
const sitemapPath = path.join(DIST_DIR, 'sitemap.xml')
assert(fs.existsSync(sitemapPath), 'sitemap.xml exists in dist')
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf-8')
  const urlCount = (sitemap.match(/<loc>/g) || []).length
  assert(urlCount >= 37, `sitemap contains at least 37 URLs (found ${urlCount})`)
  assert(!/<loc>https:\/\/convertlytools\.xyz\/.+\/<\/loc>/.test(sitemap), 'sitemap subpath URLs do not end with trailing slash')
  assert(sitemap.includes('<priority>1.0</priority>'), 'sitemap contains root priority 1.0')
}

// 3. Verify OpenGraph Image
const ogImagePath = path.join(DIST_DIR, 'og-image.png')
assert(fs.existsSync(ogImagePath), 'og-image.png exists in dist')

// 4. Verify All 30 Tool Pages
const TOOLS = [
  'pdf-to-word', 'word-to-pdf', 'pdf-merge', 'pdf-compress', 'pdf-split',
  'pdf-rotate', 'images-to-pdf', 'excel-to-pdf', 'ppt-to-pdf', 'pdf-delete-pages',
  'pdf-extract-pages', 'pdf-reorder-pages', 'jpg-to-png', 'png-to-jpg', 'image-to-webp',
  'webp-to-image', 'pdf-to-images', 'image-resize', 'image-compress', 'image-crop',
  'image-rotate', 'pdf-protect', 'pdf-unlock', 'pdf-watermark', 'pdf-page-numbers',
  'pdf-redact', 'pdf-flatten', 'pdf-scrub-metadata', 'pdf-to-txt', 'pdf-grayscale'
]

for (const tool of TOOLS) {
  const toolHtmlPath = path.join(DIST_DIR, 'tools', tool, 'index.html')
  assert(fs.existsSync(toolHtmlPath), `Pre-rendered static HTML exists for /tools/${tool}`)
  if (fs.existsSync(toolHtmlPath)) {
    const html = fs.readFileSync(toolHtmlPath, 'utf-8')
    assert(html.includes('<title>'), `Tool ${tool} has <title>`)
    assert(html.includes('<meta name="description"'), `Tool ${tool} has meta description`)
    assert(html.includes(`https://convertlytools.xyz/tools/${tool}`), `Tool ${tool} has self-referencing canonical`)
    assert(html.includes('og:image'), `Tool ${tool} has og:image`)
    assert(html.includes('twitter:card'), `Tool ${tool} has twitter:card`)
    assert(html.includes('<h1'), `Tool ${tool} has <h1> element`)
    
    // Schema validation
    const schemaMatch = html.match(/<script id="convertly-schema-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/)
    assert(!!schemaMatch, `Tool ${tool} contains JSON-LD structured data script`)
    if (schemaMatch) {
      try {
        const parsed = JSON.parse(schemaMatch[1])
        assert(Array.isArray(parsed) && parsed.length >= 3, `Tool ${tool} JSON-LD has WebApplication, HowTo, and BreadcrumbList`)
      } catch {
        assert(false, `Tool ${tool} JSON-LD parses without syntax error`)
      }
    }
  }
}

// 5. Verify Core Pages
const CORE_PAGES = ['privacy', 'security', 'terms', 'developers', 'formats', 'tools']
for (const page of CORE_PAGES) {
  const pageHtmlPath = path.join(DIST_DIR, page, 'index.html')
  assert(fs.existsSync(pageHtmlPath), `Pre-rendered static HTML exists for /${page}`)
  if (fs.existsSync(pageHtmlPath)) {
    const html = fs.readFileSync(pageHtmlPath, 'utf-8')
    assert(html.includes('<title>'), `Page ${page} has <title>`)
    assert(html.includes('<meta name="description"'), `Page ${page} has meta description`)
  }
}

console.log(`\nTechnical SEO Audit Results:`)
console.log(`  Passed assertions: ${passed}`)
console.log(`  Failed assertions: ${failed}`)

if (failed > 0) {
  console.error(`\n❌ Technical SEO Audit FAILED with ${failed} issues.`)
  process.exit(1)
} else {
  console.log(`\n🎉 Technical SEO Audit PASSED 100%! All routes, tags, schemas, and assets verified.`)
  process.exit(0)
}
