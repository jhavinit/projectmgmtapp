// components/Breadcrumbs.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Breadcrumbs component displays the current navigation path as clickable links.
 * Uses Next.js navigation hooks and ensures accessibility.
 */
export const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  /**
   * Helper to format breadcrumb labels.
   * @param segment - The URL segment.
   * @returns Formatted label string.
   */
  const formatLabel = (segment: string): string =>
    decodeURIComponent(segment.replace(/-/g, " "));

  return (
    <nav
      className="mb-4 flex items-center text-sm text-gray-600"
      aria-label="Breadcrumb"
    >
      <Link
        href="/"
        className="text-blue-600 hover:underline"
        aria-label="Home"
      >
        Home
      </Link>
      {segments.map((seg, idx) => {
        const href = "/" + segments.slice(0, idx + 1).join("/");
        const label = formatLabel(seg);

        return (
          <span key={href} className="flex items-center">
            <ChevronRight className="mx-2 h-4 w-4" aria-hidden="true" />
            <Link
              href={href}
              className="capitalize text-blue-600 hover:underline"
              aria-current={idx === segments.length - 1 ? "page" : undefined}
              tabIndex={0}
            >
              {label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
};
