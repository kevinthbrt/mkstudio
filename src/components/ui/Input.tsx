import { cn } from "@/lib/utils";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-3.5 py-2.5 text-sm",
            "placeholder:text-gray-600 outline-none transition-all duration-200",
            "focus:border-[#D4AF37] focus:shadow-[0_0_0_2px_rgba(212,175,55,0.1)]",
            icon && "pl-10",
            error && "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.1)]",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-3.5 py-2.5 text-sm",
          "placeholder:text-gray-600 outline-none transition-all duration-200 resize-none",
          "focus:border-[#D4AF37] focus:shadow-[0_0_0_2px_rgba(212,175,55,0.1)]",
          error && "border-red-500",
          className
        )}
        rows={3}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          "w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-3.5 py-2.5 text-sm",
          "outline-none transition-all duration-200 appearance-none cursor-pointer",
          "focus:border-[#D4AF37] focus:shadow-[0_0_0_2px_rgba(212,175,55,0.1)]",
          error && "border-red-500",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#1a1a1a]">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
