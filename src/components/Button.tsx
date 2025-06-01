import React from "react";

/**
 * ButtonProps defines the props for the Button component.
 * Move to a shared types directory if reused elsewhere.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  variant?: "primary" | "secondary";
  className?: string;
}

/**
 * Button is a reusable, accessible button component.
 * Supports primary and secondary variants.
 */
export const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  ...rest
}) => {
  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400"
      : "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`w-full rounded-md px-4 py-2 font-semibold focus:outline-none focus:ring-2 ${styles} ${className}`}
      aria-label={text}
      {...rest}
    >
      {text}
    </button>
  );
};
