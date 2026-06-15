# Steganography Tool Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the steganography tool with AES-GCM encryption, pako compression, image LSB steganography, dark mode, performance improvements, and comprehensive tests.

**Architecture:** New `lib/encryption.ts` (Web Crypto API), refactored `lib/steganography.ts` (error classes, typed arrays, compress+encrypt pipeline), new `lib/image-steganography.ts` (Canvas LSB), extracted UI components (ZWCharSelector, ThemeToggle), updated page.tsx with 3 tabs and passphrase support.

**Tech Stack:** Next.js 16 + React 19, Web Crypto API (AES-GCM + PBKDF2), pako (zlib), Canvas API, Vitest, next-themes

---

### Task 1: Install dependencies + Vitest config

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install dependencies**

Run:
```powershell
pnpm add pako
pnpm add -D vitest @vitejs/plugin-react @types/pako
```

Expected: packages installed, no errors.

- [ ] **Step 2: Create vitest.config.ts**

Create `vitest.config.ts` at project root:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add test scripts to package.json**

Edit `package.json` — add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create tests directory**

Run:
```powershell
New-Item -ItemType Directory -Path "tests" -Force
```

- [ ] **Step 5: Verify Vitest works**

Run:
```powershell
pnpm vitest run
```
Expected: "No test files found" (no tests exist yet) — exits cleanly, no config errors.

- [ ] **Step 6: Commit**

```bash
git add package.json vitest.config.ts tests/
git commit -m "chore: add vitest, pako deps and config"
```

---

### Task 2: lib/encryption.ts + tests

**Files:**
- Create: `lib/encryption.ts`
- Create: `tests/encryption.test.ts`

- [ ] **Step 1: Write lib/encryption.ts**

```typescript
export class EncryptionError extends Error {
  constructor(message?: string) {
    super(message ?? "Decryption failed. Wrong passphrase or corrupted data.");
    this.name = "EncryptionError";
  }
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptMessage(plaintext: Uint8Array, passphrase: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);
  return result;
}

export async function decryptMessage(ciphertext: Uint8Array, passphrase: string): Promise<Uint8Array> {
  if (ciphertext.length < 28) throw new EncryptionError("Ciphertext too short.");
  const salt = ciphertext.slice(0, 16);
  const iv = ciphertext.slice(16, 28);
  const data = ciphertext.slice(28);
  const key = await deriveKey(passphrase, salt);
  try {
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new Uint8Array(decrypted);
  } catch {
    throw new EncryptionError();
  }
}
```

- [ ] **Step 2: Write tests/encryption.test.ts**

