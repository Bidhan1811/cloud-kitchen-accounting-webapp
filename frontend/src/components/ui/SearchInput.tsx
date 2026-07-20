"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/utils/cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search...", className }: SearchInputProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Search size={16} className="absolute left-3 text-[#9E8E80] pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input !pl-9 !pr-8"
        aria-label={placeholder}
      />
      {value && (
        <button
          className="absolute right-3 text-[#9E8E80] hover:text-[#1C1410] transition-colors"
          onClick={() => onChange("")}
          aria-label="Clear search"
          type="button"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
