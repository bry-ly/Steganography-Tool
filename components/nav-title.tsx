"use client";

import Image from "next/image";
import Link from "next/link";
import type { ComponentProps } from "react";

export function NavTitle(props: ComponentProps<"a">) {
  return (
    <Link href="/" {...props}>
      <Image
        src="/logo/Logo.png"
        alt="Logo"
        width={50}
        height={50}
        className="rounded"
        priority
      />
      <span>Stegnohide</span>
    </Link>
  );
}
