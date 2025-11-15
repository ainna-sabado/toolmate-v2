"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

// Load QR scanner only on client
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

// Helper — extract QR data from scanner output
function getQRValue(result: any): string | null {
  if (!result) return null;

  if (Array.isArray(result) && result[0]?.rawValue) {
    return result[0].rawValue;
  }

  return result.rawValue ?? null;
}

export default function AdminAccessGate() {
  const router = useRouter();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSelectedDepartment(localStorage.getItem("mainDepartment"));
  }, []);

  const handleScan = async (scan: any) => {
    if (processing) return;
    setProcessing(true);

    const qrValue = getQRValue(scan);
    if (!qrValue) {
      console.warn("⚠️ Invalid QR detected");
      setProcessing(false);
      return;
    }

    try {
      // Verify admin
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
        setTimeout(() => (window.location.href = "/"), 1000);
        return;
      }

      // Create admin session cookie
      await fetch("/api/admin/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: verifyData.employee._id }),
      });

      toast.success("Admin Verified! Redirecting…");

      // Must be a full redirect so middleware sees cookie
      setTimeout(() => {
        window.location.href = "/admin-access/dashboard";
      }, 1200);
    } catch (err) {
      console.error("❌ Verification error:", err);
      toast.error("Verification Failed");
      setTimeout(() => (window.location.href = "/"), 500);
    } finally {
      setProcessing(false);
    }
  };

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
          <p className="text-center text-sm text-gray-500">
            Scan your employee QR code
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
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

          <Button disabled className="w-full opacity-50">
            {processing && <Loader2 className="animate-spin mr-2" size={16} />}
            {processing ? "Processing…" : "Waiting for QR scan…"}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Department: <strong>{selectedDepartment}</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
