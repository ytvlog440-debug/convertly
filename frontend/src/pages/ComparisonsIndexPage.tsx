import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Scale,
  CheckCircle2
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SeoHead } from '../components/shared/SeoHead'
import { COMPARISONS_DATA } from '../data/comparisonsData'

export function ComparisonsIndexPage() {
  const comparisons = Object.values(COMPARISONS_DATA)

  return (
    <div className="relative min-h-screen py-10 sm:py-16">
      <SeoHead
        title="Convertly vs Competitors (2026) — Comprehensive PDF & Tool Comparisons"
        description="Factual, side-by-side comparisons of Convertly against Smallpdf, iLovePDF, PDF24, Adobe Acrobat, and FreeConvert. Compare free limits, pricing, and security."
        keywords="convertly vs smallpdf, convertly vs ilovepdf, convertly vs pdf24, convertly vs adobe acrobat, best pdf converter comparison"
        canonicalUrl="https://convertlytools.xyz/compare"
        pageType="CollectionPage"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Comparisons', item: '/compare' }
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Comparisons</span>
        </nav>

        {/* Hero Header */}
        <header className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Scale className="h-3.5 w-3.5" />
            <span>Factual Head-to-Head Evaluations</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Convertly vs. Leading PDF & Converter Platforms
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            We believe in honest, transparent comparisons. Explore how Convertly compares against legacy desktop software and freemium web converters in terms of pricing, daily file limits, and data confidentiality.
          </p>
        </header>

        {/* Competitor Teardown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comparisons.map((c) => (
            <Card key={c.slug} className="flex flex-col justify-between p-6 border border-border/80 bg-card/50 hover:border-indigo-500/40 transition-all space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs font-semibold">
                    Head-to-Head
                  </Badge>
                  <span className="text-xs text-muted-foreground">{c.competitorDomain}</span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-foreground hover:text-indigo-400 transition-colors">
                    <Link to={`/compare/${c.slug}`}>Convertly vs {c.competitorName}</Link>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {c.summary}
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground">Convertly:</span>
                    <span className="font-medium text-emerald-400 text-right">100% Free Forever</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground">{c.competitorName}:</span>
                    <span className="font-medium text-foreground/80 text-right truncate max-w-[150px]" title={c.pricingModel.competitor}>
                      {c.pricingModel.competitor.split('(')[0].trim()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Key Advantages
                  </span>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {c.strengths.convertly.slice(0, 2).map((st, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60">
                <Link to={`/compare/${c.slug}`} className="w-full">
                  <Button variant="outline" className="w-full justify-between group text-xs">
                    <span>Read Full Breakdown</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Global Conversion Architecture Banner */}
        <section aria-label="Core Convertly Philosophy" className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 sm:p-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <span>Convertly’s Open Architecture Commitment</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-cyan-400" />
                <span>Zero Subscription Paywalls</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We believe basic document conversion is foundational internet infrastructure that should never be metered behind expensive monthly fees.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>120-Minute Temporary Retention</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your private documents are stored temporarily on active server storage and automatically removed after 120 minutes with zero data harvesting.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-indigo-400" />
                <span>Native Performance Standards</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Compiled C++ and Python engines (PyMuPDF, LibreOffice, Pillow) deliver pixel-accurate output without browser-based canvas glitches.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
