import { HTMLAttributes } from 'react'

// Breaks out of the page's max-w-6xl column to full viewport width, while
// keeping inner content aligned to the same contained column as everything
// else on the page.
export default function FullBleedSection({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`w-screen relative left-1/2 right-1/2 -mx-[50vw] ${className}`} {...props}>
      <div className="max-w-6xl mx-auto px-6">{children}</div>
    </div>
  )
}
