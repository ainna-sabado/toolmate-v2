import React, { Suspense } from "react";
import AuditClient from "./AuditClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">
          Loading audit…
        </div>
      }
    >
      <AuditClient />
    </Suspense>
  );
}
