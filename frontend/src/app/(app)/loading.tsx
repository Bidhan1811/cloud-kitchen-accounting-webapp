import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <Loader2 size={32} className="text-[#C8873A] animate-spin" />
    </div>
  );
}
