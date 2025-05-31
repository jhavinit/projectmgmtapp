import React from "react";

type InputProps = {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
};

export const Input: React.FC<InputProps> = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
}) => (
  <div className="mb-4">
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
      className="w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);
