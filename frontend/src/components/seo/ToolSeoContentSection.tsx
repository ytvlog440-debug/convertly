import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Lock,
  ArrowRight,
  Laptop,
  Smartphone,
  Users,
  Clock,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  Briefcase,
  Layers
} from 'lucide-react'
import { Card } from '../ui/Card'
import type { ToolSeoContent } from '../../data/toolSeoContent'

interface ToolSeoContentSectionProps {
  content: ToolSeoContent
}

export function ToolSeoContentSection({ content }: ToolSeoContentSectionProps) {
  // State for interactive accessible FAQ accordion
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  return (
    <article className="mt-20 pt-12 border-t border-border/60 space-y-16 text-foreground">

      {/* EEAT Editorial Authority & Trust Signal Banner */}
      <section aria-label="Editorial Verification & Authority" className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-foreground">Verified Document Engineering Guide</span>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  Updated September 2026
                </span>
                <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
                  Search Intent: {content.searchIntent}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Technically reviewed by the Convertly Document Engineering Team • ISO 27001-Aligned • Zero-Retention Privacy SLA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
            <Cpu className="h-3.5 w-3.5" />
            <span>Native C++/Python Core</span>
          </div>
        </div>
      </section>

      {/* Section 1: Detailed Overview & What Is */}
      <section aria-labelledby="section-what-is" className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
          <Sparkles className="h-3 w-3" />
          <span>Comprehensive Technical Overview</span>
        </div>
        <h2 id="section-what-is" className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {content.whatIsHeading}
        </h2>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          {content.whatIsParagraphs.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        {/* Contextual Internal Linking Matrix with Descriptive Anchor Text */}
        {content.relatedTools && content.relatedTools.length > 0 && (
          <div className="pt-3 border-t border-border/40 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block">
              Related Document & Media Workflows:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {content.relatedTools.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/tools/${rel.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card/60 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-colors"
                >
                  <span>{rel.actionText}</span>
                  <ArrowRight className="h-3 w-3 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Section 2: Target Audience & Practical Scenarios */}
      <section aria-labelledby="section-audiences-scenarios" className="space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Audience & Timing</span>
          <h2 id="section-audiences-scenarios" className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
            Target Audience & Recommended Scenarios
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Designed for technical teams, legal departments, and corporate professionals requiring precision file handling.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Who Should Use */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Users className="h-4 w-4" />
              <h3 className="font-heading text-base font-bold text-foreground">
                {content.whoShouldUseHeading}
              </h3>
            </div>
            <div className="space-y-3">
              {content.whoShouldUseAudiences.map((aud, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border/70 bg-card/40 hover:bg-card/70 transition-colors">
                  <h4 className="text-xs font-bold text-foreground mb-1">{aud.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{aud.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* When Should You Use */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <Clock className="h-4 w-4" />
              <h3 className="font-heading text-base font-bold text-foreground">
                {content.whenToUseHeading}
              </h3>
            </div>
            <div className="space-y-3">
              {content.whenToUsePoints.map((pt, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border/70 bg-card/40 hover:bg-card/70 transition-colors">
                  <h4 className="text-xs font-bold text-foreground mb-1">{pt.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{pt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Step-by-Step Conversion Workflow (How It Works) */}
      <section aria-labelledby="section-how-it-works" className="space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Step-by-Step Guide</span>
          <h2 id="section-how-it-works" className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
            {content.howItWorksHeading}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Follow these streamlined instructions to process your documents with zero technical friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.steps.map((step) => (
            <Card key={step.number} className="p-5 flex gap-4 border-border/80 hover:border-indigo-500/40 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-sm font-mono font-bold text-indigo-400">
                {step.number}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 4: Enterprise Features Grid */}
      <section aria-labelledby="section-key-features" className="space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Core Capabilities</span>
          <h2 id="section-key-features" className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
            {content.keyFeaturesHeading}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.features.map((feat, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border/70 bg-card/40 p-5 hover:border-border hover:bg-card/70 transition-all duration-300"
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">{feat.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: Benefits & Workflow Enhancements */}
      <section aria-labelledby="section-benefits" className="space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Real-World Advantages</span>
          <h2 id="section-benefits" className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
            {content.benefitsHeading}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {content.benefits.map((b, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-border/60 bg-secondary/20 flex gap-3 items-start">
              <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">{b.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 6: Supported Formats Matrix */}
      <section aria-labelledby="section-formats" className="space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Format Specifications</span>
          <h2 id="section-formats" className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
            {content.supportedFormatsHeading}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{content.formatNotes}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 border-border/80">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">Accepted Input Formats</h3>
            <div className="space-y-2">
              {content.inputFormats.map((fmt, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 text-xs">
                  <span className="font-mono font-semibold text-foreground">{fmt.ext}</span>
                  <span className="text-muted-foreground">{fmt.name}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 border-border/80">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-3">Resulting Output Formats</h3>
            <div className="space-y-2">
              {content.outputFormats.map((fmt, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 text-xs">
                  <span className="font-mono font-semibold text-foreground">{fmt.ext}</span>
                  <span className="text-muted-foreground">{fmt.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Section 7: Common Real-World Use Cases */}
      {content.useCases && content.useCases.length > 0 && (
        <section aria-labelledby="section-use-cases" className="space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Applications</span>
            <h2 id="section-use-cases" className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
              {content.useCasesHeading}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.useCases.map((uc, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-border/70 bg-card/40 hover:bg-card/70 transition-colors">
                <div className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Briefcase className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{uc.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 8: Expert Tips for Best Results */}
      {content.bestResultsTips && content.bestResultsTips.length > 0 && (
        <section aria-labelledby="section-tips" className="space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Pro Tips</span>
            <h2 id="section-tips" className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
              {content.bestResultsHeading}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.bestResultsTips.map((tip, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex gap-3 items-start">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Lightbulb className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">{tip.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 9: Common Problems & Troubleshooting Solutions */}
      {content.troubleshootingItems && content.troubleshootingItems.length > 0 && (
        <section aria-labelledby="section-troubleshooting" className="space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Troubleshooting Guide</span>
            <h2 id="section-troubleshooting" className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
              {content.troubleshootingHeading}
            </h2>
          </div>

          <div className="space-y-3">
            {content.troubleshootingItems.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border/80 bg-card/40 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <h3 className="text-xs font-bold text-foreground">{item.problem}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-6.5">
                  <span className="font-semibold text-foreground">Solution: </span>
                  {item.solution}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 10: Security, Confidentiality & 120m Shredding */}
      <section aria-labelledby="section-security" className="space-y-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 id="section-security" className="font-heading text-lg sm:text-xl font-bold text-foreground">
              {content.securityHeading}
            </h2>
            <span className="text-xs text-indigo-400">Zero-Retention Policy & In-Memory Encryption</span>
          </div>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {content.securityParagraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {content.certifications.map((cert, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/60 px-3.5 py-2.5 text-xs text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{cert}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 11: Technical Performance Benchmarks */}
      <section aria-labelledby="section-performance" className="space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Technical Benchmarks</span>
          <h2 id="section-performance" className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
            {content.performanceHeading}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {content.specs.map((spec, idx) => (
            <Card key={idx} className="p-4 border-border/80">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">{spec.label}</h3>
              <div className="text-sm font-mono font-bold text-foreground mt-1">{spec.value}</div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{spec.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 12: Cross-Platform Compatibility */}
      <section aria-labelledby="section-compatibility" className="space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Universal Availability</span>
          <h2 id="section-compatibility" className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
            {content.compatibilityHeading}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {content.platforms.map((plat, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-border/70 bg-card/40">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                {plat.name.includes('Mobile') ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-foreground">{plat.name}</h3>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {plat.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{plat.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 13: Honest Comparison with Alternatives */}
      <section aria-labelledby="section-comparison" className="space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Competitive Analysis</span>
          <h2 id="section-comparison" className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
            {content.whyChooseHeading}
          </h2>
        </div>

        <div className="space-y-3">
          {content.comparisonPoints.map((comp, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-border/80 bg-card/40 hover:bg-card/70 transition-colors">
              <h3 className="text-xs font-bold text-foreground mb-1">{comp.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{comp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 14: Accessible Interactive FAQ Accordion (At Least 10 FAQs) */}
      <section aria-labelledby="section-faqs" className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Search & Knowledge Base ({content.faqs.length} Questions)</span>
          </div>
          <h2 id="section-faqs" className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
            {content.faqsHeading}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Direct, transparent answers addressing file security, formatting preservation, limits, and compatibility.
          </p>
        </div>

        <div className="space-y-3">
          {content.faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card/40 transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  id={`faq-question-${idx}`}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-semibold text-foreground hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <span className="pr-4">{faq.question}</span>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>
                {isOpen && (
                  <div
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-question-${idx}`}
                    className="border-t border-border/40 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 text-xs text-muted-foreground leading-relaxed animate-in fade-in duration-200"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Section 15: Recommended Related Tools & Topic Clusters */}
      {content.relatedTools && content.relatedTools.length > 0 && (
        <section aria-labelledby="section-related-cluster" className="space-y-6 pt-4 border-t border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                <Layers className="h-3.5 w-3.5" />
                <span>Recommended Tool Cluster</span>
              </div>
              <h2 id="section-related-cluster" className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
                Complementary Document & Media Tools
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Explore interconnected utilities to continue your document optimization workflow.
              </p>
            </div>
            <Link
              to="/tools"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 shrink-0"
            >
              <span>View all 30 tools</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {content.relatedTools.map((rel) => (
              <Link
                key={rel.id}
                to={`/tools/${rel.id}`}
                className="group block rounded-2xl border border-border/80 bg-card/40 p-4 hover:border-indigo-500/50 hover:bg-card/70 hover:-translate-y-1 transition-all duration-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                    {rel.category}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <h3 className="text-xs font-bold text-foreground group-hover:text-indigo-400 transition-colors">
                  {rel.actionText}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                  {rel.desc}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Section 16: Conclusion & Action */}
      <section aria-labelledby="section-conclusion" className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-card/60 p-6 sm:p-8 space-y-4">
        <h2 id="section-conclusion" className="font-heading text-xl font-bold text-foreground">
          {content.conclusionHeading}
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {content.conclusionParagraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
        <div className="pt-2">
          <a
            href="#tool-top"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <span>Scroll Up to Start Converting</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

    </article>
  )
}

export default ToolSeoContentSection