```typescript
import { describe, it, expect } from "vitest";
import { encryptMessage, decryptMessage, EncryptionError } from "@/lib/encryption";

describe("encryptMessage / decryptMessage", () => {
  const passphrase = "test-passphrase-123";

  it("encrypts and decrypts a simple message", async () => {
    const plaintext = new TextEncoder().encode("Hello, World!");
    const encrypted = await encryptMessage(plaintext, passphrase);
    expect(encrypted).toBeInstanceOf(Uint8Array);
    expect(encrypted.length).toBeGreaterThan(plaintext.length);

    const decrypted = await decryptMessage(encrypted, passphrase);
    expect(new TextDecoder().decode(decrypted)).toBe("Hello, World!");
  });

  it("produces different ciphertext each time (salt/IV changes)", async () => {
    const plaintext = new TextEncoder().encode("same message");
    const a = await encryptMessage(plaintext, passphrase);
    const b = await encryptMessage(plaintext, passphrase);
    expect(a).not.toEqual(b);
  });

  it("throws EncryptionError on wrong passphrase", async () => {
    const plaintext = new TextEncoder().encode("secret");
    const encrypted = await encryptMessage(plaintext, passphrase);
    await expect(decryptMessage(encrypted, "wrong-passphrase")).rejects.toThrow(EncryptionError);
  });

  it("throws EncryptionError on corrupted ciphertext", async () => {
    const plaintext = new TextEncoder().encode("secret");
    const encrypted = await encryptMessage(plaintext, passphrase);
    encrypted[28] ^= 0xFF; // corrupt one byte of ciphertext
    await expect(decryptMessage(encrypted, passphrase)).rejects.toThrow(EncryptionError);
  });

  it("handles empty passphrase", async () => {
    const plaintext = new TextEncoder().encode("data");
    const encrypted = await encryptMessage(plaintext, "");
    const decrypted = await decryptMessage(encrypted, "");
    expect(new TextDecoder().decode(decrypted)).toBe("data");
  });

  it("handles empty plaintext", async () => {
    const plaintext = new Uint8Array(0);
    const encrypted = await encryptMessage(plaintext, passphrase);
    const decrypted = await decryptMessage(encrypted, passphrase);
    expect(decrypted).toEqual(new Uint8Array(0));
  });

  it("round-trips binary data (random bytes)", async () => {
    const plaintext = crypto.getRandomValues(new Uint8Array(256));
    const encrypted = await encryptMessage(plaintext, passphrase);
    const decrypted = await decryptMessage(encrypted, passphrase);
    expect(decrypted).toEqual(plaintext);
  });

  it("handles long messages (10KB)", async () => {
    const plaintext = new Uint8Array(10_000).fill(0x41); // 'A' * 10000
    const encrypted = await encryptMessage(plaintext, passphrase);
    const decrypted = await decryptMessage(encrypted, passphrase);
    expect(decrypted).toEqual(plaintext);
  });

  it("throws on truncated ciphertext", async () => {
    const plaintext = new TextEncoder().encode("data");
    const encrypted = await encryptMessage(plaintext, passphrase);
    const truncated = encrypted.slice(0, 20);
    await expect(decryptMessage(truncated, passphrase)).rejects.toThrow(EncryptionError);
  });
});
```

- [ ] **Step 3: Run tests**

Run:
```powershell
pnpm vitest run tests/encryption.test.ts
```
Expected: all 9 tests pass.

- [ ] **Step 4: Commit**

```bash
git add lib/encryption.ts tests/encryption.test.ts
git commit -m "feat: add AES-GCM encryption module"
```

---

### Task 3: Full refactor of lib/steganography.ts

**Files:**
- Rewrite: `lib/steganography.ts`
- Create: `tests/steganography.test.ts`

- [ ] **Step 1: Write the refactored lib/steganography.ts**

