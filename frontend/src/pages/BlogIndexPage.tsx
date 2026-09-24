import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Clock,
  Search,
  BookOpen
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SeoHead } from '../components/shared/SeoHead'
import { BLOG_POSTS_DATA } from '../data/blogData'

const CATEGORIES = [
  'All',
  'PDF Guides',
  'Word Guides',
  'Excel Guides',
  'PowerPoint Guides',
  'Image Guides',
  'Privacy',
  'Security',
  'Productivity',
  'Comparison',
  'Tutorials'
] as const

export function BlogIndexPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')

  const allPosts = Object.values(BLOG_POSTS_DATA)

  const filteredPosts = allPosts.filter((post) => {
    const matchesCat = selectedCategory === 'All' || post.category === selectedCategory
    const matchesSearch =
      searchQuery.trim() === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.lead.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.keywords.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="relative min-h-screen py-10 sm:py-16">
      <SeoHead
        title="Convertly Engineering Blog — Deep Dives in PDF, Office & Image Optimization"
        description="Explore technical tutorials, format breakdowns, document privacy research, and productivity guides from the Convertly document engineering team."
        keywords="pdf blog, document engineering blog, lossless compression guide, webp vs png, file retention security"
        canonicalUrl="https://convertlytools.xyz/blog"
        pageType="CollectionPage"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Blog', item: '/blog' }
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Blog</span>
        </nav>

        {/* Hero Section */}
        <header className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Engineering Insights & Guides</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Convertly Knowledge Base & Editorial Blog
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            In-depth technical guides, cryptographic privacy whitepapers, and step-by-step document conversion strategies published by our core engineering team.
          </p>
        </header>

        {/* Search & Category Filter Bar */}
        <div className="space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles, guides, or concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border/80 bg-card/60 pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Categories Pill Scroller */}
          <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                    : 'bg-card/50 text-muted-foreground border border-border/60 hover:bg-secondary hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card key={post.slug} className="flex flex-col justify-between p-6 border border-border/80 bg-card/50 hover:border-indigo-500/40 transition-all space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
                    {post.category}
                  </Badge>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{post.readTime}</span>
                  </span>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground hover:text-indigo-400 transition-colors line-clamp-2">
                    <Link to={`/blog/${post.slug}`}>{post.h1}</Link>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                    {post.lead}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-[10px]">
                      {post.author.avatarInitials}
                    </div>
                    <span className="truncate max-w-[120px]">{post.author.name}</span>
                  </div>
                  <span>{post.publishDate}</span>
                </div>

                <Link to={`/blog/${post.slug}`} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-between group text-xs">
                    <span>Read Article</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm font-semibold text-foreground">No articles found matching your query.</p>
            <p className="text-xs text-muted-foreground">Try clearing search filters or selecting another category.</p>
          </div>
        )}
      </div>
    </div>
  )
}
