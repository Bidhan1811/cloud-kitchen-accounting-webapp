"use client";

import React, { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center w-full">
      <div className="w-12 h-12 rounded-full bg-[rgba(192,82,74,0.12)] flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-[#C0524A]" />
      </div>
      <h2 className="text-[18px] font-[600] text-[#1C1410] mb-2">Something went wrong!</h2>
      <p className="text-[13px] text-[#9E8E80] mb-6 max-w-sm">
        An unexpected error occurred while loading this page. Please try again or contact support if the issue persists.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
