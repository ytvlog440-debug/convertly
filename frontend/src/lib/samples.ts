// Sample file generation for instant 1-click testing & demo onboarding

export async function generateSampleFiles(toolId: string): Promise<File[]> {
  const isPdfTool =
    toolId.startsWith('pdf-') ||
    toolId === 'pdf-to-word' ||
    toolId === 'pdf-to-images' ||
    toolId === 'pdf-to-txt' ||
    toolId === 'pdf-grayscale'

  const isImageTool =
    toolId.startsWith('image-') ||
    toolId === 'jpg-to-png' ||
    toolId === 'png-to-jpg' ||
    toolId === 'image-to-webp' ||
    toolId === 'webp-to-image' ||
    toolId === 'images-to-pdf'

  if (toolId === 'word-to-pdf') {
    try {
      const res = await fetch('/samples/sample.docx')
      const blob = await res.blob()
      return [
        new File([blob], 'Sample_Executive_Brief.docx', {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
      ]
    } catch (e) {
      console.warn('Could not fetch sample.docx, falling back', e)
    }
  }

  if (toolId === 'excel-to-pdf') {
    try {
      const res = await fetch('/samples/sample.xlsx')
      const blob = await res.blob()
      return [
        new File([blob], 'Sample_Spreadsheet.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      ]
    } catch (e) {
      console.warn('Could not fetch sample.xlsx, falling back', e)
    }
  }

  if (toolId === 'ppt-to-pdf') {
    try {
      const res = await fetch('/samples/sample.pptx')
      const blob = await res.blob()
      return [
        new File([blob], 'Sample_Presentation.pptx', {
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        }),
      ]
    } catch (e) {
      console.warn('Could not fetch sample.pptx, falling back', e)
    }
  }

  if (toolId === 'pdf-merge') {
    const pdf1 = createMinimalPdf('Convertly V2 — Sample Document (Part 1)')
    const pdf2 = createMinimalPdf('Convertly V2 — Sample Document (Part 2)')
    return [
      new File([pdf1], 'Sample_Document_Part_1.pdf', { type: 'application/pdf' }),
      new File([pdf2], 'Sample_Document_Part_2.pdf', { type: 'application/pdf' }),
    ]
  }

  if (toolId === 'images-to-pdf') {
    const img1 = await createSampleImageCanvas('Slide 1: Convertly Presentation', '#6366f1')
    const img2 = await createSampleImageCanvas('Slide 2: Architecture Diagram', '#06b6d4')
    return [
      new File([img1], 'Sample_Photo_1.png', { type: 'image/png' }),
      new File([img2], 'Sample_Photo_2.png', { type: 'image/png' }),
    ]
  }

  if (toolId === 'pdf-to-excel') {
    const pdf = createSampleFinancialTablePdf()
    return [new File([pdf], 'Sample_Financial_Statement.pdf', { type: 'application/pdf' })]
  }

  if (isPdfTool) {
    const pdf = createMinimalPdf(`Convertly V2 — Sample Test Document\nTool: ${toolId}`)
    return [new File([pdf], `Sample_${toolId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, { type: 'application/pdf' })]
  }

  if (isImageTool) {
    const ext = toolId === 'png-to-jpg' || toolId === 'image-compress' ? 'jpg' : 'png'
    const mime = ext === 'jpg' ? 'image/jpeg' : 'image/png'
    const imgBlob = await createSampleImageCanvas(`Convertly V2 — Sample Image\nTool: ${toolId}`, '#4f46e5', mime)
    return [new File([imgBlob], `Sample_Photo.${ext}`, { type: mime })]
  }

  // Fallback text / general sample
  const textBlob = new Blob(
    [
      `Convertly V2 Enterprise File Platform\n\nThis is an automated sample document generated for verifying conversion workflows.\nTool ID: ${toolId}\nTimestamp: ${new Date().toISOString()}\nRetention policy: All documents automatically deleted within 120 minutes.`,
    ],
    { type: 'text/plain' }
  )
  return [new File([textBlob], `Sample_Document_${toolId}.txt`, { type: 'text/plain' })]
}

function createMinimalPdf(textTitle: string): Blob {
  const cleanTitle = textTitle.replace(/[()\\]/g, '')
  // Valid PDF 1.4 binary structure with Helvetica font and centered text
  const pdfString = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 120 >> stream
BT
/F1 18 Tf
50 720 Td
(${cleanTitle}) Tj
0 -40 Td
/F1 12 Tf
(Free Online Conversion | 120-Minute Retention) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000416 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
490
%%EOF`

  return new Blob([pdfString], { type: 'application/pdf' })
}

function createSampleFinancialTablePdf(): Blob {
  const stream = `0.5 w
0.8 0.8 0.8 RG
50 670 512 25 re S
50 645 512 25 re S
50 620 512 25 re S
50 595 512 25 re S
50 570 512 25 re S
50 545 512 25 re S
BT
/F1 16 Tf
50 730 Td
(Quarterly Financial Performance Statement) Tj
ET
BT
/F1 10 Tf
55 678 Td (Quarter) Tj
ET
BT
/F1 10 Tf
160 678 Td (Gross Revenue) Tj
ET
BT
/F1 10 Tf
280 678 Td (Operating Cost) Tj
ET
BT
/F1 10 Tf
400 678 Td (Net Income) Tj
ET
BT
/F1 10 Tf
490 678 Td (Margin) Tj
ET
BT
/F1 10 Tf
55 653 Td (Q1 2024) Tj
ET
BT
/F1 10 Tf
160 653 Td ($1,250,000.00) Tj
ET
BT
/F1 10 Tf
280 653 Td ($820,000.00) Tj
ET
BT
/F1 10 Tf
400 653 Td ($430,000.00) Tj
ET
BT
/F1 10 Tf
490 653 Td (34.40%) Tj
ET
BT
/F1 10 Tf
55 628 Td (Q2 2024) Tj
ET
BT
/F1 10 Tf
160 628 Td ($1,420,000.00) Tj
ET
BT
/F1 10 Tf
280 628 Td ($890,000.00) Tj
ET
BT
/F1 10 Tf
400 628 Td ($530,000.00) Tj
ET
BT
/F1 10 Tf
490 628 Td (37.32%) Tj
ET
BT
/F1 10 Tf
55 603 Td (Q3 2024) Tj
ET
BT
/F1 10 Tf
160 603 Td ($1,680,000.00) Tj
ET
BT
/F1 10 Tf
280 603 Td ($940,000.00) Tj
ET
BT
/F1 10 Tf
400 603 Td ($740,000.00) Tj
ET
BT
/F1 10 Tf
490 603 Td (44.05%) Tj
ET
BT
/F1 10 Tf
55 578 Td (Q4 2024) Tj
ET
BT
/F1 10 Tf
160 578 Td ($1,950,000.00) Tj
ET
BT
/F1 10 Tf
280 578 Td ($1,050,000.00) Tj
ET
BT
/F1 10 Tf
400 578 Td ($900,000.00) Tj
ET
BT
/F1 10 Tf
490 578 Td (46.15%) Tj
ET
BT
/F1 10 Tf
55 553 Td (Total FY) Tj
ET
BT
/F1 10 Tf
160 553 Td ($6,300,000.00) Tj
ET
BT
/F1 10 Tf
280 553 Td ($3,700,000.00) Tj
ET
BT
/F1 10 Tf
400 553 Td ($2,600,000.00) Tj
ET
BT
/F1 10 Tf
490 553 Td (41.27%) Tj
ET`.trim()

  const pdfString = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${stream.length} >> stream
${stream}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000250 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
500
%%EOF`

  return new Blob([pdfString], { type: 'application/pdf' })
}

export function createSampleInspectionPdf(): File {
  const pdfString = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 150 >> stream
BT
/F1 18 Tf
50 720 Td
(Quarterly Compliance & Audit Briefing) Tj
0 -40 Td
/F1 12 Tf
(CONFIDENTIAL - INTERNAL DISTRIBUTION ONLY) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
6 0 obj << /Title (Confidential Q3 Executive Audit) /Author (Sarah Jenkins - Chief Compliance Officer) /Producer (Adobe Acrobat Pro 2024 Extended) /CreationDate (D:20260910120000) >> endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000446 00000 n 
0000000520 00000 n 
trailer << /Size 7 /Root 1 0 R /Info 6 0 R >>
startxref
665
%%EOF`

  return new File([new Blob([pdfString], { type: 'application/pdf' })], 'Sample_Corporate_Audit.pdf', {
    type: 'application/pdf',
  })
}

function createSampleImageCanvas(
  caption: string,
  accentColor: string,
  mimeType: string = 'image/png'
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 400
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      resolve(new Blob(['fake image'], { type: mimeType }))
      return
    }

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 600, 400)
    grad.addColorStop(0, '#0f172a')
    grad.addColorStop(1, accentColor)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 600, 400)

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 4
    ctx.strokeRect(20, 20, 560, 360)

    // Text caption
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Convertly V2 Sample File', 300, 180)

    ctx.font = '14px sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText(caption, 300, 220)

    canvas.toBlob((blob) => {
      resolve(blob || new Blob(['image'], { type: mimeType }))
    }, mimeType)
  })
}
