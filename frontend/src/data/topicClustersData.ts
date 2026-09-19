/**
 * Topic Clusters and Semantic Entity Graph
 * Maps document and media operations into authoritative hierarchical and lateral clusters.
 */

export interface TopicClusterNode {
  id: string
  name: string
  slug: string
  category: 'PDF' | 'Office' | 'Images'
  parentTopicId?: string
  childTopicIds: string[]
  siblingTopicIds: string[]
  primaryToolId: string
  searchIntent: 'Transactional' | 'Informational' | 'Commercial' | 'Navigational'
  description: string
  keywords: string[]
}

export const TOPIC_CLUSTER_TREE: Record<string, TopicClusterNode> = {
  // Master Hubs
  'pdf-master': {
    id: 'pdf-master',
    name: 'PDF Management & Processing Suite',
    slug: 'pdf',
    category: 'PDF',
    childTopicIds: ['pdf-organize', 'pdf-convert', 'pdf-security', 'pdf-optimize'],
    siblingTopicIds: ['office-master', 'image-master'],
    primaryToolId: 'pdf-merge',
    searchIntent: 'Navigational',
    description: 'Comprehensive cluster covering manipulation, page reordering, compression, encryption, and transformation of Portable Document Format (PDF) files.',
    keywords: ['pdf tools', 'pdf management', 'online pdf suite', 'pdf editor free']
  },
  'office-master': {
    id: 'office-master',
    name: 'Office Document Interoperability Suite',
    slug: 'office',
    category: 'Office',
    childTopicIds: ['office-to-pdf', 'pdf-to-office'],
    siblingTopicIds: ['pdf-master', 'image-master'],
    primaryToolId: 'pdf-to-word',
    searchIntent: 'Navigational',
    description: 'Bilateral conversion workflows between Microsoft 365 formats (DOCX, XLSX, PPTX) and standard vector PDF.',
    keywords: ['office to pdf', 'convert office documents', 'word excel powerpoint converter']
  },
  'image-master': {
    id: 'image-master',
    name: 'Image Optimization & Conversion Suite',
    slug: 'images',
    category: 'Images',
    childTopicIds: ['image-formats', 'image-compression', 'image-pdf'],
    siblingTopicIds: ['pdf-master', 'office-master'],
    primaryToolId: 'jpg-to-png',
    searchIntent: 'Navigational',
    description: 'High-speed lossless and perceptual image transformation, compression, resizing, and PDF bundling.',
    keywords: ['image converter', 'photo compression', 'convert jpg png webp']
  },

  // PDF Sub-clusters
  'pdf-organize': {
    id: 'pdf-organize',
    name: 'PDF Organization & Page Assembly',
    slug: 'organize-pdf',
    category: 'PDF',
    parentTopicId: 'pdf-master',
    childTopicIds: ['pdf-merge', 'pdf-split', 'pdf-rotate', 'pdf-delete-pages', 'pdf-extract-pages', 'pdf-reorder-pages'],
    siblingTopicIds: ['pdf-security', 'pdf-optimize', 'pdf-convert'],
    primaryToolId: 'pdf-merge',
    searchIntent: 'Commercial',
    description: 'Combine, extract, reorder, and permanently rotate pages within complex PDF documents.',
    keywords: ['combine pdf pages', 'reorder pdf', 'split pdf document']
  },
  'pdf-security': {
    id: 'pdf-security',
    name: 'PDF Security, Redaction & Cryptography',
    slug: 'secure-pdf',
    category: 'PDF',
    parentTopicId: 'pdf-master',
    childTopicIds: ['pdf-protect', 'pdf-unlock', 'pdf-redact', 'pdf-flatten', 'pdf-scrub-metadata'],
    siblingTopicIds: ['pdf-organize', 'pdf-optimize'],
    primaryToolId: 'pdf-protect',
    searchIntent: 'Commercial',
    description: 'AES-256 encryption, password removal, permanent vector redaction, form flattening, and EXIF metadata scrubbing.',
    keywords: ['encrypt pdf', 'password protect pdf', 'redact confidential pdf', 'remove pdf metadata']
  },
  'pdf-optimize': {
    id: 'pdf-optimize',
    name: 'PDF Compression & Archival Optimization',
    slug: 'optimize-pdf',
    category: 'PDF',
    parentTopicId: 'pdf-master',
    childTopicIds: ['pdf-compress', 'pdf-grayscale', 'pdf-flatten'],
    siblingTopicIds: ['pdf-organize', 'pdf-security'],
    primaryToolId: 'pdf-compress',
    searchIntent: 'Transactional',
    description: 'Reduce stream bulk, downsample excess DPI raster images, and convert color profiles to monochrome for efficient distribution.',
    keywords: ['compress pdf size', 'reduce pdf for email', 'grayscale pdf printer ink']
  }
}

