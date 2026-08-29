"use client";

import React from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { useVoiceCapture } from "../hooks/useVoiceCapture";
import type { VoiceContext, VoiceParseResult } from "../services/voice.service";

interface VoiceMicButtonProps<T> {
    context: VoiceContext;
    /** Called once extraction succeeds, with the transcript + extracted fields. */
    onResult: (result: VoiceParseResult<T>) => void;
    className?: string;
}

export function VoiceMicButton<T = Record<string, unknown>>({
    context,
    onResult,
    className,
}: VoiceMicButtonProps<T>) {
    const { status, result, error, start, stop, reset } = useVoiceCapture<T>(context);

    // Fire the callback once, when a result lands
    const handledRef = React.useRef(false);
    React.useEffect(() => {
        if (status === "done" && result && !handledRef.current) {
            handledRef.current = true;
            onResult(result);
            reset();
            handledRef.current = false;
        }
    }, [status, result, onResult, reset]);

    const handleClick = () => {
        if (status === "recording") stop();
        else if (status === "idle" || status === "error" || status === "done") start();
    };

    return (
        <div className="flex flex-col items-center gap-1">
            <button
                type="button"
                onClick={handleClick}
                disabled={status === "processing"}
                aria-label={status === "recording" ? "Stop recording" : "Record voice entry"}
                className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-sm",
                    status === "recording" && "bg-[#C0524A] text-white animate-pulse",
                    status === "processing" && "bg-[#9E8E80] text-white",
                    (status === "idle" || status === "error" || status === "done") && "bg-primary-gradient",
                    className
                )}
            >
                {status === "processing" ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : status === "recording" ? (
                    <Square size={16} fill="currentColor" />
                ) : (
                    <Mic size={18} />
                )}
            </button>
            {status === "recording" && (
                <span className="text-[10px] text-[#C0524A] font-medium">Listening...</span>
            )}
            {status === "processing" && (
                <span className="text-[10px] text-[#9E8E80] font-medium">Processing...</span>
            )}
            {error && (
                <span className="text-[10px] text-[#C0524A] font-medium max-w-[100px] text-center">{error}</span>
            )}
        </div>
    );
}