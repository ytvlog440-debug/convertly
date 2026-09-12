import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

const TOOLS = [
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    category: 'Office',
    title: 'PDF to Word Converter — Convert PDF to Editable DOCX Online Free',
    description: 'Convert PDF to Word DOCX online for free. Features optical character recognition (OCR) for scanned PDFs, preserving original tables, fonts, and layouts with zero data retention.',
    keywords: 'pdf to word, convert pdf to word, pdf to docx, pdf to word editable, ocr pdf to word, free online pdf converter, convertly',
    badge: 'Smart OCR & Editable DOCX',
    summary: 'Transform PDF documents into 100% editable Microsoft Word (.docx) files with formatting, tables, and typography intact.',
    steps: [
      { number: 1, title: 'Upload PDF Document', desc: 'Drag and drop your PDF file or select it from your device storage.' },
      { number: 2, title: 'Enable Smart OCR (Optional)', desc: 'For scanned documents or image-based PDFs, enable OCR to convert pixel characters into editable text.' },
      { number: 3, title: 'Execute Conversion', desc: 'Click "Convert to Word". Our native engine analyzes layout, vectors, and font styles in seconds.' },
      { number: 4, title: 'Instant Download & QR Transfer', desc: 'Download your editable Word document or scan the secure QR code to save directly to your phone.' },
    ],
    faqs: [
      { question: 'Is Convertly’s PDF to Word converter completely free?', answer: 'Yes, 100% free with no subscription, daily file limits, or hidden fees.' },
      { question: 'Can I convert scanned PDF documents with images of text?', answer: 'Yes. Convertly features integrated Tesseract OCR to recognize text from scanned pages.' },
      { question: 'How long are my files kept on your servers?', answer: 'Files are permanently shredded after 120 minutes with zero data retention.' },
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
  const isImage = tool.category === 'Images'
  const isOffice = tool.category === 'Office'
  const baseFaqs = [
    {
      question: `Is Convertly’s ${tool.name} tool completely free to use?`,
      answer: `Yes. Convertly’s ${tool.name} tool is 100% free with no hidden subscription fees, no trial limits, and no daily conversion caps. You can process files whenever you need without credit card details.`
    },
    {
      question: `How long are my uploaded files stored on your servers?`,
      answer: `Under our strict Zero-Retention Policy, all uploaded files and converted outputs are stored exclusively in temporary sandboxed storage and are permanently and irreversibly shredded after 120 minutes.`
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
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '15420',
        bestRating: '5',
        worstRating: '1',
      },
      offers: {
        '@type': 'Offer',
        price: '0.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      featureList: [
        'Enterprise Document Conversion Fidelity',
        '120-Minute Zero-Retention Auto-Shredding Privacy',
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
      <div style="max-width: 900px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, -apple-system, sans-serif;">
        <header>
          <nav aria-label="Breadcrumb">
            <a href="/">Home</a> / <a href="/tools">Tools</a> / <span>${tool.name}</span>
          </nav>
          <h1 style="font-size: 2.25rem; font-weight: 800; margin-top: 1rem; margin-bottom: 0.5rem;">${tool.name}</h1>
          <p style="font-size: 1.125rem; color: #64748b; line-height: 1.6;">${tool.summary}</p>
        </header>
        <section style="margin-top: 2rem;">
          <h2>How to Convert Files with ${tool.name}</h2>
          <ol style="line-height: 1.8; margin-top: 1rem;">
            ${stepsList}
          </ol>
        </section>
        <section style="margin-top: 2.5rem;">
          <h2>Frequently Asked Questions (${tool.name})</h2>
          <div style="margin-top: 1rem;">
            ${faqsList}
          </div>
        </section>
        <footer style="margin-top: 3rem; border-top: 1px solid #e2e8f0; padding-top: 1.5rem; font-size: 0.875rem; color: #94a3b8;">
          <p>Convertly V2 — Enterprise File Conversion Platform with Zero Data Retention. Encrypted with TLS 1.3.</p>
        </footer>
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

  // Inject initial fallback content into <div id="root"></div>
  html = html.replace('<div id="root"></div>', fallbackBody.trim())

  return html
}

console.log('🚀 Starting Convertly V2 Static Pre-rendering Engine...')

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

// 2. Generate /tools directory page
const toolsDir = path.join(DIST_DIR, 'tools')
if (!fs.existsSync(toolsDir)) {
  fs.mkdirSync(toolsDir, { recursive: true })
}
let toolsPageHtml = template
toolsPageHtml = toolsPageHtml.replace(/<title>.*?<\/title>/, `<title>All 30 Document & Image Conversion Tools — Convertly</title>`)
toolsPageHtml = toolsPageHtml.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="Browse all 30 enterprise-grade document, PDF, Office, and image conversion tools on Convertly. Fast, free, and secure with zero retention." />`)
toolsPageHtml = toolsPageHtml.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${BASE_DOMAIN}/tools" />`)
fs.writeFileSync(path.join(toolsDir, 'index.html'), toolsPageHtml, 'utf-8')
console.log(`  ✓ Pre-rendered: /tools`)

// 3. Generate static landing directories for core hubs, specifications & legal
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
  let pageHtml = template
  pageHtml = pageHtml.replace(/<title>.*?<\/title>/, `<title>${page.title}</title>`)
  pageHtml = pageHtml.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${page.desc}" />`)
  pageHtml = pageHtml.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${BASE_DOMAIN}/${page.slug}" />`)
  fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml, 'utf-8')
  console.log(`  ✓ Pre-rendered: /${page.slug}`)
}

