"use client";

import { Feather } from "lucide-react";
import { forwardRef } from "react";

export const PostButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className="bg-white text-black rounded-full w-full xl:w-[90%] h-[52px] px-8 font-bold text-lg shadow-none hover:opacity-90 transition-opacity flex items-center justify-center mt-2"
      {...props}
    >
      <span className="hidden xl:block">Postear</span>
      <Feather className="xl:hidden w-6 h-6" />
    </button>
  );
});

PostButton.displayName = "PostButton";

