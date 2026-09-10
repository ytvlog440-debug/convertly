import * as React from 'react'
import { cn } from '../../lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
}

export function Progress({ value, max = 100, className, ...props }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
