import { Shield, Lock, Cpu, Server, Trash2, CheckCircle2, Terminal } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { SeoHead } from '../components/shared/SeoHead'
import { SecurityInspector } from '../components/common/SecurityInspector'

export function SecurityPage() {
  return (
    <div className="py-12 md:py-16">
      <SeoHead
        title="Security Architecture & Trust | Convertly"
        description="Comprehensive technical overview of Convertly's multi-tier security architecture, sandbox isolation, TLS 1.3 encryption, and automated multi-pass shredder."
        canonicalUrl="https://convertlytools.xyz/security"
        breadcrumbs={[
          { name: 'Home', item: 'https://convertlytools.xyz' },
          { name: 'Security Architecture', item: 'https://convertlytools.xyz/security' }
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-400 mb-4">
            <Shield className="h-3.5 w-3.5" />
            <span>Bank-Grade Architecture</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Security Architecture & Defense
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Convertly V2 enforces multi-layered defense-in-depth security across every network request, file ingestion pipeline, and background transformation worker.
          </p>
        </div>

        {/* Live Interactive Pre-flight PDF Inspector */}
        <SecurityInspector />

        {/* Technical Architecture Grid */}
        <h2 className="sr-only">Security Architecture Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="p-6 border-border/80 bg-card/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-4">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-foreground">Transport Layer Security (TLS 1.3)</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              All browser-to-server traffic is mandated over TLS 1.3 with Perfect Forward Secrecy (PFS) and strict HSTS headers. Man-in-the-middle sniffing is cryptographically prevented.
            </p>
          </Card>

          <Card className="p-6 border-border/80 bg-card/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-foreground">Ephemeral Subprocess Sandboxing</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Document transformation drivers (PyMuPDF, pypdf, Pillow, pdf2docx) execute in strictly isolated ephemeral worker processes with capped CPU and memory limits.
            </p>
          </Card>

          <Card className="p-6 border-border/80 bg-card/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-foreground">Binary Magic-Byte Inspection</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              We never trust client file extensions. Ingested files are validated against true binary magic numbers (`%PDF-`, `PK\x03\x04`, `\xFF\xD8\xFF`), blocking disguised executables.
            </p>
          </Card>

          <Card className="p-6 border-border/80 bg-card/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mb-4">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-foreground">Automated 120-Minute Shredder</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Our asynchronous cleaner daemon scans storage every 10 minutes. Any file older than 120 minutes is overwritten with zero bytes, unlinked, and purged from the database.
            </p>
          </Card>
        </div>

        {/* Security Specifications Detail */}
        <Card className="p-8 sm:p-10 space-y-8 text-xs text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Server className="h-4 w-4 text-cyan-400" />
              1. Network Edge & Reverse Proxy Hardening
            </h2>
            <p>
              Incoming traffic routes through a reverse proxy configured with strict Content Security Policy (CSP), anti-clickjacking `X-Frame-Options: SAMEORIGIN`, MIME sniffing protection `X-Content-Type-Options: nosniff`, and Referrer-Policy enforcement.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-400" />
              2. Sliding-Window Rate Limiting & DoS Mitigation
            </h2>
            <p>
              To protect resource availability, an in-memory sliding-window rate limiter monitors IP connection bursts, mitigating volumetric denial of service and preventing brute-force password cracking on PDF unlocking endpoints.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-400" />
              3. Pre- & Post-Conversion Output Validation
            </h2>
            <p>
              Every conversion pipeline incorporates post-processing integrity verification. Before a converted document is marked complete, our engines verify that the output file exists, is non-empty, and exhibits valid structural headers. Corrupted outputs are immediately trapped, discarded, and converted into RFC 7807 error responses.
            </p>
          </section>
        </Card>
      </div>
    </div>
  )
}
