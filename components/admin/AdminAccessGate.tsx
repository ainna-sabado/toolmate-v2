"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, Camera, Keyboard } from "lucide-react";
import toast from "react-hot-toast";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Load QR scanner only on client
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

// Extract QR data
function getQRValue(result: any): string | null {
  if (!result) return null;
  if (Array.isArray(result) && result[0]?.rawValue) return result[0].rawValue;
  return result.rawValue ?? null;
}

export default function AdminAccessGate() {
  const router = useRouter();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  );

  const [manualQR, setManualQR] = useState("");
  const [useCamera, setUseCamera] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load department selection
  useEffect(() => {
    setMounted(true);
    setSelectedDepartment(localStorage.getItem("mainDepartment"));
  }, []);

  // -------------------------------------------
  // Verify Admin (shared by manual + camera)
  // -------------------------------------------
  const verifyAdmin = async (qrValue: string) => {
    if (!qrValue) {
      toast.error("QR value cannot be empty");
      return;
    }

    try {
      setProcessing(true);

      // API verify admin
      const verifyRes = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCodeValue: qrValue,
          selectedDepartment,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        toast.error(verifyData.error || "Access Denied");
        return;
      }

      // Create admin session cookie
      await fetch("/api/admin/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: verifyData.employee._id,
        }),
      });

      toast.success("Admin Verified! Redirecting…");

      setTimeout(() => {
        window.location.href = "/admin-access/dashboard";
      }, 1200);
    } catch (error) {
      console.error("❌ Verification error:", error);
      toast.error("Verification failed");
    } finally {
      setProcessing(false);
    }
  };

  // -------------------------------------------
  // Handle camera scan
  // -------------------------------------------
  const handleScan = async (scan: any) => {
    if (processing) return;
    const qrValue = getQRValue(scan);
    if (!qrValue) return;
    await verifyAdmin(qrValue);
  };

  // -------------------------------------------
  // Render
  // -------------------------------------------
  if (!mounted) return <div className="p-6 text-center">Loading camera…</div>;
  if (!selectedDepartment)
    return <div className="p-6 text-center">Select a department first…</div>;

  return (
    <div className="flex justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-center text-xl flex items-center justify-center gap-2">
            <ShieldCheck size={22} />
            Admin Verification
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mode Selector */}
          <div className="flex justify-center">
            <ToggleGroup
              type="single"
              value={useCamera ? "camera" : "manual"}
              className="gap-2"
              onValueChange={(value) => {
                if (!value) return;
                setUseCamera(value === "camera");
              }}
            >
              <ToggleGroupItem
                value="manual"
                aria-label="Manual Input"
                className="px-4 py-2 flex items-center gap-2"
              >
                <Keyboard size={16} />
                Manual
              </ToggleGroupItem>

              <ToggleGroupItem
                value="camera"
                aria-label="Camera Scanner"
                className="px-4 py-2 flex items-center gap-2"
              >
                <Camera size={16} />
                Camera
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* --------------------------- */}
          {/* MANUAL MODE (password field) */}
          {/* --------------------------- */}
          {!useCamera && (
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Enter employee QR code"
                value={manualQR}
                onChange={(e) => setManualQR(e.target.value)}
                onKeyDown={(e) => {
                  // Block paste via keyboard (Ctrl+V / Cmd+V)
                  if (
                    (e.ctrlKey || e.metaKey) &&
                    (e.key === "v" || e.key === "V")
                  ) {
                    e.preventDefault();
                    return;
                  }

                  // Auto-submit for USB barcode scanner
                  if (e.key === "Enter" && !processing && manualQR.trim()) {
                    e.preventDefault();
                    verifyAdmin(manualQR.trim());
                  }
                }}
                onPaste={(e) => e.preventDefault()} // Block right-click → paste
                onCopy={(e) => e.preventDefault()} // Block copying the hidden value
                onCut={(e) => e.preventDefault()} // Block cut
                onContextMenu={(e) => e.preventDefault()} // Disable right-click menu entirely
                onDrop={(e) => e.preventDefault()} // Disable drag-drop
                className="text-center tracking-widest select-none" // Can't highlight text
                autoFocus
              />

              <Button
                className="w-full"
                disabled={processing || !manualQR.trim()}
                onClick={() => verifyAdmin(manualQR.trim())}
              >
                {processing && (
                  <Loader2 className="animate-spin mr-2" size={16} />
                )}
                {processing ? "Verifying…" : "Verify Admin"}
              </Button>
            </div>
          )}

          {/* --------------------------- */}
          {/* CAMERA MODE */}
          {/* --------------------------- */}
          {useCamera && (
            <div className="rounded-md overflow-hidden shadow h-64">
              <Scanner
                onScan={handleScan}
                onError={(err: any) => console.error("SCAN ERROR:", err)}
                constraints={{ facingMode: "environment" }}
                styles={{
                  container: { width: "100%", height: "100%" },
                  video: { width: "100%", height: "100%", objectFit: "cover" },
                }}
              />
            </div>
          )}

          <p className="text-xs text-center text-gray-500">
            Department: <strong>{selectedDepartment}</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
