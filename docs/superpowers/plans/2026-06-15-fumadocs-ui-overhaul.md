# Fumadocs UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace plain markdown docs with rich Fumadocs UI components (Tabs, Steps, Callouts, CodeBlock, Files, Cards) for a polished documentation experience.

**Architecture:** Register Fumadocs UI components in `components/mdx.tsx`, then rewrite each MDX content file to use them. Update `meta.json` for richer sidebar entries and enhance `layout.shared.tsx` with footer links.

**Tech Stack:** Fumadocs UI components (Tabs, Tab, CodeBlock, Pre, Steps, Step, Files, Folder, File, Callout, Card), MDX

---

### Task 1: Register Fumadocs UI components in mdx.tsx

**Files:**
- Modify: `components/mdx.tsx`

- [ ] **Step 1: Update components/mdx.tsx**

Replace the full file content:

```tsx
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Callout } from "fumadocs-ui/components/callout";
import { File, Folder, Files } from "fumadocs-ui/components/files";
import { Card } from "fumadocs-ui/components/card";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    pre: ({ ref: _ref, ...props }) => (
      <CodeBlock>
        <Pre {...props}>{props.children}</Pre>
      </CodeBlock>
    ),
    Tabs,
    Tab,
    Steps,
    Step,
    Callout,
    Files,
    Folder,
    File,
    Card,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
```

- [ ] **Step 2: Verify build**

Run:
```powershell
pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add components/mdx.tsx
git commit -m "feat: register Tabs, Steps, Callout, CodeBlock, Files, Card in MDX components"
```

---

### Task 2: Rewrite index.mdx — feature cards + link cards

**Files:**
- Modify: `content/docs/index.mdx`

- [ ] **Step 1: Rewrite content/docs/index.mdx**

Replace the full file content:

```mdx
---
title: Steganography Tool
description: Hide secret messages inside plain text or images using steganography.
---

The Steganography Tool is a client-side web application that lets you hide secret messages inside plain text or images using steganography techniques. Everything runs in the browser — no server required.

## Features

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
<Card icon={<span className="text-xl">🔒</span>} title="Text Steganography">
Hide messages using zero-width Unicode characters that are invisible to human readers.
</Card>
<Card icon={<span className="text-xl">🖼️</span>} title="Image Steganography">
Embed messages in the least significant bits of image pixels (LSB).
</Card>
<Card icon={<span className="text-xl">🔐</span>} title="AES-256-GCM Encryption">
Optionally encrypt messages with a passphrase before hiding.
</Card>
<Card icon={<span className="text-xl">📦</span>} title="Zlib Compression">
Automatically compresses payloads to minimize hidden data size.
</Card>
<Card icon={<span className="text-xl">🌙</span>} title="Dark Mode">
Full light/dark theme support with system preference detection.
</Card>
<Card icon={<span className="text-xl">🌐</span>} title="No Server Required">
Everything runs in the browser using the Web Crypto API.
</Card>
</div>

## Quick Links

- [Getting Started](/docs/getting-started) — Install and run the tool
- [Text Steganography](/docs/text-steganography) — How ZW-character encoding works
- [Image Steganography](/docs/image-steganography) — How LSB image encoding works
- [Encryption](/docs/encryption) — AES-256-GCM encryption details
- [API Reference](/docs/api-reference) — Full function signatures
```

- [ ] **Step 2: Verify build**

Run:
```powershell
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add content/docs/index.mdx
git commit -m "feat: add feature cards to docs index page"
```

---

### Task 3: Rewrite getting-started.mdx — Steps + Files components

**Files:**
- Modify: `content/docs/getting-started.mdx`

- [ ] **Step 1: Rewrite content/docs/getting-started.mdx**

Replace the full file content:

```mdx
---
title: Getting Started
description: Install and run the Steganography Tool locally.
---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [pnpm](https://pnpm.io/) (recommended) or npm

## Installation

<Steps>
<Step>
### Clone the repository

```bash
git clone https://github.com/your-username/steganography-tool.git
cd steganography-tool
```
</Step>
<Step>
### Install dependencies

```bash
pnpm install
```
</Step>
<Step>
### Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
</Step>
</Steps>

## Production Build

```bash
pnpm build
pnpm start
```

## Testing

```bash
pnpm test
```

To run tests in watch mode:

```bash
pnpm test:watch
```

## Project Structure

<Files>
  <Folder name="app" defaultOpen>
    <File name="layout.tsx" />
    <File name="page.tsx" />
    <Folder name="docs">
      <File name="layout.tsx" />
      <File name="[[...slug]]/page.tsx" />
    </Folder>
  </Folder>
  <Folder name="components">
    <File name="theme-toggle.tsx" />
    <File name="zw-char-selector.tsx" />
    <Folder name="ui" />
  </Folder>
  <Folder name="lib">
    <File name="encryption.ts" />
    <File name="steganography.ts" />
    <File name="image-steganography.ts" />
    <File name="utils.ts" />
  </Folder>
  <Folder name="content/docs">
    <File name="meta.json" />
    <File name="index.mdx" />
  </Folder>
</Files>
```

