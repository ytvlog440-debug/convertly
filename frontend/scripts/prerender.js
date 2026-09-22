import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BLOG_POSTS_DATA } from '../src/data/blogData.ts'
import { PROBLEM_GUIDES_DATA } from '../src/data/guidesData.ts'
import { COMPARISONS_DATA } from '../src/data/comparisonsData.ts'
import { USE_CASES_DATA } from '../src/data/useCasesData.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_DIR = path.resolve(__dirname, '../dist')
const INDEX_PATH = path.join(DIST_DIR, 'index.html')
const BASE_DOMAIN = 'https://convertlytools.xyz'

if (!fs.existsSync(INDEX_PATH)) {
  console.error(`[Prerender Error] ${INDEX_PATH} does not exist. Run vite build first.`)
  process.exit(1)
}

const template = fs.readFileSync(INDEX_PATH, 'utf-8')

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}


const TOOLS = [
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    category: 'Office',
    title: 'PDF to Word Converter — Convert PDF to Editable DOCX Online Free',
    description: 'Convert PDF to Word DOCX online for free. Features optical character recognition (OCR) for scanned PDFs, preserving original tables, fonts, and layouts with automatic file deletion.',
    keywords: 'pdf to word, convert pdf to word, pdf to docx, pdf to word editable, ocr pdf to word, free online pdf converter, convertly',
    badge: 'Smart OCR & Editable DOCX',
    summary: 'Transform PDF documents into editable Microsoft Word (.docx) files with formatting, tables, and typography preserved.',
    steps: [
      { number: 1, title: 'Upload PDF Document', desc: 'Drag and drop your PDF file or select it from your device storage.' },
      { number: 2, title: 'Enable Smart OCR (Optional)', desc: 'For scanned documents or image-based PDFs, enable OCR to convert pixel characters into editable text.' },
      { number: 3, title: 'Execute Conversion', desc: 'Click "Convert to Word". Our native engine analyzes layout, vectors, and font styles in seconds.' },
      { number: 4, title: 'Instant Download & QR Transfer', desc: 'Download your editable Word document or scan the secure QR code to save directly to your phone.' },
    ],
    faqs: [
      { question: 'Is Convertly’s PDF to Word converter completely free?', answer: 'Yes, 100% free with no subscription, daily file limits, or hidden fees.' },
      { question: 'Can I convert scanned PDF documents with images of text?', answer: 'Yes. Convertly features integrated Tesseract OCR to recognize text from scanned pages.' },
      { question: 'How long are my files kept on your servers?', answer: 'Files are automatically deleted after 120 minutes with zero permanent retention.' },
    ],
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    category: 'Office',
    title: 'Word to PDF Converter — Convert DOCX & DOC to PDF Online Free',
    description: 'Convert Microsoft Word (DOCX, DOC) to PDF online for free. Preserves exact fonts, margins, vector tables, and headers with zero data retention.',
    keywords: 'word to pdf, convert word to pdf, docx to pdf, doc to pdf, free word to pdf converter, convertly',
    badge: 'Pixel-Perfect Vector PDF',
    summary: 'Convert Word documents (DOCX, DOC) into universal, standardized PDF files with 100% layout and font preservation.',
    steps: [
      { number: 1, title: 'Select Word Document', desc: 'Upload your .docx or .doc file into the conversion dropzone.' },
      { number: 2, title: 'Process Conversion', desc: 'Our native office rendering engine parses styles, footnotes, tables, and images.' },
      { number: 3, title: 'Download Standard PDF', desc: 'Save your publication-ready PDF instantly or transfer to mobile via QR code.' },
    ],
    faqs: [
      { question: 'Will my fonts and margins look identical?', answer: 'Yes, our backend engine renders exact font metrics and margin layouts matching Microsoft Word.' },
      { question: 'Can I convert older .doc files?', answer: 'Yes, both modern DOCX and legacy DOC formats are fully supported.' },
    ],
  },
  {
    id: 'pdf-merge',
    name: 'Merge PDF',
    category: 'PDF',
    title: 'Merge PDF Online — Combine Multiple PDF Files Free | Convertly',
    description: 'Combine and merge multiple PDF documents into a single organized file in seconds. Drag to reorder pages with zero data retention and no file size limits.',
    keywords: 'merge pdf, combine pdf, join pdf files, merge pdf online free, pdf joiner, convertly',
    badge: 'Multi-File Drag & Drop',
    summary: 'Merge multiple PDF documents into a single cohesive, high-speed vector PDF with intuitive drag-and-drop ordering.',
    steps: [
      { number: 1, title: 'Upload Multiple PDFs', desc: 'Select or drag multiple PDF files into the upload staging area.' },
      { number: 2, title: 'Arrange Document Order', desc: 'Drag and reorder files into your exact desired sequential order.' },
      { number: 3, title: 'Merge Files', desc: 'Click "Merge PDFs" to combine all pages into one unified document.' },
      { number: 4, title: 'Download Result', desc: 'Save your merged document immediately or transfer via QR code.' },
    ],
    faqs: [
      { question: 'How many PDF files can I merge at once?', answer: 'You can merge up to 20 PDF files simultaneously up to 100MB total size.' },
      { question: 'Are merged files secure?', answer: 'Yes, files are processed over TLS 1.3 encryption and automatically shredded after 120 minutes.' },
    ],
  },
  {
    id: 'pdf-compress',
    name: 'Compress PDF',
    category: 'PDF',
    title: 'Compress PDF Online — Reduce PDF File Size Free | Convertly',
    description: 'Compress PDF files online while preserving crisp text and sharp image quality. Choose between Extreme, Recommended, or Low compression levels.',
    keywords: 'compress pdf, reduce pdf size, shrink pdf, pdf compressor online free, optimize pdf, convertly',
    badge: 'Smart DPI Optimization',
    summary: 'Reduce PDF file size by up to 90% while maintaining crisp vector typography and high-definition raster graphics.',
    steps: [
      { number: 1, title: 'Upload PDF', desc: 'Drop your large PDF document into the upload dropzone.' },
      { number: 2, title: 'Select Compression Level', desc: 'Choose between Recommended (balanced), Extreme (smallest size), or Low (maximum fidelity).' },
      { number: 3, title: 'Compress & Download', desc: 'Our engine removes redundant streams and downsamples images, providing your optimized PDF.' },
    ],
    faqs: [
      { question: 'Will compressing my PDF make the text blurry?', answer: 'No, vector text remains mathematically crisp; only unneeded image metadata and excess DPI are optimized.' },
      { question: 'Can I compress PDF files for email attachments?', answer: 'Yes, Convertly easily reduces multi-megabyte PDFs down to under 5MB or 10MB email limits.' },
    ],
  },
  {
    id: 'pdf-split',
    name: 'Split PDF',
    category: 'PDF',
    title: 'Split PDF Online — Extract Pages from PDF Free | Convertly',
    description: 'Split PDF files into individual pages or extract custom page ranges online for free. Fast, secure, and private with zero data retention.',
    keywords: 'split pdf, extract pdf pages, separate pdf, cut pdf pages, split pdf online free, convertly',
    badge: 'Precision Page Splitter',
    summary: 'Extract specific pages or page ranges from any PDF document into individual files or a consolidated custom document.',
    steps: [
      { number: 1, title: 'Upload PDF Document', desc: 'Upload the PDF you wish to split or divide.' },
      { number: 2, title: 'Define Page Range', desc: 'Specify custom ranges (e.g. 1-5, 8, 11-14) or split all pages individually.' },
      { number: 3, title: 'Download Extracted Pages', desc: 'Save your extracted PDF or download a ZIP archive containing individual pages.' },
    ],
    faqs: [
      { question: 'Can I split password-protected PDFs?', answer: 'You can unlock the PDF first using Convertly’s Unlock PDF tool, then split with ease.' },
    ],
  },
  {
    id: 'pdf-rotate',
    name: 'Rotate PDF',
    category: 'PDF',
    title: 'Rotate PDF Online — Permanently Rotate PDF Pages 90° 180° Free',
    description: 'Rotate PDF pages permanently online. Rotate clockwise, counter-clockwise, or upside down for all pages or selected pages with zero retention.',
    keywords: 'rotate pdf, turn pdf, rotate pdf 90 degrees, permanent pdf rotation, rotate pdf online, convertly',
    badge: 'Permanent Vector Rotation',
    summary: 'Fix orientation for upside down or sideways scanned PDF pages with permanent 90-degree increments.',
    steps: [
      { number: 1, title: 'Upload PDF', desc: 'Drop your misaligned PDF document into the tool.' },
      { number: 2, title: 'Choose Rotation Angle', desc: 'Rotate 90° clockwise, 180°, or 270° counter-clockwise.' },
      { number: 3, title: 'Save Rotated PDF', desc: 'Apply permanent transformation and download your corrected document.' },
    ],
    faqs: [
      { question: 'Is the rotation permanent when opened in Adobe Acrobat?', answer: 'Yes, page rotation flags are hard-baked into the PDF metadata.' },
    ],
  },
  {
    id: 'images-to-pdf',
    name: 'Images to PDF',
    category: 'PDF',
    title: 'Images to PDF Converter — Convert JPG & PNG to PDF Online Free',
    description: 'Convert JPG, PNG, and WebP images into a single standardized PDF document online. Customize page margins and orientation with zero retention.',
    keywords: 'images to pdf, jpg to pdf, png to pdf, photo to pdf, pictures to pdf, free image to pdf converter, convertly',
    badge: 'Multi-Image PDF Album',
    summary: 'Convert multiple photos, scans, and graphic images into a consolidated, presentation-quality PDF portfolio.',
    steps: [
      { number: 1, title: 'Select Images', desc: 'Upload multiple JPG, PNG, or WebP pictures.' },
      { number: 2, title: 'Arrange Order', desc: 'Reorder images to match your desired sequence.' },
      { number: 3, title: 'Convert to PDF', desc: 'Generate a clean, high-resolution PDF document.' },
    ],
    faqs: [
      { question: 'Can I mix JPG and PNG files in one PDF?', answer: 'Yes, you can combine multiple image formats into one single PDF.' },
    ],
  },
  {
    id: 'excel-to-pdf',
    name: 'Excel to PDF',
    category: 'Office',
    title: 'Excel to PDF Converter — Convert XLSX & XLS to PDF Online Free',
    description: 'Convert Microsoft Excel spreadsheets (XLSX, XLS) into professional PDF documents. Preserves gridlines, formulas, fonts, and chart formatting.',
    keywords: 'excel to pdf, convert xlsx to pdf, xls to pdf, spreadsheet to pdf, free excel to pdf, convertly',
    badge: 'High-Fidelity Sheet Renderer',
    summary: 'Transform Excel workbooks and sheets into clean, shareable PDF documents without distorted column widths.',
    steps: [
      { number: 1, title: 'Upload Excel File', desc: 'Drop your XLSX or XLS spreadsheet.' },
      { number: 2, title: 'Render Document', desc: 'Our engine paginates sheets and preserves table structures.' },
      { number: 3, title: 'Download PDF', desc: 'Save your ready-to-share PDF report.' },
    ],
    faqs: [
      { question: 'Are complex charts and formulas preserved?', answer: 'Yes, visual charts and computed formula outputs are converted faithfully.' },
    ],
  },
  {
    id: 'pdf-to-excel',
    name: 'PDF to Excel',
    category: 'Office',
    title: 'PDF to Excel Converter — Free Table & Spreadsheet Extraction | Convertly',
    description: 'Convert PDF to Excel online free. Extract tables from invoices, bank statements, and financial reports to editable XLSX spreadsheets. Smart OCR for scanned PDFs.',
    keywords: 'pdf to excel, convert pdf to excel, pdf to xlsx, extract pdf tables to excel, scanned pdf to excel, bank statement pdf to excel, pdf table extraction, invoice to excel, free pdf to excel converter, convertly',
    badge: 'Smart Table Extraction & OCR',
    summary: 'Extract tables, invoices, and financial reports from PDF into structured, editable Microsoft Excel (.xlsx) workbooks with preserved numbers and formulas.',
    steps: [
      { number: 1, title: 'Upload Your PDF Document', desc: 'Drag and drop your PDF into the upload zone above or browse from your computer or mobile device. Files up to 100MB are supported.' },
      { number: 2, title: 'Configure Extraction & OCR Settings', desc: 'Enable Smart OCR if your document contains scanned pages or photographed tables. Select your desired spreadsheet preferences.' },
      { number: 3, title: 'Click "Process File Now"', desc: 'Our engine analyzes table boundaries, aligns cell grids, detects data types, and generates your XLSX workbook.' },
      { number: 4, title: 'Download Editable Excel Spreadsheet', desc: 'Download your formatted XLSX file directly to your device or scan the QR code to save it on your smartphone.' },
    ],
    faqs: [
      {
        question: 'Is Convertly’s PDF to Excel converter completely free?',
        answer: 'Yes, Convertly is free to use with no subscription required and no watermarks added to your output spreadsheets.'
      },
      {
        question: 'Will the extracted Excel file preserve numbers and formulas?',
        answer: 'The engine identifies numeric values, currency symbols, percentages, and dates and formats them as standard Excel cell types. Because standard PDF files store computed visual text rather than underlying spreadsheet formulas, mathematical formulas (such as =SUM or =VLOOKUP) cannot be recovered from the PDF and must be added in Excel. Users should verify critical figures against the source document when preparing financial or tax statements.'
      },
      {
        question: 'Can I convert scanned PDFs or photos of tables to Excel?',
        answer: 'Yes. Convertly includes integrated Tesseract Optical Character Recognition (OCR). When the Smart OCR option is enabled, the engine recognizes scanned text from document images and maps detected cells into rows and columns.'
      },
      {
        question: 'What version of Excel is the output compatible with?',
        answer: 'Convertly produces modern Office Open XML (.xlsx) workbooks compatible with Microsoft Excel (2007 and newer, Microsoft 365), Google Sheets, Apple Numbers, LibreOffice Calc, and mobile spreadsheet apps.'
      },
      {
        question: 'How are multi-page PDF documents handled?',
        answer: 'Each page of your PDF is extracted into a dedicated worksheet tab named "Page 1", "Page 2", etc. For multi-page documents with matching column structures like bank statements or invoices, the engine also generates an "All Data (Consolidated)" master tab so you can analyze all transactions in one continuous table.'
      },
      {
        question: 'Can I extract bank statements and credit card bills into Excel?',
        answer: 'Yes. Bank statements, transaction ledgers, and credit card summaries are common use cases. The engine’s spatial heuristics help align columns in borderless transaction tables. For accounting reconciliation, verify extracted line items and totals against the source statement.'
      },
      {
        question: 'What is the maximum PDF file size supported?',
        answer: 'You can upload PDF documents up to 100MB in size, providing capacity for lengthy annual financial reports and multi-page statements.'
      },
      {
        question: 'Are my confidential financial documents safe on Convertly?',
        answer: 'Yes. Uploads and downloads are protected with TLS encryption in transit. Files reside in temporary server storage solely for conversion and download, and are automatically deleted after 120 minutes.'
      },
      {
        question: 'Does Convertly use my data to train AI models?',
        answer: 'No. Convertly never reads, indexes, shares, or uses your uploaded documents or financial data to train artificial intelligence or machine learning models.'
      },
      {
        question: 'Can I convert PDF to Excel on my iPhone, iPad, or Android phone?',
        answer: 'Yes. The converter runs directly in modern mobile web browsers. You can upload documents from mobile storage or cloud drives, and use QR transfer to download results directly to your phone.'
      },
      {
        question: 'What happens if a table has no borders (borderless table)?',
        answer: 'The extraction engine uses whitespace alignment and text-stream heuristics to detect column positions and group text into appropriate cells even when visible gridlines are absent.'
      },
      {
        question: 'Can I convert my Excel spreadsheet back to PDF after editing?',
        answer: 'Yes. Once you finish editing your spreadsheet in Excel or Google Sheets, you can use Convertly’s Excel to PDF tool to convert it back into a paginated PDF document.'
      }
    ],
  },
  {
    id: 'ppt-to-pdf',
    name: 'PowerPoint to PDF',
    category: 'Office',
    title: 'PowerPoint to PDF Converter — Convert PPTX & PPT to PDF Online Free',
    description: 'Convert Microsoft PowerPoint presentations (PPTX, PPT) to PDF online for free. Preserves slide transitions, vector graphics, and layout typography.',
    keywords: 'ppt to pdf, powerpoint to pdf, pptx to pdf, presentation to pdf, convert powerpoint to pdf, convertly',
    badge: 'Crisp Slide Vectorization',
    summary: 'Convert PPT and PPTX presentation slide decks into portable, high-definition PDF handouts.',
    steps: [
      { number: 1, title: 'Upload Presentation', desc: 'Select your PPTX or PPT slide deck.' },
      { number: 2, title: 'Process Slides', desc: 'Every slide is converted into a vector PDF page.' },
      { number: 3, title: 'Download PDF Deck', desc: 'Get your portable PDF presentation.' },
    ],
    faqs: [
      { question: 'Will custom fonts be preserved?', answer: 'Yes, presentation text is rendered with exact typographic shapes.' },
    ],
  },
  {
    id: 'pdf-delete-pages',
    name: 'Delete PDF Pages',
    category: 'PDF',
    title: 'Delete PDF Pages Online — Remove Unwanted Pages from PDF Free',
    description: 'Remove unwanted or blank pages from any PDF document online for free. Specify page numbers or ranges with instant output and zero data retention.',
    keywords: 'delete pdf pages, remove pages from pdf, cut pages pdf, delete pages from pdf free, convertly',
    badge: 'Instant Page Removal',
    summary: 'Quickly remove sensitive, blank, or unwanted pages from your PDF documents.',
    steps: [
      { number: 1, title: 'Upload PDF', desc: 'Upload the document you want to trim.' },
      { number: 2, title: 'Select Pages to Remove', desc: 'Enter the page numbers to delete (e.g., 2, 4, 7-9).' },
      { number: 3, title: 'Download Clean PDF', desc: 'Save your updated document without the removed pages.' },
    ],
    faqs: [
      { question: 'Can I undo deleted pages?', answer: 'Original uploaded files remain untouched; a new PDF with requested pages removed is provided.' },
    ],
  },
  {
    id: 'pdf-extract-pages',
    name: 'Extract PDF Pages',
    category: 'PDF',
    title: 'Extract PDF Pages Online — Save Specific Pages from PDF Free',
    description: 'Extract specific pages from your PDF and create a brand-new focused document. Free, lightning fast, and encrypted with zero retention.',
    keywords: 'extract pdf pages, select pages from pdf, isolate pdf pages, extract pages from pdf online, convertly',
    badge: 'Focused Document Generator',
    summary: 'Pull out essential pages from extensive manuals, contracts, or books into a concise standalone PDF.',
    steps: [
      { number: 1, title: 'Upload Source PDF', desc: 'Choose your multi-page document.' },
      { number: 2, title: 'Specify Page Selection', desc: 'Enter page ranges to isolate (e.g. 5-10, 15).' },
      { number: 3, title: 'Download Extracted PDF', desc: 'Get your targeted document immediately.' },
    ],
    faqs: [
      { question: 'Does page extraction reduce PDF resolution?', answer: 'No, all original vector graphics and high-res images are copied losslessly.' },
    ],
  },
  {
    id: 'pdf-reorder-pages',
    name: 'Reorder PDF Pages',
    category: 'PDF',
    title: 'Reorder PDF Pages Online — Rearrange PDF Page Order Free',
    description: 'Rearrange and reorder pages in any PDF file online for free. Drag and drop visual page thumbnails into your ideal sequence.',
    keywords: 'reorder pdf pages, rearrange pdf, change page order pdf, organize pdf pages, convertly',
    badge: 'Drag & Drop Page Organizer',
    summary: 'Change the sequence of pages in your PDF document using visual drag-and-drop or explicit page indices.',
    steps: [
      { number: 1, title: 'Upload Document', desc: 'Upload your PDF.' },
      { number: 2, title: 'Reorder Pages', desc: 'Provide new sequence (e.g. 3, 1, 2, 4).' },
      { number: 3, title: 'Save Reorganized PDF', desc: 'Download your restructured document.' },
    ],
    faqs: [
      { question: 'Will hyperlinks inside the PDF still work?', answer: 'Yes, internal document structures and bookmarks are preserved.' },
    ],
  },
  {
    id: 'jpg-to-png',
    name: 'JPG to PNG',
    category: 'Images',
    title: 'JPG to PNG Converter — Convert JPEG to PNG Online Free | Convertly',
    description: 'Convert JPG images to lossless PNG format online for free. Support high bit-depth and transparency preparation with zero data retention.',
    keywords: 'jpg to png, convert jpeg to png, image converter, picture converter, free jpg to png, convertly',
    badge: 'Lossless PNG Conversion',
    summary: 'Convert compressed JPEG photos into high-fidelity PNG graphic files without quality degradation.',
    steps: [
      { number: 1, title: 'Upload JPG Image', desc: 'Drop your .jpg or .jpeg file.' },
      { number: 2, title: 'Execute Conversion', desc: 'Engine decodes and re-encodes into lossless PNG.' },
      { number: 3, title: 'Download PNG', desc: 'Save your clean PNG image.' },
    ],
    faqs: [
      { question: 'Does converting JPG to PNG improve image quality?', answer: 'It prevents further compression degradation and enables lossless editing.' },
    ],
  },
  {
    id: 'png-to-jpg',
    name: 'PNG to JPG',
    category: 'Images',
    title: 'PNG to JPG Converter — Convert PNG to JPEG Online Free | Convertly',
    description: 'Convert PNG images to lightweight JPG format online for free. Adjust compression quality and reduce storage footprint in seconds.',
    keywords: 'png to jpg, convert png to jpeg, shrink png, photo converter, free png to jpg, convertly',
    badge: 'Fast JPG Optimization',
    summary: 'Convert heavy PNG images into lightweight, web-optimized JPEG pictures with customizable compression balance.',
    steps: [
      { number: 1, title: 'Upload PNG Image', desc: 'Select your PNG file.' },
      { number: 2, title: 'Process Conversion', desc: 'Engine handles alpha transparency with clean background.' },
      { number: 3, title: 'Download JPG', desc: 'Save your compressed JPG photo.' },
    ],
    faqs: [
      { question: 'What happens to transparent backgrounds?', answer: 'Transparent pixels are blended cleanly onto a crisp white background.' },
    ],
  },
  {
    id: 'image-to-webp',
    name: 'Image to WebP',
    category: 'Images',
    title: 'Image to WebP Converter — Convert JPG & PNG to WebP Online Free',
    description: 'Convert JPG, PNG, and GIF images to modern next-gen Google WebP format. Reduce web image size by up to 35% without visible quality loss.',
    keywords: 'image to webp, jpg to webp, png to webp, convert to webp, next-gen image converter, convertly',
    badge: 'Next-Gen Web Speed',
    summary: 'Optimize website performance by converting legacy JPG and PNG graphics into next-generation Google WebP files.',
    steps: [
      { number: 1, title: 'Upload Image', desc: 'Drop your JPG, PNG, or GIF file.' },
      { number: 2, title: 'Convert to WebP', desc: 'Engine utilizes Google WebP compression libraries.' },
      { number: 3, title: 'Download WebP', desc: 'Save your lightweight web asset.' },
    ],
    faqs: [
      { question: 'Do all modern web browsers support WebP?', answer: 'Yes, 100% of modern browsers (Chrome, Safari, Edge, Firefox) support WebP.' },
    ],
  },
  {
    id: 'webp-to-image',
    name: 'WebP to Image',
    category: 'Images',
    title: 'WebP to JPG / PNG Converter — Convert WebP Online Free | Convertly',
    description: 'Convert Google WebP images to standard JPG or PNG format online for free. Perfect for software and applications that don’t yet support WebP.',
    keywords: 'webp to image, webp to jpg, webp to png, convert webp, open webp file, convertly',
    badge: 'Universal Format Compatibility',
    summary: 'Convert WebP images into universally supported PNG or JPG files for legacy desktop photo editing software.',
    steps: [
      { number: 1, title: 'Upload WebP Image', desc: 'Select your .webp image.' },
      { number: 2, title: 'Choose Target Format', desc: 'Select PNG for lossless fidelity or JPG for smaller size.' },
      { number: 3, title: 'Download Image', desc: 'Save your converted image file.' },
    ],
    faqs: [
      { question: 'Can I convert animated WebP images?', answer: 'Yes, animated frames can be extracted or converted cleanly.' },
    ],
  },
  {
    id: 'pdf-to-images',
    name: 'PDF to Images',
    category: 'PDF',
    title: 'PDF to Images Converter — Convert PDF Pages to JPG & PNG Free',
    description: 'Convert PDF pages into high-resolution JPG or PNG images online for free. Download individual images or a bundled ZIP archive with zero retention.',
    keywords: 'pdf to images, pdf to jpg, pdf to png, export pdf pages to image, pdf to photos, convertly',
    badge: 'High-DPI Rasterizer',
    summary: 'Extract and render every page of your PDF document into crisp 300 DPI JPG or PNG image files.',
    steps: [
      { number: 1, title: 'Upload PDF', desc: 'Select your PDF document.' },
      { number: 2, title: 'Render Pages', desc: 'Engine converts each vector page into a sharp image.' },
      { number: 3, title: 'Download Images / ZIP', desc: 'Download images individually or in a single ZIP.' },
    ],
    faqs: [
      { question: 'What DPI resolution are the generated images?', answer: 'Images are rendered at high-resolution 150 to 300 DPI for crystal clear text readability.' },
    ],
  },
  {
    id: 'image-resize',
    name: 'Resize Image',
    category: 'Images',
    title: 'Resize Image Online — Change Dimensions & Resolution Free | Convertly',
    description: 'Resize JPG, PNG, and WebP images online for free. Scale by exact pixel dimensions or percentages with aspect-ratio locking and zero retention.',
    keywords: 'resize image, change image size, scale photo, photo resizer online free, image dimensions, convertly',
    badge: 'Precision Pixel Scaling',
    summary: 'Scale and resize photos and graphics to exact pixel widths, heights, or percentages while locking aspect ratios.',
    steps: [
      { number: 1, title: 'Upload Image', desc: 'Drop your photo or graphic.' },
      { number: 2, title: 'Set Dimensions', desc: 'Input target width, height, or scale percentage.' },
      { number: 3, title: 'Download Resized Image', desc: 'Save your newly sized image.' },
    ],
    faqs: [
      { question: 'Will my image get stretched or distorted?', answer: 'No, aspect ratio locking prevents distortion unless you explicitly override it.' },
    ],
  },
  {
    id: 'image-compress',
    name: 'Compress Image',
    category: 'Images',
    title: 'Compress Image Online — Reduce Photo File Size Free | Convertly',
    description: 'Compress JPG, PNG, and WebP images online without losing visual clarity. Reduce image size for fast website loading and social media sharing.',
    keywords: 'compress image, reduce photo size, image optimizer, shrink image file size free, convertly',
    badge: 'Smart Lossy & Lossless',
    summary: 'Reduce image file size by up to 80% while retaining sharp details and true color vibrancy.',
    steps: [
      { number: 1, title: 'Select Image', desc: 'Upload your photo.' },
      { number: 2, title: 'Optimize Compression', desc: 'Engine applies perceptual quantization.' },
      { number: 3, title: 'Download Lightweight File', desc: 'Save your optimized image.' },
    ],
    faqs: [
      { question: 'How much smaller will my image be?', answer: 'Most users experience a 40% to 75% file size reduction with no visible difference.' },
    ],
  },
  {
    id: 'image-crop',
    name: 'Crop Image',
    category: 'Images',
    title: 'Crop Image Online — Trim Photos to Custom Dimensions Free | Convertly',
    description: 'Crop images online for free. Trim borders, focus on focal subjects, or match standard social media aspect ratios (16:9, 1:1, 4:5, 9:16).',
    keywords: 'crop image, trim photo, photo cropper online, cut image borders, square crop, convertly',
    badge: 'Interactive Aspect Cropper',
    summary: 'Trim borders and reframe photos with exact rectangular coordinates or standard aspect ratios.',
    steps: [
      { number: 1, title: 'Upload Photo', desc: 'Select image to crop.' },
      { number: 2, title: 'Adjust Crop Box', desc: 'Set crop boundary coordinates or choose preset ratios.' },
      { number: 3, title: 'Save Cropped Image', desc: 'Download your cropped picture.' },
    ],
    faqs: [
      { question: 'Does cropping reduce pixel clarity of the cropped region?', answer: 'No, original pixel data within the crop box is retained losslessly.' },
    ],
  },
  {
    id: 'image-rotate',
    name: 'Rotate Image',
    category: 'Images',
    title: 'Rotate Image Online — Flip & Turn Photos 90° 180° Free | Convertly',
    description: 'Rotate images online for free. Turn photos 90 degrees clockwise, counter-clockwise, or 180 degrees. Supports horizontal and vertical flipping.',
    keywords: 'rotate image, turn photo, flip image, rotate picture 90 degrees, photo orientation, convertly',
    badge: 'Lossless EXIF & Pixel Rotation',
    summary: 'Correct sideways or upside down photos with instant 90-degree rotations and horizontal/vertical flips.',
    steps: [
      { number: 1, title: 'Upload Image', desc: 'Select your photo.' },
      { number: 2, title: 'Choose Rotation', desc: 'Rotate 90°, 180°, or flip horizontally.' },
      { number: 3, title: 'Download Result', desc: 'Save your oriented image.' },
    ],
    faqs: [
      { question: 'Will this fix EXIF orientation on iPhones?', answer: 'Yes, pixels are physically rotated and EXIF tags updated.' },
    ],
  },
  {
    id: 'pdf-protect',
    name: 'Protect PDF',
    category: 'PDF',
    title: 'Protect PDF Online — Encrypt PDF with AES-256 Password Free',
    description: 'Password-protect PDF files online with military-grade AES-256 encryption. Prevent unauthorized viewing, printing, and copying with zero retention.',
    keywords: 'protect pdf, encrypt pdf, password protect pdf, lock pdf, secure pdf online free, convertly',
    badge: 'AES-256 Military Encryption',
    summary: 'Add robust user passwords and permission restrictions to sensitive documents with standard AES-256 encryption.',
    steps: [
      { number: 1, title: 'Upload PDF', desc: 'Select the document you want to secure.' },
      { number: 2, title: 'Set Strong Password', desc: 'Enter and confirm your secret access password.' },
      { number: 3, title: 'Download Encrypted PDF', desc: 'Get your encrypted, tamper-proof PDF.' },
    ],
    faqs: [
      { question: 'Does Convertly know my password?', answer: 'No. Passwords are used strictly inside temporary memory during encryption and never saved.' },
    ],
  },
  {
    id: 'pdf-unlock',
    name: 'Unlock PDF',
    category: 'PDF',
    title: 'Unlock PDF Online — Remove Password & Restrictions Free | Convertly',
    description: 'Unlock password-protected PDF files online for free. Remove view passwords or owner restrictions on printing and copying when you have access.',
    keywords: 'unlock pdf, remove pdf password, decrypt pdf, unlock protected pdf free, convertly',
    badge: 'Fast Security Decryption',
    summary: 'Remove access passwords and document permission restrictions from PDFs you own.',
    steps: [
      { number: 1, title: 'Upload Locked PDF', desc: 'Select your encrypted document.' },
      { number: 2, title: 'Enter Password', desc: 'Input the current password to authorize decryption.' },
      { number: 3, title: 'Download Unlocked PDF', desc: 'Save the unlocked document with restrictions removed.' },
    ],
    faqs: [
      { question: 'Can I unlock a file if I don’t know the password?', answer: 'No, legitimate decryption requires entering the document password.' },
    ],
  },
  {
    id: 'pdf-watermark',
    name: 'Watermark PDF',
    category: 'PDF',
    title: 'Watermark PDF Online — Add Text Watermarks to PDF Free | Convertly',
    description: 'Add custom text watermarks to your PDF documents online for free. Customize font, opacity, rotation angle, and position across all pages.',
    keywords: 'watermark pdf, add watermark to pdf, stamp pdf, confidential watermark, draft watermark pdf, convertly',
    badge: 'Custom Opacity & Rotation',
    summary: 'Stamp "CONFIDENTIAL", "DRAFT", or custom text watermarks across all pages of your document.',
    steps: [
      { number: 1, title: 'Upload PDF', desc: 'Choose your document.' },
      { number: 2, title: 'Customize Watermark', desc: 'Enter watermark text, rotation angle, and opacity level.' },
      { number: 3, title: 'Download Watermarked PDF', desc: 'Save your stamped document.' },
    ],
    faqs: [
      { question: 'Can the watermark be easily deleted by third parties?', answer: 'Watermarks are embedded directly into the vector layer of the PDF.' },
    ],
  },
  {
    id: 'pdf-page-numbers',
    name: 'Add Page Numbers to PDF',
    category: 'PDF',
    title: 'Add Page Numbers to PDF Online — Number PDF Pages Free | Convertly',
    description: 'Add page numbers to PDF documents online for free. Choose header or footer placement, font size, formatting style (Page X of Y), and page ranges.',
    keywords: 'add page numbers to pdf, number pdf pages, paginate pdf, pdf page numbering online free, convertly',
    badge: 'Header & Footer Pagination',
    summary: 'Insert professional page numbers in headers or footers with customizable numbering formats and position alignments.',
    steps: [
      { number: 1, title: 'Upload PDF', desc: 'Select the document to paginate.' },
      { number: 2, title: 'Select Numbering Style', desc: 'Choose position (bottom right, center, top) and format.' },
      { number: 3, title: 'Download Numbered PDF', desc: 'Get your fully numbered document.' },
    ],
    faqs: [
      { question: 'Can I skip the cover page?', answer: 'Yes, you can set the starting page number to begin numbering on page 2 or later.' },
    ],
  },
  {
    id: 'pdf-redact',
    name: 'Redact PDF',
    category: 'PDF',
    title: 'Redact PDF Online — Permanently Blackout Sensitive Text Free',
    description: 'Redact and blackout sensitive information in PDF files online for free. Permanently removes underlying text and vector data for complete privacy.',
    keywords: 'redact pdf, blackout pdf, censor pdf, remove sensitive info from pdf, permanent redaction, convertly',
    badge: 'True Binary Data Sanitization',
    summary: 'Permanently remove confidential names, numbers, and passages by sanitizing the raw PDF binary stream.',
    steps: [
      { number: 1, title: 'Upload PDF', desc: 'Select the document needing redaction.' },
      { number: 2, title: 'Define Redaction Area', desc: 'Specify the page and target coordinates or text pattern.' },
      { number: 3, title: 'Download Redacted PDF', desc: 'Save your irreversibly sanitized document.' },
    ],
    faqs: [
      { question: 'Can redacted text be highlighted or copied by someone else?', answer: 'No, Convertly burns black rectangles and strips underlying vector character codes completely.' },
    ],
  },
  {
    id: 'pdf-flatten',
    name: 'Flatten PDF',
    category: 'PDF',
    title: 'Flatten PDF Online — Lock Form Fields & Annotations Free | Convertly',
    description: 'Flatten PDF form fields, signatures, and interactive elements into non-editable native vector graphics. Prevent tampering and ensure print fidelity.',
    keywords: 'flatten pdf, flatten form fields, lock pdf form, merge pdf layers, print ready pdf, convertly',
    badge: 'Anti-Tamper Layer Fusion',
    summary: 'Lock interactive form fields, dropdowns, and digital signatures into fixed non-editable page layers.',
    steps: [
      { number: 1, title: 'Upload Interactive PDF', desc: 'Drop your completed PDF form.' },
      { number: 2, title: 'Execute Flattening', desc: 'Engine merges all layers, annotations, and widgets.' },
      { number: 3, title: 'Download Flattened PDF', desc: 'Save your secured document.' },
    ],
    faqs: [
      { question: 'Why should I flatten a PDF before sending?', answer: 'Flattening guarantees recipients cannot alter form field values and prevents printing errors.' },
    ],
  },
  {
    id: 'pdf-scrub-metadata',
    name: 'Scrub PDF Metadata',
    category: 'PDF',
    title: 'Scrub PDF Metadata Online — Remove Author, Creator & Hidden Info Free',
    description: 'Remove author names, software versions, GPS tags, and editing timestamps from PDF files online for free. Maximize anonymity and privacy.',
    keywords: 'scrub pdf metadata, remove pdf author, clean pdf properties, sanitize pdf metadata, privacy pdf, convertly',
    badge: 'Complete Privacy Anonymization',
    summary: 'Wipe all identifying metadata—including author names, creation dates, software versions, and operating system tags.',
    steps: [
      { number: 1, title: 'Upload PDF', desc: 'Select your document.' },
      { number: 2, title: 'Scrub Metadata', desc: 'Engine zeros out Info and XMP metadata dictionaries.' },
      { number: 3, title: 'Download Clean PDF', desc: 'Save your completely anonymized PDF.' },
    ],
    faqs: [
      { question: 'Will removing metadata affect the visual text?', answer: 'No, visual document content remains 100% untouched.' },
    ],
  },
  {
    id: 'pdf-to-txt',
    name: 'PDF to Text',
    category: 'PDF',
    title: 'PDF to Text Converter — Extract Plain Text from PDF Online Free',
    description: 'Extract raw text from PDF documents into clean UTF-8 plain text (.txt) files. Fast, accurate extraction without complex formatting junk.',
    keywords: 'pdf to text, pdf to txt, extract text from pdf, convert pdf to text file, plain text pdf, convertly',
    badge: 'Clean UTF-8 Extraction',
    summary: 'Extract pure, unformatted text characters from PDF documents for NLP, copy-pasting, or note-taking.',
    steps: [
      { number: 1, title: 'Upload PDF', desc: 'Drop your document.' },
      { number: 2, title: 'Extract Text Stream', desc: 'Engine parses Unicode characters in sequential reading order.' },
      { number: 3, title: 'Download .TXT File', desc: 'Save your plain text file.' },
    ],
    faqs: [
      { question: 'Can I extract text from multi-column PDFs?', answer: 'Yes, our engine respects natural layout reading flow.' },
    ],
  },
  {
    id: 'pdf-grayscale',
    name: 'Convert PDF to Grayscale',
    category: 'PDF',
    title: 'Convert PDF to Grayscale — Black & White PDF Converter Online Free',
    description: 'Convert full-color PDF documents to black and white grayscale online for free. Saves printer ink and reduces file size with zero retention.',
    keywords: 'pdf to grayscale, black and white pdf, convert pdf to bw, monochrome pdf, save printer ink pdf, convertly',
    badge: 'Ink-Saving Monochrome',
    summary: 'Convert color PDF documents to clean monochrome grayscale to reduce file size and conserve expensive printer ink.',
    steps: [
      { number: 1, title: 'Upload Color PDF', desc: 'Select your document.' },
      { number: 2, title: 'Apply Grayscale Filter', desc: 'Engine converts RGB and CMYK color spaces to monochrome.' },
      { number: 3, title: 'Download Grayscale PDF', desc: 'Save your optimized black and white file.' },
    ],
    faqs: [
      { question: 'Does converting to grayscale reduce file size?', answer: 'Yes, removing multi-channel color data often reduces image stream sizes significantly.' },
    ],
  },
]

