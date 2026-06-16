"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

interface PassphraseInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function PassphraseInput({ id, label, value, onChange, placeholder }: PassphraseInputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide passphrase" : "Show passphrase"}
        >
          {show ? <EyeSlashIcon size={14} /> : <EyeIcon size={14} />}
        </Button>
      </div>
      <input
        id={id}
        type={show ? "text" : "password"}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}