- [ ] **Step 2: Verify build**

Run:
```powershell
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add content/docs/getting-started.mdx
git commit -m "feat: add Steps and Files components to getting started guide"
```

---

### Task 4: Rewrite text-steganography.mdx — Callouts + Tabs

**Files:**
- Modify: `content/docs/text-steganography.mdx`

- [ ] **Step 1: Rewrite content/docs/text-steganography.mdx**

Replace the full file content:

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

<Tabs items={["With Passphrase", "Without Passphrase"]}>
<Tab>
Secret Text → Compress (pako) → Encrypt (AES-256-GCM) → Bit-map → ZW Characters
</Tab>
<Tab>
Secret Text → Compress (pako) → Bit-map → ZW Characters
</Tab>
</Tabs>

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

<Callout type="info">
Selecting more characters does not increase security — it only provides fallback options if a platform strips certain ZW characters.
</Callout>

### Capacity

Each character of the secret requires **8 zero-width characters** (one per bit), plus 1 delimiter.

- 100-character secret → 801 ZW characters
- 1,000-character secret → 8,001 ZW characters

The cover text must be long enough to accommodate the hidden data.

### Usage

<Tabs items={["Encoding", "Decoding"]}>
<Tab>
1. Go to the **Encode** tab
2. Paste or upload cover text
3. Type your secret message
4. Optionally enter a passphrase for encryption
5. Click **Encode Message**
6. Copy or download the stego text
</Tab>
<Tab>
1. Go to the **Decode** tab
2. Paste or upload the stego text
3. Enter the passphrase (if encrypted)
4. Click **Decode Message**
</Tab>
</Tabs>
```

- [ ] **Step 2: Verify build**

Run:
```powershell
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add content/docs/text-steganography.mdx
git commit -m "feat: add Tabs and Callout components to text steganography docs"
```

---

### Task 5: Rewrite image-steganography.mdx — Callouts + Tabs

**Files:**
- Modify: `content/docs/image-steganography.mdx`

- [ ] **Step 1: Rewrite content/docs/image-steganography.mdx**

Replace the full file content:

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

<Tabs items={["1 bpc (Higher Quality)", "2 bpc (More Capacity)"]}>
<Tab>
- Uses only the least significant bit of each channel
- Capacity: ~393,000 bytes on a 1024×1024 image
- Visual impact: Imperceptible
</Tab>
<Tab>
- Uses the two least significant bits
- Capacity: ~786,000 bytes on a 1024×1024 image
- Visual impact: Slight noise on close inspection
</Tab>
</Tabs>

### Capacity Formula

```
maxBytes = floor((width × height × 3 × bpc - 32) / 8)
```

The `-32` accounts for the 32-bit length header.

### Processing Pipeline

<Tabs items={["With Passphrase", "Without Passphrase"]}>
<Tab>
Secret Text → Compress → Encrypt → LSB Encode → PNG Export
</Tab>
<Tab>
Secret Text → Compress → LSB Encode → PNG Export
</Tab>
</Tabs>

### Supported Formats

<Callout type="info">
**Input:** PNG, JPEG — **Output:** Always PNG (lossless format preserves hidden data).
</Callout>

### Usage

<Tabs items={["Encoding", "Decoding"]}>
<Tab>
1. Go to the **Image Stego** tab
2. Select **Encode into Image**
3. Upload a PNG or JPEG image
4. Select bits per channel (1 or 2)
5. Type your secret message
6. Optionally enter a passphrase
7. Click **Encode & Download PNG**
</Tab>
<Tab>
1. Go to the **Image Stego** tab
2. Select **Decode from Image**
3. Upload the stego image
4. Enter the passphrase (if encrypted)
5. Click **Decode from Image**
</Tab>
</Tabs>
```

- [ ] **Step 2: Verify build**

