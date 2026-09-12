import { Link } from 'react-router-dom'
import { Layers, ShieldCheck, Zap, Lock, Terminal } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-card/30 backdrop-blur-md pt-14 pb-12 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Top Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-border/60">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Zero Retention Guarantee</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                All uploaded and converted files are automatically destroyed from our memory and storage within 120 minutes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Native Engine Execution</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Powered by native PyMuPDF, LibreOffice, and Ghostscript pipelines. No low-fidelity browser canvas hacks.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">End-to-End Encryption</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Transport layer security (TLS 1.3) with strictly isolated sandbox processes for every conversion request.
              </p>
            </div>
          </div>
        </div>

        {/* Links Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10">
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              PDF Toolkit
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/tools/pdf-merge" className="text-foreground/80 hover:text-indigo-400 transition-colors">Merge PDF</Link></li>
              <li><Link to="/tools/pdf-split" className="text-foreground/80 hover:text-indigo-400 transition-colors">Split PDF</Link></li>
              <li><Link to="/tools/pdf-compress" className="text-foreground/80 hover:text-indigo-400 transition-colors">Compress PDF</Link></li>
              <li><Link to="/tools/pdf-rotate" className="text-foreground/80 hover:text-indigo-400 transition-colors">Rotate PDF</Link></li>
              <li><Link to="/tools/pdf-protect" className="text-foreground/80 hover:text-indigo-400 transition-colors">Protect PDF</Link></li>
              <li><Link to="/tools/pdf-redact" className="text-foreground/80 hover:text-indigo-400 transition-colors">Redact PDF</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Office ⇄ PDF
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/tools/pdf-to-word" className="text-foreground/80 hover:text-indigo-400 transition-colors">PDF to Word</Link></li>
              <li><Link to="/tools/word-to-pdf" className="text-foreground/80 hover:text-indigo-400 transition-colors">Word to PDF</Link></li>
              <li><Link to="/tools/excel-to-pdf" className="text-foreground/80 hover:text-indigo-400 transition-colors">Excel to PDF</Link></li>
              <li><Link to="/tools/ppt-to-pdf" className="text-foreground/80 hover:text-indigo-400 transition-colors">PowerPoint to PDF</Link></li>
              <li><Link to="/tools/pdf-to-txt" className="text-foreground/80 hover:text-indigo-400 transition-colors">PDF to Text</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Image Converter
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/tools/images-to-pdf" className="text-foreground/80 hover:text-indigo-400 transition-colors">Images to PDF</Link></li>
              <li><Link to="/tools/pdf-to-images" className="text-foreground/80 hover:text-indigo-400 transition-colors">PDF to Images</Link></li>
              <li><Link to="/tools/jpg-to-png" className="text-foreground/80 hover:text-indigo-400 transition-colors">JPG to PNG</Link></li>
              <li><Link to="/tools/png-to-jpg" className="text-foreground/80 hover:text-indigo-400 transition-colors">PNG to JPG</Link></li>
              <li><Link to="/tools/image-to-webp" className="text-foreground/80 hover:text-indigo-400 transition-colors">Image to WebP</Link></li>
              <li><Link to="/tools/image-compress" className="text-foreground/80 hover:text-indigo-400 transition-colors">Compress Image</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Platform & Standards
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/developers" className="text-foreground/80 hover:text-indigo-400 transition-colors">Developer REST API</Link></li>
              <li><Link to="/formats" className="text-foreground/80 hover:text-indigo-400 transition-colors">Format Standards & Specs</Link></li>
              <li><a href="/api/v1/docs" target="_blank" rel="noreferrer" className="text-foreground/80 hover:text-indigo-400 transition-colors">OpenAPI Documentation</a></li>
              <li><button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))} className="text-foreground/80 hover:text-indigo-400 transition-colors cursor-pointer text-left">Keyboard Shortcuts (?)</button></li>
              <li><Link to="/privacy" className="text-foreground/80 hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-foreground/80 hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/security" className="text-foreground/80 hover:text-indigo-400 transition-colors">Security Architecture</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-500" />
            <span>&copy; {new Date().getFullYear()} Convertly V2 Technologies. Enterprise-grade open conversion infrastructure.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Terminal className="h-3 w-3" /> REST API v2.0
            </span>
            <span>100% Free Forever</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
