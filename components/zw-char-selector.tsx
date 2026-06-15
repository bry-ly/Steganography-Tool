"use client";

import { ZW_CHARS } from "@/lib/steganography";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ZWCharSelectorProps {
  selectedChars: string[];
  onChange: (chars: string[]) => void;
}

export function ZWCharSelector({ selectedChars, onChange }: ZWCharSelectorProps) {
  function toggleChar(code: string) {
    onChange(
      selectedChars.includes(code)
        ? selectedChars.filter((c) => c !== code)
        : [...selectedChars, code],
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Zero Width Characters for Steganography</Label>
        {selectedChars.length < 3 && (
          <span className="text-xs text-destructive">Select at least 3</span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-1">
        {ZW_CHARS.map(({ code, label }) => {
          const checked = selectedChars.includes(code);
          const idx = selectedChars.indexOf(code);
          return (
            <div key={code} className="flex items-center gap-2 py-0.5">
              <Checkbox id={code} checked={checked} onCheckedChange={() => toggleChar(code)} />
              <Label
                htmlFor={code}
                className={`cursor-pointer font-normal ${checked ? "" : "text-muted-foreground"}`}
              >
                {label}
              </Label>
              {idx === 0 && <Badge variant="secondary" className="text-xs h-4 px-1">bit 0</Badge>}
              {idx === 1 && <Badge variant="secondary" className="text-xs h-4 px-1">bit 1</Badge>}
              {idx === 2 && <Badge variant="secondary" className="text-xs h-4 px-1">delimiter</Badge>}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        The first 3 selected are used as: bit 0, bit 1, and end delimiter.
      </p>
    </div>
  );
}