/**
 * Sequential topic flow representing standard user journey across PDF lifecycle
 */
export const PDF_LIFECYCLE_CLUSTER = [
  { id: 'pdf-merge', name: 'Merge PDF', step: 1, action: 'Combine disparate reports or attachments into one document' },
  { id: 'pdf-split', name: 'Split PDF', step: 2, action: 'Extract target chapters, invoices, or distinct sections' },
  { id: 'pdf-compress', name: 'Compress PDF', step: 3, action: 'Reduce megabytes for email attachment or web portal limits' },
  { id: 'pdf-rotate', name: 'Rotate PDF', step: 4, action: 'Correct upside down or sideways scanned pages permanently' },
  { id: 'pdf-protect', name: 'Protect PDF', step: 5, action: 'Apply AES-256 military-grade password encryption' },
  { id: 'pdf-unlock', name: 'Unlock PDF', step: 6, action: 'Decrypt secured documents with authorized credentials' },
  { id: 'pdf-delete-pages', name: 'Delete Pages', step: 7, action: 'Strip blank or unwanted pages from the final master' },
  { id: 'pdf-extract-pages', name: 'Extract Pages', step: 8, action: 'Isolate key pages into a standalone lightweight document' },
  { id: 'pdf-watermark', name: 'Watermark PDF', step: 9, action: 'Stamp copyright, draft notices, or confidentiality badges' },
  { id: 'pdf-redact', name: 'Redact PDF', step: 10, action: 'Blackout sensitive SSNs, financial figures, or confidential text' },
  { id: 'pdf-flatten', name: 'Flatten PDF', step: 11, action: 'Bake interactive forms and annotations permanently into the canvas' },
  { id: 'pdf-grayscale', name: 'Grayscale PDF', step: 12, action: 'Convert full-color layouts to black-and-white to save ink' },
  { id: 'pdf-to-excel', name: 'PDF to Excel', step: 13, action: 'Extract tables, statements, and financial figures into editable spreadsheets' }
]

export function getRelatedClusterTools(toolId: string): { id: string; name: string; action: string }[] {
  const currentIndex = PDF_LIFECYCLE_CLUSTER.findIndex(item => item.id === toolId)
  if (currentIndex === -1) {
    return PDF_LIFECYCLE_CLUSTER.slice(0, 4)
  }
  const prev = PDF_LIFECYCLE_CLUSTER[currentIndex - 1] || PDF_LIFECYCLE_CLUSTER[PDF_LIFECYCLE_CLUSTER.length - 1]
  const next = PDF_LIFECYCLE_CLUSTER[currentIndex + 1] || PDF_LIFECYCLE_CLUSTER[0]
  const other1 = PDF_LIFECYCLE_CLUSTER[(currentIndex + 2) % PDF_LIFECYCLE_CLUSTER.length]
  const other2 = PDF_LIFECYCLE_CLUSTER[(currentIndex + 3) % PDF_LIFECYCLE_CLUSTER.length]

  return [prev, next, other1, other2]
}

export interface ContextualEcosystemLinks {
  guides: { slug: string; title: string }[]
  comparisons: { slug: string; title: string }[]
  useCases: { slug: string; title: string }[]
  programmatic: { slug: string; title: string }[]
}

