"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Homepage() {
  return (
    <main className="container mx-auto px-4 py-10">
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">ToolMate</h1>
        <p className="text-gray-600">
          Simple aviation tool tracking — Issue, Return, Audit.
        </p>
      </div>

      {/* Main Actions */}
      <div className="grid gap-6 max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <Link href="/issue-tools">
              <Button className="w-full">Issue Tools</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Link href="/return-tools">
              <Button className="w-full">Return Tools</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Link href="/run-audit">
              <Button variant="outline" className="w-full">
                Run Inventory Audit
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Link href="/dashboard">
              <Button variant="secondary" className="w-full">
                Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
