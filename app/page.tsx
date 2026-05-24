"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { encodeMessage, decodeMessage, ZW_CHARS, DEFAULT_SELECTED } from "@/lib/steganography";
import { LockKeyIcon, LockKeyOpenIcon, CopyIcon, DownloadSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react";

// Reads a File as plain text and returns a Promise<string>
function readFile(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsText(file);
  });
}

// Creates a temporary download link and triggers a .txt file download
function downloadTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Writes text to the clipboard and shows a toast notification
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success("Copied to clipboard"),
    () => toast.error("Failed to copy"),
  );
}

export default function Home() {
  const [coverText, setCoverText] = useState("");
  const [secret, setSecret] = useState("");
  const [stegoOut, setStegoOut] = useState("");
  const [encodeError, setEncodeError] = useState("");

  const [stegoIn, setStegoIn] = useState("");
  const [decoded, setDecoded] = useState("");
  const [decodeError, setDecodeError] = useState("");

  // Selected zero-width character codes; first 3 are used as bit0, bit1, delimiter
  const [selectedChars, setSelectedChars] = useState<string[]>(DEFAULT_SELECTED);

  const encodeFileRef = useRef<HTMLInputElement>(null);
  const decodeFileRef = useRef<HTMLInputElement>(null);

  function toggleChar(code: string) {
    setSelectedChars((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  // Calls encodeMessage and updates output state
  function handleEncode() {
    setEncodeError("");
    setStegoOut("");
    try {
      setStegoOut(encodeMessage(coverText, secret, selectedChars));
      toast.success("Message encoded successfully");
    } catch (e) {
      setEncodeError((e as Error).message);
    }
  }

  // Calls decodeMessage and updates decoded state
  function handleDecode() {
    setDecodeError("");
    setDecoded("");
    try {
      setDecoded(decodeMessage(stegoIn, selectedChars));
      toast.success("Message decoded successfully");
    } catch (e) {
      setDecodeError((e as Error).message);
    }
  }

  // Loads an uploaded .txt file into the cover text field
  async function handleEncodeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setCoverText(await readFile(file));
    e.target.value = "";
  }

  // Loads an uploaded .txt file into the stego input field
  async function handleDecodeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setStegoIn(await readFile(file));
    e.target.value = "";
  }

  const wordCount = coverText.trim() ? coverText.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 pt-10 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-1">
          <LockKeyIcon size={22} weight="duotone" />
          <h1 className="text-xl font-semibold tracking-tight">Steganography Tool</h1>
        </div>
        <p className="text-sm text-muted-foreground">Hide secret messages inside plain text using invisible zero-width characters.</p>
      </header>

      <Separator className="max-w-2xl mx-auto w-full" />

      <main className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full space-y-6">
        {/* Zero-width character selector */}
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
                  <Checkbox
                    id={code}
                    checked={checked}
                    onCheckedChange={() => toggleChar(code)}
                  />
                  <Label htmlFor={code} className={`cursor-pointer font-normal ${checked ? "" : "text-muted-foreground"}`}>
                    {label}
                  </Label>
                  {idx === 0 && <Badge variant="secondary" className="text-xs h-4 px-1">bit 0</Badge>}
                  {idx === 1 && <Badge variant="secondary" className="text-xs h-4 px-1">bit 1</Badge>}
                  {idx === 2 && <Badge variant="secondary" className="text-xs h-4 px-1">delimiter</Badge>}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">The first 3 selected are used as: bit 0, bit 1, and end delimiter.</p>
        </div>

        <Separator />

        <Tabs defaultValue="encode">
          <TabsList className="mb-6">
            <TabsTrigger value="encode" className="gap-1.5">
              <LockKeyIcon size={14} />
              Encode
            </TabsTrigger>
            <TabsTrigger value="decode" className="gap-1.5">
              <LockKeyOpenIcon size={14} />
              Decode
            </TabsTrigger>
          </TabsList>

          {/* ENCODE */}
          <TabsContent value="encode" className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="cover-text">Cover Text</Label>
                <div className="flex items-center gap-2">
                  {wordCount > 0 && <Badge variant="secondary">{wordCount} words</Badge>}
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => encodeFileRef.current?.click()}>
                    <UploadSimpleIcon size={12} /> Upload .txt
                  </Button>
                  <input ref={encodeFileRef} type="file" accept=".txt" className="hidden" onChange={handleEncodeFile} />
                </div>
              </div>
              <Textarea id="cover-text" placeholder="Paste your cover text here…" rows={5} value={coverText} onChange={(e) => setCoverText(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="secret">Secret Message</Label>
              <Textarea id="secret" placeholder="Type the message to hide…" rows={3} value={secret} onChange={(e) => setSecret(e.target.value)} />
            </div>

            {encodeError && <p className="text-sm text-destructive">{encodeError}</p>}

            <Button onClick={handleEncode} disabled={selectedChars.length < 3} className="gap-1.5 w-full">
              <LockKeyIcon size={14} /> Encode Message
            </Button>

            {stegoOut && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Stego Text Output</Label>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => copyToClipboard(stegoOut)}>
                      <CopyIcon size={12} /> Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => {
                        downloadTxt(stegoOut, "stego-output.txt");
                        toast.success("File downloaded");
                      }}
                    >
                      <DownloadSimpleIcon size={12} /> Download
                    </Button>
                  </div>
                </div>
                <Textarea readOnly rows={5} value={stegoOut} className="font-mono text-sm" />
                <p className="text-xs text-muted-foreground">Looks identical to the cover text but contains hidden zero-width characters.</p>
              </div>
            )}
          </TabsContent>

          {/* DECODE */}
          <TabsContent value="decode" className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="stego-in">Stego Text</Label>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => decodeFileRef.current?.click()}>
                  <UploadSimpleIcon size={12} /> Upload .txt
                </Button>
                <input ref={decodeFileRef} type="file" accept=".txt" className="hidden" onChange={handleDecodeFile} />
              </div>
              <Textarea id="stego-in" placeholder="Paste stego text or upload a .txt file…" rows={6} value={stegoIn} onChange={(e) => setStegoIn(e.target.value)} />
            </div>

            {decodeError && <p className="text-sm text-destructive">{decodeError}</p>}

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
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => copyToClipboard(decoded)}>
                    <CopyIcon size={12} /> Copy
                  </Button>
                </div>
                <Textarea readOnly rows={4} value={decoded} className="font-mono text-sm" />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
