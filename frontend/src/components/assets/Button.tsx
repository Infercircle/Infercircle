import React from "react";
import { FiArrowRight } from "react-icons/fi";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ className = "", icon, children, ...props }) => {
  // Increased vertical padding for a larger button
  const sizeClasses = "py-3 h-auto px-6 text-base rounded w-64";

  return (
    <button
      className={`bg-violet-500 hover:bg-violet-600 text-white font-semibold transition flex items-center justify-center gap-2 ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
      {icon !== undefined ? icon : null}
    </button>
  );
};

// Usage example: <Button icon={<FiArrowRight />} />
export default Button;