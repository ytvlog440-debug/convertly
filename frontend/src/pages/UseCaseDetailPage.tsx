import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  ShieldCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from 'lucide-react'
import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SeoHead } from '../components/shared/SeoHead'
import { USE_CASES_DATA } from '../data/useCasesData'
import { NotFoundPage } from './NotFoundPage'
import { trackToolSelected } from '../lib/analytics'

export function UseCaseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const data = slug ? USE_CASES_DATA[slug] : null
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  if (!data) {
    return <NotFoundPage />
  }

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const canonicalUrl = `https://convertlytools.xyz/use-cases/${data.slug}`

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
          { name: 'Use Cases', item: '/use-cases' },
          { name: data.targetAudience, item: `/use-cases/${data.slug}` }
        ]}
        faqs={data.faqs}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to="/use-cases" className="hover:text-foreground transition-colors">Use Cases</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{data.targetAudience}</span>
        </nav>

        {/* Hero Section */}
        <header className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Users className="h-3.5 w-3.5" />
            <span>Dedicated Workflow Guide</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {data.h1}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {data.summary}
          </p>
        </header>

        {/* Industry Pain Points vs Solutions */}
        <section aria-labelledby="pain-points-heading" className="space-y-4">
          <h2 id="pain-points-heading" className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <span>Common Industry Challenges & How Convertly Solves Them</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {data.keyPainPoints.map((pp, idx) => (
              <Card key={idx} className="p-5 border border-border/80 bg-card/40 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Challenge {idx + 1}
                </span>
                <h3 className="text-sm font-semibold text-foreground">{pp.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{pp.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Recommended Tool Pipelines */}
        <section aria-labelledby="workflows-heading" className="space-y-4">
          <h2 id="workflows-heading" className="text-xl font-bold tracking-tight text-foreground">
            Tailored Tool Pipelines for {data.targetAudience}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.recommendedWorkflows.map((wf, idx) => (
              <Card key={idx} className="p-5 border border-border/80 bg-card/40 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
                      Workflow {idx + 1}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{wf.toolName}</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{wf.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{wf.desc}</p>
                </div>
                <Link
                  to={`/tools/${wf.toolId}`}
                  onClick={() => trackToolSelected(wf.toolName, undefined, 'use_case_detail')}
                >
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs justify-between group">
                    <span>Open {wf.toolName}</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* Compliance, Security & Standards */}
        <section aria-labelledby="compliance-heading" className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 space-y-4">
          <h2 id="compliance-heading" className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span>Compliance, Privacy & Ethics Safeguards</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {data.complianceAndSecurity.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>{item.title}</span>
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Expert Tips */}
        {data.expertTips.length > 0 && (
          <section aria-labelledby="tips-heading" className="space-y-3">
            <h2 id="tips-heading" className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              <span>Expert Practitioner Tips</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.expertTips.map((tip, idx) => (
                <div key={idx} className="rounded-xl border border-border/80 bg-card/40 p-4 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQs */}
        {data.faqs.length > 0 && (
          <section aria-labelledby="faqs-heading" className="space-y-4">
            <h2 id="faqs-heading" className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-indigo-400" />
              <span>Questions & Answers for {data.targetAudience}</span>
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

        {/* Other Industries Navigation */}
        <section aria-label="Explore other professions" className="pt-6 border-t border-border/60 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Explore Other Professions
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {Object.values(USE_CASES_DATA).filter(uc => uc.slug !== data.slug).map(uc => (
              <Link
                key={uc.slug}
                to={`/use-cases/${uc.slug}`}
                className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <span>{uc.targetAudience.split(',')[0]}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
