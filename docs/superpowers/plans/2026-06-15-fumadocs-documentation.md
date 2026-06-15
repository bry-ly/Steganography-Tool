# Fumadocs Documentation Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Fumadocs-powered documentation site to the steganography tool, providing comprehensive guides for text steganography, image steganography, encryption, and API reference.

**Architecture:** Fumadocs integrates into the existing Next.js 16 App Router project. Documentation content lives in `content/docs/` as MDX files. The docs route (`/docs`) runs alongside the main app (`/`), sharing the same Next.js instance.

**Tech Stack:** Fumadocs (fumadocs-mdx + fumadocs-core), MDX, Next.js 16 App Router

---

### Task 1: Install dependencies + configure MDX

**Files:**
- Modify: `package.json`
- Modify: `next.config.ts`
- Create: `source.config.ts`

- [ ] **Step 1: Install Fumadocs packages**

Run:
```powershell
pnpm add fumadocs-mdx fumadocs-core @types/mdx
```

- [ ] **Step 2: Update next.config.ts**

Replace the empty config in `next.config.ts`:

```typescript
import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const config = {};

const withMDX = createMDX();

export default withMDX(config);
```

- [ ] **Step 3: Create source.config.ts**

Create `source.config.ts` at project root:

```typescript
import { defineDocs, defineConfig } from "fumadocs-mdx/config";

export const docs = defineDocs({
  dir: "content/docs",
});

export default defineConfig();
```

- [ ] **Step 4: Commit**

```bash
git add package.json next.config.ts source.config.ts pnpm-lock.yaml
git commit -m "feat: add fumadocs-mdx configuration"
```

---

### Task 2: Create source loader + layout shared config

**Files:**
- Create: `lib/source.ts`
- Create: `lib/layout.shared.tsx`

- [ ] **Step 1: Create lib/source.ts**

```typescript
import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});
```

- [ ] **Step 2: Create lib/layout.shared.tsx**

```typescript
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Steganography Tool",
    },
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/source.ts lib/layout.shared.tsx
git commit -m "feat: add fumadocs source loader and layout config"
```

---

### Task 3: Create docs layout route

**Files:**
- Create: `app/docs/layout.tsx`

- [ ] **Step 1: Create app/docs/layout.tsx**

```typescript
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      {...baseOptions()}
      tree={source.getPageTree()}
    >
      {children}
    </DocsLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/docs/layout.tsx
git commit -m "feat: add docs layout with sidebar navigation"
```

---

### Task 4: Create docs catch-all route

**Files:**
- Create: `app/docs/[[...slug]]/page.tsx`

- [ ] **Step 1: Create app/docs/[[...slug]]/page.tsx**

```typescript
import { source } from "@/lib/source";
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import defaultMdxComponents from "fumadocs-ui/mdx";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents }} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  return {
    title: page.data.title,
    description: page.data.description,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/docs/[[...slug]]/page.tsx"
git commit -m "feat: add docs catch-all route with MDX rendering"
```

---

### Task 5: Create docs content — meta.json + index page

**Files:**
- Create: `content/docs/meta.json`
- Create: `content/docs/index.mdx`
- Create: `content/docs/getting-started.mdx`
- Create: `content/docs/text-steganography.mdx`
- Create: `content/docs/image-steganography.mdx`
- Create: `content/docs/encryption.mdx`
- Create: `content/docs/api-reference.mdx`

- [ ] **Step 1: Create content/docs/meta.json**

```json
{
  "pages": ["index", "getting-started", "text-steganography", "image-steganography", "encryption", "api-reference"]
}
```

- [ ] **Step 2: Create content/docs/index.mdx**

