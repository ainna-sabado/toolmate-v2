"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  Wrench,
  PackageSearch,
  ClipboardList,
  Settings,
  LayoutTemplate,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminCard
          title="Manage Tools"
          icon={<Wrench size={20} />}
          onClick={() => router.push("/admin-access/tools")}
        />

        <AdminCard
          title="Manage ToolKits"
          icon={<PackageSearch size={20} />}
          onClick={() => router.push("/admin-access/toolkits")}
        />

        <AdminCard
          title="Manage Shadowboards"
          icon={<LayoutTemplate size={20} />}
          onClick={() => router.push("/admin-access/shadowboards")}
        />

        <AdminCard
          title="Reports & Audit Logs"
          icon={<ClipboardList size={20} />}
          onClick={() => router.push("/admin-access/reports")}
        />

        <AdminCard
          title="Storage Settings"
          icon={<Settings size={20} />}
          onClick={() => router.push("/admin-access/settings")}
        />
      </div>
    </div>
  );
}

function AdminCard({
  title,
  icon,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-md transition border rounded-xl"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-base font-medium">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
