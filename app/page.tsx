"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDepartment } from "@/context/DepartmentContext";

export default function Homepage() {
  const { mainDepartment } = useDepartment();
  return (
    <div className="w-full">
      {/* Title Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">ToolMate</h1>
        {/* SHOW DEPARTMENT ONLY ON MOBILE/TABLET */}
        {mainDepartment && (
          <div className="mt-2 md:hidden">
            <span className="px-3 py-1 bg-gray-200 rounded-md text-sm font-medium">
              {mainDepartment}
            </span>
          </div>
        )}
        <p className="text-gray-600 text-base sm:text-lg max-w-xl mx-auto">
          Intelligent aviation tool tracking. Issue, return, and monitor tools
          with ease.
        </p>
      </section>

      {/* Main Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Issue Tools */}
        <Card>
          <CardContent className="p-6 text-center">
            <Link href="/issue-tools">
              <Button className="w-full" size="lg">
                Issue Tools
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Return Tools */}
        <Card>
          <CardContent className="p-6 text-center">
            <Link href="/return-tools">
              <Button className="w-full" size="lg">
                Return Tools
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Run Audit */}
        <Card>
          <CardContent className="p-6 text-center">
            <Link href="/run-audit">
              <Button variant="outline" className="w-full" size="lg">
                Run Inventory Audit
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Dashboard */}
        <Card>
          <CardContent className="p-6 text-center">
            <Link href="/dashboard/storages">
              <Button variant="secondary" className="w-full" size="lg">
                Main Storage Dashboards
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