function getFullToolFaqs(tool) {
  if (tool.id === 'pdf-to-excel' && tool.faqs && tool.faqs.length > 0) {
    return tool.faqs
  }

  const isImage = tool.category === 'Images'
  const isOffice = tool.category === 'Office'
  const baseFaqs = [
    {
      question: `Is Convertly’s ${tool.name} tool completely free to use?`,
      answer: `Yes. Convertly’s ${tool.name} tool is 100% free with no hidden subscription fees, no trial limits, and no daily conversion caps. You can process files whenever you need without credit card details.`
    },
    {
      question: `How long are my uploaded files stored on your servers?`,
      answer: `Under our privacy policy, all uploaded files and converted outputs are stored in temporary server storage and are automatically deleted after 120 minutes.`
    },
    {
      question: `Will my file formatting, fonts, or image quality be lost?`,
      answer: `No. Convertly uses native C++ and Python processing engines (such as PyMuPDF, LibreOffice, and Pillow) to ensure 100% vector accuracy, exact font metrics, and high-fidelity raster preservation.`
    },
    {
      question: `Do I need to create an account or register to use ${tool.name}?`,
      answer: `No account registration is required. We do not ask for your email address, phone number, or personal details. Simply upload your file, execute the task, and download your result instantly.`
    },
    {
      question: `Can I use ${tool.name} on my iPhone, iPad, or Android phone?`,
      answer: `Yes! Convertly is fully mobile-optimized. You can access the tool on any smartphone or tablet, select files directly from device storage or cloud drives, and even scan a QR code to transfer files to your phone.`
    },
    {
      question: `Does this tool work on Mac, Windows, and Linux?`,
      answer: `Yes. Convertly runs entirely in your web browser and is fully compatible with Windows 10/11, macOS (Intel & Apple Silicon), Linux (Ubuntu, Fedora, Debian), and ChromeOS across all modern browsers.`
    },
    {
      question: `What is the maximum file size limit for uploads?`,
      answer: `You can process files up to 100MB per session, which provides ample headroom for heavy multi-page documents, high-resolution photographs, and complex presentations.`
    },
    {
      question: `Does Convertly add watermarks to my converted files?`,
      answer: `No. We never stamp logos, watermarks, branding labels, or advertising onto your documents. Your output files remain 100% clean and professional.`
    },
    {
      question: `Which web browsers are supported?`,
      answer: `Convertly supports all modern web browsers including Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge, Brave, and Opera without needing third-party plugins or browser extensions.`
    },
    {
      question: isImage
        ? `Can I convert multiple images at the same time?`
        : isOffice
        ? `Can I convert older legacy Microsoft Office formats like .doc, .xls, or .ppt?`
        : `Can I process password-protected or encrypted PDF documents?`,
      answer: isImage
        ? `Yes! Convertly supports multi-file batch uploads so you can process multiple graphics sequentially with high-speed parallel workers.`
        : isOffice
        ? `Yes. Both modern XML-based formats (.docx, .xlsx, .pptx) and legacy binary formats (.doc, .xls, .ppt) are fully supported by our backend office conversion engine.`
        : `If your PDF is encrypted with an open password, please use Convertly’s "Unlock PDF" tool first to decrypt it, then use ${tool.name} to complete your workflow.`
    },
    {
      question: `Are my files used to train AI models or shared with third parties?`,
      answer: `Never. Convertly guarantees a Zero AI Model Training policy. Your documents and images are never read, analyzed, shared, sold, or used to train machine learning models.`
    },
    {
      question: `Can I continue editing my document with other Convertly tools?`,
      answer: `Yes! You can seamlessly pipe your result into our other 29 conversion tools, such as Compress PDF, Merge PDF, Protect PDF, or Convert to Word.`
    }
  ]

  const custom = tool.faqs || []
  const existingQuestions = new Set(custom.map(f => f.question.toLowerCase()))
  const combined = [...custom]
  for (const f of baseFaqs) {
    if (!existingQuestions.has(f.question.toLowerCase())) {
      combined.push(f)
    }
  }
  return combined
}