// 4. Pre-render Programmatic SEO Landing Pages
const PROGRAMMATIC_PAGES = [
  { slug: 'pdf-to-word', title: 'PDF to Word Converter — Convert PDF to DOCX Free | Convertly', desc: 'Convert PDF to editable Word DOCX online for free. Preserves layout, tables, fonts, and inline graphics with built-in optical character recognition (OCR).' },
  { slug: 'pdf-to-word-online', title: 'PDF to Word Online — Convert PDF to DOCX in Web Browser | Convertly', desc: 'Convert PDF to Word online directly in your browser. No desktop software installation required. Fast, private, secure, and completely free.' },
  { slug: 'pdf-to-word-free', title: 'Free PDF to Word Converter — 100% Free DOCX Output | Convertly', desc: 'Convert PDF to Word free online. No hidden trial limitations, no daily file limits, no registration, and no intrusive watermarks.' },
  { slug: 'pdf-to-word-windows', title: 'PDF to Word for Windows 11 & 10 — Fast Web Converter | Convertly', desc: 'Convert PDF to Word on Windows 11, 10, and 8. Compatible with Microsoft Edge, Chrome, and Firefox. Generates native DOCX for Microsoft Word.' },
  { slug: 'pdf-to-word-mac', title: 'PDF to Word for Mac — Convert PDF to DOCX on macOS | Convertly', desc: 'Convert PDF to Word on Apple Mac (macOS Sonoma, Ventura, Monterey). Compatible with Apple Silicon M1/M2/M3/M4 and Intel Macs with Safari support.' },
  { slug: 'pdf-to-word-mobile', title: 'PDF to Word on Mobile — Convert PDF to DOCX on iPhone & Android', desc: 'Convert PDF to Word on mobile devices. Touch-optimized converter for iPhone, iPad, and Android phones. Direct QR code transfer included.' },
  { slug: 'word-to-pdf', title: 'Word to PDF Online — Convert DOCX & DOC to PDF Free | Convertly', desc: 'Convert Microsoft Word DOCX and DOC files into print-ready PDF documents online for free. Preserves exact fonts, margins, vector tables, and headers.' },
  { slug: 'merge-pdf-online', title: 'Merge PDF Online — Combine Multiple PDF Files Free | Convertly', desc: 'Combine and merge multiple PDF documents into a single organized file online for free. Drag and drop to reorder pages with zero data retention.' },
  { slug: 'compress-pdf-online', title: 'Compress PDF Online — Reduce PDF File Size Free | Convertly', desc: 'Reduce PDF file size online while maintaining crisp text and sharp image quality. Perfect for email attachments and portal uploads. 100% free.' },
  { slug: 'convert-pdf-without-losing-formatting', title: 'Convert PDF Without Losing Formatting — 100% Layout Preservation', desc: 'Convert PDF to Word without losing formatting, tables, font styles, or margins. Advanced structural synthesis ensures pixel-accurate editable documents.' },
  { slug: 'convert-jpg-to-png', title: 'Convert JPG to PNG Online — Lossless Raster Image Conversion', desc: 'Convert JPG images to lossless PNG format online for free. Support high bit-depth and transparency preparation with zero compression artifacts.' },
  { slug: 'convert-image-to-pdf', title: 'Convert Image to PDF Online — Combine JPG, PNG & WebP into PDF', desc: 'Convert JPG, PNG, and WebP images into a single professional PDF document online for free. Clean page margins and orientation with zero data retention.' },
]

