import { Link } from 'react-router-dom'
import {
  Layers,
  FileText,
  Scale,
  Users,
  BookOpen,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { SeoHead } from '../components/shared/SeoHead'
import { COMPARISONS_DATA } from '../data/comparisonsData'
import { USE_CASES_DATA } from '../data/useCasesData'
import { PROBLEM_GUIDES_DATA } from '../data/guidesData'
import { BLOG_POSTS_DATA } from '../data/blogData'
import { TOOL_ACTION_ANCHORS } from '../data/toolSeoContent'

export function HtmlSitemapPage() {
  const tools = Object.entries(TOOL_ACTION_ANCHORS)
  const comparisons = Object.values(COMPARISONS_DATA)
  const useCases = Object.values(USE_CASES_DATA)
  const guides = Object.values(PROBLEM_GUIDES_DATA)
  const blogPosts = Object.values(BLOG_POSTS_DATA)

  const corePages = [
    { name: 'Home Page', url: '/' },
    { name: 'All 30 Tools Directory', url: '/tools' },
    { name: 'Comparison Hub', url: '/compare' },
    { name: 'Industry Use Cases Hub', url: '/use-cases' },
    { name: 'Problem Solving Guides Hub', url: '/guides' },
    { name: 'Engineering Blog & Knowledge Base', url: '/blog' },
    { name: 'Developer REST API Specs', url: '/developers' },
    { name: 'Supported File Formats & MIME Specifications', url: '/formats' },
    { name: 'Security Architecture & Defense-in-Depth', url: '/security' },
    { name: 'Privacy Policy & Zero-Retention SLA', url: '/privacy' },
    { name: 'Terms of Service', url: '/terms' },
  ]

  return (
    <div className="relative min-h-screen py-10 sm:py-16">
      <SeoHead
        title="HTML Sitemap & Complete Entity Index — Convertly"
        description="Comprehensive index of all Convertly conversion tools, competitor comparisons, audience use cases, guides, and engineering articles."
        keywords="convertly sitemap, all tools index, pdf converter directory, site structure"
        canonicalUrl="https://convertlytools.xyz/sitemap"
        pageType="CollectionPage"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'HTML Sitemap', item: '/sitemap' }
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Sitemap</span>
        </nav>

        {/* Hero Section */}
        <header className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Layers className="h-3.5 w-3.5" />
            <span>Complete Architectural Index</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Convertly Master HTML Sitemap
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Direct navigational access to all 30 conversion tools, competitor teardowns, industry use cases, problem-solving guides, and blog articles.
          </p>
        </header>

        {/* Master Index Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* 1. Core Pages & Hubs */}
          <Card className="p-6 border border-border/80 bg-card/40 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Core Hubs & Specifications ({corePages.length})
              </h2>
            </div>
            <ul className="space-y-2 text-xs">
              {corePages.map((page, idx) => (
                <li key={idx}>
                  <Link to={page.url} className="text-foreground/80 hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span>{page.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* 2. Flagship Conversion Tools */}
          <Card className="p-6 border border-border/80 bg-card/40 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Layers className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Conversion Tools ({tools.length})
              </h2>
            </div>
            <ul className="space-y-2 text-xs max-h-[420px] overflow-y-auto pr-2">
              {tools.map(([id, info]) => (
                <li key={id}>
                  <Link to={`/tools/${id}`} className="text-foreground/80 hover:text-indigo-400 transition-colors flex items-center justify-between gap-1.5">
                    <span className="truncate">{info.name}</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1">{info.category}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* 3. Competitor Comparisons */}
          <Card className="p-6 border border-border/80 bg-card/40 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Scale className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Competitor Comparisons ({comparisons.length})
              </h2>
            </div>
            <ul className="space-y-2 text-xs">
              {comparisons.map((c) => (
                <li key={c.slug}>
                  <Link to={`/compare/${c.slug}`} className="text-foreground/80 hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>Convertly vs {c.competitorName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* 4. Audience Use Cases */}
          <Card className="p-6 border border-border/80 bg-card/40 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Users className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Industry Use Cases ({useCases.length})
              </h2>
            </div>
            <ul className="space-y-2 text-xs">
              {useCases.map((uc) => (
                <li key={uc.slug}>
                  <Link to={`/use-cases/${uc.slug}`} className="text-foreground/80 hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>{uc.h1}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* 5. Problem Solving Guides */}
          <Card className="p-6 border border-border/80 bg-card/40 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Problem Solving Guides ({guides.length})
              </h2>
            </div>
            <ul className="space-y-2 text-xs">
              {guides.map((g) => (
                <li key={g.slug}>
                  <Link to={`/guides/${g.slug}`} className="text-foreground/80 hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{g.h1}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* 6. Engineering Blog Articles */}
          <Card className="p-6 border border-border/80 bg-card/40 space-y-4 md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <FileText className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Engineering Articles & Tutorials ({blogPosts.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {blogPosts.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="rounded-lg border border-border/60 bg-secondary/20 p-2.5 text-xs text-foreground/80 hover:text-indigo-400 hover:bg-secondary/40 transition-colors flex items-start gap-2"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block truncate">{post.h1}</span>
                    <span className="text-[10px] text-muted-foreground">{post.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
