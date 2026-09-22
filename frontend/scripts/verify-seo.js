import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import worker, { CONVERT_REDIRECTS } from '../worker.ts'

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
  assert(urlCount >= 70, `sitemap contains at least 70 URLs (found ${urlCount})`)
  assert(!/<loc>https:\/\/convertlytools\.xyz\/.+\/<\/loc>/.test(sitemap), 'sitemap subpath URLs do not end with trailing slash')
  assert(sitemap.includes('<priority>1.0</priority>'), 'sitemap contains root priority 1.0')

  // A. Assert generated sitemap contains 0 /convert/ URLs
  const convertSitemapMatches = sitemap.match(/<loc>[^<]*\/convert\/[^<]*<\/loc>/g) || []
  assert(convertSitemapMatches.length === 0, `Generated sitemap.xml contains 0 /convert/ URLs (found ${convertSitemapMatches.length})`)
}

// 3. Verify OpenGraph Image
const ogImagePath = path.join(DIST_DIR, 'og-image.png')
assert(fs.existsSync(ogImagePath), 'og-image.png exists in dist')

// 4. Verify All 31 Active Tool Pages
const TOOLS = [
  'pdf-to-word', 'word-to-pdf', 'pdf-merge', 'pdf-compress', 'pdf-split',
  'pdf-rotate', 'images-to-pdf', 'excel-to-pdf', 'pdf-to-excel', 'ppt-to-pdf', 'pdf-delete-pages',
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

// 5. Verify Core Pages & Hubs
const CORE_PAGES = [
  'privacy', 'security', 'terms', 'developers', 'formats', 'tools',
  'compare', 'use-cases', 'guides', 'blog', 'sitemap'
]
for (const page of CORE_PAGES) {
  const pageHtmlPath = path.join(DIST_DIR, page, 'index.html')
  assert(fs.existsSync(pageHtmlPath), `Pre-rendered static HTML exists for /${page}`)
  if (fs.existsSync(pageHtmlPath)) {
    const html = fs.readFileSync(pageHtmlPath, 'utf-8')
    assert(html.includes('<title>'), `Page ${page} has <title>`)
    assert(html.includes('<meta name="description"'), `Page ${page} has meta description`)
    assert(html.includes(`https://convertlytools.xyz/${page}`), `Page ${page} has canonical`)
  }
}

// 6. Verify Competitor Comparisons
const COMPARISON_SLUGS = [
  'convertly-vs-smallpdf', 'convertly-vs-ilovepdf', 'convertly-vs-pdf24',
  'convertly-vs-adobe-acrobat', 'convertly-vs-freeconvert'
]
for (const slug of COMPARISON_SLUGS) {
  const htmlPath = path.join(DIST_DIR, 'compare', slug, 'index.html')
  assert(fs.existsSync(htmlPath), `Pre-rendered static HTML exists for /compare/${slug}`)
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf-8')
    assert(html.includes('<title>'), `Comparison ${slug} has <title>`)
    assert(html.includes('<meta name="description"'), `Comparison ${slug} has meta description`)
  }
}

// 7. Verify Audience Use Cases
const USE_CASE_SLUGS = [
  'students', 'teachers', 'businesses', 'lawyers', 'hr', 'freelancers', 'designers'
]
for (const slug of USE_CASE_SLUGS) {
  const htmlPath = path.join(DIST_DIR, 'use-cases', slug, 'index.html')
  assert(fs.existsSync(htmlPath), `Pre-rendered static HTML exists for /use-cases/${slug}`)
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf-8')
    assert(html.includes('<title>'), `Use case ${slug} has <title>`)
    assert(html.includes('<meta name="description"'), `Use case ${slug} has meta description`)
  }
}

// 8. Verify Problem Solving Guides
const GUIDE_SLUGS = [
  'how-to-convert-pdf-to-word-without-losing-formatting',
  'how-to-compress-pdf-without-losing-quality',
  'how-to-merge-pdf-files',
  'how-to-split-pdf-pages',
  'how-to-convert-excel-to-pdf',
  'how-to-convert-powerpoint-to-pdf',
  'how-to-convert-images-into-pdf',
  'how-to-extract-tables-from-pdf-to-excel'
]
for (const slug of GUIDE_SLUGS) {
  const htmlPath = path.join(DIST_DIR, 'guides', slug, 'index.html')
  assert(fs.existsSync(htmlPath), `Pre-rendered static HTML exists for /guides/${slug}`)
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf-8')
    assert(html.includes('<title>'), `Guide ${slug} has <title>`)
    assert(html.includes('<meta name="description"'), `Guide ${slug} has meta description`)
  }
}

