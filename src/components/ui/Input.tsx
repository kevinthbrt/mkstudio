import { cn } from "@/lib/utils";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-600">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full bg-[#13121e] border border-[#2d2b40] text-white rounded-xl px-4 py-3 text-sm",
            "placeholder:text-gray-700 outline-none transition-all duration-200",
            "focus:border-[#D4AF37]/60 focus:bg-[#16152a] focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)]",
            icon && "pl-11",
            error && "border-red-500/50 focus:border-red-500/70 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.08)]",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
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
        <label htmlFor={inputId} className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "w-full bg-[#13121e] border border-[#2d2b40] text-white rounded-xl px-4 py-3 text-sm",
          "placeholder:text-gray-700 outline-none transition-all duration-200 resize-none",
          "focus:border-[#D4AF37]/60 focus:bg-[#16152a] focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)]",
          error && "border-red-500/50",
          className
        )}
        rows={3}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
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
        <label htmlFor={inputId} className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          "w-full bg-[#13121e] border border-[#2d2b40] text-white rounded-xl px-4 py-3 text-sm",
          "outline-none transition-all duration-200 appearance-none cursor-pointer",
          "focus:border-[#D4AF37]/60 focus:bg-[#16152a] focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)]",
          error && "border-red-500/50",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#13121e]">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
