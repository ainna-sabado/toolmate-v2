"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

// Load QR Scanner only on client
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

export default function AdminAccessGate() {
  const router = useRouter();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSelectedDepartment(localStorage.getItem("mainDepartment"));
  }, []);

  const handleScan = async (result: any) => {
    if (processing) return;
    setProcessing(true);

    let qrValue = "";
    if (Array.isArray(result) && result[0]?.rawValue) {
      qrValue = result[0].rawValue;
    } else if (result?.rawValue) {
      qrValue = result.rawValue;
    }

    if (!qrValue) {
      console.log("⚠️ Invalid QR detected");
      setProcessing(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCodeValue: qrValue, selectedDepartment }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Access Denied");
        setTimeout(() => router.push("/"), 900);
        return;
      }

      // Create secure admin session
      await fetch("/api/admin/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: data.employee._id }),
      });

      toast.success("Admin verified! ✔");

      setTimeout(() => router.push("/admin-access/dashboard"), 900);
    } catch (err) {
      console.error("❌ Verification error:", err);
      toast.error("Verification failed");
      setTimeout(() => router.push("/"), 900);
    }
  };

  if (!mounted) return <div className="p-6 text-center">Loading camera…</div>;
  if (!selectedDepartment)
    return <div className="p-6 text-center">Select a department first…</div>;

  return (
    <div className="flex justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            <ShieldCheck className="inline-block mr-2" size={22} />
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
              constraints={{
                facingMode: "environment", // correct MediaTrackConstraints format
              }}
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          <Button disabled className="w-full opacity-40">
            {processing && <Loader2 className="animate-spin mr-2" size={16} />}
            Waiting for QR scan…
          </Button>

          <p className="text-xs text-center text-gray-500">
            Department: <strong>{selectedDepartment}</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