```typescript
import { encryptMessage, decryptMessage, EncryptionError } from "@/lib/encryption";
import pako from "pako";

// ── Error classes ─────────────────────────────────────────

export class SteganographyError extends Error {
  name = "SteganographyError";
}
export class EncodeError extends SteganographyError {
  name = "EncodeError";
}
export class DecodeError extends SteganographyError {
  name = "DecodeError";
}

// ── Zero-width character definitions ──────────────────────

export const ZW_CHARS = [
  { code: "\u200B", label: "U+200B ZERO WIDTH SPACE" },
  { code: "\u200C", label: "U+200C ZERO WIDTH NON-JOINER" },
  { code: "\u200D", label: "U+200D ZERO WIDTH JOINER" },
  { code: "\u200E", label: "U+200E LEFT-TO-RIGHT MARK" },
  { code: "\u202A", label: "U+202A LEFT-TO-RIGHT EMBEDDING" },
  { code: "\u202C", label: "U+202C POP DIRECTIONAL FORMATTING" },
  { code: "\u202D", label: "U+202D LEFT-TO-RIGHT OVERRIDE" },
  { code: "\u2062", label: "U+2062 INVISIBLE TIMES" },
  { code: "\u2063", label: "U+2063 INVISIBLE SEPARATOR" },
  { code: "\uFEFF", label: "U+FEFF ZERO WIDTH NO-BREAK SPACE" },
] as const;

export const DEFAULT_SELECTED = ["\u200B", "\u200C", "\u200D"];

// ── Internal helpers ──────────────────────────────────────

function textToUint8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function uint8ToText(data: Uint8Array): string {
  return new TextDecoder().decode(data);
}

// Build a packed bit array (0/1 values) from UTF-8 bytes
function toBits(data: Uint8Array): Uint8Array {
  const bits = new Uint8Array(data.length * 8);
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < 8; j++) {
      bits[i * 8 + j] = (data[i] >> (7 - j)) & 1;
    }
  }
  return bits;
}

// Reconstruct bytes from a packed bit array
function fromBits(bits: Uint8Array): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }
  return new Uint8Array(bytes);
}

// ── Compression helpers ───────────────────────────────────

function packSecret(data: Uint8Array): Uint8Array {
  const compressed = pako.deflateRaw(data);
  const payload = compressed.length < data.length ? compressed : data;
  const flag = compressed.length < data.length ? 1 : 0;
  const result = new Uint8Array(1 + payload.length);
  result[0] = flag;
  result.set(payload, 1);
  return result;
}

function unpackSecret(packed: Uint8Array): Uint8Array {
  const flag = packed[0];
  const data = packed.slice(1);
  if (flag === 1) {
    return pako.inflateRaw(data);
  }
  return data;
}

// ── Shared pipeline helpers ───────────────────────────────

export async function prepareSecret(
  secret: string | Uint8Array,
  passphrase?: string,
): Promise<Uint8Array> {
  const bytes = typeof secret === "string" ? textToUint8(secret) : secret;
  const packed = packSecret(bytes);
  if (passphrase) {
    return encryptMessage(packed, passphrase);
  }
  return packed;
}

export async function extractSecret(
  data: Uint8Array,
  passphrase?: string,
): Promise<string> {
  let bytes = data;
  if (passphrase) {
    try {
      bytes = await decryptMessage(bytes, passphrase);
    } catch (e) {
      if (e instanceof EncryptionError) throw e;
      throw new DecodeError("Failed to decrypt. Wrong passphrase?");
    }
  }
  const decompressed = unpackSecret(bytes);
  return uint8ToText(decompressed);
}

// ── Public API ────────────────────────────────────────────

export async function encodeMessage(
  coverText: string,
  secret: string | Uint8Array,
  chars = DEFAULT_SELECTED,
  passphrase?: string,
): Promise<string> {
  if (!coverText.trim()) throw new EncodeError("Cover text cannot be empty.");
  if (!secret || (typeof secret === "string" && !secret)) throw new EncodeError("Secret message cannot be empty.");
  if (chars.length < 3) throw new EncodeError("At least 3 zero-width characters must be selected.");

  const [ZW0, ZW1, ZWD] = chars;
  const payload = await prepareSecret(secret, passphrase);
  const bits = toBits(payload);

  let hidden = "";
  for (let i = 0; i < bits.length; i++) {
    hidden += bits[i] === 0 ? ZW0 : ZW1;
  }
  hidden += ZWD;

  const firstSpace = coverText.search(/\s/);
  if (firstSpace === -1) return coverText + hidden;
  return coverText.slice(0, firstSpace) + hidden + coverText.slice(firstSpace);
}

export async function decodeMessage(
  stegoText: string,
  chars = DEFAULT_SELECTED,
  passphrase?: string,
): Promise<string> {
  if (chars.length < 3) throw new DecodeError("At least 3 zero-width characters must be selected.");

  const [ZW0, ZW1, ZWD] = chars;
  const delimIdx = stegoText.indexOf(ZWD);
  if (delimIdx === -1) throw new DecodeError("No hidden message found.");

  const bits: number[] = [];
  for (const ch of stegoText.slice(0, delimIdx)) {
    if (ch === ZW0) bits.push(0);
    else if (ch === ZW1) bits.push(1);
  }

  if (bits.length === 0) throw new DecodeError("No hidden message found.");
  const data = fromBits(new Uint8Array(bits));
  return extractSecret(data, passphrase);
}
```

- [ ] **Step 2: Write tests/steganography.test.ts**