function renderToolHtml(tool) {
  const canonicalUrl = `${BASE_DOMAIN}/tools/${tool.id}`
  const fullFaqs = getFullToolFaqs(tool)
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.name,
      alternateName: `Convertly ${tool.name}`,
      url: canonicalUrl,
      inLanguage: 'en-US',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'All (Windows, macOS, Linux, iOS, Android)',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      softwareVersion: '2.0.0',
      isPartOf: {
        '@type': 'WebSite',
        '@id': `${BASE_DOMAIN}/#website`,
        name: 'Convertly',
        url: BASE_DOMAIN,
      },
      offers: {
        '@type': 'Offer',
        price: '0.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      featureList: [
        'Document Conversion Fidelity',
        'Automated 120-Minute Temporary File Deletion',
        'Smart OCR for Scanned Documents',
        'In-Browser Live Document Preview',
        'Smartphone QR Direct File Transfer',
        'No File Limits and No Watermarks',
      ],
      about: [
        {
          '@type': 'Thing',
          name: 'Document conversion',
          sameAs: 'https://en.wikipedia.org/wiki/Data_conversion',
        },
        ...(tool.name.toLowerCase().includes('pdf') || tool.category === 'PDF' ? [{
          '@type': 'Thing',
          name: 'Portable Document Format',
          sameAs: 'https://en.wikipedia.org/wiki/PDF',
        }] : []),
        ...(tool.name.toLowerCase().includes('word') ? [{
          '@type': 'Thing',
          name: 'Microsoft Word',
          sameAs: 'https://en.wikipedia.org/wiki/Microsoft_Word',
        }] : []),
        ...(tool.name.toLowerCase().includes('excel') ? [{
          '@type': 'Thing',
          name: 'Microsoft Excel',
          sameAs: 'https://en.wikipedia.org/wiki/Microsoft_Excel',
        }] : []),
        ...(tool.category === 'Images' ? [{
          '@type': 'Thing',
          name: 'Image file format',
          sameAs: 'https://en.wikipedia.org/wiki/Image_file_format',
        }] : []),
      ],
      creator: {
        '@type': 'Organization',
        '@id': `${BASE_DOMAIN}/#organization`,
        name: 'Convertly',
        url: BASE_DOMAIN,
        sameAs: [
          'https://github.com/convertly',
          'https://twitter.com/convertlytools',
          'https://www.linkedin.com/company/convertlytools',
        ],
        knowsAbout: [
          'https://en.wikipedia.org/wiki/PDF',
          'https://en.wikipedia.org/wiki/Microsoft_Word',
          'https://en.wikipedia.org/wiki/Data_compression',
          'https://en.wikipedia.org/wiki/Optical_character_recognition',
        ],
      },
      publisher: {
        '@type': 'Organization',
        '@id': `${BASE_DOMAIN}/#organization`,
        name: 'Convertly',
        url: BASE_DOMAIN,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Tools', item: `${BASE_DOMAIN}/tools` },
        { '@type': 'ListItem', position: 3, name: tool.name, item: canonicalUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to use ${tool.name} with Convertly`,
      description: tool.description,
      step: tool.steps.map((s) => ({
        '@type': 'HowToStep',
        position: s.number,
        name: s.title,
        text: s.desc,
        url: `${canonicalUrl}#step-${s.number}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: fullFaqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    },
  ]

  // Prerendered SSR semantic body inside root for crawlers without JavaScript
  const stepsList = tool.steps
    .map((s) => `<li><strong>Step ${s.number}: ${s.title}</strong> — ${s.desc}</li>`)
    .join('')
  const faqsList = fullFaqs
    .map((f) => `<details style="margin-bottom: 12px;"><summary><strong>${f.question}</strong></summary><p>${f.answer}</p></details>`)
    .join('')

  const fallbackBody = `
    <div id="root">
      <div class="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
        <header class="sticky top-0 z-50 h-16 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div class="flex items-center gap-2.5">
              <a href="/" class="flex items-center gap-2.5">
                <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="font-heading text-lg font-bold tracking-tight text-foreground">Convertly</span>
                  <span class="rounded-md bg-indigo-500/10 px-1.5 py-0.2 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">v2.0</span>
                </div>
              </a>
            </div>
            <div class="flex items-center gap-3">
              <a href="/tools" class="rounded-xl border border-border/80 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:border-border hover:bg-card">All Tools</a>
            </div>
          </div>
        </header>

        <main class="flex-1">
          <div id="tool-top" class="py-12 md:py-16">
            <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div class="mb-6 flex items-center justify-between">
                <a href="/tools" class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                  Back to All Tools
                </a>
                <span class="inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-400">
                  <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
                  Zero Retention (120m)
                </span>
              </div>

              <div class="text-center max-w-2xl mx-auto mb-10">
                <div class="mx-auto mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 shadow-lg shadow-indigo-500/10">
                  <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                </div>
                <h1 class="font-heading text-3xl sm:text-4xl font-extrabold text-foreground">${tool.name}</h1>
                <p class="mt-2 text-sm text-muted-foreground leading-relaxed">${tool.summary}</p>
              </div>

              <div class="space-y-8">
                <div class="space-y-3">
                  <div class="w-full">
                    <div class="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card/40 p-10 text-center select-none min-h-[250px]">
                      <div class="relative mb-4 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                        <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
                      </div>
                      <p class="text-lg font-semibold text-foreground">Choose files or drag &amp; drop here</p>
                      <p class="mt-1.5 text-xs text-muted-foreground font-medium">${tool.name} file (up to 100MB)</p>
                      <div class="mt-5 inline-flex items-center gap-2 rounded-xl bg-secondary/80 px-4 py-2 text-xs font-semibold text-foreground shadow-sm">
                        Browse Files
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center justify-center">
                    <button class="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-400">
                      Try with Sample Document
                    </button>
                  </div>
                </div>
              </div>

              <article class="mt-20 pt-12 border-t border-border/60 space-y-16 text-foreground">
                <section class="space-y-4">
                  <div class="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
                    <span>How to Convert Files with ${tool.name}</span>
                  </div>
                  <h2 class="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">How to Use ${tool.name}</h2>
                  <ol class="space-y-3 leading-relaxed mt-4">
                    ${stepsList}
                  </ol>
                </section>

                <section class="space-y-6">
                  <h2 class="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">Frequently Asked Questions (${tool.name})</h2>
                  <div class="space-y-3 mt-4">
                    ${faqsList}
                  </div>
                </section>
              </article>
            </div>
          </div>
        </main>
      </div>
    </div>
  `

  let html = template
  // Replace title
  html = html.replace(/<title>.*?<\/title>/, `<title>${tool.title}</title>`)
  // Replace meta description
  html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${tool.description.replace(/"/g, '&quot;')}" />`)
  // Replace meta keywords
  html = html.replace(/<meta name="keywords" content=".*?" \/>/, `<meta name="keywords" content="${tool.keywords.replace(/"/g, '&quot;')}" />`)
  // Replace canonical
  html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`)
  // Replace og:title
  html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${tool.title.replace(/"/g, '&quot;')}" />`)
  // Replace og:description
  html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${tool.description.replace(/"/g, '&quot;')}" />`)
  // Replace og:url
  html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`)
  // Replace twitter:title
  html = html.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${tool.title.replace(/"/g, '&quot;')}" />`)
  // Replace twitter:description
  html = html.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${tool.description.replace(/"/g, '&quot;')}" />`)

  // Inject Schema Script before </head>
  const schemaScript = `\n    <script id="convertly-schema-jsonld" type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n    </script>\n  </head>`
  html = html.replace('</head>', schemaScript)

  // Inject initial fallback content into <div id="root">
  html = html.replace(/<div id="root">[\s\S]*?<\/body>/, `${fallbackBody.trim()}\n  </body>`)

  return html
}

console.log('🚀 Starting Convertly V2 Static Pre-rendering Engine...')

// 0. Pre-render Root Homepage (dist/index.html) with critical LCP Header and Hero
const homeFallbackBody = `
    <div id="root">
      <header class="sticky top-0 z-50 h-16 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="font-heading text-lg font-bold tracking-tight text-foreground">Convertly</span>
              <span class="rounded-md bg-indigo-500/10 px-1.5 py-0.2 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">v2.0</span>
            </div>
          </div>
        </div>
      </header>
      <main class="flex-1">
        <section class="relative pt-20 pb-12 md:pt-28 md:pb-20">
          <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <div class="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-400 mb-8 backdrop-blur-md">
              <span>Fast, Free & Private File Conversion Engine</span>
            </div>
            <h1 class="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Free Online File Converter <br class="hidden sm:inline" />
              <span class="gradient-text">for PDF, Word, Excel, Images and More</span>
            </h1>
            <p class="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Convert, compress, and edit PDF, Word, Excel, PowerPoint, and images with pixel-perfect output fidelity. Powered by native document engines with guaranteed zero data retention.
            </p>
          </div>
        </section>
      </main>
    </div>
`
let homeHtml = template
homeHtml = homeHtml.replace(/<div id="root">[\s\S]*?<\/body>/, `${homeFallbackBody.trim()}\n  </body>`)
fs.writeFileSync(INDEX_PATH, homeHtml, 'utf-8')
console.log('  ✓ Pre-rendered: / (Homepage Critical Hero LCP)')

// 1. Generate Pre-rendered pages for all 30 tools
for (const tool of TOOLS) {
  const toolDir = path.join(DIST_DIR, 'tools', tool.id)
  if (!fs.existsSync(toolDir)) {
    fs.mkdirSync(toolDir, { recursive: true })
  }
  const toolHtml = renderToolHtml(tool)
  fs.writeFileSync(path.join(toolDir, 'index.html'), toolHtml, 'utf-8')
  console.log(`  ✓ Pre-rendered: /tools/${tool.id}`)
}

// --- Helper functions for Rich Semantic Non-Tool Pre-rendering ---

function renderPageTemplate({
  title,
  description,
  keywords,
  canonicalUrl,
  ogType = 'website',
  schema,
  bodyContent
}) {
  const fallbackBody = `
    <div id="root">
      <div class="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
        <header class="sticky top-0 z-50 h-16 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div class="flex items-center gap-2.5">
              <a href="/" class="flex items-center gap-2.5">
                <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="font-heading text-lg font-bold tracking-tight text-foreground">Convertly</span>
                  <span class="rounded-md bg-indigo-500/10 px-1.5 py-0.2 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">v2.0</span>
                </div>
              </a>
            </div>
            <div class="flex items-center gap-3">
              <a href="/tools" class="rounded-xl border border-border/80 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:border-border hover:bg-card">All Tools</a>
            </div>
          </div>
        </header>
        <main class="flex-1">
          ${bodyContent}
        </main>
      </div>
    </div>
  `

  let html = template
  if (title) {
    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />`)
    html = html.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />`)
  }
  if (description) {
    html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description.replace(/"/g, '&quot;')}" />`)
    html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />`)
    html = html.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />`)
  }
  if (keywords) {
    html = html.replace(/<meta name="keywords" content=".*?" \/>/, `<meta name="keywords" content="${keywords.replace(/"/g, '&quot;')}" />`)
  }
  if (canonicalUrl) {
    html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`)
    html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`)
  }
  if (ogType) {
    html = html.replace(/<meta property="og:type" content=".*?" \/>/, `<meta property="og:type" content="${ogType}" />`)
  }
  if (schema) {
    const schemaScript = `\n    <script id="convertly-schema-jsonld" type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n    </script>\n  </head>`
    html = html.replace('</head>', schemaScript)
  }
  html = html.replace(/<div id="root">[\s\S]*?<\/body>/, `${fallbackBody.trim()}\n  </body>`)
  return html
}

