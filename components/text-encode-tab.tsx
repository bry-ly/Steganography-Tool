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
import { encodeMessage } from "@/lib/steganography";
import { copyToClipboard, downloadTextFile, readFileAsText } from "@/lib/file";
import { CopyIcon, DownloadSimpleIcon, LockKeyIcon, UploadSimpleIcon } from "@phosphor-icons/react";

interface TextEncodeTabProps {
  selectedChars: string[];
  onSelectedCharsChange: (chars: string[]) => void;
}

export function TextEncodeTab({ selectedChars, onSelectedCharsChange }: TextEncodeTabProps) {
  const [coverText, setCoverText] = useState("");
  const [secret, setSecret] = useState("");
  const [stegoOut, setStegoOut] = useState("");
  const [error, setError] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [stats, setStats] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleEncode() {
    setError("");
    setStegoOut("");
    setStats("");
    try {
      const result = await encodeMessage(coverText, secret, selectedChars, passphrase || undefined);
      setStegoOut(result);
      const zwCount = (result.match(/[​‌‍‎‪‬‭⁢⁣﻿]/g) || []).length;
      const secretBytes = new TextEncoder().encode(secret).length;
      const coverWords = coverText.trim().split(/\s+/).length;
      setStats(`Hidden ${secretBytes} bytes (${zwCount} ZW chars) in ${coverWords}-word cover text.`);
      toast.success("Message encoded successfully");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setCoverText(await readFileAsText(file));
    e.target.value = "";
  }

  const wordCount = coverText.trim() ? coverText.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="cover-text">Cover Text</Label>
          <div className="flex items-center gap-2">
            {wordCount > 0 && <Badge variant="secondary">{wordCount} words</Badge>}
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => fileRef.current?.click()}>
              <UploadSimpleIcon size={12} /> Upload .txt
            </Button>
            <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={handleFile} />
          </div>
        </div>
        <Textarea id="cover-text" placeholder="Paste your cover text here…" rows={5} value={coverText} onChange={(e) => setCoverText(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="secret">Secret Message</Label>
        <Textarea id="secret" placeholder="Type the message to hide…" rows={3} value={secret} onChange={(e) => setSecret(e.target.value)} />
      </div>

      <PassphraseInput id="encode-passphrase" label="Passphrase (optional)" value={passphrase} onChange={setPassphrase} placeholder="Encrypt the secret with a passphrase" />

      <ZWCharSelector selectedChars={selectedChars} onChange={onSelectedCharsChange} />

      <Separator />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleEncode} disabled={selectedChars.length < 3} className="gap-1.5 w-full">
        <LockKeyIcon size={14} /> Encode Message
      </Button>

      {stats && <p className="text-xs text-muted-foreground">{stats}</p>}

      {stegoOut && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Stego Text Output</Label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => copyToClipboard(stegoOut, "Copied to clipboard", "Failed to copy")}>
                <CopyIcon size={12} /> Copy
              </Button>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => { downloadTextFile(stegoOut, "stego-output.txt"); toast.success("File downloaded"); }}>
                <DownloadSimpleIcon size={12} /> Download
              </Button>
            </div>
          </div>
          <Textarea readOnly rows={5} value={stegoOut} className="font-mono text-sm" />
          <p className="text-xs text-muted-foreground">Looks identical to the cover text but contains hidden zero-width characters.</p>
        </div>
      )}
    </div>
  );
}
