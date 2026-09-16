import { useDropzone, type Accept } from 'react-dropzone'
import { UploadCloud, File, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface DropzoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: Accept
  maxFiles?: number
  maxSizeBytes?: number
  disabled?: boolean
  className?: string
  hintText?: string
}

export function Dropzone({
  onFilesSelected,
  accept,
  maxFiles = 10,
  maxSizeBytes = 100 * 1024 * 1024, // 100MB
  disabled = false,
  className,
  hintText = 'PDF, Word, Excel, PowerPoint, JPG, PNG, WEBP (up to 100MB)',
}: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles)
      }
    },
    accept,
    maxFiles,
    maxSize: maxSizeBytes,
    disabled,
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer select-none group',
          isDragActive
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-border/80 bg-card/40 hover:border-indigo-500/50 hover:bg-card/70',
          isDragReject && 'border-rose-500 bg-rose-500/10',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
      >
        <input {...getInputProps()} />

        <div className="relative mb-4 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 transition-transform duration-300 group-hover:scale-110 group-hover:bg-indigo-500/20">
          <UploadCloud className="h-8 w-8 shrink-0" />
        </div>

        <p className="text-lg font-semibold text-foreground">
          {isDragActive ? 'Drop your files here...' : 'Choose files or drag & drop here'}
        </p>
        
        <p className="mt-1.5 text-xs text-muted-foreground font-medium">
          {hintText}
        </p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-secondary/80 px-4 py-2 text-xs font-semibold text-foreground shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
          <File className="h-3.5 w-3.5 shrink-0" />
          Browse Files
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{fileRejections[0].errors[0]?.message || 'File upload rejected'}</span>
        </div>
      )}
    </div>
  )
}
