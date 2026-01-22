import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  withSearchIcon?: boolean;
}

const baseInput =
  "flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:border-primary/50 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";

const invalidInput = "border-destructive/70 focus-visible:ring-destructive/25 focus-visible:border-destructive/60";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, withSearchIcon, ...props }, ref) => {
    if (withSearchIcon) {
      return (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
          <input
            type={type}
            className={cn(
              baseInput,
              "pl-10 pr-3",
              props["aria-invalid"] === true && invalidInput,
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
          baseInput,
          props["aria-invalid"] === true && invalidInput,
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
