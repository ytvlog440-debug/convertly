import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SeoHead } from '../components/shared/SeoHead'
import { BLOG_POSTS_DATA } from '../data/blogData'
import { NotFoundPage } from './NotFoundPage'

export function BlogPostDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? BLOG_POSTS_DATA[slug] : null

  if (!post) {
    return <NotFoundPage />
  }

  const canonicalUrl = `https://convertlytools.xyz/blog/${post.slug}`

  // Article Schema
  const articleSchema = {
    '@type': 'Article',
    headline: post.h1,
    description: post.metaDescription,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role
    },
    publisher: {
      '@type': 'Organization',
      name: 'Convertly',
      url: 'https://convertlytools.xyz'
    },
    datePublished: '2026-09-01',
    dateModified: '2026-09-12',
    mainEntityOfPage: canonicalUrl
  }

  return (
    <div className="relative min-h-screen py-10 sm:py-16">
      <SeoHead
        title={`${post.title} | Convertly Blog`}
        description={post.metaDescription}
        keywords={post.keywords}
        canonicalUrl={canonicalUrl}
        pageType="WebPage"
        ogType="article"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Blog', item: '/blog' },
          { name: post.h1, item: `/blog/${post.slug}` }
        ]}
        schemaJson={articleSchema}
      />

      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{post.h1}</span>
        </nav>

        {/* Article Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
              {post.category}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{post.readTime}</span>
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{post.publishDate}</span>
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            {post.h1}
          </h1>

          {/* Author Byline */}
          <div className="flex items-center gap-3 pt-2 border-t border-b border-border/60 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs">
              {post.author.avatarInitials}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{post.author.name}</p>
              <p className="text-xs text-muted-foreground">{post.author.role} • Convertly Research</p>
            </div>
          </div>
        </header>

        {/* Lead Paragraph */}
        <p className="text-base sm:text-lg text-foreground/90 font-medium leading-relaxed">
          {post.lead}
        </p>

        {/* Key Takeaways Card */}
        <Card className="p-6 border-indigo-500/30 bg-indigo-500/5 space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Key Editorial Takeaways</span>
          </h2>
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            {post.keyTakeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Dynamic Content Sections */}
        <div className="space-y-8 text-foreground/90">
          {post.contentSections.map((section, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
              {section.bulletPoints && section.bulletPoints.length > 0 && (
                <ul className="space-y-2 pl-4 text-xs sm:text-sm text-muted-foreground list-disc">
                  {section.bulletPoints.map((bp, bpIdx) => (
                    <li key={bpIdx}>{bp}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Contextual In-Article Tool Action Banner */}
        <Card className="p-6 border border-indigo-500/40 bg-card/60 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Try It In Action:</span>
            <h3 className="text-base font-bold text-foreground">{post.recommendedToolName}</h3>
            <p className="text-xs text-muted-foreground">Execute your workflow in seconds with zero data retention.</p>
          </div>
          <Link to={`/tools/${post.recommendedToolId}`}>
            <Button className="bg-indigo-600 hover:bg-indigo-500 gap-1.5 text-xs shrink-0">
              <span>Launch Tool Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>

        {/* Related Posts */}
        {post.relatedPostSlugs.length > 0 && (
          <section aria-label="Related Blog Articles" className="pt-8 border-t border-border/60 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Related Research & Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {post.relatedPostSlugs.map((relSlug) => {
                const relPost = BLOG_POSTS_DATA[relSlug]
                if (!relPost) return null
                return (
                  <Card key={relSlug} className="p-4 border border-border/80 bg-card/40 flex flex-col justify-between space-y-2">
                    <div>
                      <Badge variant="outline" className="bg-secondary text-[10px] mb-1.5">
                        {relPost.category}
                      </Badge>
                      <h3 className="text-xs font-bold text-foreground line-clamp-2 hover:text-indigo-400 transition-colors">
                        <Link to={`/blog/${relSlug}`}>{relPost.h1}</Link>
                      </h3>
                    </div>
                    <Link to={`/blog/${relSlug}`} className="text-[11px] font-medium text-indigo-400 hover:underline inline-flex items-center gap-1 pt-2">
                      <span>Read article</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Card>
                )
              })}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}