```typescript
import { describe, it, expect } from "vitest";
import {
  encodeMessage,
  decodeMessage,
  ZW_CHARS,
  DEFAULT_SELECTED,
  EncodeError,
  DecodeError,
  SteganographyError,
} from "@/lib/steganography";

describe("encodeMessage / decodeMessage", () => {
  const cover = "The quick brown fox jumps over the lazy dog.";

  it("round-trips a simple message", async () => {
    const enc = await encodeMessage(cover, "hello");
    expect(enc).not.toBe(cover);
    expect(enc.replace(/[\u200B\u200C\u200D\u200E\u202A\u202C\u202D\u2062\u2063\uFEFF]/g, "")).toBe(cover.replace(/[\u200B\u200C\u200D\u200E\u202A\u202C\u202D\u2062\u2063\uFEFF]/g, ""));
    const dec = await decodeMessage(enc);
    expect(dec).toBe("hello");
  });

  it("handles empty secret", async () => {
    await expect(encodeMessage(cover, "")).rejects.toThrow(EncodeError);
  });

  it("handles empty cover", async () => {
    await expect(encodeMessage("  ", "secret")).rejects.toThrow(EncodeError);
  });

  it("handles cover text with no whitespace", async () => {
    const enc = await encodeMessage("NoSpace", "hi");
    const dec = await decodeMessage(enc);
    expect(dec).toBe("hi");
  });

  it("uses custom ZW character mapping", async () => {
    const custom = ["\u200E", "\u202A", "\u202C"];
    const enc = await encodeMessage(cover, "test", custom);
    const dec = await decodeMessage(enc, custom);
    expect(dec).toBe("test");
  });

  it("rejects fewer than 3 chars", async () => {
    await expect(encodeMessage(cover, "x", ["\u200B", "\u200C"])).rejects.toThrow(EncodeError);
  });

  it("round-trips multi-byte characters", async () => {
    const secret = "Hello 世界 🎉";
    const enc = await encodeMessage(cover, secret);
    const dec = await decodeMessage(enc);
    expect(dec).toBe(secret);
  });

  it("round-trips a long message", async () => {
    const secret = "A".repeat(1000);
    const enc = await encodeMessage(cover, secret);
    const dec = await decodeMessage(enc);
    expect(dec).toBe(secret);
  });

  it("throws DecodeError when no hidden message", async () => {
    await expect(decodeMessage("just plain text")).rejects.toThrow(DecodeError);
  });
});

describe("encodeMessage with passphrase", () => {
  const cover = "Cover text for encrypted test.";

  it("round-trips with passphrase", async () => {
    const enc = await encodeMessage(cover, "secret data", DEFAULT_SELECTED, "mypass");
    const dec = await decodeMessage(enc, DEFAULT_SELECTED, "mypass");
    expect(dec).toBe("secret data");
  });

  it("throws DecodeError on wrong passphrase", async () => {
    const enc = await encodeMessage(cover, "secret", DEFAULT_SELECTED, "correct");
    await expect(decodeMessage(enc, DEFAULT_SELECTED, "wrong")).rejects.toThrow(SteganographyError);
  });

  it("round-trips without passphrase (backward compat)", async () => {
    const enc = await encodeMessage(cover, "no encryption");
    const dec = await decodeMessage(enc);
    expect(dec).toBe("no encryption");
  });
});
```

- [ ] **Step 3: Run tests**

Run:
```powershell
pnpm vitest run tests/steganography.test.ts
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add lib/steganography.ts tests/steganography.test.ts
git commit -m "feat: refactor steganography with compression, encryption, error classes"
```

---

### Task 4: lib/image-steganography.ts + tests

**Files:**
- Create: `lib/image-steganography.ts`
- Create: `tests/image-steganography.test.ts`

- [ ] **Step 1: Write lib/image-steganography.ts**