function renderToolsDirectoryHtml() {
  const title = 'All 30 Document & Image Conversion Tools — Convertly'
  const desc = 'Browse all 30 enterprise-grade document, PDF, Office, and image conversion tools on Convertly. Fast, free, and secure with zero retention.'
  const canonicalUrl = `${BASE_DOMAIN}/tools`

  const bodyContent = `
    <div class="py-12 md:py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-10">
          <div class="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400 mb-4">
            <span>30 Enterprise Tools Available</span>
          </div>
          <h1 class="font-heading text-3xl sm:text-5xl font-extrabold text-foreground">
            All Conversion Tools
          </h1>
          <p class="mt-3 text-sm sm:text-base text-muted-foreground">
            Browse our full suite of privacy-preserving, enterprise document and media conversion tools.
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${TOOLS.map(t => `
            <div class="rounded-2xl border border-border/80 bg-card/60 p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold text-indigo-400 uppercase tracking-wider">${t.category}</span>
                  ${t.badge ? `<span class="rounded-lg bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-foreground">${t.badge}</span>` : ''}
                </div>
                <h2 class="text-lg font-bold text-foreground">${t.name}</h2>
                <p class="text-xs text-muted-foreground leading-relaxed">${t.summary || t.description}</p>
              </div>
              <div class="mt-6 pt-4 border-t border-border/40">
                <a href="/tools/${t.id}" class="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                  Open Tool →
                </a>
              </div>
            </div>
          `).join('\n')}
        </div>
      </div>
    </div>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Tools Directory', item: canonicalUrl }
      ]
    }
  ]

  return renderPageTemplate({
    title,
    description: desc,
    keywords: 'conversion tools directory, free pdf converter, word to pdf, pdf to word, image to pdf, compress pdf, merge pdf',
    canonicalUrl,
    schema,
    bodyContent
  })
}

function renderBlogPostHtml(post) {
  const canonicalUrl = `${BASE_DOMAIN}/blog/${post.slug}`
  const title = `${post.title} | Convertly Blog`

  const bodyContent = `
    <article class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 text-foreground">
      <nav aria-label="Breadcrumbs" class="flex items-center gap-2 text-xs text-muted-foreground">
        <a href="/" class="hover:text-foreground">Home</a>
        <span>/</span>
        <a href="/blog" class="hover:text-foreground">Blog</a>
        <span>/</span>
        <span class="text-foreground font-medium truncate">${post.h1}</span>
      </nav>
      <header class="space-y-4">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">${post.category}</span>
          <span class="text-xs text-muted-foreground">• ${post.readTime}</span>
          <span class="text-xs text-muted-foreground">• ${post.publishDate}</span>
        </div>
        <h1 class="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">${post.h1}</h1>
        <div class="flex items-center gap-3 pt-2 border-t border-b border-border/60 py-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs">${post.author.avatarInitials}</div>
          <div>
            <p class="text-sm font-bold text-foreground">${post.author.name}</p>
            <p class="text-xs text-muted-foreground">${post.author.role} • Convertly Research</p>
          </div>
        </div>
      </header>
      <p class="text-base sm:text-lg text-foreground/90 font-medium leading-relaxed">${post.lead}</p>
      <div class="rounded-2xl p-6 border border-indigo-500/30 bg-indigo-500/5 space-y-3">
        <h2 class="text-sm font-bold text-foreground">Key Editorial Takeaways</h2>
        <ul class="space-y-2 text-xs sm:text-sm text-muted-foreground">
          ${post.keyTakeaways.map(t => `<li class="flex items-start gap-2"><span class="text-emerald-400 shrink-0">✓</span><span>${t}</span></li>`).join('\n')}
        </ul>
      </div>
      <div class="space-y-8 text-foreground/90">
        ${post.contentSections.map(s => `
          <section class="space-y-4">
            <h2 class="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">${s.heading}</h2>
            ${s.paragraphs.map(p => `<p class="text-sm sm:text-base leading-relaxed text-muted-foreground">${p}</p>`).join('\n')}
            ${s.bulletPoints && s.bulletPoints.length ? `
              <ul class="space-y-2 pl-4 text-xs sm:text-sm text-muted-foreground list-disc">
                ${s.bulletPoints.map(bp => `<li>${bp}</li>`).join('\n')}
              </ul>
            ` : ''}
          </section>
        `).join('\n')}
      </div>
      <div class="rounded-2xl p-6 border border-indigo-500/40 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-bold text-indigo-400 uppercase">Try It In Action:</span>
          <h3 class="text-base font-bold text-foreground">${post.recommendedToolName}</h3>
          <p class="text-xs text-muted-foreground">Execute your workflow in seconds with zero data retention.</p>
        </div>
        <a href="/tools/${post.recommendedToolId}" class="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500">Launch Tool Now</a>
      </div>
    </article>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.h1,
      description: post.metaDescription,
      author: {
        '@type': 'Person',
        name: post.author.name,
        jobTitle: post.author.role
      },
      publisher: {
        '@type': 'Organization',
        name: 'Convertly',
        url: BASE_DOMAIN
      },
      datePublished: '2026-09-01',
      dateModified: '2026-09-12',
      mainEntityOfPage: canonicalUrl
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_DOMAIN}/blog` },
        { '@type': 'ListItem', position: 3, name: post.h1, item: canonicalUrl }
      ]
    }
  ]

  return renderPageTemplate({
    title,
    description: post.metaDescription,
    keywords: post.keywords,
    canonicalUrl,
    ogType: 'article',
    schema,
    bodyContent
  })
}

function renderGuideHtml(guide) {
  const canonicalUrl = `${BASE_DOMAIN}/guides/${guide.slug}`

  const bodyContent = `
    <article class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 text-foreground">
      <nav aria-label="Breadcrumbs" class="flex items-center gap-2 text-xs text-muted-foreground">
        <a href="/" class="hover:text-foreground">Home</a>
        <span>/</span>
        <a href="/guides" class="hover:text-foreground">Guides</a>
        <span>/</span>
        <span class="text-foreground font-medium truncate">${guide.h1}</span>
      </nav>
      <header class="space-y-4">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">${guide.category} Guide</span>
          <span class="text-xs text-muted-foreground">• ${guide.readingTime}</span>
        </div>
        <h1 class="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">${guide.h1}</h1>
        <p class="text-base sm:text-lg text-muted-foreground leading-relaxed">${guide.summary}</p>
        <div class="pt-2">
          <div class="rounded-2xl p-4 sm:p-5 border border-indigo-500/30 bg-indigo-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span class="text-xs font-bold text-indigo-400">Recommended Converter Engine:</span>
              <p class="text-sm font-semibold text-foreground">${guide.recommendedToolName}</p>
            </div>
            <a href="/tools/${guide.recommendedToolId}" class="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500">Open Tool</a>
          </div>
        </div>
      </header>
      <section class="space-y-4">
        <h2 class="text-xl font-bold tracking-tight text-foreground">Why Typical Online Converters Fail at This</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          ${guide.whyItFailsNormally.map((item, idx) => `
            <div class="rounded-2xl p-5 border border-border/80 bg-card/40 space-y-2">
              <span class="text-xs font-bold text-amber-400">Pitfall ${idx + 1}</span>
              <h3 class="text-sm font-semibold text-foreground">${item.problem}</h3>
              <p class="text-xs text-muted-foreground leading-relaxed">${item.reason}</p>
            </div>
          `).join('\n')}
        </div>
      </section>
      <section class="space-y-6">
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Step-by-Step Action Plan</h2>
        <div class="space-y-5">
          ${guide.howToSteps.map(step => `
            <div class="rounded-2xl p-6 border border-border/80 bg-card/50 space-y-3">
              <div class="flex items-center gap-3">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white text-sm font-bold">${step.step}</span>
                <h3 class="text-base font-bold text-foreground">${step.title}</h3>
              </div>
              <p class="text-sm text-muted-foreground leading-relaxed pl-11">${step.instruction}</p>
              ${step.proTip ? `<div class="ml-11 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-muted-foreground"><strong>Pro-Tip:</strong> ${step.proTip}</div>` : ''}
            </div>
          `).join('\n')}
        </div>
      </section>
      <section class="space-y-4 rounded-2xl border border-border/80 bg-card/40 p-6 sm:p-8">
        <h2 class="text-xl font-bold tracking-tight text-foreground">Technical Deep Dive</h2>
        <div class="space-y-3 text-sm text-muted-foreground leading-relaxed">
          ${guide.technicalDeepDive.map(p => `<p>${p}</p>`).join('\n')}
        </div>
      </section>
      <section class="space-y-4">
        <h2 class="text-xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h2>
        <div class="space-y-3">
          ${guide.faqs.map(faq => `
            <div class="rounded-2xl border border-border/80 bg-card/40 p-5 space-y-2">
              <h3 class="text-sm font-semibold text-foreground">${faq.question}</h3>
              <p class="text-xs text-muted-foreground leading-relaxed">${faq.answer}</p>
            </div>
          `).join('\n')}
        </div>
      </section>
    </article>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: guide.h1,
      description: guide.summary,
      step: guide.howToSteps.map(s => ({
        '@type': 'HowToStep',
        position: s.step,
        name: s.title,
        text: s.instruction
      }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${BASE_DOMAIN}/guides` },
        { '@type': 'ListItem', position: 3, name: guide.h1, item: canonicalUrl }
      ]
    }
  ]

  if (guide.faqs && guide.faqs.length) {
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: guide.faqs.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer
        }
      }))
    })
  }

  return renderPageTemplate({
    title: guide.title,
    description: guide.metaDescription,
    keywords: guide.keywords,
    canonicalUrl,
    schema,
    bodyContent
  })
}

function renderComparisonHtml(comp) {
  const canonicalUrl = `${BASE_DOMAIN}/compare/${comp.slug}`

  const bodyContent = `
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 text-foreground">
      <nav aria-label="Breadcrumbs" class="flex items-center gap-2 text-xs text-muted-foreground">
        <a href="/" class="hover:text-foreground">Home</a>
        <span>/</span>
        <a href="/compare" class="hover:text-foreground">Comparisons</a>
        <span>/</span>
        <span class="text-foreground font-medium truncate">Convertly vs ${comp.competitorName}</span>
      </nav>
      <header class="space-y-4 text-center max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
          <span>Factual Head-to-Head Analysis</span>
        </div>
        <h1 class="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">${comp.h1}</h1>
        <p class="text-sm sm:text-base text-muted-foreground leading-relaxed">${comp.summary}</p>
      </header>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="rounded-2xl p-6 border border-indigo-500/40 bg-card/60 space-y-4">
          <div class="flex items-center justify-between">
            <span class="rounded-md bg-indigo-600 text-white px-2.5 py-1 text-xs font-bold">Convertly</span>
            <span class="text-xs text-emerald-400 font-semibold">100% Free Forever</span>
          </div>
          <div>
            <span class="text-xs text-muted-foreground uppercase font-semibold">Pricing Model</span>
            <p class="text-sm font-medium text-foreground">${comp.pricingModel.convertly}</p>
          </div>
          <div class="border-t border-border/40 pt-3">
            <span class="text-xs text-muted-foreground uppercase font-semibold">Data Retention SLA</span>
            <p class="text-xs text-muted-foreground">${comp.retentionPolicy.convertly}</p>
          </div>
        </div>
        <div class="rounded-2xl p-6 border border-border/80 bg-card/40 space-y-4">
          <div class="flex items-center justify-between">
            <span class="rounded-md border border-border px-2.5 py-1 text-xs font-bold">${comp.competitorName}</span>
            <span class="text-xs text-muted-foreground">${comp.competitorDomain}</span>
          </div>
          <div>
            <span class="text-xs text-muted-foreground uppercase font-semibold">Pricing Model</span>
            <p class="text-sm font-medium text-foreground">${comp.pricingModel.competitor}</p>
          </div>
          <div class="border-t border-border/40 pt-3">
            <span class="text-xs text-muted-foreground uppercase font-semibold">Data Retention SLA</span>
            <p class="text-xs text-muted-foreground">${comp.retentionPolicy.competitor}</p>
          </div>
        </div>
      </div>
      <section class="space-y-4">
        <h2 class="text-xl font-bold tracking-tight text-foreground">Feature Matrix Comparison</h2>
        <div class="overflow-x-auto rounded-xl border border-border/80 bg-card/50">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-border/60 bg-secondary/40 text-muted-foreground">
                <th class="p-3.5 font-semibold">Feature</th>
                <th class="p-3.5 font-semibold text-indigo-400">Convertly</th>
                <th class="p-3.5 font-semibold">${comp.competitorName}</th>
              </tr>
            </thead>
            <tbody class="divide-y border-border/40">
              ${comp.matrix.map(row => `
                <tr>
                  <td class="p-3.5 font-medium text-foreground">${row.feature}</td>
                  <td class="p-3.5 text-foreground">${row.convertly}</td>
                  <td class="p-3.5 text-muted-foreground">${row.competitor}</td>
                </tr>
              `).join('\n')}
            </tbody>
          </table>
        </div>
      </section>
      <section class="space-y-4">
        <h2 class="text-xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h2>
        <div class="space-y-3">
          ${comp.faqs.map(faq => `
            <div class="rounded-2xl border border-border/80 bg-card/40 p-5 space-y-2">
              <h3 class="text-sm font-semibold text-foreground">${faq.question}</h3>
              <p class="text-xs text-muted-foreground leading-relaxed">${faq.answer}</p>
            </div>
          `).join('\n')}
        </div>
      </section>
    </div>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Comparisons', item: `${BASE_DOMAIN}/compare` },
        { '@type': 'ListItem', position: 3, name: `Convertly vs ${comp.competitorName}`, item: canonicalUrl }
      ]
    }
  ]

  if (comp.faqs && comp.faqs.length) {
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: comp.faqs.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer
        }
      }))
    })
  }

  return renderPageTemplate({
    title: comp.title,
    description: comp.metaDescription,
    keywords: `convertly vs ${comp.competitorName.toLowerCase()}, ${comp.competitorName.toLowerCase()} alternative, free pdf converter vs ${comp.competitorName.toLowerCase()}`,
    canonicalUrl,
    schema,
    bodyContent
  })
}