```mdx
---
title: Steganography Tool
description: Hide secret messages inside plain text or images using steganography.
---

## Overview

The Steganography Tool is a client-side web application that lets you hide secret messages inside plain text or images using steganography techniques.

### Features

- **Text Steganography** — Hide messages using zero-width Unicode characters that are invisible to human readers
- **Image Steganography** — Embed messages in the least significant bits of image pixels (LSB)
- **AES-256-GCM Encryption** — Optionally encrypt messages with a passphrase before hiding
- **Zlib Compression** — Automatically compresses payloads to minimize hidden data size
- **Dark Mode** — Full light/dark theme support
- **No Server Required** — Everything runs in the browser using the Web Crypto API

### Quick Links

- [Getting Started](/docs/getting-started)
- [Text Steganography](/docs/text-steganography)
- [Image Steganography](/docs/image-steganography)
- [Encryption](/docs/encryption)
- [API Reference](/docs/api-reference)
```

- [ ] **Step 3: Create content/docs/getting-started.mdx**

```mdx
---
title: Getting Started
description: Install and run the Steganography Tool locally.
---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [pnpm](https://pnpm.io/) (recommended) or npm

## Installation

```bash
git clone https://github.com/your-username/steganography-tool.git
cd steganography-tool
pnpm install
```

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

```bash
pnpm build
pnpm start
```

## Testing

```bash
pnpm test
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with ThemeProvider
│   ├── page.tsx            # Main UI (Encode, Decode, Image Stego tabs)
│   └── docs/               # Documentation pages (Fumadocs)
├── components/             # React components
│   ├── theme-toggle.tsx    # Dark/light mode toggle
│   ├── zw-char-selector.tsx # Zero-width character selector
│   └── ui/                 # shadcn/ui components
├── lib/                    # Core libraries
│   ├── encryption.ts       # AES-256-GCM + PBKDF2 encryption
│   ├── steganography.ts    # Zero-width character steganography engine
│   ├── image-steganography.ts # LSB image steganography
│   └── utils.ts            # Utility functions
├── tests/                  # Vitest test files
├── content/docs/           # Documentation MDX files
└── source.config.ts        # Fumadocs MDX configuration
```
```

- [ ] **Step 4: Create content/docs/text-steganography.mdx**

```mdx
---
title: Text Steganography
description: Hide messages using zero-width Unicode characters.
---

## How It Works

Text steganography hides secret messages inside visible cover text using **zero-width Unicode characters**. These characters are invisible to humans but can be detected and decoded programmatically.

### The Algorithm

1. **Convert** the secret message from UTF-8 text to binary (each byte becomes 8 bits)
2. **Map** each bit to a zero-width character:
   - Bit `0` → First selected character (e.g., U+200B ZERO WIDTH SPACE)
   - Bit `1` → Second selected character (e.g., U+200C ZERO WIDTH NON-JOINER)
3. **Append** a delimiter character (e.g., U+200D ZERO WIDTH JOINER)
4. **Insert** the hidden sequence after the first word in the cover text

### Processing Pipeline

When a passphrase is provided, the data goes through:

```
Secret Text → Compress (pako) → Encrypt (AES-256-GCM) → Bit-map → ZW Characters
```

Without a passphrase:

```
Secret Text → Compress (pako) → Bit-map → ZW Characters
```

### Available Zero-Width Characters

| Character | Code | Name |
|-----------|------|------|
| `​` | U+200B | Zero Width Space |
| `‌` | U+200C | Zero Width Non-Joiner |
| `‍` | U+200D | Zero Width Joiner |
| `‎` | U+200E | Left-to-Right Mark |
| `‪` | U+202A | Left-to-Right Embedding |
| `‬` | U+202C | Pop Directional Formatting |
| `‭` | U+202D | Left-to-Right Override |
| `⁢` | U+2062 | Invisible Times |
| `⁣` | U+2063 | Invisible Separator |
| `﻿` | U+FEFF | Zero Width No-Break Space |

Select any 3 or more characters. The first three are assigned roles:
1. **Bit 0** — Represents binary `0`
2. **Bit 1** — Represents binary `1`
3. **Delimiter** — Marks the end of the hidden message

### Capacity

Each character of the secret requires **8 zero-width characters** (one per bit), plus 1 delimiter.

- 100-character secret → 801 ZW characters
- 1,000-character secret → 8,001 ZW characters

The cover text must be long enough to accommodate the hidden data.

### Usage

**Encoding:**

1. Go to the **Encode** tab
2. Paste or upload cover text
3. Type your secret message
4. Optionally enter a passphrase for encryption
5. Click **Encode Message**
6. Copy or download the stego text

**Decoding:**

1. Go to the **Decode** tab
2. Paste or upload the stego text
3. Enter the passphrase (if encrypted)
4. Click **Decode Message**
```

