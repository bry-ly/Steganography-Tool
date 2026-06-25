"use client";

import { Logo } from "@/components/logo";
import type { ComponentProps } from "react";

export function NavTitle(props: ComponentProps<"a">) {
  return <Logo size={50} {...props} />;
}