export function getContextualEcosystemLinks(toolId: string): ContextualEcosystemLinks {
  // Mapping of primary tools to relevant ecosystem links
  const guideMap: Record<string, { slug: string; title: string }[]> = {
    'pdf-to-word': [
      { slug: 'how-to-convert-pdf-to-word-without-losing-formatting', title: 'Convert PDF to Word Without Losing Formatting' },
      { slug: 'how-to-compress-pdf-without-losing-quality', title: 'Compress PDF Without Quality Loss' }
    ],
    'word-to-pdf': [
      { slug: 'how-to-convert-pdf-to-word-without-losing-formatting', title: 'Maintain Fonts & Margins in Word to PDF' },
      { slug: 'how-to-compress-pdf-without-losing-quality', title: 'Compress PDF for Email Distribution' }
    ],
    'pdf-compress': [
      { slug: 'how-to-compress-pdf-without-losing-quality', title: 'How to Compress PDF Without Losing Quality' },
      { slug: 'how-to-merge-pdf-files', title: 'How to Merge Multiple PDF Files' }
    ],
    'pdf-merge': [
      { slug: 'how-to-merge-pdf-files', title: 'How to Merge Multiple PDF Files into One' },
      { slug: 'how-to-split-pdf-pages', title: 'How to Split PDF Pages & Extract Ranges' }
    ],
    'pdf-split': [
      { slug: 'how-to-split-pdf-pages', title: 'How to Split PDF Pages and Extract Sections' },
      { slug: 'how-to-merge-pdf-files', title: 'How to Merge Multiple PDF Files' }
    ],
    'excel-to-pdf': [
      { slug: 'how-to-convert-excel-to-pdf', title: 'Convert Excel to PDF Without Cutting Off Columns' },
      { slug: 'how-to-compress-pdf-without-losing-quality', title: 'Compress PDF for Email Distribution' }
    ],
    'pdf-to-excel': [
      { slug: 'how-to-extract-tables-from-pdf-to-excel', title: 'Extract Tables from PDF to Excel (XLSX)' },
      { slug: 'how-to-convert-excel-to-pdf', title: 'Convert Excel to PDF Without Cutting Off Columns' }
    ],
    'ppt-to-pdf': [
      { slug: 'how-to-convert-powerpoint-to-pdf', title: 'Convert PowerPoint Slides to Universal Handouts' },
      { slug: 'how-to-compress-pdf-without-losing-quality', title: 'Compress PDF Presentation Decks' }
    ],
    'images-to-pdf': [
      { slug: 'how-to-convert-images-into-pdf', title: 'Convert Images into a Single PDF Document' },
      { slug: 'how-to-merge-pdf-files', title: 'How to Merge Multiple PDF Files' }
    ],
    'jpg-to-png': [
      { slug: 'how-to-convert-images-into-pdf', title: 'Convert Graphic Formats Without Quality Loss' },
      { slug: 'how-to-compress-pdf-without-losing-quality', title: 'Asset Downsampling Principles' }
    ],
    'png-to-jpg': [
      { slug: 'how-to-convert-images-into-pdf', title: 'Convert Transparent Assets to Standard JPG' },
      { slug: 'how-to-compress-pdf-without-losing-quality', title: 'Lossless Compression Fundamentals' }
    ],
    'pdf-redact': [
      { slug: 'how-to-compress-pdf-without-losing-quality', title: 'Optimize Court Briefs for Electronic Filing' },
      { slug: 'how-to-merge-pdf-files', title: 'Consolidate Redacted Exhibits' }
    ]
  }

  const defaultGuides = [
    { slug: 'how-to-compress-pdf-without-losing-quality', title: 'How to Compress PDF Without Losing Quality' },
    { slug: 'how-to-convert-pdf-to-word-without-losing-formatting', title: 'Convert PDF to Word Without Formatting Loss' }
  ]

  const comparisons = [
    { slug: 'convertly-vs-smallpdf', title: 'Convertly vs Smallpdf' },
    { slug: 'convertly-vs-ilovepdf', title: 'Convertly vs iLovePDF' },
    { slug: 'convertly-vs-adobe-acrobat', title: 'Convertly vs Adobe Acrobat' }
  ]

  const useCaseMap: Record<string, { slug: string; title: string }[]> = {
    'pdf-to-word': [
      { slug: 'students', title: 'For College & University Students' },
      { slug: 'businesses', title: 'For Small Businesses & Enterprises' },
      { slug: 'freelancers', title: 'For Independent Contractors' }
    ],
    'pdf-to-excel': [
      { slug: 'businesses', title: 'For Financial Analysts & Accountants' },
      { slug: 'freelancers', title: 'For Independent Contractors & Invoicing' },
      { slug: 'lawyers', title: 'For Legal Discovery & Document Audits' }
    ],
    'pdf-redact': [
      { slug: 'lawyers', title: 'For Lawyers & Legal Counsel' },
      { slug: 'hr', title: 'For HR & Personnel Records' },
      { slug: 'businesses', title: 'For Corporate Compliance' }
    ],
    'pdf-protect': [
      { slug: 'lawyers', title: 'For Lawyers & Legal Counsel' },
      { slug: 'businesses', title: 'For Confidential Financial Data' },
      { slug: 'hr', title: 'For Employee PII Safeguarding' }
    ],
    'jpg-to-png': [
      { slug: 'designers', title: 'For Digital Graphic Designers' },
      { slug: 'freelancers', title: 'For Web & Content Creators' },
      { slug: 'businesses', title: 'For Marketing Collateral' }
    ],
    'png-to-jpg': [
      { slug: 'designers', title: 'For Digital Graphic Designers' },
      { slug: 'freelancers', title: 'For Web & Content Creators' },
      { slug: 'businesses', title: 'For Marketing Collateral' }
    ]
  }

  const defaultUseCases = [
    { slug: 'students', title: 'For College & University Students' },
    { slug: 'businesses', title: 'For Small Businesses & Enterprises' },
    { slug: 'lawyers', title: 'For Lawyers & Legal Counsel' }
  ]

  const progMap: Record<string, { slug: string; title: string }[]> = {
    'pdf-to-word': [
      { slug: 'pdf-to-word-online', title: 'PDF to Word Online' },
      { slug: 'pdf-to-word-free', title: 'Free PDF to Word' },
      { slug: 'pdf-to-word-windows', title: 'PDF to Word Windows' },
      { slug: 'pdf-to-word-mac', title: 'PDF to Word Mac' }
    ],
    'pdf-to-excel': [],
    'word-to-pdf': [
      { slug: 'word-to-pdf', title: 'Word to PDF Online' },
      { slug: 'merge-pdf-online', title: 'Merge PDF Online' }
    ],
    'pdf-merge': [
      { slug: 'merge-pdf-online', title: 'Merge PDF Online' },
      { slug: 'compress-pdf-online', title: 'Compress PDF Online' }
    ],
    'pdf-compress': [
      { slug: 'compress-pdf-online', title: 'Compress PDF Online' },
      { slug: 'convert-pdf-without-losing-formatting', title: 'Preserve Formatting Guide' }
    ],
    'jpg-to-png': [
      { slug: 'convert-jpg-to-png', title: 'Convert JPG to PNG Online' },
      { slug: 'convert-image-to-pdf', title: 'Convert Image to PDF' }
    ],
    'png-to-jpg': [
      { slug: 'convert-jpg-to-png', title: 'Convert JPG to PNG Online' },
      { slug: 'convert-image-to-pdf', title: 'Convert Image to PDF' }
    ],
    'images-to-pdf': [
      { slug: 'convert-image-to-pdf', title: 'Convert Image to PDF Online' },
      { slug: 'merge-pdf-online', title: 'Merge PDF Online' }
    ]
  }

  const defaultProg = [
    { slug: 'pdf-to-word-online', title: 'PDF to Word Online' },
    { slug: 'merge-pdf-online', title: 'Merge PDF Online' },
    { slug: 'compress-pdf-online', title: 'Compress PDF Online' }
  ]

  return {
    guides: guideMap[toolId] || defaultGuides,
    comparisons,
    useCases: useCaseMap[toolId] || defaultUseCases,
    programmatic: progMap[toolId] || defaultProg
  }
}
