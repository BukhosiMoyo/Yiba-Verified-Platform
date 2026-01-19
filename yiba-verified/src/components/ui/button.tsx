import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* Primary — Add, Save, Apply, Submit, Confirm. Solid blue, white text, visible hover/focus. */
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-blue-500",
        /* Destructive — Delete, Disable, Remove. Solid red, white text. */
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-red-500/50",
        /* Secondary — View, Cancel, Back, Export. Strong border + white bg so they never look faded. */
        outline:
          "border border-gray-400 bg-white text-gray-900 shadow-sm hover:bg-gray-50 hover:border-gray-500 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:shadow-none dark:hover:bg-gray-700 dark:hover:border-gray-400",
        /* Alias for outline; same visual tier. */
        secondary:
          "border border-gray-400 bg-white text-gray-900 shadow-sm hover:bg-gray-50 hover:border-gray-500 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:shadow-none dark:hover:bg-gray-700 dark:hover:border-gray-400",
        /* Low-emphasis: border, dark text, stronger hover. Must not look disabled. */
        ghost:
          "border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-100 hover:border-gray-400 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800 dark:hover:border-gray-500",
        link: "text-primary underline-offset-4 hover:underline",
        pill:
          "rounded-full border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-100 hover:border-gray-400 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800 dark:hover:border-gray-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        pill: "h-8 rounded-full px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
