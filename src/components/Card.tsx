import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full rounded-2xl bg-white p-8 shadow-lg">{children}</div>
  );
}
