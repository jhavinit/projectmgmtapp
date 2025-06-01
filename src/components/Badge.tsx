import React from "react";

export function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-800 ${className}`}
    >
      {children}
    </span>
  );
}