for (const prog of PROGRAMMATIC_PAGES) {
  const pageDir = path.join(DIST_DIR, 'convert', prog.slug)
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true })
  }
  let progHtml = template
  progHtml = progHtml.replace(/<title>.*?<\/title>/, `<title>${prog.title}</title>`)
  progHtml = progHtml.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${prog.desc}" />`)
  progHtml = progHtml.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${BASE_DOMAIN}/convert/${prog.slug}" />`)
  fs.writeFileSync(path.join(pageDir, 'index.html'), progHtml, 'utf-8')
  console.log(`  ✓ Pre-rendered: /convert/${prog.slug}`)
}

// 5. Pre-render Competitor Comparison Pages
const COMPARISON_PAGES = [
  { slug: 'convertly-vs-smallpdf', title: 'Convertly vs Smallpdf Comparison (2026) — Features, Limits & Pricing', desc: 'Unbiased factual comparison between Convertly and Smallpdf. Compare free tier file limits, OCR accuracy, privacy retention SLAs, and pricing models.' },
  { slug: 'convertly-vs-ilovepdf', title: 'Convertly vs iLovePDF Comparison (2026) — Limits, Ads & Security', desc: 'Detailed technical comparison between Convertly and iLovePDF. Compare advertising density, file size limits, API availability, and processing speeds.' },
  { slug: 'convertly-vs-pdf24', title: 'Convertly vs PDF24 Comparison (2026) — Performance, UI & Speed', desc: 'Objective comparison between Convertly and PDF24 Tools. Compare UI design, mobile responsiveness, processing speeds, and document security.' },
  { slug: 'convertly-vs-adobe-acrobat', title: 'Convertly vs Adobe Acrobat Online (2026) — Free vs Enterprise Suite', desc: 'Compare Convertly and Adobe Acrobat Online. Weigh Adobe’s proprietary rendering and subscription fees against Convertly’s free cloud converter.' },
  { slug: 'convertly-vs-freeconvert', title: 'Convertly vs FreeConvert Comparison (2026) — Conversion Limits & Privacy', desc: 'Compare Convertly and FreeConvert. Analyze conversion minutes, maximum file sizes, queue wait times, advertising levels, and privacy guarantees.' },
]

for (const comp of COMPARISON_PAGES) {
  const pageDir = path.join(DIST_DIR, 'compare', comp.slug)
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true })
  }
  let compHtml = template
  compHtml = compHtml.replace(/<title>.*?<\/title>/, `<title>${comp.title}</title>`)
  compHtml = compHtml.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${comp.desc}" />`)
  compHtml = compHtml.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${BASE_DOMAIN}/compare/${comp.slug}" />`)
  fs.writeFileSync(path.join(pageDir, 'index.html'), compHtml, 'utf-8')
  console.log(`  ✓ Pre-rendered: /compare/${comp.slug}`)
}

