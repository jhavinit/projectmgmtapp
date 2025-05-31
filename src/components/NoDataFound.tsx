import React from "react";
import Image from "next/image";

type NoDataFoundProps = {
  message?: string;
  logoUrl?: string; // optional logo image URL
  logoSize?: number; // optional logo size in px
};

export default function NoDataFound({
  message = "No data found",
  logoUrl = "/undraw_no-data_ig65.svg", // replace with your default logo path
  logoSize = 150,
}: NoDataFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
      {logoUrl && (
        <Image
          src={logoUrl}
          alt="No data"
          width={logoSize}
          height={logoSize}
          className="mb-4 opacity-50"
        />
      )}
      <p className="text-lg font-semibold">{message}</p>
    </div>
  );
}
