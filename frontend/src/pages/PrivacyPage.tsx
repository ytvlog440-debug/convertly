import { ShieldCheck, Clock, Trash2, Lock, EyeOff, Server, FileText } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { SeoHead } from '../components/shared/SeoHead'

export function PrivacyPage() {
  return (
    <div className="py-12 md:py-16">
      <SeoHead
        title="Privacy Policy & Zero-Retention Guarantee | Convertly"
        description="Learn how Convertly protects your privacy with zero permanent document storage, automated 120-minute privacy shredding, and full GDPR compliance."
        canonicalUrl="https://convertlytools.xyz/privacy"
        breadcrumbs={[
          { name: 'Home', item: 'https://convertlytools.xyz/' },
          { name: 'Privacy Policy', item: 'https://convertlytools.xyz/privacy' }
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Zero Permanent Retention</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Privacy Policy & Data Protection
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            At Convertly V2, your documents belong strictly to you. We engineered our platform from day one with a zero-knowledge, zero-retention architecture.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Effective Date: September 10, 2026 • Version 2.0
          </p>
        </div>

        {/* Highlight Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 border-emerald-500/20 bg-card/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-foreground">120-Minute TTL Shredder</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Every uploaded and converted file is assigned a strict 120-minute Time-To-Live. Our automated cleaner overwrites bytes and deletes all storage records.
            </p>
          </Card>

          <Card className="p-6 border-indigo-500/20 bg-card/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
              <EyeOff className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-foreground">No File Inspection</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              No humans, AI training crawlers, or third-party advertising brokers ever read or parse your document contents.
            </p>
          </Card>

          <Card className="p-6 border-cyan-500/20 bg-card/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-4">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-foreground">Encrypted in Transit</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              All communications between your web browser and our document engine are encrypted using industry-standard TLS 1.3.
            </p>
          </Card>
        </div>

        {/* Detailed Policy Content */}
        <Card className="p-8 sm:p-10 space-y-8 text-xs text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              1. Information We Collect
            </h2>
            <p>
              When using Convertly V2, you provide files solely for the purpose of executing the file transformation you have requested (such as PDF conversion, image compression, or file merging). We do not require account registration, email addresses, credit card details, or personal profile data.
            </p>
            <p className="mt-2">
              We collect minimal technical diagnostics (such as HTTP request headers, file size, and conversion execution latency) solely to maintain platform health and prevent Denial-of-Service (DoS) abuse.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-rose-400" />
              2. Automated Document Shredding & Retention Policy
            </h2>
            <p>
              Unlike traditional cloud storage services, Convertly V2 is not a file hosting repository. All documents are stored in temporary, isolated directory structures with a maximum retention lifespan of exactly 120 minutes (2 hours).
            </p>
            <p className="mt-2">
              Our automated background cleaner runs every 10 minutes. It identifies any file whose retention threshold has elapsed, performs zero-byte wiping, and removes all associated database records. Once shredded, documents cannot be recovered by any party, including Convertly V2 engineers.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Server className="h-4 w-4 text-cyan-400" />
              3. Processing Infrastructure & Third-Party Isolation
            </h2>
            <p>
              All file conversions are processed on dedicated, isolated compute nodes. We do not transmit your documents to external third-party AI APIs, advertising networks, or analytics trackers. Your conversion executes entirely within our secure sandbox containers.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              4. GDPR & CCPA Compliance
            </h2>
            <p>
              Under the European Union General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA), you retain full rights over your personal data. Because we do not store personal profiles and automatically shred all files within 120 minutes, your data is inherently protected by design (Data Protection by Design and by Default).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400" />
              5. Contact & Privacy Officer
            </h2>
            <p>
              If you have any questions, inquiries, or security disclosures regarding our privacy architecture, you can contact our security and compliance team at{' '}
              <span className="font-mono text-foreground font-semibold">security@convertly.app</span>.
            </p>
          </section>
        </Card>
      </div>
    </div>
  )
}
