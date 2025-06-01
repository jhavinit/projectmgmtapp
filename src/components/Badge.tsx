import React from "react";

/**
 * BadgeProps defines the props for the Badge component.
 * Move to a shared types/components directory if reused elsewhere.
 */
interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Badge is a reusable, accessible label for status, tags, or metadata.
 * Provides consistent styling for badges throughout the UI.
 */
export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-800 ${className}`}
      aria-label="Badge"
    >
      {children}
    </span>
  );
}