- [ ] **Step 5: Create content/docs/image-steganography.mdx**

```mdx
---
title: Image Steganography
description: Hide messages in image pixels using LSB steganography.
---

## How It Works

Image steganography hides secret messages by modifying the **least significant bits (LSB)** of pixel color channels. This produces visually identical images with hidden data embedded in the pixel values.

### The Algorithm

1. **Read** the image pixel data (RGBA channels, skipping alpha)
2. **Convert** the secret payload to bits
3. **Prepend** a 32-bit length header (little-endian) so the decoder knows exactly how many bits to extract
4. **Embed** each bit into the LSB of successive R, G, B channels
5. **Output** the modified image as a PNG file

### Bits Per Channel (bpc)

| Mode | Capacity (1024×1024) | Visual Impact |
|------|---------------------|---------------|
| 1 bpc | ~393,000 bytes | Imperceptible |
| 2 bpc | ~786,000 bytes | Slight noise on close inspection |

- **1 bpc** — Uses only the least significant bit of each channel. Higher quality, lower capacity.
- **2 bpc** — Uses the two least significant bits. More capacity, slight visual degradation possible.

### Capacity Formula

```
maxBytes = floor((width × height × 3 × bpc - 32) / 8)
```

The `-32` accounts for the 32-bit length header.

### Processing Pipeline

When a passphrase is provided:

```
Secret Text → Compress → Encrypt → LSB Encode → PNG Export
```

Without a passphrase:

```
Secret Text → Compress → LSB Encode → PNG Export
```

### Supported Formats

- **Input:** PNG, JPEG
- **Output:** Always PNG (lossless, preserves hidden data)

### Usage

**Encoding:**

1. Go to the **Image Stego** tab
2. Select **Encode into Image**
3. Upload a PNG or JPEG image
4. Select bits per channel (1 or 2)
5. Type your secret message
6. Optionally enter a passphrase
7. Click **Encode & Download PNG**
8. The encoded image downloads automatically

**Decoding:**

1. Go to the **Image Stego** tab
2. Select **Decode from Image**
3. Upload the stego image
4. Enter the passphrase (if encrypted)
5. Click **Decode from Image**
6. The extracted message appears
```

- [ ] **Step 6: Create content/docs/encryption.mdx**

```mdx
---
title: Encryption
description: AES-256-GCM encryption for secure steganography.
---

## Overview

The Steganography Tool includes optional **AES-256-GCM encryption** to protect your hidden messages. Even if someone discovers the steganographic content, they cannot read it without the correct passphrase.

### How It Works

1. **Key Derivation** — Your passphrase is converted to an AES-256 key using PBKDF2 with SHA-256 and 100,000 iterations
2. **Random Salt** — A 16-byte random salt is generated for each encryption
3. **Random IV** — A 12-byte random initialization vector is generated
4. **Encryption** — The payload is encrypted using AES-256-GCM (authenticated encryption)
5. **Output Format** — `[salt(16B)][iv(12B)][ciphertext + auth tag]`

### Security Properties

| Property | Value |
|----------|-------|
| Algorithm | AES-256-GCM |
| Key Derivation | PBKDF2-SHA256 |
| Iterations | 100,000 |
| Salt Size | 16 bytes |
| IV Size | 12 bytes |
| Auth Tag | 16 bytes (GCM) |

### Authenticated Encryption

AES-GCM provides both **confidentiality** (encryption) and **integrity** (authentication). If the ciphertext is tampered with or the wrong passphrase is used, decryption fails with an error rather than producing garbage output.

### Usage

1. When encoding, enter a passphrase in the **Passphrase** field
2. When decoding, enter the same passphrase to decrypt
3. If the wrong passphrase is used, you'll see: *"Decryption failed. Wrong passphrase or corrupted data."*

### Technical Details

```typescript
// Key derivation
const keyMaterial = await crypto.subtle.importKey(
  "raw",
  encoder.encode(passphrase),
  "PBKDF2",
  false,
  ["deriveKey"],
);

