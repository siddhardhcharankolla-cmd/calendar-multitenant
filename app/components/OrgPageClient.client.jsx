"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Client wrapper for Org page.
 * - Wrap the server HTML with <OrgPageClient>...</OrgPageClient>
 * - It listens for "org-event-imported" CustomEvent and calls router.refresh()
 *
 * Usage (server page):
 *   return (
 *     <OrgPageClient>
 *       <div>... server content ...</div>
 *     </OrgPageClient>
 *   )
 */
export default function OrgPageClient({ children }) {
  const router = useRouter();

  useEffect(() => {
    function onImported(e) {
      try {
        router.refresh();
      } catch (err) {
        console.warn("[OrgPageClient] router.refresh failed", err);
        window.location.reload();
      }
    }

    window.addEventListener("org-event-imported", onImported);
    return () => window.removeEventListener("org-event-imported", onImported);
  }, [router]);

  return <>{children}</>;
}
