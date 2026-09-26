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
  assert(urlCount === 74, `sitemap contains exactly 74 URLs (found ${urlCount})`)
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
  'how-to-extract-financial-tables-from-pdf-to-excel',
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
let invalidHrefsFound = 0
let footerApiLinksFound = 0

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

  if (content.includes('href="undefined"') || content.includes("href='undefined'")) {
    invalidHrefsFound++
    console.error(`  ❌ Invalid href="undefined" found in ${relPath}`)
  }
  if (content.includes('href="null"') || content.includes("href='null'")) {
    invalidHrefsFound++
    console.error(`  ❌ Invalid href="null" found in ${relPath}`)
  }

  const footerMatch = content.match(/<footer[\s\S]*?<\/footer>/i)
  if (footerMatch && (footerMatch[0].includes('href="/api/') || footerMatch[0].includes('href="https://convertlytools.xyz/api/'))) {
    footerApiLinksFound++
    console.error(`  ❌ Footer links to disallowed /api/ in ${relPath}`)
  }
}

assert(aggregateRatingFound === 0, `Zero AggregateRating schema occurrences across dist (found ${aggregateRatingFound})`)
assert(ratingCountFound === 0, `Zero ratingCount occurrences across dist (found ${ratingCountFound})`)
assert(reviewCountFound === 0, `Zero reviewCount occurrences across dist (found ${reviewCountFound})`)
assert(ratingValueFound === 0, `Zero ratingValue occurrences across dist (found ${ratingValueFound})`)
assert(internalConvertHrefsFound === 0, `Zero internal href references to /convert/ across dist HTML (found ${internalConvertHrefsFound})`)
assert(invalidHrefsFound === 0, `Zero invalid href="undefined" or href="null" across dist HTML (found ${invalidHrefsFound})`)
assert(footerApiLinksFound === 0, `Zero /api/ links inside <footer> across dist HTML (found ${footerApiLinksFound})`)

// 11b. Verify Exact 1 H1 and Valid Canonical Across Every Generated HTML File
let h1Violations = 0
let canonicalViolations = 0
let jsonLdParseErrors = 0

for (const file of allHtmlFiles) {
  const content = fs.readFileSync(file, 'utf-8')
  const relPath = path.relative(DIST_DIR, file)

  // H1 Check
  const h1Matches = content.match(/<h1[\s>]/gi) || []
  if (h1Matches.length !== 1) {
    h1Violations++
    console.error(`  ❌ Expected exactly 1 <h1> in ${relPath}, found ${h1Matches.length}`)
  }

  // Canonical Check
  const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)
  if (!canonicalMatch || !canonicalMatch[1].startsWith('https://convertlytools.xyz')) {
    canonicalViolations++
    console.error(`  ❌ Missing or invalid canonical in ${relPath}`)
  }

  // JSON-LD Validation
  const jsonLdMatches = [...content.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const match of jsonLdMatches) {
    try {
      JSON.parse(match[1])
    } catch (e) {
      jsonLdParseErrors++
      console.error(`  ❌ Malformed JSON-LD in ${relPath}: ${e.message}`)
    }
  }
}

assert(h1Violations === 0, `All ${allHtmlFiles.length} generated HTML files have exactly one <h1> (found ${h1Violations} violations)`)
assert(canonicalViolations === 0, `All ${allHtmlFiles.length} generated HTML files have valid canonical URLs (found ${canonicalViolations} violations)`)
assert(jsonLdParseErrors === 0, `All JSON-LD blocks across ${allHtmlFiles.length} HTML files parse cleanly without syntax error (found ${jsonLdParseErrors} errors)`)

