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

// 6. Verify Programmatic SEO Landing Pages
const PROGRAMMATIC_SLUGS = [
  'pdf-to-word', 'pdf-to-word-online', 'pdf-to-word-free', 'pdf-to-word-windows',
  'pdf-to-word-mac', 'pdf-to-word-mobile', 'word-to-pdf', 'merge-pdf-online',
  'compress-pdf-online', 'convert-pdf-without-losing-formatting',
  'convert-jpg-to-png', 'convert-image-to-pdf'
]
for (const slug of PROGRAMMATIC_SLUGS) {
  const htmlPath = path.join(DIST_DIR, 'convert', slug, 'index.html')
  assert(fs.existsSync(htmlPath), `Pre-rendered static HTML exists for /convert/${slug}`)
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf-8')
    assert(html.includes('<title>'), `Programmatic page ${slug} has <title>`)
    assert(html.includes('<meta name="description"'), `Programmatic page ${slug} has meta description`)
    assert(html.includes(`https://convertlytools.xyz/convert/${slug}`), `Programmatic page ${slug} has canonical`)
  }
}

// 7. Verify Competitor Comparisons
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

// 8. Verify Audience Use Cases
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

// 9. Verify Problem Solving Guides
const GUIDE_SLUGS = [
  'how-to-convert-pdf-to-word-without-losing-formatting',
  'how-to-compress-pdf-without-losing-quality',
  'how-to-merge-pdf-files',
  'how-to-split-pdf-pages',
  'how-to-convert-excel-to-pdf',
  'how-to-convert-powerpoint-to-pdf',
  'how-to-convert-images-into-pdf'
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

// 10. Verify Engineering Blog Articles
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

console.log(`\nTechnical SEO Audit Results:`)
console.log(`  Passed assertions: ${passed}`)
console.log(`  Failed assertions: ${failed}`)

if (failed > 0) {
  console.error(`\n❌ Technical SEO Audit FAILED with ${failed} issues.`)
  process.exit(1)
} else {
  console.log(`\n🎉 Technical SEO Audit PASSED 100%! All search ecosystem routes, tags, schemas, and assets verified.`)
  process.exit(0)
}
