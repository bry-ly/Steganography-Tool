"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PassphraseInput } from "@/components/pass-phrase-input";
import { encodeIntoImage, decodeFromImage, imageDataFromFile, imageDataToPngBlob, getImageCapacity } from "@/lib/image-steganography";
import { prepareSecret, extractSecret } from "@/lib/steganography";
import { copyToClipboard, downloadBlob, withExtensionStripped } from "@/lib/file";
import { isLikelyLossySource } from "@/lib/image-source";
import { CopyIcon, DownloadSimpleIcon, LockKeyIcon, UploadSimpleIcon } from "@phosphor-icons/react";

export function ImageStegoTab() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [lossySource, setLossySource] = useState(false);
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [bitsPerChannel, setBitsPerChannel] = useState<1 | 2>(1);
  const [secret, setSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [iterations, setIterations] = useState(100_000);
  const [encodeError, setEncodeError] = useState("");
  const [decodeResult, setDecodeResult] = useState("");
  const [decodeError, setDecodeError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setLossySource(isLikelyLossySource(f));
    setPreviewUrl(URL.createObjectURL(f));
    setDecodeResult("");
    setDecodeError("");
    setEncodeError("");
    setDims(null);
    const img = new Image();
    img.onload = () => setDims({ w: img.width, h: img.height });
    img.src = URL.createObjectURL(f);
    e.target.value = "";
  }

  function handleRemove() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setDims(null);
    setLossySource(false);
    setSecret("");
    setPassphrase("");
    setEncodeError("");
    setDecodeError("");
    setDecodeResult("");
  }

  async function handleEncode() {
    if (!file) {
      setEncodeError("Select an image first.");
      return;
    }
    if (!secret) {
      setEncodeError("Enter a secret message.");
      return;
    }
    setEncodeError("");
    setDecodeResult("");

    try {
      const imageData = await imageDataFromFile(file);
      const { maxBytes } = getImageCapacity(imageData.width, imageData.height, bitsPerChannel);
      const prepared = await prepareSecret(secret, passphrase || undefined, passphrase ? { iterations } : {});
      if (prepared.length > maxBytes) {
        setEncodeError(`Secret is ${prepared.length} bytes but image holds ${maxBytes} bytes at ${bitsPerChannel} bpc. Try a larger image, 2 bpc, or a shorter message.`);
        return;
      }
      const encoded = encodeIntoImage(imageData, prepared, bitsPerChannel);
      const roundTripBytes = decodeFromImage(encoded, bitsPerChannel);
      const roundTripSecret = await extractSecret(roundTripBytes, passphrase || undefined);
      const verified = roundTripSecret === secret;
      const blob = await imageDataToPngBlob(encoded);
      downloadBlob(blob, `${withExtensionStripped(file.name)}-stego.png`);
      if (verified) {
        toast.success(`Image encoded and downloaded (self-test passed)`);
      } else {
        toast.error("Round-trip verification failed");
      }
    } catch (e) {
      setEncodeError((e as Error).message);
    }
  }

  async function handleDecode() {
    if (!file) {
      setDecodeError("Select an image first.");
      return;
    }
    setDecodeError("");
    setDecodeResult("");
    setEncodeError("");

    try {
      const imageData = await imageDataFromFile(file);
      const decoded = decodeFromImage(imageData, bitsPerChannel);
      const result = await extractSecret(decoded, passphrase || undefined);
      setDecodeResult(result);
      toast.success("Secret extracted from image");
    } catch (e) {
      setDecodeError((e as Error).message);
    }
  }

  const capacity = dims ? getImageCapacity(dims.w, dims.h, bitsPerChannel).maxBytes : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Mode</Label>
        <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
          <button
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${mode === "encode" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => {
              setMode("encode");
              setEncodeError("");
              setDecodeError("");
              setDecodeResult("");
            }}
          >
            Encode into Image
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${mode === "decode" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => {
              setMode("decode");
              handleRemove();
            }}
          >
            Decode from Image
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="image-file">Image</Label>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => fileRef.current?.click()}>
              <UploadSimpleIcon size={12} /> Upload Image
            </Button>
            {file && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-destructive hover:text-destructive" onClick={handleRemove}>
                Remove
              </Button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />
        </div>
        {previewUrl && (
          <div className="border rounded-lg overflow-hidden">
            <img src={previewUrl} alt="Stego image preview" className="max-h-48 object-contain mx-auto" />
          </div>
        )}
        {file && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
              {mode === "encode" && dims && (
                <>
                  {" "}
                  — capacity: ~{capacity} bytes (at {bitsPerChannel} bpc)
                </>
              )}
            </p>
            {lossySource && mode === "encode" && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Source is a lossy format (JPEG/WebP/HEIC/AVIF). LSBs are already noisy, but encoding still works — output is always PNG.</p>
            )}
          </div>
        )}
      </div>

      {mode === "encode" && (
        <>
          <div className="space-y-1.5">
            <Label>Bits per channel</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="bpc" checked={bitsPerChannel === 1} onChange={() => setBitsPerChannel(1)} className="accent-primary" />
                <span className="text-sm">1 bit (higher quality)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="bpc" checked={bitsPerChannel === 2} onChange={() => setBitsPerChannel(2)} className="accent-primary" />
                <span className="text-sm">2 bits (more capacity)</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="image-secret">Secret Message</Label>
            <Textarea id="image-secret" placeholder="Type the message to hide in the image…" rows={3} value={secret} onChange={(e) => setSecret(e.target.value)} />
          </div>

          <PassphraseInput
            id="image-passphrase"
            label="Passphrase (optional)"
            value={passphrase}
            onChange={setPassphrase}
            placeholder="Encrypt with a passphrase"
            iterations={iterations}
            onIterationsChange={setIterations}
            showSecurityLevel
          />

          {encodeError && <p className="text-sm text-destructive">{encodeError}</p>}

          <Button onClick={handleEncode} disabled={!file} className="gap-1.5 w-full">
            <DownloadSimpleIcon size={14} /> Encode & Download PNG
          </Button>
        </>
      )}

      {mode === "decode" && (
        <>
          <PassphraseInput id="image-decode-passphrase" label="Passphrase (if encrypted)" value={passphrase} onChange={setPassphrase} placeholder="Enter passphrase if the image was encrypted" />

          {decodeError && <p className="text-sm text-destructive">{decodeError}</p>}

          <Button onClick={handleDecode} disabled={!file} className="gap-1.5 w-full">
            <LockKeyIcon size={14} /> Decode from Image
          </Button>

          {decodeResult && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Extracted Message</Label>
                  <Badge variant="secondary">Found</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={async () => {
                    const r = await copyToClipboard(decodeResult);
                    toast[r.ok ? "success" : "error"](r.message);
                  }}
                >
                  <CopyIcon size={12} /> Copy
                </Button>
              </div>
              <Textarea readOnly rows={4} value={decodeResult} className="font-mono text-sm" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
