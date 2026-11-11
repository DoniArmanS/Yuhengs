import type { Metadata } from "next";
import { NotFoundContent } from "@/components/not-found-content";
import SiteLayout from "./(site)/layout";

export const metadata: Metadata = { title: "Page not found" };

/** Unknown URLs render outside any route group, so this one brings the site chrome itself. */
export default function NotFound() {
  return (
    <SiteLayout>
      <NotFoundContent />
    </SiteLayout>
  );
}
