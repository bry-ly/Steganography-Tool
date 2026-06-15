"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";
import { ZWCharSelector } from "@/components/zw-char-selector";
import {
  encodeMessage,
  decodeMessage,
  prepareSecret,
  extractSecret,
  DEFAULT_SELECTED,
} from "@/lib/steganography";
import {
  encodeIntoImage,
  decodeFromImage,
  imageDataFromFile,
  imageDataToPngBlob,
  getImageCapacity,
} from "@/lib/image-steganography";
import {
  LockKeyIcon,
  LockKeyOpenIcon,
  CopyIcon,
  DownloadSimpleIcon,
  UploadSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  ImageIcon,
} from "@phosphor-icons/react";

function readFile(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsText(file);
  });
}

function downloadTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
  const [encodePassphrase, setEncodePassphrase] = useState("");
  const [showEncodePass, setShowEncodePass] = useState(false);
  const [encodingStats, setEncodingStats] = useState("");
  const [stegoIn, setStegoIn] = useState("");
  const [decoded, setDecoded] = useState("");
  const [decodeError, setDecodeError] = useState("");
  const [decodePassphrase, setDecodePassphrase] = useState("");
  const [showDecodePass, setShowDecodePass] = useState(false);
  const [selectedChars, setSelectedChars] = useState<string[]>(DEFAULT_SELECTED);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);
  const [imageSecret, setImageSecret] = useState("");
  const [imagePassphrase, setImagePassphrase] = useState("");
  const [showImagePass, setShowImagePass] = useState(false);
  const [imageBitsPerChannel, setImageBitsPerChannel] = useState<1 | 2>(1);
  const [imageMode, setImageMode] = useState<"encode" | "decode">("encode");
  const [imageEncodeError, setImageEncodeError] = useState("");
  const [imageDecodeResult, setImageDecodeResult] = useState("");
  const [imageDecodeError, setImageDecodeError] = useState("");

  const encodeFileRef = useRef<HTMLInputElement>(null);
  const decodeFileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);

  async function handleEncode() {
    setEncodeError("");
    setStegoOut("");
    setEncodingStats("");
    try {
      const result = await encodeMessage(coverText, secret, selectedChars, encodePassphrase || undefined);
      setStegoOut(result);
      const zwCount = (result.match(/[\u200B\u200C\u200D\u200E\u202A\u202C\u202D\u2062\u2063\uFEFF]/g) || []).length;
      const secretBytes = new TextEncoder().encode(secret).length;
      const coverWords = coverText.trim().split(/\s+/).length;
      setEncodingStats(`Hidden ${secretBytes} bytes (${zwCount} ZW chars) in ${coverWords}-word cover text.`);
      toast.success("Message encoded successfully");
    } catch (e) {
      setEncodeError((e as Error).message);
    }
  }

  async function handleDecode() {
    setDecodeError("");
    setDecoded("");
    try {
      const result = await decodeMessage(stegoIn, selectedChars, decodePassphrase || undefined);
      setDecoded(result);
      toast.success("Message decoded successfully");
    } catch (e) {
      setDecodeError((e as Error).message);
    }
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setImageDecodeResult("");
    setImageDecodeError("");
    setImageEncodeError("");
    setImageDims(null);
    const img = new Image();
    img.onload = () => setImageDims({ w: img.width, h: img.height });
    img.src = URL.createObjectURL(file);
    e.target.value = "";
  }

  function handleImageRemove() {
    setImageFile(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl("");
    setImageDims(null);
    setImageSecret("");
    setImagePassphrase("");
    setImageEncodeError("");
    setImageDecodeError("");
    setImageDecodeResult("");
  }

  async function handleImageEncode() {
    if (!imageFile) { setImageEncodeError("Select an image first."); return; }
    if (!imageSecret) { setImageEncodeError("Enter a secret message."); return; }
    setImageEncodeError("");
    setImageDecodeResult("");

    try {
      const imageData = await imageDataFromFile(imageFile);
      const prep = await prepareSecret(imageSecret, imagePassphrase || undefined);
      const encoded = encodeIntoImage(imageData, prep, imageBitsPerChannel);
      const blob = await imageDataToPngBlob(encoded);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = imageFile.name.replace(/\.[^.]+$/, "") + "-stego.png";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Image encoded and downloaded");
    } catch (e) {
      setImageEncodeError((e as Error).message);
    }
  }

  async function handleImageDecode() {
    if (!imageFile) { setImageDecodeError("Select an image first."); return; }
    setImageDecodeError("");
    setImageDecodeResult("");
    setImageEncodeError("");

    try {
      const imageData = await imageDataFromFile(imageFile);
      const decoded = decodeFromImage(imageData, imageBitsPerChannel);
      const secret = await extractSecret(decoded, imagePassphrase || undefined);
      setImageDecodeResult(secret);
      toast.success("Secret extracted from image");
    } catch (e) {
      setImageDecodeError((e as Error).message);
    }
  }

  async function handleEncodeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setCoverText(await readFile(file));
    e.target.value = "";
  }

  async function handleDecodeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setStegoIn(await readFile(file));
    e.target.value = "";
  }

  const wordCount = coverText.trim() ? coverText.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 pt-10 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <LockKeyIcon size={22} weight="duotone" />
            <h1 className="text-xl font-semibold tracking-tight">Steganography Tool</h1>
          </div>
          <ThemeToggle />
        </div>
        <p className="text-sm text-muted-foreground">
          Hide secret messages inside plain text or images using steganography.
        </p>
      </header>

      <Separator className="max-w-2xl mx-auto w-full" />

      <main className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full space-y-6">
        <Tabs defaultValue="encode-text" onValueChange={() => { setEncodeError(""); setDecodeError(""); }}>
          <TabsList className="mb-6 mx-auto">
            <TabsTrigger value="encode-text" className="gap-1.5">
              <LockKeyIcon size={14} /> Encode
            </TabsTrigger>
            <TabsTrigger value="decode-text" className="gap-1.5">
              <LockKeyOpenIcon size={14} /> Decode
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-1.5">
              <ImageIcon size={14} /> Image Stego
            </TabsTrigger>
          </TabsList>

          <TabsContent value="encode-text" className="space-y-4">
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

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="encode-passphrase">Passphrase (optional)</Label>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowEncodePass(!showEncodePass)}>
                  {showEncodePass ? <EyeSlashIcon size={14} /> : <EyeIcon size={14} />}
                </Button>
              </div>
              <input
                id="encode-passphrase"
                type={showEncodePass ? "text" : "password"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Encrypt the secret with a passphrase"
                value={encodePassphrase}
                onChange={(e) => setEncodePassphrase(e.target.value)}
              />
            </div>

            <ZWCharSelector selectedChars={selectedChars} onChange={setSelectedChars} />

            <Separator />

            {encodeError && <p className="text-sm text-destructive">{encodeError}</p>}

            <Button onClick={handleEncode} disabled={selectedChars.length < 3} className="gap-1.5 w-full">
              <LockKeyIcon size={14} /> Encode Message
            </Button>

            {encodingStats && (
              <p className="text-xs text-muted-foreground">{encodingStats}</p>
            )}

            {stegoOut && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Stego Text Output</Label>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => copyToClipboard(stegoOut)}>
                      <CopyIcon size={12} /> Copy
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => { downloadTxt(stegoOut, "stego-output.txt"); toast.success("File downloaded"); }}>
                      <DownloadSimpleIcon size={12} /> Download
                    </Button>
                  </div>
                </div>
                <Textarea readOnly rows={5} value={stegoOut} className="font-mono text-sm" />
                <p className="text-xs text-muted-foreground">Looks identical to the cover text but contains hidden zero-width characters.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="decode-text" className="space-y-4">
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

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="decode-passphrase">Passphrase (if encrypted)</Label>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowDecodePass(!showDecodePass)}>
                  {showDecodePass ? <EyeSlashIcon size={14} /> : <EyeIcon size={14} />}
                </Button>
              </div>
              <input
                id="decode-passphrase"
                type={showDecodePass ? "text" : "password"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Enter passphrase if the message was encrypted"
                value={decodePassphrase}
                onChange={(e) => setDecodePassphrase(e.target.value)}
              />
            </div>

            <ZWCharSelector selectedChars={selectedChars} onChange={setSelectedChars} />

            <Separator />

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

          <TabsContent value="image" className="space-y-4">
            <div className="space-y-1.5">
              <Label>Mode</Label>
              <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
                <button
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${imageMode === "encode" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => { setImageMode("encode"); setImageEncodeError(""); setImageDecodeError(""); setImageDecodeResult(""); }}
                >
                  Encode into Image
                </button>
                <button
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${imageMode === "decode" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => { setImageMode("decode"); handleImageRemove(); }}
                >
                  Decode from Image
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="image-file">Image</Label>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => imageFileRef.current?.click()}>
                    <UploadSimpleIcon size={12} /> Upload Image
                  </Button>
                  {imageFile && (
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-destructive hover:text-destructive" onClick={handleImageRemove}>
                      Remove
                    </Button>
                  )}
                </div>
                <input ref={imageFileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleImageFile} />
              </div>
              {imagePreviewUrl && (
                <div className="border rounded-lg overflow-hidden">
                  <img src={imagePreviewUrl} alt="Stego image preview" className="max-h-48 object-contain mx-auto" />
                </div>
              )}
              {imageFile && (
                <p className="text-xs text-muted-foreground">
                  {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                  {imageMode === "encode" && imageDims && (
                    <> — capacity: ~{getImageCapacity(imageDims.w, imageDims.h, imageBitsPerChannel).maxBytes} bytes (at {imageBitsPerChannel} bpc)</>
                  )}
                </p>
              )}
            </div>

            {imageMode === "encode" && (
              <>
                <div className="space-y-1.5">
                  <Label>Bits per channel</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="bpc" checked={imageBitsPerChannel === 1} onChange={() => setImageBitsPerChannel(1)} className="accent-primary" />
                      <span className="text-sm">1 bit (higher quality)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="bpc" checked={imageBitsPerChannel === 2} onChange={() => setImageBitsPerChannel(2)} className="accent-primary" />
                      <span className="text-sm">2 bits (more capacity)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="image-secret">Secret Message</Label>
                  <Textarea id="image-secret" placeholder="Type the message to hide in the image…" rows={3} value={imageSecret} onChange={(e) => setImageSecret(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="image-passphrase">Passphrase (optional)</Label>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowImagePass(!showImagePass)}>
                      {showImagePass ? <EyeSlashIcon size={14} /> : <EyeIcon size={14} />}
                    </Button>
                  </div>
                  <input
                    id="image-passphrase"
                    type={showImagePass ? "text" : "password"}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Encrypt with a passphrase"
                    value={imagePassphrase}
                    onChange={(e) => setImagePassphrase(e.target.value)}
                  />
                </div>

                {imageEncodeError && <p className="text-sm text-destructive">{imageEncodeError}</p>}

                <Button onClick={handleImageEncode} disabled={!imageFile} className="gap-1.5 w-full">
                  <DownloadSimpleIcon size={14} /> Encode & Download PNG
                </Button>
              </>
            )}

            {imageMode === "decode" && (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="image-decode-passphrase">Passphrase (if encrypted)</Label>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowImagePass(!showImagePass)}>
                      {showImagePass ? <EyeSlashIcon size={14} /> : <EyeIcon size={14} />}
                    </Button>
                  </div>
                  <input
                    id="image-decode-passphrase"
                    type={showImagePass ? "text" : "password"}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Enter passphrase if the image was encrypted"
                    value={imagePassphrase}
                    onChange={(e) => setImagePassphrase(e.target.value)}
                  />
                </div>

                {imageDecodeError && <p className="text-sm text-destructive">{imageDecodeError}</p>}

                <Button onClick={handleImageDecode} disabled={!imageFile} className="gap-1.5 w-full">
                  <LockKeyIcon size={14} /> Decode from Image
                </Button>

                {imageDecodeResult && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label>Extracted Message</Label>
                        <Badge variant="secondary">Found</Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => copyToClipboard(imageDecodeResult)}>
                        <CopyIcon size={12} /> Copy
                      </Button>
                    </div>
                    <Textarea readOnly rows={4} value={imageDecodeResult} className="font-mono text-sm" />
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
