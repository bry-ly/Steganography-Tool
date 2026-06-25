"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

export const SECURITY_PRESETS = [
  { label: "Fast (100k)", iterations: 100_000, hint: "Default. Quick on any device." },
  { label: "Balanced (250k)", iterations: 250_000, hint: "Recommended for most users." },
  { label: "Strong (600k)", iterations: 600_000, hint: "Slower unlock, resists brute force better." },
  { label: "Paranoid (1M)", iterations: 1_000_000, hint: "Very slow unlock. For high-value secrets." },
] as const;

interface PassphraseInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  iterations?: number;
  onIterationsChange?: (iterations: number) => void;
  showSecurityLevel?: boolean;
}

export function PassphraseInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  iterations,
  onIterationsChange,
  showSecurityLevel = false,
}: PassphraseInputProps) {
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
      {showSecurityLevel && onIterationsChange && (
        <div className="flex items-center gap-2 pt-1">
          <Label htmlFor={`${id}-iterations`} className="text-xs text-muted-foreground whitespace-nowrap">
            KDF strength
          </Label>
          <select
            id={`${id}-iterations`}
            value={iterations ?? 100_000}
            onChange={(e) => onIterationsChange(Number(e.target.value))}
            className="h-7 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {SECURITY_PRESETS.map((preset) => (
              <option key={preset.iterations} value={preset.iterations} title={preset.hint}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}