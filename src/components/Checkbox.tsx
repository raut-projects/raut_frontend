import { forwardRef } from 'react'

const Checkbox = forwardRef(function Checkbox(
  { className = '', disabled = false, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      disabled={disabled}
      className={`
        h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 bg-white
        transition-colors duration-150
        checked:border-brand-600 checked:bg-brand-600
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:ring-offset-0
        disabled:cursor-not-allowed disabled:opacity-50 disabled:checked:bg-slate-400 disabled:checked:border-slate-400
        ${className}
      `}
      style={{
        backgroundImage: props.checked
          ? "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")"
          : 'none',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      {...props}
    />
  )
})

export default Checkbox
