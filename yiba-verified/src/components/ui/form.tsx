"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Form Field Wrapper
 * Provides consistent spacing and structure for form fields
 */
export interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export function FormField({ children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  );
}

/**
 * Form Label with Required Indicator
 */
export interface FormLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  error?: boolean;
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, error, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none",
          "text-foreground",
          error && "text-destructive",
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="ml-1 text-red-500" aria-label="required">
            *
          </span>
        )}
      </label>
    );
  }
);
FormLabel.displayName = "FormLabel";

/**
 * Form Error Message
 * Displays inline error messages below form fields
 */
export interface FormErrorMessageProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function FormErrorMessage({
  children,
  className,
  id,
}: FormErrorMessageProps) {
  if (!children) return null;

  return (
    <p
      id={id}
      className={cn(
        "text-xs font-medium text-red-600 mt-1",
        className
      )}
      role="alert"
    >
      {children}
    </p>
  );
}

/**
 * Form Hint / Helper Text
 * Displays helpful information below form fields
 */
export interface FormHintProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function FormHint({ children, className, id }: FormHintProps) {
  if (!children) return null;

  return (
    <p
      id={id}
      className={cn(
        "text-xs text-muted-foreground mt-1",
        className
      )}
    >
      {children}
    </p>
  );
}

/**
 * Form Item
 * Complete form field container with label, input, error, and hint
 */
export interface FormItemProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
}

export function FormItem({
  label,
  required,
  error,
  hint,
  children,
  className,
  labelProps,
}: FormItemProps) {
  const fieldId = React.useId();
  const hasError = !!error;

  // Clone children to add error prop and id
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        // @ts-ignore
        id: child.props.id || fieldId,
        error: hasError,
        "aria-invalid": hasError,
        "aria-describedby": hasError
          ? `${fieldId}-error`
          : hint
          ? `${fieldId}-hint`
          : undefined,
      } as any);
    }
    return child;
  });

  return (
    <FormField className={className}>
      {label && (
        <FormLabel
          htmlFor={fieldId}
          required={required}
          error={hasError}
          {...labelProps}
        >
          {label}
        </FormLabel>
      )}
      {enhancedChildren}
      {error && (
        <FormErrorMessage id={`${fieldId}-error`}>{error}</FormErrorMessage>
      )}
      {hint && !error && (
        <FormHint id={`${fieldId}-hint`}>{hint}</FormHint>
      )}
    </FormField>
  );
}