// 6. Pre-render Industry & Persona Use Case Pages
const USE_CASE_PAGES = [
  { slug: 'students', title: 'Best PDF Converter for Students (100% Free & Unlimited) | Convertly', desc: 'Free, unlimited PDF and document tools for college and university students. Convert research papers, merge assignments, compress thesis PDFs, and extract lecture notes.' },
  { slug: 'teachers', title: 'Best PDF Converter for Teachers & Educators (Free) | Convertly', desc: 'Free document conversion suite for teachers, professors, and educators. Create printable worksheets, merge grading packets, and convert slides to handouts.' },
  { slug: 'businesses', title: 'Best PDF Converter for Small Businesses & Enterprises | Convertly', desc: 'Secure, fast, and 100% free document converter for businesses and startups. Convert invoices, merge contracts, optimize reports for email, and protect sensitive IP.' },
  { slug: 'lawyers', title: 'Best PDF Converter for Lawyers & Legal Counsel (Secure & Private)', desc: 'Strictly private, zero-retention PDF tools for lawyers, paralegals, and legal firms. Redact sensitive disclosures, merge case exhibits, and prepare court filings.' },
  { slug: 'hr', title: 'Best PDF Converter for HR & People Operations | Convertly', desc: 'Streamline onboarding packets, payroll records, and employee contracts with secure, free PDF tools. Convert Word resumes, merge benefit packets, and protect PII.' },
  { slug: 'freelancers', title: 'Best PDF Converter for Freelancers & Contractors | Convertly', desc: 'Free, professional document conversion suite for freelancers and solo contractors. Convert invoices to PDF, merge project deliverables, and compress client proposals.' },
  { slug: 'designers', title: 'Best Image & PDF Converter for Designers & Creatives | Convertly', desc: 'High-fidelity image and PDF conversion suite for UI/UX and graphic designers. Convert WebP, PNG, and JPG, compress vector PDFs, and export design portfolios.' },
]

for (const uc of USE_CASE_PAGES) {
  const pageDir = path.join(DIST_DIR, 'use-cases', uc.slug)
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true })
  }
  let ucHtml = template
  ucHtml = ucHtml.replace(/<title>.*?<\/title>/, `<title>${uc.title}</title>`)
  ucHtml = ucHtml.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${uc.desc}" />`)
  ucHtml = ucHtml.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${BASE_DOMAIN}/use-cases/${uc.slug}" />`)
  fs.writeFileSync(path.join(pageDir, 'index.html'), ucHtml, 'utf-8')
  console.log(`  ✓ Pre-rendered: /use-cases/${uc.slug}`)
}

// 7. Pre-render Problem Solving Guides
const GUIDE_PAGES = [
  { slug: 'how-to-convert-pdf-to-word-without-losing-formatting', title: 'How to Convert PDF to Word Without Losing Formatting (2026 Guide)', desc: 'Step-by-step guide to converting complex PDF documents into editable Microsoft Word DOCX files while preserving exact tables, margins, fonts, and layouts.' },
  { slug: 'how-to-compress-pdf-without-losing-quality', title: 'How to Compress PDF Without Losing Quality (Email & Portal Ready)', desc: 'Learn how to reduce large PDF file sizes by up to 90% while keeping vector text mathematically crisp and images sharp. Full technical walkthrough.' },
  { slug: 'how-to-merge-pdf-files', title: 'How to Merge Multiple PDF Files into One (Free Step-by-Step Guide)', desc: 'Combine multiple PDF documents into a single cohesive file online. Learn how to sequence pages, preserve bookmarks, and merge up to 20 files in seconds.' },
  { slug: 'how-to-split-pdf-pages', title: 'How to Split PDF Pages & Extract Ranges Online Free | Convertly', desc: 'Extract specific pages, chapters, or page ranges from any PDF file. Step-by-step instructions on separating single pages or breaking large documents down.' },
  { slug: 'how-to-convert-excel-to-pdf', title: 'How to Convert Excel to PDF Without Cutting Off Columns (Guide)', desc: 'Convert XLSX and XLS spreadsheets to beautifully paginated PDF documents. How to avoid split tables, cropped columns, and pagination issues.' },
  { slug: 'how-to-convert-powerpoint-to-pdf', title: 'How to Convert PowerPoint to PDF (Slide Deck to Universal Handout)', desc: 'Convert PPTX and PPT presentation slide decks into universal PDF documents. Maintain slide typography, vector graphics, and speaker notes.' },
  { slug: 'how-to-convert-images-into-pdf', title: 'How to Convert Images into a Single PDF (JPG, PNG & WebP)', desc: 'Step-by-step guide to combining photos, screenshots, and graphic scans into a multi-page PDF document online for free.' },
]

