"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function Stepper({ value, onChange, min = 0, max = 999, disabled = false }: StepperProps) {
  const decrement = () => { if (value > min) onChange(value - 1); };
  const increment = () => { if (value < max) onChange(value + 1); };

  return (
    <div className="stepper" aria-label="Quantity stepper">
      <button
        type="button"
        className="stepper-btn"
        onClick={decrement}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          if (!isNaN(val)) onChange(val);
        }}
        className="stepper-value w-8 text-center bg-transparent outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Quantity"
        min={min}
        max={max}
        disabled={disabled}
      />
      <button
        type="button"
        className="stepper-btn"
        onClick={increment}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
