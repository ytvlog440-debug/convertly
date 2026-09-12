import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Scale,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SeoHead } from '../components/shared/SeoHead'
import { COMPARISONS_DATA } from '../data/comparisonsData'
import { NotFoundPage } from './NotFoundPage'
import { trackToolSelected } from '../lib/analytics'

export function ComparisonDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const data = slug ? COMPARISONS_DATA[slug] : null
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  if (!data) {
    return <NotFoundPage />
  }

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const canonicalUrl = `https://convertlytools.xyz/compare/${data.slug}`

  return (
    <div className="relative min-h-screen py-10 sm:py-16">
      <SeoHead
        title={data.title}
        description={data.metaDescription}
        keywords={`convertly vs ${data.competitorName.toLowerCase()}, ${data.competitorName.toLowerCase()} alternative, free pdf converter vs ${data.competitorName.toLowerCase()}`}
        canonicalUrl={canonicalUrl}
        pageType="WebPage"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Comparisons', item: '/compare' },
          { name: `Convertly vs ${data.competitorName}`, item: `/compare/${data.slug}` }
        ]}
        faqs={data.faqs}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to="/compare" className="hover:text-foreground transition-colors">Comparisons</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">Convertly vs {data.competitorName}</span>
        </nav>

        {/* Hero Section */}
        <header className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Scale className="h-3.5 w-3.5" />
            <span>Factual Head-to-Head Analysis</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {data.h1}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {data.summary}
          </p>
        </header>

        {/* Pricing & Retention Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border-indigo-500/40 bg-card/60 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <Badge className="bg-indigo-600 text-white font-bold">Convertly</Badge>
              <span className="text-xs text-emerald-400 font-semibold">100% Free Forever</span>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Pricing Model</span>
              <p className="text-sm font-medium text-foreground">{data.pricingModel.convertly}</p>
            </div>
            <div className="space-y-2 border-t border-border/40 pt-3">
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Data Retention SLA</span>
              <p className="text-xs text-muted-foreground">{data.retentionPolicy.convertly}</p>
            </div>
          </Card>

          <Card className="p-6 border-border/80 bg-card/40 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="font-bold">{data.competitorName}</Badge>
              <span className="text-xs text-muted-foreground">{data.competitorDomain}</span>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Pricing Model</span>
              <p className="text-sm font-medium text-foreground">{data.pricingModel.competitor}</p>
            </div>
            <div className="space-y-2 border-t border-border/40 pt-3">
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Data Retention Policy</span>
              <p className="text-xs text-muted-foreground">{data.retentionPolicy.competitor}</p>
            </div>
          </Card>
        </div>

        {/* Feature Comparison Matrix Table */}
        <section aria-labelledby="matrix-heading" className="space-y-4">
          <h2 id="matrix-heading" className="text-xl font-bold tracking-tight text-foreground">
            Side-by-Side Feature Matrix
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/50">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/40 text-muted-foreground">
                  <th className="p-3.5 font-semibold">Capability / Specification</th>
                  <th className="p-3.5 font-semibold text-indigo-400">Convertly</th>
                  <th className="p-3.5 font-semibold">{data.competitorName}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.matrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3.5 font-medium text-foreground">{row.feature}</td>
                    <td className="p-3.5 text-foreground/90 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {row.verdict === 'win' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                        <span>{row.convertly}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground">{row.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Balanced Strengths & Limitations */}
        <section aria-labelledby="strengths-heading" className="space-y-4">
          <h2 id="strengths-heading" className="text-xl font-bold tracking-tight text-foreground">
            Strengths & Limitations Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Convertly Card */}
            <Card className="p-5 border border-border/80 bg-card/40 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Convertly Strengths</span>
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {data.strengths.convertly.map((st, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-border/40">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Convertly Limitations</h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {data.limitations.convertly.map((lim, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Competitor Card */}
            <Card className="p-5 border border-border/80 bg-card/40 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                <span>{data.competitorName} Strengths</span>
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {data.strengths.competitor.map((st, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-border/40">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">{data.competitorName} Limitations</h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {data.limitations.competitor.map((lim, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        </section>

        {/* Editorial Verdict Narrative */}
        <section aria-labelledby="verdict-heading" className="space-y-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
          <h2 id="verdict-heading" className="text-lg font-bold text-foreground">
            Editorial Conclusion: Which Platform Should You Choose?
          </h2>
          {data.verdictNarrative.map((p, i) => (
            <p key={i} className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {p}
            </p>
          ))}
        </section>

        {/* Recommended Convertly Tools */}
        <section aria-labelledby="tools-heading" className="space-y-4">
          <h2 id="tools-heading" className="text-xl font-bold tracking-tight text-foreground">
            Try Convertly’s High-Speed Conversion Engines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {data.recommendedTools.map((tool) => (
              <Card key={tool.id} className="p-5 border border-border/80 bg-card/40 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-foreground">{tool.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
                </div>
                <Link
                  to={`/tools/${tool.id}`}
                  onClick={() => trackToolSelected(tool.name, undefined, 'comparison_detail')}
                >
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                    <span>Launch {tool.name}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* Frequently Asked Questions */}
        {data.faqs.length > 0 && (
          <section aria-labelledby="faqs-heading" className="space-y-4">
            <h2 id="faqs-heading" className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-indigo-400" />
              <span>Comparison FAQs</span>
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

        {/* Other Comparisons Navigation */}
        <section aria-label="Other Competitor Evaluations" className="pt-6 border-t border-border/60 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Explore More Comparisons
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {Object.values(COMPARISONS_DATA).filter(c => c.slug !== data.slug).map(c => (
              <Link
                key={c.slug}
                to={`/compare/${c.slug}`}
                className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <span>vs {c.competitorName}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
