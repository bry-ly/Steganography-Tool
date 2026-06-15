"use client";

import Image from "next/image";
import Link from "next/link";

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold">
      <Image
        src="/logo/Logo.png"
        alt="Steganography Tool"
        width={size}
        height={size}
        className="rounded"
        priority
      />
      <span className="text-[0.9375rem]">Steganography Tool</span>
    </Link>
  );
}
