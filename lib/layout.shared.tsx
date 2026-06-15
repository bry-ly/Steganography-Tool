import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Steganography Tool",
    },
    links: [
      {
        text: "GitHub",
        url: "https://github.com/your-username/steganography-tool",
        external: true,
      },
    ],
  };
}
