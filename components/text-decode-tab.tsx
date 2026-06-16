"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PassphraseInput } from "@/components/pass-phrase-input";
import { ZWCharSelector } from "@/components/zw-char-selector";
import { decodeMessage } from "@/lib/steganography";
import { copyToClipboard, readFileAsText } from "@/lib/file";
import { CopyIcon, LockKeyOpenIcon, UploadSimpleIcon } from "@phosphor-icons/react";

interface TextDecodeTabProps {
  selectedChars: string[];
  onSelectedCharsChange: (chars: string[]) => void;
}

export function TextDecodeTab({ selectedChars, onSelectedCharsChange }: TextDecodeTabProps) {
  const [stegoIn, setStegoIn] = useState("");
  const [decoded, setDecoded] = useState("");
  const [error, setError] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleDecode() {
    setError("");
    setDecoded("");
    try {
      const result = await decodeMessage(stegoIn, selectedChars, passphrase || undefined);
      setDecoded(result);
      toast.success("Message decoded successfully");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setStegoIn(await readFileAsText(file));
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="stego-in">Stego Text</Label>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => fileRef.current?.click()}>
            <UploadSimpleIcon size={12} /> Upload .txt
          </Button>
          <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={handleFile} />
        </div>
        <Textarea id="stego-in" placeholder="Paste stego text or upload a .txt file…" rows={6} value={stegoIn} onChange={(e) => setStegoIn(e.target.value)} />
      </div>

      <PassphraseInput id="decode-passphrase" label="Passphrase (if encrypted)" value={passphrase} onChange={setPassphrase} placeholder="Enter passphrase if the message was encrypted" />

      <ZWCharSelector selectedChars={selectedChars} onChange={onSelectedCharsChange} />

      <Separator />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleDecode} disabled={selectedChars.length < 3} className="gap-1.5 w-full">
        <LockKeyOpenIcon size={14} /> Decode Message
      </Button>

      {decoded && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Extracted Message</Label>
              <Badge variant="secondary">Found</Badge>
            </div>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={async () => {
              const r = await copyToClipboard(decoded);
              toast[r.ok ? "success" : "error"](r.message);
            }}>
              <CopyIcon size={12} /> Copy
            </Button>
          </div>
          <Textarea readOnly rows={4} value={decoded} className="font-mono text-sm" />
        </div>
      )}
    </div>
  );
}
