import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SeoHead } from '../components/shared/SeoHead'
import { PROBLEM_GUIDES_DATA } from '../data/guidesData'

export function GuidesIndexPage() {
  const guides = Object.values(PROBLEM_GUIDES_DATA)

  return (
    <div className="relative min-h-screen py-10 sm:py-16">
      <SeoHead
        title="Problem Solving Guides & PDF Tutorials (2026) — Convertly"
        description="Comprehensive technical guides on solving PDF and document formatting, compression, page splitting, merging, and conversion issues."
        keywords="pdf guides, how to convert pdf without losing formatting, compress pdf guide, merge pdf tutorial, convertly guides"
        canonicalUrl="https://convertlytools.xyz/guides"
        pageType="CollectionPage"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Guides', item: '/guides' }
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Guides</span>
        </nav>

        {/* Hero Section */}
        <header className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Actionable Technical Problem Resolution</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Document Engineering & Problem-Solving Guides
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Detailed, step-by-step guidance written by document architects. Solve complex formatting issues, compression puzzles, and multi-document assembly challenges.
          </p>
        </header>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((g) => (
            <Card key={g.slug} className="flex flex-col justify-between p-6 border border-border/80 bg-card/50 hover:border-indigo-500/40 transition-all space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
                    {g.category}
                  </Badge>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{g.readingTime}</span>
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-foreground hover:text-indigo-400 transition-colors">
                    <Link to={`/guides/${g.slug}`}>{g.h1}</Link>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                    {g.summary}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    What You'll Learn
                  </span>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {g.howToSteps.slice(0, 2).map((st) => (
                      <li key={st.step} className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{st.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60">
                <Link to={`/guides/${g.slug}`} className="w-full">
                  <Button variant="outline" className="w-full justify-between group text-xs">
                    <span>Read Step-by-Step Guide</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
