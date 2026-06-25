"use client";

import { useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { UploadSimpleIcon } from "@phosphor-icons/react";

interface FileUploadButtonProps {
  /** Accepted file types, e.g. ".txt" or "image/png,image/jpeg" */
  accept: string;
  /** Button label (default "Upload") */
  label?: string;
  /** Called when a file is selected */
  onFile: (file: File) => void | Promise<void>;
  /** Optional icon override (default UploadSimpleIcon) */
  icon?: ReactNode;
  /** Optional class name for the button */
  className?: string;
}

export function FileUploadButton({ accept, label = "Upload", onFile, icon, className }: FileUploadButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      await onFile(file);
    }
    e.target.value = "";
  }

  return (
    <>
      <Button variant="ghost" size="sm" className={`h-7 gap-1 text-xs${className ? ` ${className}` : ""}`} onClick={() => fileRef.current?.click()}>
        {icon ?? <UploadSimpleIcon size={12} />} {label}
      </Button>
      <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </>
  );
}