function renderUseCaseHtml(uc) {
  const canonicalUrl = `${BASE_DOMAIN}/use-cases/${uc.slug}`

  const bodyContent = `
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 text-foreground">
      <nav aria-label="Breadcrumbs" class="flex items-center gap-2 text-xs text-muted-foreground">
        <a href="/" class="hover:text-foreground">Home</a>
        <span>/</span>
        <a href="/use-cases" class="hover:text-foreground">Use Cases</a>
        <span>/</span>
        <span class="text-foreground font-medium truncate">${uc.targetAudience}</span>
      </nav>
      <header class="space-y-4 text-center max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
          <span>Dedicated Workflow Guide</span>
        </div>
        <h1 class="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">${uc.h1}</h1>
        <p class="text-sm sm:text-base text-muted-foreground leading-relaxed">${uc.summary}</p>
      </header>
      <section class="space-y-4">
        <h2 class="text-xl font-bold tracking-tight text-foreground">Common Industry Challenges & How Convertly Solves Them</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          ${uc.keyPainPoints.map((pp, idx) => `
            <div class="rounded-2xl p-5 border border-border/80 bg-card/40 space-y-2">
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block">Challenge ${idx + 1}</span>
              <h3 class="text-sm font-semibold text-foreground">${pp.title}</h3>
              <p class="text-xs text-muted-foreground leading-relaxed">${pp.desc}</p>
            </div>
          `).join('\n')}
        </div>
      </section>
      <section class="space-y-4">
        <h2 class="text-xl font-bold tracking-tight text-foreground">Recommended Tool Pipelines for ${uc.targetAudience}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${uc.recommendedWorkflows.map(wf => `
            <div class="rounded-2xl border border-border/80 bg-card/50 p-5 space-y-3">
              <h3 class="text-sm font-bold text-foreground">${wf.title}</h3>
              <p class="text-xs text-muted-foreground leading-relaxed">${wf.desc}</p>
              <a href="/tools/${wf.toolId}" class="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                Open ${wf.toolName} →
              </a>
            </div>
          `).join('\n')}
        </div>
      </section>
      <section class="space-y-4">
        <h2 class="text-xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h2>
        <div class="space-y-3">
          ${uc.faqs.map(faq => `
            <div class="rounded-2xl border border-border/80 bg-card/40 p-5 space-y-2">
              <h3 class="text-sm font-semibold text-foreground">${faq.question}</h3>
              <p class="text-xs text-muted-foreground leading-relaxed">${faq.answer}</p>
            </div>
          `).join('\n')}
        </div>
      </section>
    </div>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Use Cases', item: `${BASE_DOMAIN}/use-cases` },
        { '@type': 'ListItem', position: 3, name: uc.targetAudience, item: canonicalUrl }
      ]
    }
  ]

  if (uc.faqs && uc.faqs.length) {
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: uc.faqs.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer
        }
      }))
    })
  }

  return renderPageTemplate({
    title: uc.title,
    description: uc.metaDescription,
    keywords: uc.keywords,
    canonicalUrl,
    schema,
    bodyContent
  })
}

function renderPrivacyHtml() {
  const canonicalUrl = `${BASE_DOMAIN}/privacy`
  const title = 'Privacy Policy — 120-Minute Auto-Shredder Guarantee | Convertly'
  const desc = 'Convertly Privacy Policy. Strict zero-retention guarantee, 120-minute automated file shredding, TLS 1.3 encryption, and GDPR compliance.'

  const bodyContent = `
    <div class="py-12 md:py-16 text-foreground">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <div class="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-4">
            <span>Zero Permanent Retention</span>
          </div>
          <h1 class="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Privacy Policy & Data Protection
          </h1>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
            At Convertly V2, your documents belong strictly to you. We engineered our platform from day one with a zero-knowledge, zero-retention architecture.
          </p>
          <p class="mt-1 text-xs text-muted-foreground">Effective Date: September 10, 2026 • Version 2.0</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div class="rounded-2xl p-6 border border-emerald-500/20 bg-card/60">
            <h2 class="font-heading text-sm font-bold text-foreground">120-Minute TTL Shredder</h2>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">Every uploaded and converted file is assigned a strict 120-minute Time-To-Live. Our automated cleaner overwrites bytes and deletes all storage records.</p>
          </div>
          <div class="rounded-2xl p-6 border border-indigo-500/20 bg-card/60">
            <h2 class="font-heading text-sm font-bold text-foreground">No File Inspection</h2>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">No humans, AI training crawlers, or third-party advertising brokers ever read or parse your document contents.</p>
          </div>
          <div class="rounded-2xl p-6 border border-cyan-500/20 bg-card/60">
            <h2 class="font-heading text-sm font-bold text-foreground">Encrypted in Transit</h2>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">All communications between your web browser and our document engine are encrypted using industry-standard TLS 1.3.</p>
          </div>
        </div>
        <div class="rounded-2xl p-8 sm:p-10 border border-border/80 bg-card/60 space-y-8 text-xs text-muted-foreground leading-relaxed">
          <section>
            <h2 class="font-heading text-base font-bold text-foreground mb-3">1. Information We Collect</h2>
            <p>When using Convertly V2, you provide files solely for the purpose of executing the file transformation you have requested. We do not require account registration, email addresses, credit card details, or personal profile data.</p>
          </section>
          <section>
            <h2 class="font-heading text-base font-bold text-foreground mb-3">2. Automated Document Shredding & Retention Policy</h2>
            <p>All documents are stored in temporary, isolated directory structures with a maximum retention lifespan of exactly 120 minutes (2 hours). Our automated background cleaner removes all files and database records permanently.</p>
          </section>
          <section>
            <h2 class="font-heading text-base font-bold text-foreground mb-3">3. Encryption & In-Transit Security Standards</h2>
            <p>All data transmitted between your device and Convertly V2 is encrypted via TLS 1.3 with Perfect Forward Secrecy. Eavesdropping and data alteration are cryptographically prevented.</p>
          </section>
          <section>
            <h2 class="font-heading text-base font-bold text-foreground mb-3">4. No Third-Party Commercial Tracking or AI Training</h2>
            <p>We do not sell user data, utilize behavioral tracking cookies, or use customer documents to train artificial intelligence or machine learning models.</p>
          </section>
          <section>
            <h2 class="font-heading text-base font-bold text-foreground mb-3">5. GDPR & Cross-Border Compliance</h2>
            <p>Convertly V2 adheres to core GDPR privacy-by-design principles: data minimization, purpose limitation, and immediate storage limitation.</p>
          </section>
        </div>
      </div>
    </div>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: canonicalUrl }
      ]
    }
  ]

  return renderPageTemplate({ title, description: desc, canonicalUrl, schema, bodyContent })
}

