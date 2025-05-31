import React from "react";

type ButtonProps = {
  text: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary";
};

export const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  type = "button",
  variant = "primary",
}) => {
  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "bg-gray-200 text-gray-800 hover:bg-gray-300";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`w-full rounded-md px-4 py-2 font-semibold ${styles}`}
    >
      {text}
    </button>
  );
};
