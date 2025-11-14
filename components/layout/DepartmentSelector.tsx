"use client";

import { useDepartment } from "@/context/DepartmentContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function DepartmentSelector({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { mainDepartment, updateDepartment } = useDepartment();
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await fetch("/api/departments");
        const data = await res.json();
        setDepartments(data.departments || []);
      } catch (err) {
        console.error("Failed to fetch departments:", err);
      } finally {
        setLoading(false);
      }
    }

    if (open) fetchDepartments();
  }, [open]);

  const handleSelect = (dep: string) => {
    updateDepartment(dep);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Department</DialogTitle>
        </DialogHeader>

        {loading && <p className="text-sm text-gray-500">Loading…</p>}

        {!loading && departments.length === 0 && (
          <p className="text-sm text-red-500">No departments found in database.</p>
        )}

        <div className="flex flex-col gap-2 mt-4">
          {departments.map((dep) => (
            <Button
              key={dep}
              variant={mainDepartment === dep ? "default" : "outline"}
              onClick={() => handleSelect(dep)}
              className="justify-start"
            >
              {dep}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
