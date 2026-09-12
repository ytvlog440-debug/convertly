import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Users,
  GraduationCap,
  Briefcase,
  Scale,
  Palette,
  CheckCircle2
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SeoHead } from '../components/shared/SeoHead'
import { USE_CASES_DATA } from '../data/useCasesData'

const ICON_MAP: Record<string, typeof Users> = {
  students: GraduationCap,
  teachers: GraduationCap,
  businesses: Briefcase,
  lawyers: Scale,
  hr: Users,
  freelancers: Briefcase,
  designers: Palette
}

export function UseCasesIndexPage() {
  const useCases = Object.values(USE_CASES_DATA)

  return (
    <div className="relative min-h-screen py-10 sm:py-16">
      <SeoHead
        title="Document Solutions by Industry & Profession — Convertly Use Cases"
        description="Tailored PDF and document workflows for Students, Teachers, Businesses, Lawyers, HR, Freelancers, and Designers. Compliant with FERPA, HIPAA, and GDPR."
        keywords="pdf converter by industry, pdf solutions for lawyers, student pdf tools, business document converter, designer image tools"
        canonicalUrl="https://convertlytools.xyz/use-cases"
        pageType="CollectionPage"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Use Cases', item: '/use-cases' }
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Use Cases</span>
        </nav>

        {/* Hero Section */}
        <header className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Users className="h-3.5 w-3.5" />
            <span>Tailored Industry Solutions</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Document Workflows Built for Your Profession
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Different professions face distinct compliance obligations and document challenges. Explore how Convertly streamlines daily workflows for your sector without recurring subscription fees.
          </p>
        </header>

        {/* Industry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((uc) => {
            const IconComponent = ICON_MAP[uc.slug] || Users
            return (
              <Card key={uc.slug} className="flex flex-col justify-between p-6 border border-border/80 bg-card/50 hover:border-indigo-500/40 transition-all space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="bg-secondary/60 text-xs">
                      {uc.targetAudience.split(',')[0]}
                    </Badge>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-foreground hover:text-indigo-400 transition-colors">
                      <Link to={`/use-cases/${uc.slug}`}>{uc.h1}</Link>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                      {uc.summary}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Common Solutions
                    </span>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {uc.recommendedWorkflows.slice(0, 2).map((wf, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{wf.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/60">
                  <Link to={`/use-cases/${uc.slug}`} className="w-full">
                    <Button variant="outline" className="w-full justify-between group text-xs">
                      <span>Explore Workflows</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
