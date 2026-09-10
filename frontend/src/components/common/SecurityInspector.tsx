import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Lock,
  Unlock,
  UploadCloud,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Code,
  FileCheck2,
} from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { inspectPdf, FileInspectionResponse } from '../../lib/api'
import { createSampleInspectionPdf } from '../../lib/samples'

export function SecurityInspector() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<FileInspectionResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file to run pre-flight privacy inspection.')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const data = await inspectPdf(selectedFile)
      setReport(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Inspection failed. Ensure file is a valid PDF.')
      setReport(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleSampleClick = () => {
    const sample = createSampleInspectionPdf()
    handleFileChange(sample)
  }

  const handleReset = () => {
    setReport(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Card className="p-6 sm:p-8 border-cyan-500/30 bg-card/80 shadow-2xl backdrop-blur-md relative overflow-hidden mb-12">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Interactive Privacy Audit</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-foreground">
            Live PDF Security & Privacy Pre-flight Inspector
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Scan any PDF binary in real time to expose hidden metadata leaks, embedded scripts, unflattened form widgets, and encryption state.
          </p>
        </div>

        {report && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="self-start sm:self-auto gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Inspect Another File
          </Button>
        )}
      </div>

      {/* Upload Dropzone (if no report) */}
      {!report && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/5 transition-all rounded-2xl cursor-pointer text-center group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform mb-4 shadow-inner">
              {isLoading ? (
                <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />
              ) : (
                <UploadCloud className="h-7 w-7 text-cyan-400" />
              )}
            </div>

            <p className="text-sm font-semibold text-foreground">
              {isLoading ? 'Analyzing PDF binary structure...' : 'Click or drag PDF document to inspect'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Evaluated with real-time server PyMuPDF binary engine • Zero persistent storage
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <span className="text-xs text-muted-foreground">Don't have a PDF ready?</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSampleClick}
              disabled={isLoading}
              className="text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Try with Sample Corporate Audit PDF
            </Button>
          </div>
        </div>
      )}

      {/* Inspection Results Dashboard */}
      {report && (
        <div className="space-y-6">
          {/* Top Score Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black font-heading shadow-lg ${
                  report.privacy_score >= 80
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : report.privacy_score >= 55
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {report.privacy_score}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Privacy Score
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {report.privacy_score >= 80 ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                  )}
                  <span className="text-sm font-bold text-foreground">{report.risk_level}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Scale of 0 (critical exposure) to 100 (air-gapped hardened)
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Document Details
              </span>
              <p className="text-sm font-bold text-foreground truncate mt-1" title={report.filename}>
                {report.filename}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>{report.page_count} {report.page_count === 1 ? 'page' : 'pages'}</span>
                <span>•</span>
                <span>{(report.file_size_bytes / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span>{report.pdf_version}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Binary Security Flags
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  {report.is_encrypted ? (
                    <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  <span className={report.is_encrypted ? 'text-emerald-400' : 'text-rose-400'}>
                    {report.is_encrypted ? 'Encrypted' : 'Unencrypted'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Code className={`h-3.5 w-3.5 ${report.has_javascript ? 'text-rose-400' : 'text-emerald-400'}`} />
                  <span className={report.has_javascript ? 'text-rose-400' : 'text-muted-foreground'}>
                    {report.has_javascript ? 'JS Scripts Found' : 'No Scripts'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <FileText className={`h-3.5 w-3.5 ${report.has_forms ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <span className={report.has_forms ? 'text-amber-400' : 'text-muted-foreground'}>
                    {report.has_forms ? 'Active Forms' : 'No Forms'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <FileCheck2 className={`h-3.5 w-3.5 ${report.has_annotations ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <span className={report.has_annotations ? 'text-amber-400' : 'text-muted-foreground'}>
                    {report.has_annotations ? 'Annotations' : 'Clean Canvas'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Inspector Table */}
          <div className="rounded-2xl border border-border/80 bg-card/60 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              Exposed Metadata In Binary Dictionary
            </h3>
            {Object.keys(report.metadata).length === 0 ? (
              <p className="text-xs text-emerald-400">
                ✓ No metadata attributes detected. Document is already scrubbed!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(report.metadata).map(([key, value]) => (
                  <div key={key} className="flex items-baseline justify-between p-2 rounded-lg bg-background/50 border border-border/40">
                    <span className="font-mono text-muted-foreground capitalize">{key}:</span>
                    <span className="font-semibold text-foreground truncate max-w-[200px]" title={value}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 1-Click Remediation Playbook */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Recommended Defense Actions ({report.recommendations.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-border/80 bg-card hover:border-cyan-500/50 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground group-hover:text-cyan-400 transition-colors">
                        {rec.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        /{rec.tool_id}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {rec.reason}
                    </p>
                  </div>

                  <Link
                    to={`/tools/${rec.tool_id}?demo=true`}
                    className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-cyan-400 hover:text-cyan-300 pt-2 border-t border-border/40"
                  >
                    <span>Launch 1-Click Hardening</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