function renderSecurityHtml() {
  const canonicalUrl = `${BASE_DOMAIN}/security`
  const title = 'Security Architecture & Defense-in-Depth | Convertly'
  const desc = 'Learn how Convertly protects your confidential documents with TLS 1.3, sandboxed subprocesses, magic-byte inspection, and automated shredding.'

  const bodyContent = `
    <div class="py-12 md:py-16 text-foreground">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-10">
          <div class="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-400 mb-4">
            <span>Bank-Grade Architecture</span>
          </div>
          <h1 class="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Security Architecture & Defense
          </h1>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
            Convertly V2 enforces multi-layered defense-in-depth security across every network request, file ingestion pipeline, and background transformation worker.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div class="rounded-2xl p-6 border border-border/80 bg-card/60">
            <h2 class="font-heading text-sm font-bold text-foreground">Transport Layer Security (TLS 1.3)</h2>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">All browser-to-server traffic is mandated over TLS 1.3 with Perfect Forward Secrecy (PFS) and strict HSTS headers.</p>
          </div>
          <div class="rounded-2xl p-6 border border-border/80 bg-card/60">
            <h2 class="font-heading text-sm font-bold text-foreground">Ephemeral Subprocess Sandboxing</h2>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">Document transformation drivers execute in strictly isolated ephemeral worker processes with capped CPU and memory limits.</p>
          </div>
          <div class="rounded-2xl p-6 border border-border/80 bg-card/60">
            <h2 class="font-heading text-sm font-bold text-foreground">Automated Multi-Pass Shredding</h2>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">Worker cron jobs run every 10 minutes to wipe expired documents, unlinking files from disk and pruning database records.</p>
          </div>
          <div class="rounded-2xl p-6 border border-border/80 bg-card/60">
            <h2 class="font-heading text-sm font-bold text-foreground">Strict Magic-Byte Inspection</h2>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">Every uploaded binary is inspected for authentic file headers before processing, preventing disguised executables and malicious payloads.</p>
          </div>
          <div class="rounded-2xl p-6 border border-border/80 bg-card/60">
            <h2 class="font-heading text-sm font-bold text-foreground">Zero Analytics Leakage</h2>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">Document contents, filenames, and text streams are never logged to analytics or monitoring pipelines.</p>
          </div>
          <div class="rounded-2xl p-6 border border-border/80 bg-card/60">
            <h2 class="font-heading text-sm font-bold text-foreground">Hardened Network Boundary</h2>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">Our infrastructure uses rate limiting, Cloudflare DDoS shielding, and automated firewall rules to prevent abuse.</p>
          </div>
        </div>
      </div>
    </div>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Security Architecture', item: canonicalUrl }
      ]
    }
  ]

  return renderPageTemplate({ title, description: desc, canonicalUrl, schema, bodyContent })
}

function renderTermsHtml() {
  const canonicalUrl = `${BASE_DOMAIN}/terms`
  const title = 'Terms of Service — Convertly V2 File Conversion'
  const desc = 'Terms and conditions for utilizing Convertly online document and image conversion services.'

  const bodyContent = `
    <div class="py-12 md:py-16 text-foreground">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <div class="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400 mb-4">
            <span>Clear & Fair Terms</span>
          </div>
          <h1 class="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
            Simple, transparent terms governing your use of Convertly V2's free file conversion infrastructure.
          </p>
          <p class="mt-1 text-xs text-muted-foreground">Last Updated: September 10, 2026 • Version 2.0</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div class="rounded-2xl p-6 border border-border/80 bg-card/60">
            <h2 class="font-heading text-sm font-bold text-foreground">100% User Ownership</h2>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">You retain full, unencumbered intellectual property rights over all files, text, and images you upload or convert.</p>
          </div>
          <div class="rounded-2xl p-6 border border-border/80 bg-card/60">
            <h2 class="font-heading text-sm font-bold text-foreground">Free & Open Utility</h2>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">All 30 tools are provided free of charge for personal, academic, and commercial business workflows without watermarks.</p>
          </div>
          <div class="rounded-2xl p-6 border border-border/80 bg-card/60">
            <h2 class="font-heading text-sm font-bold text-foreground">Responsible Fair Use</h2>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">Users agree not to exploit the conversion pipelines for automated scraping, illegal material distribution, or denial of service attacks.</p>
          </div>
        </div>
        <div class="rounded-2xl p-8 sm:p-10 border border-border/80 bg-card/60 space-y-8 text-xs text-muted-foreground leading-relaxed">
          <section>
            <h2 class="font-heading text-base font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or utilizing Convertly V2 services, you confirm your acceptance of these Terms of Service.</p>
          </section>
          <section>
            <h2 class="font-heading text-base font-bold text-foreground mb-3">2. User Content & Intellectual Property</h2>
            <p>Convertly V2 makes no claim of ownership over any files, images, or documents you process through our platform.</p>
          </section>
          <section>
            <h2 class="font-heading text-base font-bold text-foreground mb-3">3. Permitted & Acceptable Use</h2>
            <p>You agree to utilize Convertly V2 only for lawful purposes in compliance with all relevant international and local laws.</p>
          </section>
          <section>
            <h2 class="font-heading text-base font-bold text-foreground mb-3">4. Disclaimer of Warranties</h2>
            <p>The conversion service is provided on an "as-is" and "as-available" basis without warranties of any kind.</p>
          </section>
          <section>
            <h2 class="font-heading text-base font-bold text-foreground mb-3">5. Limitation of Liability</h2>
            <p>Convertly V2 and its operators shall not be liable for any indirect, incidental, or consequential damages resulting from service usage.</p>
          </section>
        </div>
      </div>
    </div>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Terms of Service', item: canonicalUrl }
      ]
    }
  ]

  return renderPageTemplate({ title, description: desc, canonicalUrl, schema, bodyContent })
}