// 9. Verify Engineering Blog Articles
const BLOG_SLUGS = [
  'the-definitive-guide-to-lossless-pdf-compression',
  'how-to-fix-broken-formatting-in-pdf-to-word',
  'excel-to-pdf-best-practices-for-executive-reporting',
  'powerpoint-to-pdf-handout-optimization',
  'next-gen-image-formats-webp-vs-png-vs-jpg',
  'zero-retention-architecture-in-modern-file-converters',
  'security-defense-in-depth-document-pipeline',
  'paperless-office-productivity-hacks',
  'why-convertly-is-the-best-free-alternative-to-adobe-acrobat',
  'step-by-step-tutorial-redacting-confidential-data-from-pdf'
]
for (const slug of BLOG_SLUGS) {
  const htmlPath = path.join(DIST_DIR, 'blog', slug, 'index.html')
  assert(fs.existsSync(htmlPath), `Pre-rendered static HTML exists for /blog/${slug}`)
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf-8')
    assert(html.includes('<title>'), `Blog post ${slug} has <title>`)
    assert(html.includes('<meta name="description"'), `Blog post ${slug} has meta description`)
  }
}

// 10. Verify Elimination of Standalone /convert/* HTML Pages
const convertDistDir = path.join(DIST_DIR, 'convert')
const convertDirExists = fs.existsSync(convertDistDir)
assert(!convertDirExists, 'Generated dist/convert directory does NOT exist (no thin HTML generated)')
for (const srcPath of Object.keys(CONVERT_REDIRECTS)) {
  const relativeHtml = path.join(DIST_DIR, srcPath, 'index.html')
  assert(!fs.existsSync(relativeHtml), `Standalone HTML does not exist for redirect path ${srcPath}`)
}

// 11. Regression Check: Zero Unsupported Schema & Zero Internal Links to /convert/
function getAllHtmlFiles(dir) {
  let results = []
  if (!fs.existsSync(dir)) return results
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllHtmlFiles(filePath))
    } else if (file.endsWith('.html')) {
      results.push(filePath)
    }
  }
  return results
}

const allHtmlFiles = getAllHtmlFiles(DIST_DIR)
assert(allHtmlFiles.length >= 60, `Found ${allHtmlFiles.length} generated HTML files in dist to scan`)

let aggregateRatingFound = 0
let ratingCountFound = 0
let reviewCountFound = 0
let ratingValueFound = 0
let internalConvertHrefsFound = 0

const hrefRegex = /href=["'](https:\/\/convertlytools\.xyz)?\/convert\/[^"']*["']/g

for (const file of allHtmlFiles) {
  const content = fs.readFileSync(file, 'utf-8')
  const relPath = path.relative(DIST_DIR, file)

  if (content.includes('"@type":"AggregateRating"') || content.includes('"@type": "AggregateRating"')) {
    aggregateRatingFound++
    console.error(`  ❌ Unsupported AggregateRating found in ${relPath}`)
  }
  if (content.includes('ratingCount')) {
    ratingCountFound++
    console.error(`  ❌ Unsupported ratingCount found in ${relPath}`)
  }
  if (content.includes('reviewCount')) {
    reviewCountFound++
    console.error(`  ❌ Unsupported reviewCount found in ${relPath}`)
  }
  if (content.includes('ratingValue')) {
    ratingValueFound++
    console.error(`  ❌ Unsupported ratingValue found in ${relPath}`)
  }

  const hrefMatches = content.match(hrefRegex)
  if (hrefMatches) {
    internalConvertHrefsFound += hrefMatches.length
    console.error(`  ❌ Internal href link to /convert/ found in ${relPath}: ${hrefMatches.join(', ')}`)
  }
}

assert(aggregateRatingFound === 0, `Zero AggregateRating schema occurrences across dist (found ${aggregateRatingFound})`)
assert(ratingCountFound === 0, `Zero ratingCount occurrences across dist (found ${ratingCountFound})`)
assert(reviewCountFound === 0, `Zero reviewCount occurrences across dist (found ${reviewCountFound})`)
assert(ratingValueFound === 0, `Zero ratingValue occurrences across dist (found ${ratingValueFound})`)
assert(internalConvertHrefsFound === 0, `Zero internal href references to /convert/ across dist HTML (found ${internalConvertHrefsFound})`)

