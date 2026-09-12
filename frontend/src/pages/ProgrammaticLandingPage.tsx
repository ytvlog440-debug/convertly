import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  ExternalLink
} from 'lucide-react'
import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SeoHead } from '../components/shared/SeoHead'
import { resolveProgrammaticPage } from '../data/programmaticSeoData'
import { NotFoundPage } from './NotFoundPage'

export function ProgrammaticLandingPage() {
  const { slug } = useParams<{ slug: string }>()
  const data = slug ? resolveProgrammaticPage(slug) : null
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  if (!data) {
    return <NotFoundPage />
  }

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const canonicalUrl = `https://convertlytools.xyz/convert/${data.slug}`

  return (
    <div className="relative min-h-screen py-10 sm:py-16">
      <SeoHead
        title={data.title}
        description={data.metaDescription}
        keywords={data.keywords}
        canonicalUrl={canonicalUrl}
        pageType="WebApplication"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Tools', item: '/tools' },
          { name: data.h1, item: `/convert/${data.slug}` }
        ]}
        faqs={data.faqs}
        howToSteps={data.stepGuide.map(s => ({ number: s.step, title: s.title, desc: s.desc }))}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to="/tools" className="hover:text-foreground transition-colors">Tools</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{data.h1}</span>
        </nav>

        {/* Hero Section */}
        <header className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{data.badge}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider">{data.searchIntent}</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {data.h1}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {data.subheading}
          </p>

          {/* Primary Action CTA Card */}
          <div className="pt-6">
            <Card className="p-6 sm:p-8 bg-card/60 backdrop-blur-xl border border-indigo-500/30 shadow-xl text-center space-y-5">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/30">
                  <Layers className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Launch {data.h1} Engine</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    100% Free • No Account Registration • 120-Minute Automatic File Shredder
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to={`/tools/${data.toolId}`}>
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-500/20 gap-2">
                    <span>Open Converter Workspace</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/tools">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Browse All 30 Tools
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> TLS 1.3 Encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-indigo-400" /> Zero Retention SLA
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-cyan-400" /> Sub-3s Execution
                </span>
              </div>
            </Card>
          </div>
        </header>

        {/* Feature Highlights Grid */}
        <section aria-labelledby="highlights-heading" className="space-y-4">
          <h2 id="highlights-heading" className="text-xl font-bold tracking-tight text-foreground">
            Why Use Convertly for {data.h1}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {data.highlights.map((h, i) => (
              <Card key={i} className="p-5 border border-border/80 bg-card/40 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{h.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{h.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Step-by-Step Execution Guide */}
        <section aria-labelledby="how-it-works-heading" className="space-y-4">
          <h2 id="how-it-works-heading" className="text-xl font-bold tracking-tight text-foreground">
            How to Convert Your File in 3 Simple Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {data.stepGuide.map((s) => (
              <Card key={s.step} className="p-5 border border-border/80 bg-card/40 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
                    Step {s.step}
                  </Badge>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground pt-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Deep Technical Overview */}
        <section aria-labelledby="deep-overview-heading" className="space-y-4">
          <h2 id="deep-overview-heading" className="text-xl font-bold tracking-tight text-foreground">
            Technical Architecture & Structural Integrity
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            {data.deepExplanation.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* Frequently Asked Questions */}
        {data.faqs.length > 0 && (
          <section aria-labelledby="faqs-heading" className="space-y-4">
            <h2 id="faqs-heading" className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-indigo-400" />
              <span>Frequently Asked Questions</span>
            </h2>
            <div className="space-y-3">
              {data.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx
                return (
                  <div key={idx} className="rounded-xl border border-border/80 bg-card/40 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-foreground hover:bg-secondary/40 transition-colors"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Contextual Internal Linking Matrix */}
        <section aria-labelledby="related-workflows-heading" className="pt-6 border-t border-border/60 space-y-4">
          <h2 id="related-workflows-heading" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Related Converters & Variations
          </h2>
          <div className="flex flex-wrap items-center gap-2.5">
            {data.relatedSlugs.map((relSlug) => (
              <Link
                key={relSlug}
                to={`/convert/${relSlug}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card/60 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-colors"
              >
                <span>{relSlug.replace(/-/g, ' ')}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
            {data.relatedTools.map((relTool) => (
              <Link
                key={relTool}
                to={`/tools/${relTool}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <span>Direct Tool: {relTool}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
