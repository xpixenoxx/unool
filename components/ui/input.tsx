'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  aiAssist?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, icon, iconPosition = 'left', id: providedId, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = providedId || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    // Omit framer-motion specific event handlers that conflict with React's DOM handlers
    const { onAnimationStart, onAnimationEnd, onAnimationIteration, ...inputProps } = props;

    return (
      <motion.div className="w-full" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {label && (
          <motion.label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            {label}
          </motion.label>
        )}
        <motion.div
          className={cn(
            'relative flex items-center',
            icon !== undefined && icon !== null && icon !== false && 'pl-10'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {icon && iconPosition === 'left' && (
            <motion.div
              className="pointer-events-none absolute left-3 text-muted-foreground"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {icon}
            </motion.div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-150',
              error && 'border-destructive focus-visible:ring-destructive',
              !error && 'hover:border-primary/50',
              className
            )}
            ref={ref}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(errorId, hintId)}
            {...inputProps}
          />
          {icon && iconPosition === 'right' && (
            <motion.div
              className="pointer-events-none absolute right-3 text-muted-foreground"
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {icon}
            </motion.div>
          )}
        </motion.div>
        {error && (
          <motion.p
            id={errorId}
            className="mt-1.5 text-sm text-destructive"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <motion.p
            id={hintId}
            className="mt-1.5 text-sm text-muted-foreground"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {hint}
          </motion.p>
        )}
      </motion.div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id: providedId, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = providedId || generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;
    const hintId = hint ? `${textareaId}-hint` : undefined;

    // Omit framer-motion specific event handlers that conflict with React's DOM handlers
    const { onAnimationStart, onAnimationEnd, onAnimationIteration, ...textareaProps } = props;

    return (
      <motion.div className="w-full" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {label && (
          <motion.label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            {label}
          </motion.label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-150',
            error && 'border-destructive focus-visible:ring-destructive',
            !error && 'hover:border-primary/50',
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(errorId, hintId)}
          {...textareaProps}
        />
        {error && (
          <motion.p
            id={errorId}
            className="mt-1.5 text-sm text-destructive"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <motion.p
            id={hintId}
            className="mt-1.5 text-sm text-muted-foreground"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {hint}
          </motion.p>
        )}
      </motion.div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    // Omit framer-motion specific event handlers that conflict with React's DOM handlers
    const { onAnimationStart, onAnimationEnd, onAnimationIteration, ...labelProps } = props;

    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...labelProps}
      >
        {children}
        {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
      </label>
    );
  }
);
Label.displayName = 'Label';