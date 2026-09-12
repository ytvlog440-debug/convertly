import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Wrench
} from 'lucide-react'
import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SeoHead } from '../components/shared/SeoHead'
import { PROBLEM_GUIDES_DATA } from '../data/guidesData'
import { NotFoundPage } from './NotFoundPage'
import { trackToolSelected } from '../lib/analytics'

export function GuideDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const data = slug ? PROBLEM_GUIDES_DATA[slug] : null
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  if (!data) {
    return <NotFoundPage />
  }

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const canonicalUrl = `https://convertlytools.xyz/guides/${data.slug}`

  return (
    <div className="relative min-h-screen py-10 sm:py-16">
      <SeoHead
        title={data.title}
        description={data.metaDescription}
        keywords={data.keywords}
        canonicalUrl={canonicalUrl}
        pageType="WebPage"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Guides', item: '/guides' },
          { name: data.h1, item: `/guides/${data.slug}` }
        ]}
        faqs={data.faqs}
        howToSteps={data.howToSteps.map(s => ({ number: s.step, title: s.title, desc: s.instruction }))}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to="/guides" className="hover:text-foreground transition-colors">Guides</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{data.h1}</span>
        </nav>

        {/* Hero Section */}
        <header className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
              {data.category} Guide
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{data.readingTime}</span>
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {data.h1}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {data.summary}
          </p>

          {/* Quick Tool Callout Banner */}
          <div className="pt-2">
            <Card className="p-4 sm:p-5 border-indigo-500/30 bg-indigo-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-indigo-400">Recommended Converter Engine:</span>
                <p className="text-sm font-semibold text-foreground">{data.recommendedToolName}</p>
              </div>
              <Link
                to={`/tools/${data.recommendedToolId}`}
                onClick={() => trackToolSelected(data.recommendedToolName, undefined, 'guide_detail')}
              >
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 gap-1.5 text-xs shrink-0">
                  <span>Open Tool</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </Card>
          </div>
        </header>

        {/* Why This Fails Normally */}
        <section aria-labelledby="why-it-fails-heading" className="space-y-4">
          <h2 id="why-it-fails-heading" className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <span>Why Typical Online Converters Fail at This</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {data.whyItFailsNormally.map((item, idx) => (
              <Card key={idx} className="p-5 border border-border/80 bg-card/40 space-y-2">
                <span className="text-xs font-bold text-amber-400">Pitfall {idx + 1}</span>
                <h3 className="text-sm font-semibold text-foreground">{item.problem}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.reason}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Step-by-Step Problem Resolution Steps */}
        <section aria-labelledby="steps-heading" className="space-y-6">
          <h2 id="steps-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <span>Step-by-Step Action Plan</span>
          </h2>
          <div className="space-y-5">
            {data.howToSteps.map((step) => (
              <Card key={step.step} className="p-6 border border-border/80 bg-card/50 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md shadow-indigo-600/20">
                    {step.step}
                  </span>
                  <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-11">
                  {step.instruction}
                </p>
                {step.proTip && (
                  <div className="ml-11 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong className="text-foreground">Pro-Tip:</strong> {step.proTip}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Technical Deep Dive */}
        <section aria-labelledby="technical-deep-dive" className="space-y-4 rounded-2xl border border-border/80 bg-card/40 p-6 sm:p-8">
          <h2 id="technical-deep-dive" className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            <span>Technical Deep Dive: How the Underlying Engine Solves It</span>
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            {data.technicalDeepDive.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* Troubleshooting Matrix */}
        <section aria-labelledby="troubleshooting-heading" className="space-y-4">
          <h2 id="troubleshooting-heading" className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="h-5 w-5 text-cyan-400" />
            <span>Troubleshooting Common Edge Cases</span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/50">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/40 text-muted-foreground">
                  <th className="p-3.5 font-semibold w-1/3">Observed Symptom</th>
                  <th className="p-3.5 font-semibold text-emerald-400">Actionable Remedy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.troubleshootingMatrix.map((item, idx) => (
                  <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3.5 font-medium text-foreground">{item.issue}</td>
                    <td className="p-3.5 text-muted-foreground leading-relaxed">{item.remedy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQs */}
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

        {/* Related Guides Navigation */}
        <section aria-label="Related Problem Guides" className="pt-6 border-t border-border/60 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Related Problem Guides
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {data.relatedGuides.map((relSlug) => {
              const relGuide = PROBLEM_GUIDES_DATA[relSlug]
              if (!relGuide) return null
              return (
                <Link
                  key={relSlug}
                  to={`/guides/${relSlug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <span>{relGuide.h1}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
