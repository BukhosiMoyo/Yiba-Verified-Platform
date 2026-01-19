import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  withSearchIcon?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, withSearchIcon, ...props }, ref) => {
    if (withSearchIcon) {
      return (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-lg border border-gray-200/80 bg-gray-50/50 pl-10 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
              props["aria-invalid"] === true && "border-red-300 focus-visible:ring-red-500/20 focus-visible:border-red-400",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
      )
    }
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-gray-200/80 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
          props["aria-invalid"] === true && "border-red-300 focus-visible:ring-red-500/20 focus-visible:border-red-400",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
