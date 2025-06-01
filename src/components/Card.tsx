import React from "react";

/**
 * CardProps defines the props for the Card component.
 * Move to a shared types directory if reused elsewhere.
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card is a reusable, accessible container for grouping content.
 * Provides consistent styling and shadow for UI sections.
 */
export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`w-full rounded-2xl bg-white p-8 shadow-lg ${className}`}
      aria-label="Card Container"
      {...props}
    >
      {children}
    </div>
  );
}
