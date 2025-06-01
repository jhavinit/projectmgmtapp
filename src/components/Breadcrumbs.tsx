// components/Breadcrumbs.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const Breadcrumbs = () => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="mb-4 flex items-center text-sm text-gray-600">
      <Link href="/" className="text-blue-600 hover:underline">
        Home
      </Link>
      {segments.map((seg, idx) => {
        const href = "/" + segments.slice(0, idx + 1).join("/");
        const label = decodeURIComponent(seg.replace(/-/g, " "));

        return (
          <span key={href} className="flex items-center">
            <ChevronRight className="mx-2 h-4 w-4" />
            <Link
              href={href}
              className="capitalize text-blue-600 hover:underline"
            >
              {label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
};