Run:
```powershell
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add content/docs/image-steganography.mdx
git commit -m "feat: add Tabs and Callout components to image steganography docs"
```

---

### Task 6: Rewrite encryption.mdx — Callout + CodeBlock

**Files:**
- Modify: `content/docs/encryption.mdx`

- [ ] **Step 1: Rewrite content/docs/encryption.mdx**

Replace the full file content:

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

<Callout type="warn">
**Authenticated encryption** means that if the ciphertext is tampered with or the wrong passphrase is used, decryption fails with an error rather than producing garbage output. Never reuse the same passphrase+message combination for security-critical applications.
</Callout>

### Usage

1. When encoding, enter a passphrase in the **Passphrase** field
2. When decoding, enter the same passphrase to decrypt
3. If the wrong passphrase is used, you'll see an error: "Decryption failed. Wrong passphrase or corrupted data."

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

- [ ] **Step 2: Verify build**

Run:
```powershell
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add content/docs/encryption.mdx
git commit -m "feat: add Callout to encryption docs"
```

---

### Task 7: Rewrite api-reference.mdx — better formatting

**Files:**
- Modify: `content/docs/api-reference.mdx`

- [ ] **Step 1: Rewrite content/docs/api-reference.mdx**

Replace the full file content:

```mdx
---
title: API Reference
description: Library APIs for encryption, steganography, and image steganography.
---

## lib/encryption.ts

### `encryptMessage(plaintext, passphrase)`

Encrypts a Uint8Array payload using AES-256-GCM.

| Parameter | Type | Description |
|-----------|------|-------------|
| `plaintext` | `Uint8Array` | The data to encrypt |
| `passphrase` | `string` | The passphrase for key derivation |

**Returns:** `Promise<Uint8Array>` — Encrypted data with salt, IV, and auth tag prepended.

### `decryptMessage(ciphertext, passphrase)`

Decrypts data encrypted with `encryptMessage`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ciphertext` | `Uint8Array` | The encrypted data |
| `passphrase` | `string` | The passphrase for key derivation |

**Returns:** `Promise<Uint8Array>` — Decrypted plaintext.

**Throws:** `EncryptionError` if decryption fails (wrong passphrase, corrupted data, or truncated ciphertext).

---

## lib/steganography.ts

### `encodeMessage(coverText, secret, chars?, passphrase?)`

Hides a secret message inside cover text using zero-width characters.

| Parameter | Type | Description |
|-----------|------|-------------|
| `coverText` | `string` | The visible text to hide data in |
| `secret` | `string \| Uint8Array` | The message to hide |
| `chars` | `string[]` | (Optional) Zero-width characters to use |
| `passphrase` | `string` | (Optional) Passphrase for encryption |

**Returns:** `Promise<string>` — The stego text with hidden data.

**Throws:** `EncodeError` if cover text is empty, secret is empty, or fewer than 3 chars selected.

### `decodeMessage(stegoText, chars?, passphrase?)`

Extracts a hidden message from stego text.

| Parameter | Type | Description |
|-----------|------|-------------|
| `stegoText` | `string` | The text containing hidden data |
| `chars` | `string[]` | (Optional) Zero-width characters used (must match encoding) |
| `passphrase` | `string` | (Optional) Passphrase for decryption |

**Returns:** `Promise<string>` — The extracted secret message.

**Throws:** `DecodeError` if no hidden message found, or `SteganographyError` if decryption fails.

### `prepareSecret(secret, passphrase?)`

Compresses and optionally encrypts a secret payload.

| Parameter | Type | Description |
|-----------|------|-------------|
| `secret` | `string \| Uint8Array` | The data to prepare |
| `passphrase` | `string` | (Optional) Passphrase for encryption |

**Returns:** `Promise<Uint8Array>` — The prepared payload.

### `extractSecret(data, passphrase?)`

