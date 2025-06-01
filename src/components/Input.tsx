import React from "react";

/**
 * InputProps defines the props for the Input component.
 * Move to a shared types directory if reused elsewhere.
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

/**
 * Input is a reusable, accessible input field with label.
 * Forwards all native input props and ensures proper labeling.
 */
export const Input: React.FC<InputProps> = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  className,
  ...rest
}) => (
  <div className={className ?? "mb-4"}>
    <label
      htmlFor={name}
      className="mb-1 block text-sm font-medium text-gray-700"
    >
      {label}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-label={label}
      className="w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...rest}
    />
  </div>
);
