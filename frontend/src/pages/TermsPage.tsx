import { Scale, CheckCircle2, AlertTriangle, FileText, Globe } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { SeoHead } from '../components/shared/SeoHead'

export function TermsPage() {
  return (
    <div className="py-12 md:py-16">
      <SeoHead
        title="Terms of Service | Convertly"
        description="Review the Convertly Terms of Service covering acceptable use, free availability, and document ownership."
        canonicalUrl="https://convertlytools.xyz/terms"
        breadcrumbs={[
          { name: 'Home', item: 'https://convertlytools.xyz' },
          { name: 'Terms of Service', item: 'https://convertlytools.xyz/terms' }
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400 mb-4">
            <Scale className="h-3.5 w-3.5" />
            <span>Clear & Fair Terms</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Simple, transparent terms governing your use of Convertly V2's free file conversion infrastructure.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Last Updated: September 10, 2026 • Version 2.0
          </p>
        </div>

        {/* Highlight Summary */}
        <h2 className="sr-only">Key Terms Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 border-border/80 bg-card/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-foreground">100% User Ownership</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              You retain full, unencumbered intellectual property rights over all files, text, and images you upload or convert.
            </p>
          </Card>

          <Card className="p-6 border-border/80 bg-card/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-foreground">Free & Open Utility</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              All 30 tools are provided free of charge for personal, academic, and commercial business workflows without watermarks.
            </p>
          </Card>

          <Card className="p-6 border-border/80 bg-card/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-4">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-foreground">Acceptable Use</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Automated scraping, DoS attacks, or processing malware/illicit materials is strictly prohibited and rate limited.
            </p>
          </Card>
        </div>

        {/* Terms Sections */}
        <Card className="p-8 sm:p-10 space-y-8 text-xs text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the Convertly V2 website, API endpoints, or conversion services, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you should not access or use the service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              2. User Content & Intellectual Property
            </h2>
            <p>
              Convertly V2 claims no ownership, copyright, or intellectual property rights in any documents, files, data, or content you process using our platform. You represent and warrant that you hold all necessary rights and authorizations to upload and convert the files you submit.
            </p>
            <p className="mt-2">
              You grant Convertly V2 a strictly limited, temporary, non-exclusive license solely to perform the technical operations required to convert and return your files to you, after which all data is permanently destroyed according to our 120-minute privacy schedule.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              3. Prohibited Uses
            </h2>
            <p>
              You agree not to use Convertly V2 to:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1.5 pl-2">
              <li>Upload or distribute computer viruses, worms, trojans, or malicious scripts.</li>
              <li>Attempt to bypass sliding-window rate limiters, storage boundaries, or security controls.</li>
              <li>Engage in abusive automated denial-of-service or volumetric bandwidth exhaustion attacks.</li>
              <li>Upload materials that infringe upon copyright, trademarks, or trade secrets of third parties.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Scale className="h-4 w-4 text-cyan-400" />
              4. Disclaimer of Warranties & Limitation of Liability
            </h2>
            <p>
              Convertly V2 is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. While we employ strict file validation and high-fidelity conversion algorithms, we do not guarantee that the service will be uninterrupted, error-free, or that conversions will meet specific formatting requirements for obscure document types.
            </p>
            <p className="mt-2">
              In no event shall Convertly V2 or its contributors be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use the platform.
            </p>
          </section>
        </Card>
      </div>
    </div>
  )
}
