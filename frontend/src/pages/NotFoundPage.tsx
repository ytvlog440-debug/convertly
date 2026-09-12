import { Link } from 'react-router-dom'
import { FileQuestion, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { SeoHead } from '../components/shared/SeoHead'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4 py-16">
      <SeoHead
        title="Page Not Found (404) — Convertly"
        description="The page or conversion tool you requested does not exist on Convertly."
        noindex={true}
      />
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-6">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="font-heading text-4xl font-extrabold text-foreground">404</h1>
      <p className="mt-2 text-base text-muted-foreground">The page or conversion tool you requested does not exist.</p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary" size="md">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
