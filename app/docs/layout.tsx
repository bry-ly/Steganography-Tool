import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import { Folder, File } from "fumadocs-ui/components/files";
import type { ReactNode } from "react";

function SidebarFooter() {
  return (
    <div className="flex flex-col gap-2 p-4 text-sm text-muted-foreground">
      <a
        href="https://github.com/your-username/steganography-tool"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-foreground transition-colors"
      >
        GitHub
      </a>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      {...baseOptions()}
      tree={source.getPageTree()}
      sidebar={{
        footer: <SidebarFooter />,
      }}
    >
      {children}
    </DocsLayout>
  );
}
