import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Logo } from "@/components/logo";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      component: <Logo size={24} />,
    },
    githubUrl: "https://github.com/your-username/steganography-tool",
  };
}