```typescript
import { encryptMessage, decryptMessage } from "@/lib/encryption";
import { prepareSecret, extractSecret } from "@/lib/steganography";

export class ImageSteganographyError extends Error {
  name = "ImageSteganographyError";
}

function writeBit(pixels: Uint8ClampedArray, bitIndex: number, bit: number, bpc: number): void {
  const pixelByte = Math.floor(bitIndex / (3 * bpc)) * 4;
  const channelOffset = Math.floor((bitIndex % (3 * bpc)) / bpc);
  const bitInChannel = (bitIndex % (3 * bpc)) % bpc;
  const byteIdx = pixelByte + channelOffset;
  const mask = 1 << (bpc - 1 - bitInChannel);
  if (bit) pixels[byteIdx] |= mask;
  else pixels[byteIdx] &= ~mask;
}

function readBit(pixels: Uint8ClampedArray, bitIndex: number, bpc: number): number {
  const pixelByte = Math.floor(bitIndex / (3 * bpc)) * 4;
  const channelOffset = Math.floor((bitIndex % (3 * bpc)) / bpc);
  const bitInChannel = (bitIndex % (3 * bpc)) % bpc;
  const byteIdx = pixelByte + channelOffset;
  return (pixels[byteIdx] >> (bpc - 1 - bitInChannel)) & 1;
}

export interface CapacityInfo {
  maxBytes: number;
  bitsPerChannel: 1 | 2;
  totalPixels: number;
}

export function getImageCapacity(width: number, height: number, bitsPerChannel: 1 | 2 = 1): CapacityInfo {
  const totalPixels = width * height;
  const totalBits = totalPixels * 3 * bitsPerChannel;
  const usableBits = totalBits - 32; // 32-bit length prefix
  return { maxBytes: Math.floor(usableBits / 8), bitsPerChannel, totalPixels };
}

export function encodeIntoImage(
  imageData: ImageData,
  data: Uint8Array,
  bitsPerChannel: 1 | 2 = 1,
): ImageData {
  const pixels = new Uint8ClampedArray(imageData.data);
  const { width, height } = imageData;
  const bpc = bitsPerChannel;
  const maxBits = width * height * 3 * bpc;
  const dataBits = data.length * 8;
  const totalBits = 32 + dataBits;

  if (totalBits > maxBits) {
    throw new ImageSteganographyError(
      `Data too large. Need ${totalBits} bits, but image holds ${maxBits} (${Math.floor(maxBits / 8)} bytes).`,
    );
  }

  let bitOffset = 0;

  for (let i = 0; i < 32; i++) {
    writeBit(pixels, bitOffset++, (dataBits >> i) & 1, bpc);
  }

  for (const byte of data) {
    for (let i = 7; i >= 0; i--) {
      writeBit(pixels, bitOffset++, (byte >> i) & 1, bpc);
    }
  }

  return new ImageData(pixels, width, height);
}

export function decodeFromImage(imageData: ImageData, bitsPerChannel: 1 | 2 = 1): Uint8Array {
  const { data: pixels, width, height } = imageData;
  const bpc = bitsPerChannel;

  let dataBits = 0;
  for (let i = 0; i < 32; i++) {
    const bit = readBit(pixels, i, bpc);
    dataBits |= bit << i;
  }

  if (dataBits === 0 || dataBits > (width * height * 3 * bpc - 32)) {
    throw new ImageSteganographyError("Invalid or missing hidden data.");
  }

  const bytes: number[] = [];
  let currentByte = 0;
  let bitsInByte = 0;

  for (let i = 0; i < dataBits; i++) {
    const bit = readBit(pixels, 32 + i, bpc);
    currentByte = (currentByte << 1) | bit;
    bitsInByte++;
    if (bitsInByte === 8) {
      bytes.push(currentByte);
      currentByte = 0;
      bitsInByte = 0;
    }
  }

  if (bitsInByte > 0) {
    currentByte <<= (8 - bitsInByte);
    bytes.push(currentByte);
  }

  return new Uint8Array(bytes);
}

export function imageDataFromFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.onerror = () => reject(new ImageSteganographyError("Failed to load image."));
    img.src = URL.createObjectURL(file);
  });
}

export function imageDataToPngBlob(imageData: ImageData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(imageData, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new ImageSteganographyError("Failed to encode PNG."));
    }, "image/png");
  });
}
```

- [ ] **Step 2: Write tests/image-steganography.test.ts**