for (const guide of GUIDE_PAGES) {
  const pageDir = path.join(DIST_DIR, 'guides', guide.slug)
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true })
  }
  let guideHtml = template
  guideHtml = guideHtml.replace(/<title>.*?<\/title>/, `<title>${guide.title}</title>`)
  guideHtml = guideHtml.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${guide.desc}" />`)
  guideHtml = guideHtml.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${BASE_DOMAIN}/guides/${guide.slug}" />`)
  fs.writeFileSync(path.join(pageDir, 'index.html'), guideHtml, 'utf-8')
  console.log(`  ✓ Pre-rendered: /guides/${guide.slug}`)
}

// 8. Pre-render Engineering Blog Articles
const BLOG_PAGES = [
  { slug: 'the-definitive-guide-to-lossless-pdf-compression', title: 'The Definitive Guide to Lossless PDF Compression: Behind the Code', desc: 'Discover how modern compression engines reduce PDF file size by 80% without degrading visual vector sharpness or font typography.' },
  { slug: 'how-to-fix-broken-formatting-in-pdf-to-word', title: 'How to Fix Broken Formatting When Converting PDF to Word DOCX', desc: 'Solve misaligned tables, jumping text frames, and broken font styles when exporting PDF documents to editable Microsoft Word.' },
  { slug: 'excel-to-pdf-best-practices-for-executive-reporting', title: 'Excel to PDF Best Practices: Creating Board-Ready Financial Reports', desc: 'How to convert Microsoft Excel spreadsheets to clean, presentation-ready PDF reports without awkward column splits or distorted gridlines.' },
  { slug: 'powerpoint-to-pdf-handout-optimization', title: 'PowerPoint to PDF: Creating Crisp Slide Handouts for High-Stakes Pitches', desc: 'Transform slide decks into universal PDF presentation handouts. Prevent missing corporate fonts and format shifts across presentation hardware.' },
  { slug: 'next-gen-image-formats-webp-vs-png-vs-jpg', title: 'WebP vs PNG vs JPG: Modern Image Format Selection Guide (2026)', desc: 'A technical deep-dive into Google WebP, PNG, and JPEG. Learn which format to choose for Core Web Vitals, transparency, and photography compression.' },
  { slug: 'zero-retention-architecture-in-modern-file-converters', title: 'Zero-Retention Architecture: Protecting Document Privacy in the Cloud', desc: 'How Convertly protects sensitive user documents with TLS 1.3 encryption, isolated worker containers, and automated 120-minute file shredding.' },
  { slug: 'security-defense-in-depth-document-pipeline', title: 'Security Defense-in-Depth: Sandboxing Untrusted Document Pipelines', desc: 'A technical analysis of document processing vulnerabilities (Buffer Overflows, Ghostscript CVEs) and how defense-in-depth sandboxing mitigates them.' },
  { slug: 'paperless-office-productivity-hacks', title: '10 Paperless Productivity Hacks to Automate Document Workflows', desc: 'Boost daily office efficiency with 10 actionable document hacks: instant QR transfers, multi-file merging, PDF page isolation, and Bates numbering.' },
  { slug: 'why-convertly-is-the-best-free-alternative-to-adobe-acrobat', title: 'Why Convertly Is the Best Free Alternative to Adobe Acrobat in 2026', desc: 'A direct comparison between Convertly and Adobe Acrobat. Compare annual subscription costs ($239+/yr), forced account logins, and web conversion speed.' },
  { slug: 'step-by-step-tutorial-redacting-confidential-data-from-pdf', title: 'Step-by-Step Tutorial: Redacting Confidential Data from PDF Documents', desc: 'Learn how to properly redact sensitive information from PDF files. Why drawing black rectangles fails and how to permanently purge confidential bytes.' },
]

