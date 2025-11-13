"use client";

import { Dialog } from "@headlessui/react";
import { useDepartment } from "@/context/DepartmentContext";

interface Props {
  open: boolean;
  setOpen: (val: boolean) => void;
}

const DEPARTMENTS: string[] = [
  "Wire Harness Tooling",
  "Mechanical Tools",
  "Composite Tools",
  "APU Components",
];

export default function DepartmentSelector({ open, setOpen }: Props) {
  const { updateDepartment } = useDepartment();

  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded p-6 max-w-sm w-full">
          <Dialog.Title className="font-bold mb-4 text-lg">
            Select Department
          </Dialog.Title>

          <div className="space-y-3">
            {DEPARTMENTS.map((dep) => (
              <button
                key={dep}
                onClick={() => {
                  updateDepartment(dep);
                  setOpen(false);
                }}
                className="w-full rounded bg-gray-100 p-3 text-left hover:bg-gray-200"
              >
                {dep}
              </button>
            ))}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