```typescript
import { describe, it, expect } from "vitest";
import {
  encodeIntoImage,
  decodeFromImage,
  getImageCapacity,
  ImageSteganographyError,
} from "@/lib/image-steganography";

function createTestImage(width: number, height: number): ImageData {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i++) {
    pixels[i] = 128; // neutral gray
  }
  return new ImageData(pixels, width, height);
}

describe("getImageCapacity", () => {
  it("calculates capacity correctly", () => {
    const cap = getImageCapacity(100, 100, 1);
    // 100*100*3 = 30000 bits - 32 = 29968 / 8 = 3746 bytes
    expect(cap.maxBytes).toBe(3746);
    expect(cap.totalPixels).toBe(10000);
  });

  it("2 bpc doubles capacity", () => {
    const cap1 = getImageCapacity(10, 10, 1);
    const cap2 = getImageCapacity(10, 10, 2);
    expect(cap2.maxBytes).toBe(cap1.maxBytes * 2 + 4); // 2x + extra from 32-bit prefix
  });
});

describe("encodeIntoImage / decodeFromImage", () => {
  it("round-trips a simple message at 1 bpc", () => {
    const img = createTestImage(32, 32);
    const data = new TextEncoder().encode("Hello, Image!");
    const encoded = encodeIntoImage(img, data, 1);
    const decoded = decodeFromImage(encoded, 1);
    expect(new TextDecoder().decode(decoded)).toBe("Hello, Image!");
  });

  it("round-trips at 2 bpc", () => {
    const img = createTestImage(32, 32);
    const data = new TextEncoder().encode("2 bpc test");
    const encoded = encodeIntoImage(img, data, 2);
    const decoded = decodeFromImage(encoded, 2);
    expect(new TextDecoder().decode(decoded)).toBe("2 bpc test");
  });

  it("round-trips binary data", () => {
    const img = createTestImage(64, 64);
    const data = crypto.getRandomValues(new Uint8Array(128));
    const encoded = encodeIntoImage(img, data, 1);
    const decoded = decodeFromImage(encoded, 1);
    expect(decoded).toEqual(data);
  });

  it("throws on data that exceeds capacity", () => {
    const img = createTestImage(1, 1); // tiny image: 1*1*3 = 3 bits - 32 = -29 bits
    const data = new TextEncoder().encode("too much data");
    expect(() => encodeIntoImage(img, data, 1)).toThrow(ImageSteganographyError);
  });

  it("throws on image with no hidden data", () => {
    const img = createTestImage(32, 32);
    expect(() => decodeFromImage(img)).toThrow(ImageSteganographyError);
  });

  it("preserves non-modified pixels (covers all pixels)", () => {
    const img = createTestImage(16, 16);
    const data = new TextEncoder().encode("short");
    const before = new Uint8Array(img.data);
    const encoded = encodeIntoImage(img, data, 1);
    const after = encoded.data;
    // Only the LSB of the first N pixels should change
    expect(after.length).toBe(before.length);
    // Check that some pixels changed and some stayed the same
    let changed = 0;
    for (let i = 0; i < after.length; i++) {
      if (Math.abs(before[i] - after[i]) > 1) changed++;
    }
    // Should be minimal changes (only LSBs of RGB channels)
    expect(changed).toBeLessThan(50);
  });
});
```

- [ ] **Step 3: Run tests**

Run:
```powershell
pnpm vitest run tests/image-steganography.test.ts
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add lib/image-steganography.ts tests/image-steganography.test.ts
git commit -m "feat: add LSB image steganography"
```

---

### Task 5: Extract components/zw-char-selector.tsx

**Files:**
- Create: `components/zw-char-selector.tsx`
- (page.tsx import will be updated in Task 7)

- [ ] **Step 1: Write components/zw-char-selector.tsx**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add components/zw-char-selector.tsx
git commit -m "refactor: extract ZWCharSelector component"
```

---

### Task 6: components/theme-toggle.tsx + layout.tsx update

**Files:**
- Create: `components/theme-toggle.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write components/theme-toggle.tsx**

```tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SunIcon, MoonIcon } from "@phosphor-icons/react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // placeholder to avoid layout shift
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </Button>
  );
}
```

- [ ] **Step 2: Update app/layout.tsx**

Update `app/layout.tsx` to wrap with `<ThemeProvider>`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Steganography Tool",
  description: "Hide secret messages inside plain text or images using steganography.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", geistSans.variable, geistMono.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-mono">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/theme-toggle.tsx app/layout.tsx
