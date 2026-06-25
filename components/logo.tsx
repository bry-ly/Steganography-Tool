"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Logo({ size = 65, className, ...props }: { size?: number } & ComponentProps<"a">) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 font-semibold", className)} {...props}>
      <Image
        src="/logo/Logo.png"
        alt="Steganography Tool"
        width={size}
        height={size}
        className="rounded"
        style={{ height: "auto" }}
        priority
      />
      <span className="text-[0.9375rem]">StegnoHide</span>
    </Link>
  );
}