function renderDevelopersHtml() {
  const canonicalUrl = `${BASE_DOMAIN}/developers`
  const title = 'Developers API & Architecture — Convertly V2'
  const desc = 'Explore the Convertly V2 REST API documentation, webhook integration guides, and document pipeline specs.'

  const bodyContent = `
    <div class="py-12 md:py-16 text-foreground">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <div class="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400 mb-4">
            <span>Developer Center</span>
          </div>
          <h1 class="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Convertly V2 REST API Reference
          </h1>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
            Programmatically automate PDF transformations, high-fidelity Office conversions, and batch image processing with our high-throughput, asynchronous REST pipeline.
          </p>
        </div>
        <div class="space-y-6">
          <div class="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-3">
            <div class="flex items-center gap-2">
              <span class="rounded bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white">POST</span>
              <code class="text-sm font-semibold text-foreground">/api/v1/files/upload</code>
            </div>
            <h2 class="text-base font-bold text-foreground">1. Ingest & Validate File</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">Upload a document or image with magic-byte validation and antivirus pre-scanning. Returns a unique file ID with 120-minute expiry.</p>
          </div>
          <div class="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-3">
            <div class="flex items-center gap-2">
              <span class="rounded bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white">POST</span>
              <code class="text-sm font-semibold text-foreground">/api/v1/jobs</code>
            </div>
            <h2 class="text-base font-bold text-foreground">2. Dispatch Conversion Job</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">Submit a background conversion task with tool identifier and options. Returns a job tracking token.</p>
          </div>
          <div class="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-3">
            <div class="flex items-center gap-2">
              <span class="rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">GET</span>
              <code class="text-sm font-semibold text-foreground">/api/v1/jobs/{job_id}</code>
            </div>
            <h2 class="text-base font-bold text-foreground">3. Poll Job Status</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">Poll background worker progress until status reaches "completed" or "failed". Execution typically concludes in under 1 second.</p>
          </div>
          <div class="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-3">
            <div class="flex items-center gap-2">
              <span class="rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">GET</span>
              <code class="text-sm font-semibold text-foreground">/api/v1/files/{file_id}/download</code>
            </div>
            <h2 class="text-base font-bold text-foreground">4. Download Result</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">Streams the converted binary with safe Content-Disposition headers and anti-sniffing X-Content-Type-Options.</p>
          </div>
          <div class="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-3">
            <div class="flex items-center gap-2">
              <span class="rounded bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white">POST</span>
              <code class="text-sm font-semibold text-foreground">/api/v1/files/inspect</code>
            </div>
            <h2 class="text-base font-bold text-foreground">5. Pre-Flight PDF Security & Privacy Audit</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">Inspects PDF byte dictionary for metadata trails, form widgets, embedded JavaScript hooks, and encryption layers.</p>
          </div>
        </div>
      </div>
    </div>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Developers API', item: canonicalUrl }
      ]
    }
  ]

  return renderPageTemplate({ title, description: desc, canonicalUrl, schema, bodyContent })
}

function renderFormatsHtml() {
  const canonicalUrl = `${BASE_DOMAIN}/formats`
  const title = 'Supported File Formats & MIME Type Specifications — Convertly'
  const desc = 'Comprehensive technical specification guide covering all supported PDF, Microsoft Office, and raster image formats.'

  const bodyContent = `
    <div class="py-12 md:py-16 text-foreground">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <div class="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-400 mb-4">
            <span>Format Standards & Engine Matrix</span>
          </div>
          <h1 class="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Supported File Formats & Binary Specifications
          </h1>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
            Convertly V2 enforces strict binary magic-byte inspection before processing any uploaded document, blocking disguised executables and ensuring 100% format fidelity.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div class="rounded-2xl p-6 border border-border/80 bg-card/80 space-y-3">
            <span class="rounded bg-rose-500/10 text-rose-400 px-2 py-0.5 text-xs font-bold">PDF</span>
            <h2 class="text-base font-bold text-foreground">Portable Document Format (.pdf)</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">MIME: application/pdf • Magic Bytes: 25 50 44 46 2D (%PDF-) • Engine: PyMuPDF v1.24 + pypdf v4.3</p>
          </div>
          <div class="rounded-2xl p-6 border border-border/80 bg-card/80 space-y-3">
            <span class="rounded bg-blue-500/10 text-blue-400 px-2 py-0.5 text-xs font-bold">DOCX</span>
            <h2 class="text-base font-bold text-foreground">Microsoft Word Document (.docx)</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">MIME: application/vnd.openxmlformats-officedocument.wordprocessingml.document • Engine: LibreOffice Headless v24.2 + pdf2docx</p>
          </div>
          <div class="rounded-2xl p-6 border border-border/80 bg-card/80 space-y-3">
            <span class="rounded bg-blue-500/10 text-blue-400 px-2 py-0.5 text-xs font-bold">DOC</span>
            <h2 class="text-base font-bold text-foreground">Legacy Microsoft Word Document (.doc)</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">MIME: application/msword • Engine: LibreOffice Headless v24.2</p>
          </div>
          <div class="rounded-2xl p-6 border border-border/80 bg-card/80 space-y-3">
            <span class="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-xs font-bold">XLSX</span>
            <h2 class="text-base font-bold text-foreground">Microsoft Excel Spreadsheet (.xlsx)</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">MIME: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet • Engine: LibreOffice Calc Headless + pdfplumber</p>
          </div>
          <div class="rounded-2xl p-6 border border-border/80 bg-card/80 space-y-3">
            <span class="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-xs font-bold">XLS</span>
            <h2 class="text-base font-bold text-foreground">Legacy Microsoft Excel Spreadsheet (.xls)</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">MIME: application/vnd.ms-excel • Engine: LibreOffice Calc Headless</p>
          </div>
          <div class="rounded-2xl p-6 border border-border/80 bg-card/80 space-y-3">
            <span class="rounded bg-amber-500/10 text-amber-400 px-2 py-0.5 text-xs font-bold">PPTX</span>
            <h2 class="text-base font-bold text-foreground">Microsoft PowerPoint Presentation (.pptx)</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">MIME: application/vnd.openxmlformats-officedocument.presentationml.presentation • Engine: LibreOffice Impress Headless</p>
          </div>
          <div class="rounded-2xl p-6 border border-border/80 bg-card/80 space-y-3">
            <span class="rounded bg-amber-500/10 text-amber-400 px-2 py-0.5 text-xs font-bold">PPT</span>
            <h2 class="text-base font-bold text-foreground">Legacy Microsoft PowerPoint Presentation (.ppt)</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">MIME: application/vnd.ms-powerpoint • Engine: LibreOffice Impress Headless</p>
          </div>
          <div class="rounded-2xl p-6 border border-purple-500/10 text-purple-400 px-2 py-0.5 text-xs font-bold">JPG</span>
            <h2 class="text-base font-bold text-foreground">Joint Photographic Experts Group (.jpg, .jpeg)</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">MIME: image/jpeg • Magic Bytes: FF D8 FF • Engine: Pillow (PIL Fork) v10.4</p>
          </div>
          <div class="rounded-2xl p-6 border border-cyan-500/10 text-cyan-400 px-2 py-0.5 text-xs font-bold">PNG</span>
            <h2 class="text-base font-bold text-foreground">Portable Network Graphics (.png)</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">MIME: image/png • Magic Bytes: 89 50 4E 47 • Engine: Pillow v10.4 + libpng</p>
          </div>
          <div class="rounded-2xl p-6 border border-teal-500/10 text-teal-400 px-2 py-0.5 text-xs font-bold">WEBP</span>
            <h2 class="text-base font-bold text-foreground">Google WebP Image Format (.webp)</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">MIME: image/webp • Magic Bytes: RIFF....WEBP • Engine: Pillow v10.4 + libwebp</p>
          </div>
          <div class="rounded-2xl p-6 border border-orange-500/10 text-orange-400 px-2 py-0.5 text-xs font-bold">SVG</span>
            <h2 class="text-base font-bold text-foreground">Scalable Vector Graphics (.svg)</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">MIME: image/svg+xml • Engine: CairoSVG v2.7 + PyMuPDF</p>
          </div>
          <div class="rounded-2xl p-6 border border-slate-500/10 text-slate-400 px-2 py-0.5 text-xs font-bold">TXT</span>
            <h2 class="text-base font-bold text-foreground">Plain Text Document (.txt)</h2>
            <p class="text-xs text-muted-foreground leading-relaxed">MIME: text/plain • Engine: Native Python UTF-8 Stream Parser</p>
          </div>
        </div>
      </div>
    </div>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Supported Formats', item: canonicalUrl }
      ]
    }
  ]

  return renderPageTemplate({ title, description: desc, canonicalUrl, schema, bodyContent })
}

function renderCompareHubHtml() {
  const canonicalUrl = `${BASE_DOMAIN}/compare`
  const title = 'Convertly vs Competitors (2026) — Comprehensive PDF & Tool Comparisons'
  const desc = 'Factual side-by-side comparisons of Convertly against Smallpdf, iLovePDF, PDF24, Adobe Acrobat, and FreeConvert.'

  const bodyContent = `
    <div class="py-12 md:py-16 text-foreground">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <div class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-4">
            <span>Side-by-Side Architectural Analysis</span>
          </div>
          <h1 class="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Convertly vs Alternative PDF & File Converters
          </h1>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
            Factual engineering evaluations comparing privacy guarantees, file size limits, rate constraints, and feature sets across top online document suites.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${Object.values(COMPARISONS_DATA).map(comp => `
            <a href="/compare/${comp.slug}" class="block rounded-2xl p-6 border border-border/80 bg-card/80 hover:border-primary/50 transition-colors">
              <span class="rounded bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">Comparison</span>
              <h2 class="mt-3 text-lg font-bold text-foreground hover:text-primary transition-colors">${escapeHtml(comp.title)}</h2>
              <p class="mt-2 text-xs text-muted-foreground leading-relaxed">${escapeHtml(comp.summary)}</p>
              <div class="mt-4 text-xs font-medium text-primary flex items-center gap-1">Read full comparison &rarr;</div>
            </a>
          `).join('')}
        </div>
      </div>
    </div>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Comparisons', item: canonicalUrl }
      ]
    }
  ]

  return renderPageTemplate({ title, description: desc, canonicalUrl, schema, bodyContent })
}

function renderUseCasesHubHtml() {
  const canonicalUrl = `${BASE_DOMAIN}/use-cases`
  const title = 'Document Solutions by Industry & Profession — Convertly Use Cases'
  const desc = 'Tailored PDF and document workflows for Students, Teachers, Businesses, Lawyers, HR, Freelancers, and Designers.'

  const bodyContent = `
    <div class="py-12 md:py-16 text-foreground">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <div class="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-400 mb-4">
            <span>Specialized Document Pipelines</span>
          </div>
          <h1 class="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Tailored Document Workflows for Every Role & Industry
          </h1>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
            Discover how different professions leverage zero-retention document processing to maintain privacy, automate file conversions, and streamline high-volume paperwork.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${Object.values(USE_CASES_DATA).map(uc => `
            <a href="/use-cases/${uc.slug}" class="block rounded-2xl p-6 border border-border/80 bg-card/80 hover:border-violet-500/50 transition-colors">
              <span class="rounded bg-violet-500/10 text-violet-400 px-2 py-0.5 text-xs font-semibold">${escapeHtml(uc.targetAudience)}</span>
              <h2 class="mt-3 text-lg font-bold text-foreground hover:text-violet-400 transition-colors">${escapeHtml(uc.title)}</h2>
              <p class="mt-2 text-xs text-muted-foreground leading-relaxed">${escapeHtml(uc.description)}</p>
              <div class="mt-4 text-xs font-medium text-violet-400 flex items-center gap-1">Explore workflow &rarr;</div>
            </a>
          `).join('')}
        </div>
      </div>
    </div>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Use Cases', item: canonicalUrl }
      ]
    }
  ]

  return renderPageTemplate({ title, description: desc, canonicalUrl, schema, bodyContent })
}

function renderGuidesHubHtml() {
  const canonicalUrl = `${BASE_DOMAIN}/guides`
  const title = 'Problem Solving Guides & PDF Tutorials (2026) — Convertly'
  const desc = 'Comprehensive technical guides on solving PDF formatting, compression, page splitting, merging, and conversion issues.'

  const bodyContent = `
    <div class="py-12 md:py-16 text-foreground">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <div class="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400 mb-4">
            <span>Tutorials & Problem Solvers</span>
          </div>
          <h1 class="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Problem-Solving Guides & PDF Tutorials
          </h1>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
            Step-by-step walkthroughs to troubleshoot damaged PDFs, preserve layout formatting, extract data, and optimize files for strict submission portals.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${Object.values(PROBLEM_GUIDES_DATA).map(g => `
            <a href="/guides/${g.slug}" class="block rounded-2xl p-6 border border-border/80 bg-card/80 hover:border-amber-500/50 transition-colors">
              <div class="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span class="rounded bg-amber-500/10 text-amber-400 px-2 py-0.5 font-semibold">${escapeHtml(g.category || 'Guide')}</span>
                <span>${escapeHtml(g.readingTime || '5 min read')}</span>
              </div>
              <h2 class="mt-1 text-lg font-bold text-foreground hover:text-amber-400 transition-colors">${escapeHtml(g.title)}</h2>
              <p class="mt-2 text-xs text-muted-foreground leading-relaxed">${escapeHtml(g.description)}</p>
              <div class="mt-4 text-xs font-medium text-amber-400 flex items-center gap-1">Read tutorial &rarr;</div>
            </a>
          `).join('')}
        </div>
      </div>
    </div>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: canonicalUrl }
      ]
    }
  ]

  return renderPageTemplate({ title, description: desc, canonicalUrl, schema, bodyContent })
}

function renderBlogHubHtml() {
  const canonicalUrl = `${BASE_DOMAIN}/blog`
  const title = 'Convertly Engineering Blog — Deep Dives in PDF, Office & Image Optimization'
  const desc = 'Explore technical tutorials, format breakdowns, zero-retention security research, and productivity guides.'

  const bodyContent = `
    <div class="py-12 md:py-16 text-foreground">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <div class="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-4">
            <span>Engineering & Research</span>
          </div>
          <h1 class="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Engineering Insights, File Formats & Productivity Deep Dives
          </h1>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
            In-depth technical articles covering rasterization algorithms, headless rendering pipelines, zero-retention privacy standards, and document optimization best practices.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${Object.values(BLOG_POSTS_DATA).map(post => `
            <a href="/blog/${post.slug}" class="block rounded-2xl p-6 border border-border/80 bg-card/80 hover:border-emerald-500/50 transition-colors">
              <div class="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span class="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 font-semibold">${escapeHtml(post.category)}</span>
                <span>${escapeHtml(post.readTime)}</span>
              </div>
              <h2 class="mt-1 text-lg font-bold text-foreground hover:text-emerald-400 transition-colors">${escapeHtml(post.title)}</h2>
              <p class="mt-2 text-xs text-muted-foreground leading-relaxed">${escapeHtml(post.excerpt)}</p>
              <div class="mt-4 text-xs font-medium text-emerald-400 flex items-center gap-1">Read article &rarr;</div>
            </a>
          `).join('')}
        </div>
      </div>
    </div>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: canonicalUrl }
      ]
    }
  ]

  return renderPageTemplate({ title, description: desc, canonicalUrl, schema, bodyContent })
}

