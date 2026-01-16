"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Camera, Keyboard } from "lucide-react";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

interface QRScanInputProps {
  onScan: (value: string) => void;
  placeholder?: string;
}

export default function QRScanInput({ onScan, placeholder }: QRScanInputProps) {
  const [mode, setMode] = useState<"manual" | "camera">("manual");
  const [input, setInput] = useState("");

  const extractValue = (result: any) => {
    if (!result) return null;
    if (Array.isArray(result) && result[0]?.rawValue) return result[0].rawValue;
    return result.rawValue ?? null;
  };

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <ToggleGroup
        type="single"
        value={mode}
        className="gap-2 flex justify-center"
        onValueChange={(v) => v && setMode(v as any)}
      >
        <ToggleGroupItem value="manual" className="px-4 py-2 flex items-center gap-2">
          <Keyboard size={16} /> Manual
        </ToggleGroupItem>
        <ToggleGroupItem value="camera" className="px-4 py-2 flex items-center gap-2">
          <Camera size={16} /> Camera
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Manual input */}
      {mode === "manual" && (
        <div className="flex gap-2">
          <Input
            placeholder={placeholder || "Enter value"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && input.trim() && onScan(input.trim())}
            className="tracking-wide"
          />
          <Button onClick={() => onScan(input.trim())} disabled={!input.trim()}>
            OK
          </Button>
        </div>
      )}

      {/* Camera mode */}
      {mode === "camera" && (
        <div className="w-full flex justify-center">
          {/* Fixed square scan window */}
          <div className="relative w-full max-w-sm aspect-square rounded-xl overflow-hidden shadow-md">
            <Scanner
              onScan={(data) => {
                const val = extractValue(data);
                if (val) onScan(val);
              }}
              onError={(err) => console.error("Scanner error:", err)}
              constraints={{ facingMode: "environment" }}
              styles={{
                container: { width: "100%", height: "100%" },
                video: { width: "100%", height: "100%", objectFit: "cover" },
              }}
            />

            {/* Overlay: dim + frame */}
            <div className="pointer-events-none absolute inset-0">
              {/* Slight dim for better contrast */}
              <div className="absolute inset-0 bg-black/10" />

              {/* Square frame (same size as container) */}
              <div className="absolute inset-0 border-2 border-white/80 rounded-xl" />

              {/* Corner accents */}
              <div className="absolute top-3 left-3 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
