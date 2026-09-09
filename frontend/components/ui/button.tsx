"use client";

import React from "react";
import Link from "next/link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  href,
  target,
  rel,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-60 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/25 active:scale-[0.98]",
    secondary:
      "bg-[#1E1B4B] hover:bg-[#14123A] text-white shadow-md shadow-[#1E1B4B]/20 active:scale-[0.98]",
    outline:
      "border border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-[0.98]",
    ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} target={target} rel={rel}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export default Button;