// 12. Destination Pages Canonical Retained & Indexable
const uniqueDestinations = [...new Set(Object.values(CONVERT_REDIRECTS))]
for (const dest of uniqueDestinations) {
  const destHtmlPath = path.join(DIST_DIR, dest.slice(1), 'index.html')
  assert(fs.existsSync(destHtmlPath), `Destination page ${dest} exists in dist`)
  if (fs.existsSync(destHtmlPath)) {
    const destHtml = fs.readFileSync(destHtmlPath, 'utf-8')
    assert(destHtml.includes(`https://convertlytools.xyz${dest}`), `Destination page ${dest} retains correct canonical URL`)
    assert(!destHtml.includes('<meta name="robots" content="noindex'), `Destination page ${dest} is indexable`)
  }
}

// 13. Validate Cloudflare Worker 301 Redirect Logic
const redirectEntries = Object.entries(CONVERT_REDIRECTS)
assert(redirectEntries.length === 12, `Redirect map contains exactly 12 mappings (found ${redirectEntries.length})`)

const mockEnv = {
  ASSETS: {
    fetch: async () => new Response('Asset content', { status: 200 })
  }
}

for (const [sourcePath, destPath] of redirectEntries) {
  // Test 1: Standard URL
  const testUrl = `https://convertlytools.xyz${sourcePath}`
  const res = await worker.fetch(new Request(testUrl), mockEnv)
  assert(res.status === 301, `Worker redirect for ${sourcePath} returns HTTP 301 (got ${res.status})`)
  assert(res.headers.get('Location') === `https://convertlytools.xyz${destPath}`, `Worker Location for ${sourcePath} is ${destPath} (got ${res.headers.get('Location')})`)
  assert(res.headers.get('Cache-Control')?.includes('max-age'), `Worker 301 response has Cache-Control header`)

  // Test 2: URL with trailing slash (normalized)
  const testTrailingUrl = `https://convertlytools.xyz${sourcePath}/`
  const resTrailing = await worker.fetch(new Request(testTrailingUrl), mockEnv)
  assert(resTrailing.status === 301, `Worker redirect for ${sourcePath}/ returns HTTP 301`)
  assert(resTrailing.headers.get('Location') === `https://convertlytools.xyz${destPath}`, `Worker Location for ${sourcePath}/ is ${destPath}`)

  // Test 3: Query string preservation
  const testQueryUrl = `https://convertlytools.xyz${sourcePath}?utm_source=google&campaign=seo2026`
  const resQuery = await worker.fetch(new Request(testQueryUrl), mockEnv)
  assert(resQuery.status === 301, `Worker redirect with query returns HTTP 301`)
  assert(resQuery.headers.get('Location') === `https://convertlytools.xyz${destPath}?utm_source=google&campaign=seo2026`, `Worker preserves query strings for ${sourcePath}`)
}

// Test 4: Ensure /api/* is NOT affected by redirects
const origFetch = globalThis.fetch
globalThis.fetch = async () => new Response(JSON.stringify({ status: 'healthy' }), { status: 200 })
try {
  const apiReq = new Request('https://convertlytools.xyz/api/v1/health')
  const apiRes = await worker.fetch(apiReq, mockEnv)
  assert(apiRes.status === 200, `/api/* requests proxy to backend and do NOT trigger 301 redirect (status ${apiRes.status})`)
} finally {
  globalThis.fetch = origFetch
}

// Test 5: Ensure /assets/* is NOT affected by redirects
const assetReq = new Request('https://convertlytools.xyz/assets/index-test.js')
const assetRes = await worker.fetch(assetReq, mockEnv)
assert(assetRes.status !== 301, `/assets/* requests do NOT trigger 301 redirect`)

// Test 6: Ensure /sw.js is NOT affected by redirects
const swReq = new Request('https://convertlytools.xyz/sw.js')
const swRes = await worker.fetch(swReq, mockEnv)
assert(swRes.status === 404, `/sw.js returns 404, not 301`)

console.log(`\nTechnical SEO Audit Results:`)
console.log(`  Passed assertions: ${passed}`)
console.log(`  Failed assertions: ${failed}`)

if (failed > 0) {
  console.error(`\n❌ Technical SEO Audit FAILED with ${failed} issues.`)
  process.exit(1)
} else {
  console.log(`\n🎉 Technical SEO Audit PASSED 100%! All 12 301 redirects, search routes, clean sitemap, and schemas verified.`)
  process.exitCode = 0
}
