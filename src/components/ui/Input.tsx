import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm text-ink-900/60">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`border-b border-ink-900/25 bg-transparent px-0 py-2 text-ink-900 placeholder:text-ink-900/30 focus:outline-none focus:border-ember-400 ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-brick-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export default Input
