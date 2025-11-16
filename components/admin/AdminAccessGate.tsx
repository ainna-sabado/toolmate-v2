"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminAccessGate() {
  const router = useRouter();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [manualQR, setManualQR] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setSelectedDepartment(localStorage.getItem("mainDepartment"));
  }, []);

  const verifyAdmin = async (qrValue: string) => {
    if (!qrValue) {
      toast.error("QR value cannot be empty");
      return;
    }

    try {
      setProcessing(true);

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

      setTimeout(() => router.push("/admin-access/dashboard"), 1200);
    } catch (error) {
      console.error("❌ Verification error:", error);
      toast.error("Verification failed");
    } finally {
      setProcessing(false);
    }
  };

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
          {/* Manual password/QR input */}
          <Input
            type="password"
            placeholder="Enter admin QR code"
            value={manualQR}
            onChange={(e) => setManualQR(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V")) {
                e.preventDefault();
                return;
              }
              if (e.key === "Enter" && manualQR.trim()) {
                e.preventDefault();
                verifyAdmin(manualQR.trim());
              }
            }}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            className="text-center tracking-widest select-none"
            autoFocus
          />

          <Button
            className="w-full"
            disabled={processing || !manualQR.trim()}
            onClick={() => verifyAdmin(manualQR.trim())}
          >
            {processing && <Loader2 className="animate-spin mr-2" size={16} />}
            {processing ? "Verifying…" : "Verify Admin"}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Department: <strong>{selectedDepartment}</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
