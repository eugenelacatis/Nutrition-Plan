import { HTMLAttributes } from 'react'

// A page-level section divided by a hairline rule — used instead of a
// floating card for standalone content like forms and page blocks.
export default function Section({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`border-t border-ink-900/15 pt-8 ${className}`} {...props}>
      {children}
    </div>
  )
}