Decompresses and optionally decrypts a secret payload.

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Uint8Array` | The payload to extract |
| `passphrase` | `string` | (Optional) Passphrase for decryption |

**Returns:** `Promise<string>` — The extracted text.

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

| Parameter | Type | Description |
|-----------|------|-------------|
| `imageData` | `ImageData` | The source image data |
| `data` | `Uint8Array` | The payload to embed |
| `bitsPerChannel` | `1 \| 2` | (Optional) Bits to use per channel (default: 1) |

**Returns:** `ImageData` — Modified image data with hidden payload.

**Throws:** `ImageSteganographyError` if data exceeds image capacity.

### `decodeFromImage(imageData, bitsPerChannel?)`

Extracts hidden data from image pixels.

| Parameter | Type | Description |
|-----------|------|-------------|
| `imageData` | `ImageData` | The image to extract from |
| `bitsPerChannel` | `1 \| 2` | (Optional) Bits used per channel (default: 1) |

**Returns:** `Uint8Array` — The extracted payload.

**Throws:** `ImageSteganographyError` if no valid hidden data found.

### `getImageCapacity(width, height, bitsPerChannel?)`

Calculates the maximum payload size for an image.

| Parameter | Type | Description |
|-----------|------|-------------|
| `width` | `number` | Image width in pixels |
| `height` | `number` | Image height in pixels |
| `bitsPerChannel` | `1 \| 2` | (Optional) Bits per channel (default: 1) |

**Returns:** `CapacityInfo` — `{ maxBytes, bitsPerChannel, totalPixels }`.

### `imageDataFromFile(file)`

Loads an image file as ImageData using Canvas API.

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | `File` | The image file to load |

**Returns:** `Promise<ImageData>`.

**Throws:** `ImageSteganographyError` if image fails to load.

### `imageDataToPngBlob(imageData)`

Converts ImageData to a PNG Blob.

| Parameter | Type | Description |
|-----------|------|-------------|
| `imageData` | `ImageData` | The image data to convert |

**Returns:** `Promise<Blob>` — PNG image blob.

**Throws:** `ImageSteganographyError` if encoding fails.
```

- [ ] **Step 2: Verify build**

Run:
```powershell
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add content/docs/api-reference.mdx
git commit -m "feat: add parameter tables to API reference docs"
```

---

### Task 8: Update meta.json + layout.shared.tsx

**Files:**
- Modify: `content/docs/meta.json`
- Modify: `lib/layout.shared.tsx`

- [ ] **Step 1: Update content/docs/meta.json**

Replace with richer sidebar entries:

```json
{
  "pages": [
    {
      "title": "Overview",
      "description": "Introduction to the Steganography Tool",
      "icon": "Info",
      "page": "index"
    },
    {
      "title": "Getting Started",
      "description": "Install and run locally",
      "icon": "Terminal",
      "page": "getting-started"
    },
    {
      "title": "Text Steganography",
      "description": "Zero-width character encoding",
      "icon": "Type",
      "page": "text-steganography"
    },
    {
      "title": "Image Steganography",
      "description": "LSB image encoding",
      "icon": "Image",
      "page": "image-steganography"
    },
    {
      "title": "Encryption",
      "description": "AES-256-GCM encryption",
      "icon": "Lock",
      "page": "encryption"
    },
    {
      "title": "API Reference",
      "description": "Function signatures and types",
      "icon": "Code",
      "page": "api-reference"
    }
  ]
}
```

- [ ] **Step 2: Update lib/layout.shared.tsx**

Replace with enhanced layout options:

```tsx
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Steganography Tool",
    },
    links: [
      {
        text: "GitHub",
        url: "https://github.com/your-username/steganography-tool",
        external: true,
      },
    ],
  };
}
```

- [ ] **Step 3: Verify build**

Run:
```powershell
pnpm build
```

Expected: Build succeeds with all 7 docs pages generated.

- [ ] **Step 4: Commit**

```bash
git add content/docs/meta.json lib/layout.shared.tsx
git commit -m "feat: add rich sidebar entries and nav links to docs"
```

---

### Task 9: Final verification

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
3. All 7 doc pages render correctly with rich components
4. Tabs switch between content
5. Steps component renders numbered steps
6. Callouts render with proper styling
7. Code blocks have copy buttons
8. Files tree renders the project structure
9. Dark mode works on docs pages

---

## Files Modified Summary

| File | Action |
|------|--------|
| `components/mdx.tsx` | Modified (register UI components) |
| `content/docs/index.mdx` | Modified (feature cards) |
| `content/docs/getting-started.mdx` | Modified (Steps, Files) |
| `content/docs/text-steganography.mdx` | Modified (Tabs, Callouts) |
| `content/docs/image-steganography.mdx` | Modified (Tabs, Callouts) |
| `content/docs/encryption.mdx` | Modified (Callout) |
| `content/docs/api-reference.mdx` | Modified (parameter tables) |
| `content/docs/meta.json` | Modified (rich sidebar entries) |
| `lib/layout.shared.tsx` | Modified (nav links) |
