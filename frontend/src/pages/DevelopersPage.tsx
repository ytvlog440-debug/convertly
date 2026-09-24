import { useState } from 'react'
import {
  Code2,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Server,
  Zap,
  Clock,
  FileCode,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { SeoHead } from '../components/shared/SeoHead'

type Language = 'curl' | 'python' | 'javascript'

interface EndpointDoc {
  id: string
  title: string
  method: 'GET' | 'POST'
  path: string
  desc: string
  snippets: Record<Language, string>
  responseExample: string
}

const ENDPOINTS: EndpointDoc[] = [
  {
    id: 'upload',
    title: '1. Ingest & Validate File',
    method: 'POST',
    path: '/api/v1/files/upload',
    desc: 'Upload a document or image with magic-byte validation and executable payload checks. Returns a unique file ID with 120-minute expiry.',
    snippets: {
      curl: `curl -X POST "https://convertlytools.xyz/api/v1/files/upload" \\
  -H "Accept: application/json" \\
  -F "file=@/path/to/quarterly_report.pdf"`,
      python: `import requests

with open("quarterly_report.pdf", "rb") as f:
    response = requests.post(
        "https://convertlytools.xyz/api/v1/files/upload",
        files={"file": ("quarterly_report.pdf", f, "application/pdf")}
    )

data = response.json()["data"]
print("Uploaded file ID:", data["id"])
print("Expires at:", data["expires_at"])`,
      javascript: `const formData = new FormData();
formData.append("file", fileInput.files[0]);

const res = await fetch("https://convertlytools.xyz/api/v1/files/upload", {
  method: "POST",
  body: formData
});

const { data } = await res.json();
console.log("File ID:", data.id);`,
    },
    responseExample: `{
  "success": true,
  "message": "File uploaded and verified successfully.",
  "data": {
    "id": "a2dd828d-da24-4d63-939c-45da7c4071e7",
    "original_filename": "quarterly_report.pdf",
    "file_size_bytes": 142850,
    "mime_type": "application/pdf",
    "file_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "created_at": "2026-09-11T07:00:00Z",
    "expires_at": "2026-09-11T09:00:00Z"
  }
}`,
  },
  {
    id: 'create-job',
    title: '2. Dispatch Conversion Job',
    method: 'POST',
    path: '/api/v1/jobs',
    desc: 'Submit one or more file IDs to any of Convertly 30 binary conversion engines with customized transformation parameters.',
    snippets: {
      curl: `curl -X POST "https://convertlytools.xyz/api/v1/jobs" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool_id": "pdf-compress",
    "input_file_ids": ["a2dd828d-da24-4d63-939c-45da7c4071e7"],
    "options": {
      "level": "recommended"
    }
  }'`,
      python: `import requests

payload = {
    "tool_id": "pdf-compress",
    "input_file_ids": ["a2dd828d-da24-4d63-939c-45da7c4071e7"],
    "options": {"level": "recommended"}
}

res = requests.post("https://convertlytools.xyz/api/v1/jobs", json=payload)
job_id = res.json()["data"]["id"]
print("Dispatched Job ID:", job_id)`,
      javascript: `const res = await fetch("https://convertlytools.xyz/api/v1/jobs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tool_id: "pdf-compress",
    input_file_ids: ["a2dd828d-da24-4d63-939c-45da7c4071e7"],
    options: { level: "recommended" }
  })
});

const { data } = await res.json();
console.log("Job ID:", data.id);`,
    },
    responseExample: `{
  "success": true,
  "message": "Conversion job submitted successfully.",
  "data": {
    "id": "318a610b-c568-4da4-9fe0-097e0803afb4",
    "tool_id": "pdf-compress",
    "status": "processing",
    "progress": 25,
    "input_file_ids": ["a2dd828d-da24-4d63-939c-45da7c4071e7"],
    "options": { "level": "recommended" },
    "created_at": "2026-09-11T07:00:02Z"
  }
}`,
  },
  {
    id: 'poll-job',
    title: '3. Poll Job Status',
    method: 'GET',
    path: '/api/v1/jobs/{job_id}',
    desc: 'Poll background worker progress until status reaches "completed" or "failed". Execution typically concludes in under 1 second.',
    snippets: {
      curl: `curl "https://convertlytools.xyz/api/v1/jobs/318a610b-c568-4da4-9fe0-097e0803afb4"`,
      python: `import time
import requests

job_id = "318a610b-c568-4da4-9fe0-097e0803afb4"

while True:
    res = requests.get(f"https://convertlytools.xyz/api/v1/jobs/{job_id}")
    job = res.json()["data"]
    if job["status"] == "completed":
        print("Output file ready:", job["output_file_id"])
        break
    time.sleep(0.5)`,
      javascript: `async function waitForJob(jobId) {
  while (true) {
    const res = await fetch(\`https://convertlytools.xyz/api/v1/jobs/\${jobId}\`);
    const { data } = await res.json();
    if (data.status === "completed") return data.output_file_id;
    if (data.status === "failed") throw new Error(data.error_message);
    await new Promise(r => setTimeout(r, 500));
  }
}`,
    },
    responseExample: `{
  "success": true,
  "message": "Job status retrieved.",
  "data": {
    "id": "318a610b-c568-4da4-9fe0-097e0803afb4",
    "tool_id": "pdf-compress",
    "status": "completed",
    "progress": 100,
    "output_file_id": "44e2e6cf-8524-409b-ac27-a7ae82017fcb",
    "created_at": "2026-09-11T07:00:02Z",
    "updated_at": "2026-09-11T07:00:03Z"
  }
}`,
  },
  {
    id: 'download',
    title: '4. Download Result',
    method: 'GET',
    path: '/api/v1/files/{file_id}/download',
    desc: 'Streams the converted binary with safe Content-Disposition headers and anti-sniffing X-Content-Type-Options.',
    snippets: {
      curl: `curl -O -J "https://convertlytools.xyz/api/v1/files/44e2e6cf-8524-409b-ac27-a7ae82017fcb/download"`,
      python: `import requests

file_id = "44e2e6cf-8524-409b-ac27-a7ae82017fcb"
res = requests.get(f"https://convertlytools.xyz/api/v1/files/{file_id}/download")

with open("compressed_output.pdf", "wb") as f:
    f.write(res.content)
print("Downloaded converted file successfully!")`,
      javascript: `// Trigger direct browser download
const fileId = "44e2e6cf-8524-409b-ac27-a7ae82017fcb";
window.location.href = \`https://convertlytools.xyz/api/v1/files/\${fileId}/download\`;`,
    },
    responseExample: `HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="compressed_output.pdf"
Content-Length: 95400
X-Content-Type-Options: nosniff

<binary stream content>`,
  },
  {
    id: 'inspect',
    title: '5. Pre-Flight PDF Security & Privacy Audit',
    method: 'POST',
    path: '/api/v1/files/inspect',
    desc: 'Inspects PDF byte dictionary for metadata trails, form widgets, embedded JavaScript hooks, and encryption layers.',
    snippets: {
      curl: `curl -X POST "https://convertlytools.xyz/api/v1/files/inspect" \\
  -F "file=@document_to_audit.pdf"`,
      python: `import requests

with open("document_to_audit.pdf", "rb") as f:
    res = requests.post(
        "https://convertlytools.xyz/api/v1/files/inspect",
        files={"file": ("document_to_audit.pdf", f, "application/pdf")}
    )

audit = res.json()["data"]
print("Privacy Score:", audit["privacy_score"], "/ 100")
print("Risk Level:", audit["risk_level"])
print("Recommendations:", len(audit["recommendations"]))`,
      javascript: `const formData = new FormData();
formData.append("file", file);

const res = await fetch("https://convertlytools.xyz/api/v1/files/inspect", {
  method: "POST",
  body: formData
});

const { data } = await res.json();
console.log(\`Score: \${data.privacy_score}/100 (\${data.risk_level})\`);`,
    },
    responseExample: `{
  "success": true,
  "message": "PDF security and privacy pre-flight inspection completed.",
  "data": {
    "filename": "document_to_audit.pdf",
    "file_size_bytes": 1048576,
    "page_count": 4,
    "pdf_version": "PDF 1.7",
    "is_encrypted": false,
    "has_javascript": false,
    "has_annotations": true,
    "has_forms": true,
    "metadata": {
      "author": "Alice Henderson",
      "producer": "Convertly Enterprise Suite"
    },
    "privacy_score": 75,
    "risk_level": "Medium Risk",
    "recommendations": [
      {
        "tool_id": "pdf-scrub-metadata",
        "title": "Scrub Document Metadata",
        "reason": "Detected sensitive document trails exposing author and software fingerprints."
      }
    ]
  }
}`,
  },
]

export function DevelopersPage() {
  const [selectedLang, setSelectedLang] = useState<Language>('python')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="py-12 md:py-16">
      <SeoHead
        title="Developer API & REST Integration | Convertly"
        description="Integrate Convertly's 30 native document conversion engines programmatically with cURL, Python, and JavaScript REST endpoints."
        canonicalUrl="https://convertlytools.xyz/developers"
        breadcrumbs={[
          { name: 'Home', item: 'https://convertlytools.xyz' },
          { name: 'Developer API', item: 'https://convertlytools.xyz/developers' }
        ]}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400 mb-4">
            <Code2 className="h-3.5 w-3.5" />
            <span>Developer Center</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Convertly V2 REST API Reference
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Programmatically automate PDF transformations, high-fidelity Office conversions, and batch image processing with our high-throughput, asynchronous REST pipeline.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <a
              href="/api/v1/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
            >
              <span>Launch Interactive Swagger UI</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="/api/v1/redoc"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold transition-all"
            >
              <span>ReDoc Specification</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Technical Specs Cards */}
        <h2 className="sr-only">Technical Performance Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card className="p-4 border-border/80 bg-card/60">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Zap className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Latency</span>
            </div>
            <p className="text-base font-bold font-heading text-foreground">&lt; 850ms</p>
            <p className="text-[11px] text-muted-foreground mt-1">Average execution time on standard PDF transformations.</p>
          </Card>

          <Card className="p-4 border-border/80 bg-card/60">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">File Retention</span>
            </div>
            <p className="text-base font-bold font-heading text-foreground">120 Minutes</p>
            <p className="text-[11px] text-muted-foreground mt-1">Automated cleanup task removes expired files after 120 minutes.</p>
          </Card>

          <Card className="p-4 border-border/80 bg-card/60">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Server className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Max Payload</span>
            </div>
            <p className="text-base font-bold font-heading text-foreground">100 MB / File</p>
            <p className="text-[11px] text-muted-foreground mt-1">Single file upload ceiling, up to 30 batch-staged files.</p>
          </Card>

          <Card className="p-4 border-border/80 bg-card/60">
            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Rate Limiting</span>
            </div>
            <p className="text-base font-bold font-heading text-foreground">Sliding Window</p>
            <p className="text-[11px] text-muted-foreground mt-1">In-memory IP token bucket preventing denial-of-service.</p>
          </Card>
        </div>

        {/* Language Tabs Selector */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-8">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Code Examples Language
            </span>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border">
            {(['curl', 'python', 'javascript'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                  selectedLang === lang
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {lang === 'javascript' ? 'JavaScript / Node' : lang}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoints List */}
        <h2 className="sr-only">API Endpoints Reference</h2>
        <div className="space-y-8">
          {ENDPOINTS.map((ep) => (
            <Card key={ep.id} className="p-6 sm:p-8 border-border/80 bg-card/80 overflow-hidden relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-heading text-base font-bold text-foreground">
                    {ep.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ep.desc}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      ep.method === 'POST'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-foreground/80 px-2 py-0.5 rounded bg-muted/50 border border-border/60">
                    {ep.path}
                  </span>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative rounded-xl border border-border bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto shadow-inner mb-4">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 mb-2 border-b border-slate-800">
                  <span className="uppercase tracking-wider font-semibold text-slate-300">
                    {selectedLang === 'javascript' ? 'Node.js Fetch' : selectedLang} Snippet
                  </span>
                  <button
                    onClick={() => copySnippet(ep.id, ep.snippets[selectedLang])}
                    className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedId === ep.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[12px] leading-relaxed whitespace-pre-wrap">
                  {ep.snippets[selectedLang]}
                </pre>
              </div>

              {/* Response Example Accordion */}
              <details className="group">
                <summary className="text-xs font-semibold text-muted-foreground hover:text-indigo-400 cursor-pointer transition-colors flex items-center gap-1.5 select-none">
                  <FileCode className="h-3.5 w-3.5" />
                  <span>View Example Response Schema</span>
                </summary>
                <div className="mt-3 rounded-xl border border-border/60 bg-slate-900/60 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto">
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {ep.responseExample}
                  </pre>
                </div>
              </details>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
