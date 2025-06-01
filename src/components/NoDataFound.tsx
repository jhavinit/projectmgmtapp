import React from "react";
import Image from "next/image";

/**
 * Props for the NoDataFound component.
 * - message: Optional message to display.
 * - logoUrl: Optional logo image URL.
 * - logoSize: Optional logo size in px.
 */
export interface NoDataFoundProps {
  message?: string;
  logoUrl?: string;
  logoSize?: number;
}

/**
 * NoDataFound component displays a friendly message and illustration
 * when there is no data to show in a list or table.
 * Ensures accessibility and customizable visuals.
 */
export default function NoDataFound({
  message = "No data found",
  logoUrl = "/undraw_no-data_ig65.svg", // Default illustration
  logoSize = 150,
}: NoDataFoundProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 text-center text-gray-500"
      aria-label="No Data Found"
      role="status"
    >
      {logoUrl && (
        <Image
          src={logoUrl}
          alt="No data illustration"
          width={logoSize}
          height={logoSize}
          className="mb-4 opacity-50"
          priority={false}
        />
      )}
      <p className="text-lg font-semibold" tabIndex={0}>
        {message}
      </p>
    </div>
  );
}
