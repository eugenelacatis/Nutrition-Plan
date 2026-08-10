import { HTMLAttributes } from 'react'

// A bounded grid item (meal cards, plan cards) — needs a visible edge to
// read as a discrete unit among siblings, unlike a page section.
export default function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`border border-ink-900/15 p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