git commit -m "feat: add dark mode toggle with next-themes"
```

---

### Task 7: Refactor app/page.tsx — 3 tabs, passphrase, stats, image stego UI

**Files:**
- Rewrite: `app/page.tsx`

- [ ] **Step 1: Write the updated app/page.tsx**

```tsx
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
  // Text encode state
  const [coverText, setCoverText] = useState("");
  const [secret, setSecret] = useState("");
  const [stegoOut, setStegoOut] = useState("");
  const [encodeError, setEncodeError] = useState("");
  const [encodePassphrase, setEncodePassphrase] = useState("");
  const [showEncodePass, setShowEncodePass] = useState(false);
  const [encodingStats, setEncodingStats] = useState("");

  // Text decode state
  const [stegoIn, setStegoIn] = useState("");
  const [decoded, setDecoded] = useState("");
  const [decodeError, setDecodeError] = useState("");
  const [decodePassphrase, setDecodePassphrase] = useState("");
  const [showDecodePass, setShowDecodePass] = useState(false);

  // Shared ZW char selection
  const [selectedChars, setSelectedChars] = useState<string[]>(DEFAULT_SELECTED);

  // Image stego state
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
  const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);

  // File refs
  const encodeFileRef = useRef<HTMLInputElement>(null);
  const decodeFileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);

  // ── Text Encode ──

  async function handleEncode() {
    setEncodeError("");
    setStegoOut("");
    setEncodingStats("");
    try {
      const result = await encodeMessage(coverText, secret, selectedChars, encodePassphrase || undefined);
      setStegoOut(result);
      // Stats
      const zwCount = (result.match(/[\u200B\u200C\u200D\u200E\u202A\u202C\u202D\u2062\u2063\uFEFF]/g) || []).length;
      const secretBytes = new TextEncoder().encode(secret).length;
      const coverWords = coverText.trim().split(/\s+/).length;
      setEncodingStats(`Hidden ${secretBytes} bytes (${zwCount} ZW chars) in ${coverWords}-word cover text.`);
      toast.success("Message encoded successfully");
    } catch (e) {
      setEncodeError((e as Error).message);
    }
  }

  // ── Text Decode ──

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

  // ── Image Stego ──

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setImageDecodeResult("");
    setImageDecodeError("");
    setImageEncodeError("");
    setProcessedImageData(null);
    setImageDims(null);
    // Get dimensions
    const img = new Image();
    img.onload = () => setImageDims({ w: img.width, h: img.height });
    img.src = URL.createObjectURL(file);
    e.target.value = "";
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
      setProcessedImageData(encoded);
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

  // ── Shared helpers ──

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
          <TabsList className="mb-6">
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

          {/* ── TEXT ENCODE ── */}
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

          {/* ── TEXT DECODE ── */}
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

          {/* ── IMAGE STEGO ── */}
          <TabsContent value="image" className="space-y-4">
            <div className="space-y-1.5">
              <Label>Mode</Label>
              <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
                <button
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${imageMode === "encode" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => { setImageMode("encode"); setImageEncodeError(""); setImageDecodeError(""); }}
                >
                  Encode into Image
                </button>
                <button
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${imageMode === "decode" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => { setImageMode("decode"); setImageEncodeError(""); setImageDecodeError(""); }}
                >
                  Decode from Image
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="image-file">Image</Label>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => imageFileRef.current?.click()}>
                  <UploadSimpleIcon size={12} /> Upload Image
                </Button>
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
```

- [ ] **Step 2: Verify the build compiles**

Run:
```powershell
pnpm build
```
Expected: Build succeeds (Next.js compiles without errors).

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add image stego tab, passphrase, stats, dark mode in UI"
```

---

### Task 8: Fixes + final verification

**Files:**
- Modify: `package.json`
- Modify: `lib/steganography.ts`

- [ ] **Step 1: Fix package.json typo**

In `package.json`, change `"name": "stegnography-tool"` to `"name": "steganography-tool"`:

```json
"name": "steganography-tool",
```

- [ ] **Step 2: Fix decodeMessage comment**

In `lib/steganography.ts`, find the comment:
```
// Extracts the hidden message from stego text. Tries all known zero-width chars as potential delimiters.
```
and change to:
```
// Extracts the hidden message from stego text using the provided ZW character mapping.
```

- [ ] **Step 3: Full test suite**

Run:
```powershell
pnpm test
```
Expected: All tests in `tests/` pass.

- [ ] **Step 4: Full build**

Run:
```powershell
pnpm build
```
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json lib/steganography.ts
git commit -m "chore: fix package name typo and decodeMessage comment"
```
