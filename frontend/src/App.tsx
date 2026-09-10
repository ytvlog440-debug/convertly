import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'

// Route-level Code Splitting for Lighthouse Performance
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const ToolsDirectoryPage = lazy(() => import('./pages/ToolsDirectoryPage').then(m => ({ default: m.ToolsDirectoryPage })))
const ToolConverterPage = lazy(() => import('./pages/ToolConverterPage').then(m => ({ default: m.ToolConverterPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 px-5 py-3 text-xs text-muted-foreground backdrop-blur-md">
        <svg className="h-4 w-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Loading workspace...</span>
      </div>
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/tools" element={<ToolsDirectoryPage />} />
                <Route path="/tools/:toolId" element={<ToolConverterPage />} />
                <Route path="/tool/:toolId" element={<ToolConverterPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