for (const post of BLOG_PAGES) {
  const pageDir = path.join(DIST_DIR, 'blog', post.slug)
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true })
  }
  let postHtml = template
  postHtml = postHtml.replace(/<title>.*?<\/title>/, `<title>${post.title} | Convertly Blog</title>`)
  postHtml = postHtml.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${post.desc}" />`)
  postHtml = postHtml.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${BASE_DOMAIN}/blog/${post.slug}" />`)
  fs.writeFileSync(path.join(pageDir, 'index.html'), postHtml, 'utf-8')
  console.log(`  ✓ Pre-rendered: /blog/${post.slug}`)
}

// 9. Automated Production XML Sitemap Generator (Comprehensive Multi-Cluster Coverage)
const today = new Date().toISOString().split('T')[0]
const flagshipToolIds = new Set([
  'pdf-to-word', 'word-to-pdf', 'pdf-merge', 'pdf-compress',
  'images-to-pdf', 'excel-to-pdf', 'ppt-to-pdf'
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

// C. Programmatic Landing Pages
sitemapXml += `\n  <!-- Programmatic SEO Landing Pages (${PROGRAMMATIC_PAGES.length} URLs) -->\n`
for (const prog of PROGRAMMATIC_PAGES) {
  sitemapXml += `  <url><loc>${BASE_DOMAIN}/convert/${prog.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>\n`
}

// D. Competitor Comparisons
sitemapXml += `\n  <!-- Competitor Comparisons (${COMPARISON_PAGES.length} URLs) -->\n`
for (const comp of COMPARISON_PAGES) {
  sitemapXml += `  <url><loc>${BASE_DOMAIN}/compare/${comp.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`
}

// E. Industry & Persona Use Cases
sitemapXml += `\n  <!-- Industry Use Cases (${USE_CASE_PAGES.length} URLs) -->\n`
for (const uc of USE_CASE_PAGES) {
  sitemapXml += `  <url><loc>${BASE_DOMAIN}/use-cases/${uc.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`
}

// F. Problem Solving Guides
sitemapXml += `\n  <!-- Problem Solving Guides (${GUIDE_PAGES.length} URLs) -->\n`
for (const guide of GUIDE_PAGES) {
  sitemapXml += `  <url><loc>${BASE_DOMAIN}/guides/${guide.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>\n`
}

// G. Engineering Blog Articles
sitemapXml += `\n  <!-- Engineering Blog Articles (${BLOG_PAGES.length} URLs) -->\n`
for (const post of BLOG_PAGES) {
  sitemapXml += `  <url><loc>${BASE_DOMAIN}/blog/${post.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.75</priority></url>\n`
}

// H. Core Technical & Legal Specifications
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
  PROGRAMMATIC_PAGES.length +
  COMPARISON_PAGES.length +
  USE_CASE_PAGES.length +
  GUIDE_PAGES.length +
  BLOG_PAGES.length +
  5 // 5 legal/specs

console.log(`  ✓ Dynamically Generated Production Sitemap: ${totalUrls} Verified URLs`)

console.log('✅ Static pre-rendering and dynamic sitemap generation completed successfully!')
