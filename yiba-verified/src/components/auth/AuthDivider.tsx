import React from "react";

interface AuthDividerProps {
  text?: string;
  className?: string;
}

export function AuthDivider({ text = "OR", className }: AuthDividerProps) {
  return (
    <div className={className || "relative flex items-center py-4"}>
      <div className="flex-1 border-t border-gray-200/70"></div>
      <span className="px-3 text-xs text-gray-500 font-medium">{text}</span>
      <div className="flex-1 border-t border-gray-200/70"></div>
    </div>
  );
}
