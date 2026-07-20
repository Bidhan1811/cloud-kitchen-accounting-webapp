"use client";

import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-[6px] w-full">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-[500] text-[#6B5D50]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-[#9E8E80] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "input",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-[#C0524A] focus:border-[#C0524A] focus:shadow-[0_0_0_3px_rgba(192,82,74,0.14)]",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-[#9E8E80]">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-[12px] text-[#C0524A]" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-[12px] text-[#9E8E80]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-[6px] w-full">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-[500] text-[#6B5D50]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            "input resize-none min-h-[88px]",
            error && "border-[#C0524A]",
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="text-[12px] text-[#C0524A]" role="alert">{error}</p>}
        {helperText && !error && <p className="text-[12px] text-[#9E8E80]">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
