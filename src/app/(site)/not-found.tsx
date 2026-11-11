import type { Metadata } from "next";
import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = { title: "Page not found" };

/** notFound() from a site page (an unknown anime id, say) renders inside the site chrome. */
export default function NotFound() {
  return <NotFoundContent />;
}