const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
  keyMaterial,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt", "decrypt"],
);

// Encryption
const encrypted = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  key,
  plaintext,
);
```
```

- [ ] **Step 7: Create content/docs/api-reference.mdx**

```mdx
---
title: API Reference
description: Library APIs for encryption, steganography, and image steganography.
---

## lib/encryption.ts

### `encryptMessage(plaintext, passphrase)`

Encrypts a Uint8Array payload using AES-256-GCM.

**Parameters:**
- `plaintext: Uint8Array` — The data to encrypt
- `passphrase: string` — The passphrase for key derivation

**Returns:** `Promise<Uint8Array>` — Encrypted data with salt, IV, and auth tag prepended

**Throws:** Never throws on valid input

### `decryptMessage(ciphertext, passphrase)`

Decrypts data encrypted with `encryptMessage`.

**Parameters:**
- `ciphertext: Uint8Array` — The encrypted data
- `passphrase: string` — The passphrase for key derivation

**Returns:** `Promise<Uint8Array>` — Decrypted plaintext

**Throws:** `EncryptionError` if decryption fails (wrong passphrase, corrupted data, or truncated ciphertext)

---

## lib/steganography.ts

### `encodeMessage(coverText, secret, chars?, passphrase?)`

Hides a secret message inside cover text using zero-width characters.

**Parameters:**
- `coverText: string` — The visible text to hide data in
- `secret: string | Uint8Array` — The message to hide
- `chars: string[]` — (Optional) Zero-width characters to use (default: `["\u200B", "\u200C", "\u200D"]`)
- `passphrase: string` — (Optional) Passphrase for encryption

**Returns:** `Promise<string>` — The stego text with hidden data

**Throws:** `EncodeError` if cover text is empty, secret is empty, or fewer than 3 chars selected

### `decodeMessage(stegoText, chars?, passphrase?)`

Extracts a hidden message from stego text.

**Parameters:**
- `stegoText: string` — The text containing hidden data
- `chars: string[]` — (Optional) Zero-width characters used (must match encoding)
- `passphrase: string` — (Optional) Passphrase for decryption

**Returns:** `Promise<string>` — The extracted secret message

**Throws:** `DecodeError` if no hidden message found, or `SteganographyError` if decryption fails

### `prepareSecret(secret, passphrase?)`

Compresses and optionally encrypts a secret payload.

**Parameters:**
- `secret: string | Uint8Array` — The data to prepare
- `passphrase: string` — (Optional) Passphrase for encryption

**Returns:** `Promise<Uint8Array>` — The prepared payload

### `extractSecret(data, passphrase?)`

Decompresses and optionally decrypts a secret payload.

**Parameters:**
- `data: Uint8Array` — The payload to extract
- `passphrase: string` — (Optional) Passphrase for decryption

**Returns:** `Promise<string>` — The extracted text

### Error Classes

| Class | Extends | Usage |
|-------|---------|-------|
| `SteganographyError` | `Error` | Base class for all steganography errors |
| `EncodeError` | `SteganographyError` | Encoding failures (empty inputs, insufficient chars) |
| `DecodeError` | `SteganographyError` | Decoding failures (no hidden message, wrong passphrase) |

### Constants

- `ZW_CHARS` — Array of 10 zero-width character objects `{ code, label }`
- `DEFAULT_SELECTED` — Default 3-character array `["\u200B", "\u200C", "\u200D"]`

---

## lib/image-steganography.ts

### `encodeIntoImage(imageData, data, bitsPerChannel?)`

Embeds data into image pixels using LSB steganography.

**Parameters:**
- `imageData: ImageData` — The source image data
- `data: Uint8Array` — The payload to embed
- `bitsPerChannel: 1 | 2` — (Optional) Bits to use per channel (default: 1)

**Returns:** `ImageData` — Modified image data with hidden payload

**Throws:** `ImageSteganographyError` if data exceeds image capacity

### `decodeFromImage(imageData, bitsPerChannel?)`

Extracts hidden data from image pixels.

**Parameters:**
- `imageData: ImageData` — The image to extract from
- `bitsPerChannel: 1 | 2` — (Optional) Bits used per channel (default: 1)

**Returns:** `Uint8Array` — The extracted payload

**Throws:** `ImageSteganographyError` if no valid hidden data found

### `getImageCapacity(width, height, bitsPerChannel?)`

Calculates the maximum payload size for an image.

**Parameters:**
- `width: number` — Image width in pixels
- `height: number` — Image height in pixels
- `bitsPerChannel: 1 | 2` — (Optional) Bits per channel (default: 1)

**Returns:** `CapacityInfo` — `{ maxBytes, bitsPerChannel, totalPixels }`

### `imageDataFromFile(file)`

Loads an image file as ImageData using Canvas API.

**Parameters:**
- `file: File` — The image file to load

**Returns:** `Promise<ImageData>`

**Throws:** `ImageSteganographyError` if image fails to load

### `imageDataToPngBlob(imageData)`

Converts ImageData to a PNG Blob.

**Parameters:**
- `imageData: ImageData` — The image data to convert

**Returns:** `Promise<Blob>` — PNG image blob

**Throws:** `ImageSteganographyError` if encoding fails
```