// 11c. Verify Homepage Static Prerender SEO & Structured Data
const homepagePath = path.join(DIST_DIR, 'index.html')
assert(fs.existsSync(homepagePath), 'Homepage index.html exists in dist')
if (fs.existsSync(homepagePath)) {
  const homeContent = fs.readFileSync(homepagePath, 'utf-8')
  
  // Crawlable tool links to all 31 tools
  let missingHomeToolLinks = 0
  for (const tool of TOOLS) {
    if (!homeContent.includes(`href="/tools/${tool}"`)) {
      missingHomeToolLinks++
      console.error(`  ❌ Homepage missing crawlable link to /tools/${tool}`)
    }
  }
  assert(missingHomeToolLinks === 0, `Homepage contains crawlable links to all ${TOOLS.length} active tools (missing ${missingHomeToolLinks})`)

  // Sections
  assert(homeContent.includes('How Convertly Works'), 'Homepage contains "How Convertly Works" static section')
  assert(homeContent.includes('Frequently Asked Questions'), 'Homepage contains FAQ static section')
  assert(homeContent.includes('Enterprise Privacy &amp; Automated Data Sanitation') || homeContent.includes('Enterprise Privacy & Automated Data Sanitation'), 'Homepage contains Privacy & Architecture static section')

  // Homepage Schema Assertions
  const homeSchemaMatch = homeContent.match(/<script id="convertly-schema-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/)
  assert(!!homeSchemaMatch, 'Homepage contains convertly-schema-jsonld script')
  if (homeSchemaMatch) {
    try {
      const homeSchemas = JSON.parse(homeSchemaMatch[1])
      assert(Array.isArray(homeSchemas), 'Homepage schema is an array of structured objects')
      const types = homeSchemas.map(s => s['@type'])
      assert(types.includes('WebSite'), 'Homepage schema includes WebSite')
      assert(types.includes('WebApplication'), 'Homepage schema includes WebApplication')
      assert(types.includes('FAQPage'), 'Homepage schema includes FAQPage')
      assert(types.includes('Organization'), 'Homepage schema includes Organization')

      // Assert intentionally omitted SearchAction (client-side search only)
      const schemaString = JSON.stringify(homeSchemas)
      assert(!schemaString.includes('SearchAction'), 'Homepage schema intentionally omits SearchAction because search is client-side only')
      assert(!schemaString.includes('AggregateRating'), 'Homepage schema does not contain AggregateRating')
      assert(!schemaString.includes('Review'), 'Homepage schema does not contain Review')
      assert(!schemaString.includes('contactPoint'), 'Homepage Organization schema omits unverified contactPoint')
      assert(!schemaString.includes('github.com/convertly'), 'Homepage Organization schema omits unverified sameAs GitHub profile')
    } catch (err) {
      assert(false, `Homepage schema parses cleanly: ${err.message}`)
    }
  }
}

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

// 14. Verify Factual Compliance & Security Claims Across dist HTML
const forbiddenTerms = [
  { name: 'ISO 27001 / ISO/IEC 27001', pattern: /ISO[\s\/-]?27001|ISO\/IEC\s*27001/i },
  { name: 'SOC 2 / SOC 2 Type II', pattern: /SOC\s*2/i },
  { name: 'HIPAA', pattern: /HIPAA/i },
  { name: 'FERPA', pattern: /FERPA/i },
  { name: 'AES-256 at rest / platform encryption', pattern: /AES-256\s+(encryption\s+)?at\s+rest|encrypted\s+at\s+rest/i },
  { name: 'End-to-End Encryption / E2EE / zero-knowledge', pattern: /End-to-End\s+Encryption|\bE2EE\b|zero-knowledge/i },
  { name: 'Cryptographic / multi-pass shredding / zero-byte wiping', pattern: /cryptographic(ally)?\s+shred|multi-pass\s+shred|multi-pass\s+deletion|zero-byte\s+wip/i },
  { name: 'Auto-Shred / auto shred / shredded / shredder', pattern: /auto-shred|auto\s+shred|shredded|shredder/i },
  { name: 'Zero Data Retention / Zero Retention Guarantee / permanent retention', pattern: /Zero\s+Data\s+Retention|Zero\s+Retention\s+Guarantee|permanent\s+retention/i },
  { name: 'Broad AI Training Guarantee / Commitment / SLA', pattern: /No\s+AI\s+Training\s+Commitment|Zero\s+AI\s+Training\s+Commitment|Zero\s+AI\s+Training\s+Guarantee|AI\s+Training\s+Guarantee|AI\s+Training\s+SLA/i },
  { name: 'Unverified GitHub profile in schema', pattern: /github\.com\/convertly/i },
  { name: 'Memory-only / files never touch disk / never persisted to disk / zero disk', pattern: /memory-only|never\s+touch\s+disk|never\s+persisted\s+to\s+disk|never\s+written\s+to\s+disk|zero\s+disk|RAM-only/i },
  { name: 'Unverified isolation (isolated server environments / sandboxed processing / containerized processing)', pattern: /isolated\s+server\s+environments|isolated\s+processing|sandboxed\s+processing|containerized\s+processing|dedicated\s+isolated\s+workers/i },
  { name: 'Antivirus pre-scanning', pattern: /antivirus\s+pre-scanning/i },
  { name: 'Bank-Grade / Military-Grade Architecture / Security', pattern: /Bank-Grade\s+Architecture|Military-Grade\s+Security|Military-Grade\s+Privacy/i },
  { name: 'Manual file deletion after download', pattern: /delete\s+them\s+manually/i },
]

for (const rule of forbiddenTerms) {
  let ruleFound = 0
  for (const file of allHtmlFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const relPath = path.relative(DIST_DIR, file)
    if (rule.pattern.test(content)) {
      ruleFound++
      console.error(`  ❌ Forbidden term [${rule.name}] found in ${relPath}`)
    }
  }
  assert(ruleFound === 0, `Zero occurrences of [${rule.name}] across dist HTML (found ${ruleFound})`)
}

// Ensure legitimate AES-256 document encryption IS preserved on PDF Protect
const pdfProtectHtmlPath = path.join(DIST_DIR, 'tools', 'pdf-protect', 'index.html')
if (fs.existsSync(pdfProtectHtmlPath)) {
  const protectHtml = fs.readFileSync(pdfProtectHtmlPath, 'utf-8')
  assert(protectHtml.includes('AES-256'), 'PDF Protect page legitimately preserves AES-256 document encryption capability')
}

// 15. Verify HTML Sitemap Tool Links
const sitemapHtmlPath = path.join(DIST_DIR, 'sitemap', 'index.html')
assert(fs.existsSync(sitemapHtmlPath), 'HTML sitemap exists in dist')
if (fs.existsSync(sitemapHtmlPath)) {
  const sitemapHtml = fs.readFileSync(sitemapHtmlPath, 'utf-8')
  assert(!sitemapHtml.includes('href="undefined"'), 'HTML sitemap contains 0 href="undefined" links')
  for (const tool of TOOLS) {
    assert(sitemapHtml.includes(`/tools/${tool}`), `HTML sitemap contains valid link to /tools/${tool}`)
  }
}

// 16. Verify Global Static Footer Across Representative Routes
const REPRESENTATIVE_FOOTER_PAGES = [
  '',
  'tools/pdf-merge',
  'guides/how-to-merge-pdf-files',
  'blog/the-definitive-guide-to-lossless-pdf-compression',
  'compare/convertly-vs-smallpdf',
  'use-cases/students',
  'privacy',
  'developers',
  'sitemap'
]

for (const relRoute of REPRESENTATIVE_FOOTER_PAGES) {
  const pageFile = relRoute === '' ? path.join(DIST_DIR, 'index.html') : path.join(DIST_DIR, relRoute, 'index.html')
  assert(fs.existsSync(pageFile), `Page exists for footer check: /${relRoute}`)
  if (fs.existsSync(pageFile)) {
    const html = fs.readFileSync(pageFile, 'utf-8')
    assert(html.includes('<footer') && html.includes('</footer>'), `Prerendered HTML contains semantic <footer> on /${relRoute}`)
    assert(html.includes('href="/tools"'), `Static footer on /${relRoute} links to /tools`)
    assert(html.includes('href="/privacy"'), `Static footer on /${relRoute} links to /privacy`)
    assert(html.includes('href="/sitemap"'), `Static footer on /${relRoute} links to /sitemap`)
    assert(html.includes('href="/developers"'), `Static footer on /${relRoute} links to /developers`)
  }
}

// 17. Verify Global Navigation Policy: No /api/v1/docs in Sitewide Navigation
const footerSrcPath = path.resolve(__dirname, '../src/components/layout/Footer.tsx')
if (fs.existsSync(footerSrcPath)) {
  const footerSrc = fs.readFileSync(footerSrcPath, 'utf-8')
  assert(!footerSrc.includes('/api/v1/docs'), 'React Footer.tsx does NOT link directly to /api/v1/docs')
  assert(footerSrc.includes('/developers'), 'React Footer.tsx links to public /developers')
}

// 18. Verify Active Tool Count Consistency
assert(TOOLS.length === 31, `Active tools array in verify-seo.js contains exactly 31 tools (found ${TOOLS.length})`)

console.log(`\nTechnical SEO Audit Results:`)
console.log(`  Passed assertions: ${passed}`)
console.log(`  Failed assertions: ${failed}`)

if (failed > 0) {
  console.error(`\n❌ Technical SEO Audit FAILED with ${failed} issues.`)
  process.exit(1)
} else {
  console.log(`\n🎉 Technical SEO Audit PASSED 100%! All 12 301 redirects, search routes, clean sitemap, single H1s, and schemas verified.`)
  process.exitCode = 0
}