function renderSitemapHubHtml() {
  const canonicalUrl = `${BASE_DOMAIN}/sitemap`
  const title = 'HTML Sitemap & Complete Entity Index — Convertly'
  const desc = 'Comprehensive index of all Convertly conversion tools, landing pages, competitor comparisons, and guides.'

  const bodyContent = `
    <div class="py-12 md:py-16 text-foreground">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div class="text-center max-w-3xl mx-auto mb-8">
          <h1 class="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Convertly HTML Sitemap & Complete Index
          </h1>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
            Full directory of all tools, format specifications, engineering guides, and comparison pages available on the Convertly platform.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="rounded-2xl p-6 border border-border/80 bg-card/80 space-y-3">
            <h2 class="text-lg font-bold text-foreground border-b border-border/60 pb-2">Document Tools</h2>
            <ul class="space-y-1.5 text-xs text-muted-foreground">
              ${TOOLS.map(t => `<li><a href="${t.canonicalPath}" class="hover:text-primary transition-colors">${escapeHtml(t.name)}</a></li>`).join('')}
            </ul>
          </div>

          <div class="rounded-2xl p-6 border border-border/80 bg-card/80 space-y-3">
            <h2 class="text-lg font-bold text-foreground border-b border-border/60 pb-2">Problem Solving Guides</h2>
            <ul class="space-y-1.5 text-xs text-muted-foreground">
              ${Object.values(PROBLEM_GUIDES_DATA).map(g => `<li><a href="/guides/${g.slug}" class="hover:text-primary transition-colors">${escapeHtml(g.title)}</a></li>`).join('')}
            </ul>
          </div>

          <div class="rounded-2xl p-6 border border-border/80 bg-card/80 space-y-3">
            <h2 class="text-lg font-bold text-foreground border-b border-border/60 pb-2">Competitor Comparisons</h2>
            <ul class="space-y-1.5 text-xs text-muted-foreground">
              ${Object.values(COMPARISONS_DATA).map(c => `<li><a href="/compare/${c.slug}" class="hover:text-primary transition-colors">${escapeHtml(c.title)}</a></li>`).join('')}
            </ul>
          </div>

          <div class="rounded-2xl p-6 border border-border/80 bg-card/80 space-y-3">
            <h2 class="text-lg font-bold text-foreground border-b border-border/60 pb-2">Industry Use Cases</h2>
            <ul class="space-y-1.5 text-xs text-muted-foreground">
              ${Object.values(USE_CASES_DATA).map(u => `<li><a href="/use-cases/${u.slug}" class="hover:text-primary transition-colors">${escapeHtml(u.title)}</a></li>`).join('')}
            </ul>
          </div>

          <div class="rounded-2xl p-6 border border-border/80 bg-card/80 space-y-3">
            <h2 class="text-lg font-bold text-foreground border-b border-border/60 pb-2">Engineering Blog</h2>
            <ul class="space-y-1.5 text-xs text-muted-foreground">
              ${Object.values(BLOG_POSTS_DATA).map(p => `<li><a href="/blog/${p.slug}" class="hover:text-primary transition-colors">${escapeHtml(p.title)}</a></li>`).join('')}
            </ul>
          </div>

          <div class="rounded-2xl p-6 border border-border/80 bg-card/80 space-y-3">
            <h2 class="text-lg font-bold text-foreground border-b border-border/60 pb-2">Platform & Legal</h2>
            <ul class="space-y-1.5 text-xs text-muted-foreground">
              <li><a href="/privacy" class="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="/security" class="hover:text-primary transition-colors">Security Architecture</a></li>
              <li><a href="/terms" class="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="/developers" class="hover:text-primary transition-colors">Developers & API</a></li>
              <li><a href="/formats" class="hover:text-primary transition-colors">File Format Specifications</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_DOMAIN },
        { '@type': 'ListItem', position: 2, name: 'Sitemap', item: canonicalUrl }
      ]
    }
  ]

  return renderPageTemplate({ title, description: desc, canonicalUrl, schema, bodyContent })
}

// 2. Generate /tools directory page
const toolsDir = path.join(DIST_DIR, 'tools')
if (!fs.existsSync(toolsDir)) {
  fs.mkdirSync(toolsDir, { recursive: true })
}
const toolsPageHtml = renderToolsDirectoryHtml()
fs.writeFileSync(path.join(toolsDir, 'index.html'), toolsPageHtml, 'utf-8')
console.log(`  ✓ Pre-rendered: /tools`)

// 3. Generate static landing directories for core hubs, specifications & legal
const CORE_PAGE_RENDERERS = {
  privacy: renderPrivacyHtml,
  security: renderSecurityHtml,
  terms: renderTermsHtml,
  developers: renderDevelopersHtml,
  formats: renderFormatsHtml,
  compare: renderCompareHubHtml,
  'use-cases': renderUseCasesHubHtml,
  guides: renderGuidesHubHtml,
  blog: renderBlogHubHtml,
  sitemap: renderSitemapHubHtml,
}

const CORE_PAGES = [
  { slug: 'privacy', title: 'Privacy Policy — 120-Minute Auto-Shredder Guarantee | Convertly', desc: 'Convertly Privacy Policy. Strict zero-retention guarantee, 120-minute automated file shredding, TLS 1.3 encryption, and GDPR compliance.' },
  { slug: 'security', title: 'Security Architecture & Defense-in-Depth | Convertly', desc: 'Learn how Convertly protects your confidential documents with TLS 1.3, sandboxed subprocesses, magic-byte inspection, and automated shredding.' },
  { slug: 'terms', title: 'Terms of Service — Convertly V2 File Conversion', desc: 'Terms and conditions for utilizing Convertly online document and image conversion services.' },
  { slug: 'developers', title: 'Developers API & Architecture — Convertly V2', desc: 'Explore the Convertly V2 REST API documentation, webhook integration guides, and document pipeline specs.' },
  { slug: 'formats', title: 'Supported File Formats & MIME Type Specifications — Convertly', desc: 'Comprehensive technical specification guide covering all supported PDF, Microsoft Office, and raster image formats.' },
  { slug: 'compare', title: 'Convertly vs Competitors (2026) — Comprehensive PDF & Tool Comparisons', desc: 'Factual side-by-side comparisons of Convertly against Smallpdf, iLovePDF, PDF24, Adobe Acrobat, and FreeConvert.' },
  { slug: 'use-cases', title: 'Document Solutions by Industry & Profession — Convertly Use Cases', desc: 'Tailored PDF and document workflows for Students, Teachers, Businesses, Lawyers, HR, Freelancers, and Designers.' },
  { slug: 'guides', title: 'Problem Solving Guides & PDF Tutorials (2026) — Convertly', desc: 'Comprehensive technical guides on solving PDF formatting, compression, page splitting, merging, and conversion issues.' },
  { slug: 'blog', title: 'Convertly Engineering Blog — Deep Dives in PDF, Office & Image Optimization', desc: 'Explore technical tutorials, format breakdowns, zero-retention security research, and productivity guides.' },
  { slug: 'sitemap', title: 'HTML Sitemap & Complete Entity Index — Convertly', desc: 'Comprehensive index of all Convertly conversion tools, landing pages, competitor comparisons, and guides.' },
]

for (const page of CORE_PAGES) {
  const pageDir = path.join(DIST_DIR, page.slug)
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true })
  }
  const renderer = CORE_PAGE_RENDERERS[page.slug]
  const pageHtml = renderer ? renderer() : template
  fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml, 'utf-8')
  console.log(`  ✓ Pre-rendered: /${page.slug}`)
}

// Clean up legacy /convert directory from dist if present
const convertDistDir = path.join(DIST_DIR, 'convert')
if (fs.existsSync(convertDistDir)) {
  fs.rmSync(convertDistDir, { recursive: true, force: true })
}

// 4. Pre-render Competitor Comparison Pages
const COMPARISON_PAGES = Object.values(COMPARISONS_DATA)
for (const comp of COMPARISON_PAGES) {
  const pageDir = path.join(DIST_DIR, 'compare', comp.slug)
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true })
  }
  const compHtml = renderComparisonHtml(comp)
  fs.writeFileSync(path.join(pageDir, 'index.html'), compHtml, 'utf-8')
  console.log(`  ✓ Pre-rendered: /compare/${comp.slug}`)
}

// 5. Pre-render Industry & Persona Use Case Pages
const USE_CASE_PAGES = Object.values(USE_CASES_DATA)
for (const uc of USE_CASE_PAGES) {
  const pageDir = path.join(DIST_DIR, 'use-cases', uc.slug)
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true })
  }
  const ucHtml = renderUseCaseHtml(uc)
  fs.writeFileSync(path.join(pageDir, 'index.html'), ucHtml, 'utf-8')
  console.log(`  ✓ Pre-rendered: /use-cases/${uc.slug}`)
}

// 6. Pre-render Problem Solving Guides
const GUIDE_PAGES = Object.values(PROBLEM_GUIDES_DATA)
for (const guide of GUIDE_PAGES) {
  const pageDir = path.join(DIST_DIR, 'guides', guide.slug)
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true })
  }
  const guideHtml = renderGuideHtml(guide)
  fs.writeFileSync(path.join(pageDir, 'index.html'), guideHtml, 'utf-8')
  console.log(`  ✓ Pre-rendered: /guides/${guide.slug}`)
}

// 8. Pre-render Engineering Blog Articles
const BLOG_PAGES = Object.values(BLOG_POSTS_DATA)
for (const post of BLOG_PAGES) {
  const pageDir = path.join(DIST_DIR, 'blog', post.slug)
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true })
  }
  const postHtml = renderBlogPostHtml(post)
  fs.writeFileSync(path.join(pageDir, 'index.html'), postHtml, 'utf-8')
  console.log(`  ✓ Pre-rendered: /blog/${post.slug}`)
}

// 9. Automated Production XML Sitemap Generator (Comprehensive Multi-Cluster Coverage)
const today = new Date().toISOString().split('T')[0]
const flagshipToolIds = new Set([
  'pdf-to-word', 'word-to-pdf', 'pdf-merge', 'pdf-compress',
  'images-to-pdf', 'excel-to-pdf', 'ppt-to-pdf', 'pdf-to-excel'
])

let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n`

// A. Main Entrypoints & Directory Hubs
sitemapXml += `  <!-- Main Entrypoints & Hubs -->\n`
sitemapXml += `  <url>\n    <loc>${BASE_DOMAIN}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`
sitemapXml += `  <url>\n    <loc>${BASE_DOMAIN}/tools</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`
sitemapXml += `  <url>\n    <loc>${BASE_DOMAIN}/compare</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`
sitemapXml += `  <url>\n    <loc>${BASE_DOMAIN}/use-cases</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`
sitemapXml += `  <url>\n    <loc>${BASE_DOMAIN}/guides</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`
sitemapXml += `  <url>\n    <loc>${BASE_DOMAIN}/blog</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`
sitemapXml += `  <url>\n    <loc>${BASE_DOMAIN}/sitemap</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n\n`

// B. Conversion Tools (30 Active Engines)
sitemapXml += `  <!-- All Converter Tools (${TOOLS.length} Active Engines) -->\n`
for (const tool of TOOLS) {
  const priority = flagshipToolIds.has(tool.id) ? '0.9' : '0.8'
  sitemapXml += `  <url><loc>${BASE_DOMAIN}/tools/${tool.id}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>\n`
}

// C. Competitor Comparisons
sitemapXml += `\n  <!-- Competitor Comparisons (${COMPARISON_PAGES.length} URLs) -->\n`
for (const comp of COMPARISON_PAGES) {
  sitemapXml += `  <url><loc>${BASE_DOMAIN}/compare/${comp.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`
}

// D. Industry & Persona Use Cases
sitemapXml += `\n  <!-- Industry Use Cases (${USE_CASE_PAGES.length} URLs) -->\n`
for (const uc of USE_CASE_PAGES) {
  sitemapXml += `  <url><loc>${BASE_DOMAIN}/use-cases/${uc.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`
}

// E. Problem Solving Guides
sitemapXml += `\n  <!-- Problem Solving Guides (${GUIDE_PAGES.length} URLs) -->\n`
for (const guide of GUIDE_PAGES) {
  sitemapXml += `  <url><loc>${BASE_DOMAIN}/guides/${guide.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>\n`
}

// F. Engineering Blog Articles
sitemapXml += `\n  <!-- Engineering Blog Articles (${BLOG_PAGES.length} URLs) -->\n`
for (const post of BLOG_PAGES) {
  sitemapXml += `  <url><loc>${BASE_DOMAIN}/blog/${post.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.75</priority></url>\n`
}

// G. Core Technical & Legal Specifications
sitemapXml += `\n  <!-- Core Technical & Legal Specifications -->\n`
const pagePriorities = {
  formats: '0.7',
  developers: '0.7',
  security: '0.6',
  privacy: '0.5',
  terms: '0.5',
}
for (const page of CORE_PAGES) {
  if (['privacy', 'security', 'terms', 'developers', 'formats'].includes(page.slug)) {
    const prio = pagePriorities[page.slug] || '0.5'
    sitemapXml += `  <url><loc>${BASE_DOMAIN}/${page.slug}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${prio}</priority></url>\n`
  }
}

sitemapXml += `\n</urlset>\n`

// Write to both public and dist directories
const PUBLIC_DIR = path.resolve(__dirname, '../public')
fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml, 'utf-8')
fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf-8')

const totalUrls =
  2 + // / and /tools
  5 + // 5 hubs
  TOOLS.length +
  COMPARISON_PAGES.length +
  USE_CASE_PAGES.length +
  GUIDE_PAGES.length +
  BLOG_PAGES.length +
  5 // 5 legal/specs

console.log(`  ✓ Dynamically Generated Production Sitemap: ${totalUrls} Verified URLs`)

console.log('✅ Static pre-rendering and dynamic sitemap generation completed successfully!')