- [ ] **Step 8: Verify build**

Run:
```powershell
pnpm build
```

Expected: Build succeeds with docs pages generated at `/docs/*`.

- [ ] **Step 9: Commit**

```bash
git add content/
git commit -m "feat: add documentation pages (getting started, guides, API reference)"
```

---

### Task 6: Wire up docs link in main app header

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add docs link to header**

In `app/page.tsx`, add a "Docs" link next to the ThemeToggle in the header:

```tsx
import Link from "next/link";
```

Then update the header section:

```tsx
<header className="px-6 pt-10 pb-4 max-w-2xl mx-auto w-full">
  <div className="flex items-center justify-between mb-1">
    <div className="flex items-center gap-2">
      <LockKeyIcon size={22} weight="duotone" />
      <h1 className="text-xl font-semibold tracking-tight">Steganography Tool</h1>
    </div>
    <div className="flex items-center gap-2">
      <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        Docs
      </Link>
      <ThemeToggle />
    </div>
  </div>
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add docs link to main page header"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full test suite**

Run:
```powershell
pnpm test
```

Expected: All 29 tests pass.

- [ ] **Step 2: Run full build**

Run:
```powershell
pnpm build
```

Expected: Build succeeds. Check output for `/docs` routes.

- [ ] **Step 3: Manual verification**

Run:
```powershell
pnpm dev
```

Open browser and verify:
1. Main app at `http://localhost:3000` works as before
2. Docs at `http://localhost:3000/docs` loads with sidebar navigation
3. All 7 doc pages render correctly
4. Dark mode works on docs pages
5. Links between pages work

---

## Files Created/Modified Summary

| File | Action |
|------|--------|
| `package.json` | Modified (add fumadocs deps) |
| `next.config.ts` | Modified (add MDX plugin) |
| `source.config.ts` | Created |
| `lib/source.ts` | Created |
| `lib/layout.shared.tsx` | Created |
| `app/docs/layout.tsx` | Created |
| `app/docs/[[...slug]]/page.tsx` | Created |
| `content/docs/meta.json` | Created |
| `content/docs/index.mdx` | Created |
| `content/docs/getting-started.mdx` | Created |
| `content/docs/text-steganography.mdx` | Created |
| `content/docs/image-steganography.mdx` | Created |
| `content/docs/encryption.mdx` | Created |
| `content/docs/api-reference.mdx` | Created |
| `app/page.tsx` | Modified (add docs link) |
