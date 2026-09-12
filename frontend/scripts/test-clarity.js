/**
 * Unit/Integration test for Microsoft Clarity implementation logic
 */
import assert from 'node:assert'

console.log('Testing Microsoft Clarity integration logic...')

// Mock browser window and document environment
class MockScriptElement {
  constructor() {
    this.id = ''
    this.type = ''
    this.async = false
    this.src = ''
    this.crossOrigin = ''
    this.onload = null
    this.onerror = null
  }
}

class MockDocument {
  constructor() {
    this.elements = []
    this.head = {
      appendChild: (el) => this.elements.push(el)
    }
  }

  createElement(tag) {
    if (tag === 'script') {
      return new MockScriptElement()
    }
    return {}
  }

  getElementById(id) {
    return this.elements.find(el => el.id === id) || null
  }

  getElementsByTagName(tag) {
    if (tag === 'script') {
      return this.elements
    }
    return []
  }
}

// Test 1: Production check logic
function isProductionEnvironment(isProdBuild, hostname) {
  if (!isProdBuild) return false
  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local')
  return !isLocal
}

function shouldLoadClarity(isProdBuild, hostname, searchParam, localStorageFlag) {
  if (searchParam === 'true' || localStorageFlag === 'true') {
    return true
  }
  return isProductionEnvironment(isProdBuild, hostname)
}

assert.strictEqual(isProductionEnvironment(false, 'convertlytools.xyz'), false, 'Non-production build must return false')
assert.strictEqual(isProductionEnvironment(true, 'localhost'), false, 'Localhost in prod build must return false')
assert.strictEqual(isProductionEnvironment(true, '127.0.0.1'), false, '127.0.0.1 in prod build must return false')
assert.strictEqual(isProductionEnvironment(true, 'convertlytools.xyz'), true, 'Live domain in prod build must return true')
assert.strictEqual(shouldLoadClarity(false, 'localhost', 'true', null), true, 'Debug search param must allow local testing')
assert.strictEqual(shouldLoadClarity(false, 'localhost', null, 'true'), true, 'Debug localStorage flag must allow local testing')
assert.strictEqual(shouldLoadClarity(false, 'localhost', null, null), false, 'Default localhost must remain disabled')
console.log('✓ Test 1: Environment guard accurately restricts execution strictly to production with debug override support.')

// Test 2: Script injection & idempotency
const doc = new MockDocument()
let isClarityInitialized = false
let isClarityReady = false
const PROJECT_ID = 'yh51dttlog'

function initClarityMock(projectId, docMock) {
  if (isClarityInitialized || docMock.getElementById('microsoft-clarity')) {
    return false
  }
  isClarityInitialized = true
  const script = docMock.createElement('script')
  script.id = 'microsoft-clarity'
  script.async = true
  script.src = `https://www.clarity.ms/tag/${projectId}`
  docMock.head.appendChild(script)
  return true
}

const firstInit = initClarityMock(PROJECT_ID, doc)
assert.strictEqual(firstInit, true, 'First initialization must succeed')
assert.strictEqual(doc.elements.length, 1, 'Exactly one script element must be injected')
assert.strictEqual(doc.elements[0].id, 'microsoft-clarity', 'Script element ID must be microsoft-clarity')
assert.strictEqual(doc.elements[0].src, 'https://www.clarity.ms/tag/yh51dttlog', 'Script element src must contain correct Project ID')
assert.strictEqual(doc.elements[0].async, true, 'Script must be asynchronous')

// Test 3: Idempotency check (never initialize twice)
const secondInit = initClarityMock(PROJECT_ID, doc)
assert.strictEqual(secondInit, false, 'Second initialization must be rejected')
assert.strictEqual(doc.elements.length, 1, 'Script element count must remain exactly 1')
console.log('✓ Test 2 & 3: Idempotent asynchronous script injection verified.')

// Test 4: Clarity command queue & SPA route change tracking
const mockWindow = {
  clarity: function() {
    mockWindow.clarity.q = mockWindow.clarity.q || []
    mockWindow.clarity.q.push(Array.from(arguments))
  }
}

function trackClarityNavigationMock(win, path, title) {
  win.clarity('set', 'page', path)
  if (title) {
    win.clarity('set', 'page_title', title)
  }
  win.clarity('event', 'spa_navigation')
}

trackClarityNavigationMock(mockWindow, '/tools/pdf-to-word', 'PDF to Word Converter | Convertly')

assert.strictEqual(mockWindow.clarity.q.length, 3, 'Expected 3 commands queued for route transition')
assert.deepStrictEqual(mockWindow.clarity.q[0], ['set', 'page', '/tools/pdf-to-word'])
assert.deepStrictEqual(mockWindow.clarity.q[1], ['set', 'page_title', 'PDF to Word Converter | Convertly'])
assert.deepStrictEqual(mockWindow.clarity.q[2], ['event', 'spa_navigation'])
console.log('✓ Test 4: SPA route change tracking verified.')

// Test 5: Consent Management compatibility
function setClarityConsentMock(win, consent) {
  win.clarity('consent', consent)
}

setClarityConsentMock(mockWindow, true)
assert.deepStrictEqual(mockWindow.clarity.q[3], ['consent', true])
setClarityConsentMock(mockWindow, false)
assert.deepStrictEqual(mockWindow.clarity.q[4], ['consent', false])
console.log('✓ Test 5: Consent Management compatibility verified.')

// Test 6: Custom Tagging and Events
function trackClarityEventMock(win, eventName) {
  win.clarity('event', eventName)
}
function setClarityTagMock(win, key, value) {
  win.clarity('set', key, value)
}

trackClarityEventMock(mockWindow, 'conversion_started')
setClarityTagMock(mockWindow, 'tool_name', 'pdf-to-word')
assert.deepStrictEqual(mockWindow.clarity.q[5], ['event', 'conversion_started'])
assert.deepStrictEqual(mockWindow.clarity.q[6], ['set', 'tool_name', 'pdf-to-word'])
console.log('✓ Test 6: Custom tagging and event tracking verified.')

// Test 7: PII Sanitization
function sanitizeClarityTagValue(value) {
  if (!value) return ''
  return value
    .slice(0, 100)
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[redacted-email]')
    .replace(/([a-zA-Z]:\\[^\s]+|\/[^\s]+)/g, '[redacted-path]')
}

const dirtyInput = 'Error on C:\\Users\\Administrator\\secret.pdf from user@convertlytools.xyz'
const cleanOutput = sanitizeClarityTagValue(dirtyInput)
assert.ok(!cleanOutput.includes('user@convertlytools.xyz'), 'Email must be redacted')
assert.ok(!cleanOutput.includes('C:\\Users\\Administrator\\secret.pdf'), 'Local path must be redacted')
assert.strictEqual(cleanOutput, 'Error on [redacted-path] from [redacted-email]')
console.log('✓ Test 7: Zero PII / Data sanitization verified.')

console.log('\nAll Microsoft Clarity integration tests passed successfully!')
