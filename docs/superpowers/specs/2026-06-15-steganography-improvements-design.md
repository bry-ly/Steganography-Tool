# Steganography Tool — Improvements Design

**Date:** 2026-06-15
**Project:** stegnography-tool
**Status:** Approved design

## Overview

Upgrade the existing zero-width character steganography tool with encryption, compression, image LSB steganography, dark mode, performance improvements, testing, and general polish.

## Architecture

### File Structure

```
lib/
  steganography.ts        # Refactored ZW algorithm + error classes + typed array perf
  image-steganography.ts  # New: LSB image encode/decode via Canvas API
  encryption.ts           # New: AES-256-GCM + PBKDF2 key derivation
  utils.ts                # Unchanged (cn utility)

app/
  layout.tsx              # Add ThemeProvider wrapper from next-themes
  page.tsx                # Refactored with 3 tabs (Text Encode, Text Decode, Image Stego)

components/
  theme-toggle.tsx        # New: dark/light switch (sun/moon icon)
  zw-char-selector.tsx    # Extracted from page.tsx — ZW checkbox grid

tests/
  steganography.test.ts   # Round-trip, encryption, compression, edge cases
  image-steganography.test.ts
  encryption.test.ts      # Encrypt/decrypt round-trip, wrong passphrase

package.json              # + vitest, pako, @types/pako, @vitejs/plugin-react
next.config.ts            # Unchanged (pako doesn't need special config)
```

## 1. Core Library: `lib/encryption.ts`

### API

```typescript
export class EncryptionError extends Error {}

export async function encryptMessage(
  plaintext: Uint8Array,
  passphrase: string
): Promise<Uint8Array>

export async function decryptMessage(
  ciphertext: Uint8Array,
  passphrase: string
): Promise<Uint8Array>
```

### Algorithm

- **Cipher:** AES-256-GCM (authenticated encryption)
- **Key derivation:** PBKDF2 with SHA-256, 100,000 iterations, random 16-byte salt
- **IV:** Random 12 bytes per encryption
- **Output format:** `[salt(16)][iv(12)][ciphertext + auth tag(16)]` — single Uint8Array
- Decryption parses the salt + IV, derives the key, and decrypts
- Wrong passphrase throws `EncryptionError` (decryption fails auth tag check)

## 2. Core Library: `lib/steganography.ts` — Refactored

### Error Classes

```typescript
export class SteganographyError extends Error {}
export class EncodeError extends SteganographyError {}
export class DecodeError extends SteganographyError {}
```

### Performance: Typed Arrays

Replace string-based bit manipulation with typed arrays:

- `textToBits(text: string): { bits: Uint8Array, length: number }`
  - Converts UTF-8 bytes to a packed bit array (8 bits per byte stored as 0/1 values in Uint8Array)
  - Returns the array + the number of valid bits
- `bitsToText(bits: Uint8Array, bitLength: number): string`
  - Reconstructs UTF-8 bytes from the bit array

This avoids intermediate string allocations during the encode/decode inner loops.

### Updated Signatures

```typescript
export function encodeMessage(
  coverText: string,
  secret: string | Uint8Array,
  chars?: string[],
  passphrase?: string
): Promise<string>

export function decodeMessage(
  stegoText: string,
  chars?: string[],
  passphrase?: string
): Promise<string>
```

Both become async due to optional encryption.

### Processing Pipeline

**Encode:**
```
secret text → TextEncoder → UTF-8 bytes
  → [optional pako.deflate compression]
  → [optional encryptMessage(passphrase)]
  → textToBits → map bits to ZW chars (0→ZW0, 1→ZW1)
  → append ZWD delimiter
  → insert into cover text after first whitespace
```

**Decode:**
```
stego text → find ZWD delimiter → scan preceding ZW chars
  → map ZW0→0, ZW1→1 → bitsToText → bytes
  → [optional decryptMessage(passphrase)]
  → [optional pako.inflate decompression]
  → TextDecoder → secret text
```

### Compression

- Use `pako.deflate()` / `pako.inflate()` 
- Applied before encryption (encrypted data is incompressible)
- Check: if compressed output is larger than input, use original (small messages may not compress)

## 3. Image Steganography: `lib/image-steganography.ts`

### API

```typescript
export class ImageSteganographyError extends Error {}

export function encodeIntoImage(
  imageData: ImageData,
  secret: string,
  passphrase?: string,
  bitsPerChannel?: 1 | 2
): Promise<ImageData>

export function decodeFromImage(
  imageData: ImageData,
  passphrase?: string,
  bitsPerChannel?: 1 | 2
): Promise<string>

export function loadImageFromFile(file: File): Promise<HTMLImageElement>
export function imageDataFromImage(img: HTMLImageElement): Promise<ImageData>
export function imageDataToPngBlob(imageData: ImageData): Promise<Blob>
```

### LSB Algorithm

- Process pixels row by row, pixel by pixel
- Modify the least significant 1-2 bits of each RGB channel (skip alpha)
- **bit layout:** For each channel byte `0bXXXXXXXX`, replace bottom `n` bits with secret data bits
- The first 32 bits of the image store the bit length of the secret data (little-endian, fixed width), so extraction reads exactly that many bits and stops. No end marker needed.

### Capacity

```
capacity = width × height × 3 channels × bitsPerChannel
reserved = 32 bits (length prefix)
```

At 1 bpc on a 1024×1024 image: ~3 MB hidden capacity  
At 2 bpc: ~6 MB (slight visual degradation)

### Image Processing

- `loadImageFromFile`: uses `FileReader` + `Image` + canvas `drawImage`
- `imageDataFromImage`: renders image to off-screen canvas, calls `getImageData()`
- `imageDataToPngBlob`: uses canvas `toBlob('image/png')`

## 4. UI Redesign

### Layout

```
┌─────────────────────────────────────────────┐
│ 🗝️ Steganography Tool          [🌙 Toggle] │
│ Hide messages using invisible text or images │
├─────────────────────────────────────────────┤
│ [Text] [Text] [Image]                       │
│  Encode  Decode  Stego                      │
│                                             │
│   ── Tab content ──                         │
│                                             │
└─────────────────────────────────────────────┘
```

### Text Encode Tab

| Element | Detail |
|---|---|
| Cover Text | Existing textarea + file upload + word count badge |
| Secret Message | Existing textarea OR file upload for binary |
| Passphrase | Password input with show/hide toggle (optional) |
| ZW Char Selector | Extracted component, same behavior |
| Encode Button | Existing (disabled if < 3 chars or empty) |
| Stats Output | New: "Hidden X bytes (Y ZW chars, Z% of cover)" |
| Stego Text Output | Existing output + copy + download |

### Text Decode Tab

| Element | Detail |
|---|---|
| Stego Text | Existing textarea + file upload |
| Passphrase | Password input (shown only if encoding used it; user must know) |
| Decode Button | Existing |
| Decoded Output | Existing output + copy button |
| Error messages | Differentiate: wrong passphrase vs no hidden message |

### Image Stego Tab

| Element | Detail |
|---|---|
| Image Upload | File input + preview thumbnail |
| Bits per channel | Radio: 1 bit (higher quality) / 2 bits (more capacity) |
| Secret Message | Textarea for the hidden message |
| Passphrase | Optional password input |
| Encode Button | "Encode into Image" → downloads PNG |
| Mode toggle | Radio/segmented control: Encode ↔ Decode within the same tab |
| Decode Button | "Decode from Image" → reveals secret (requires passphrase if set) |
| Capacity indicator | Shows max bytes for current image size & bpc |

### Dark Mode

- `<ThemeProvider attribute="class" defaultTheme="system">` in layout.tsx
- `next-themes` already in package.json — wire it up
- ThemeToggle component renders `sun.svg` / `moon.svg` icon from Phosphor
- Toggles between light, dark, system
- Persisted to localStorage

### Component Extraction: `zw-char-selector.tsx`

Move the ZW character checkbox grid + badges out of page.tsx into a reusable component:

```typescript
// Props
interface ZWCharSelectorProps {
  selectedChars: string[];
  onChange: (chars: string[]) => void;
}
```

Returns `selectedChars` (ordered by check order) to the parent.

## 5. Testing

### Setup

- Vitest with `@vitejs/plugin-react`
- `vitest.config.ts` alongside next.config.ts
- Script: `"test": "vitest run"`, `"test:watch": "vitest"`

### Test Files

**`tests/encryption.test.ts`**
- Round-trip encrypt/decrypt with various inputs (empty, short, large, binary)
- Wrong passphrase throws `EncryptionError`
- Different salt/IV each time produces different ciphertext
- Empty passphrase is valid (edge case)

**`tests/steganography.test.ts`**
- Round-trip: encode then decode yields original secret
- Custom ZW character mappings
- Empty cover text throws `EncodeError`
- No hidden message throws `DecodeError`
- Encode with passphrase → decode with same passphrase
- Encode with passphrase → decode without throws `DecryptionError`
- Compression reduces output size for repetitive messages (e.g., "AAAAAAA...")
- Binary secret (Uint8Array) round-trip
- Multi-byte UTF-8 (emoji, CJK)

**`tests/image-steganography.test.ts`**
- Round-trip on synthetic ImageData (small 10×10 test image)
- 1 bpc and 2 bpc modes
- Encryption round-trip with correct/wrong passphrase
- Large enough capacity stores the data
- End marker correctly terminates extraction

## 6. Dependencies

| Package | Type | Reason |
|---|---|---|
| `pako` | dependency | zlib compression/decompression |
| `@types/pako` | devDependency | TypeScript types for pako |
| `vitest` | devDependency | Test runner |
| `@vitejs/plugin-react` | devDependency | React transform for Vitest |
| `jsdom` | devDependency | DOM environment for tests (Canvas mock) |

## Implementation Order

1. Set up test infrastructure (Vitest config + deps)
2. `lib/encryption.ts` + tests
3. Refactor `lib/steganography.ts` (error classes, typed arrays, compression, encryption integration) + tests
4. `lib/image-steganography.ts` + tests
5. `components/zw-char-selector.tsx` — extract from page.tsx
6. `components/theme-toggle.tsx` + wire into layout.tsx
7. Update `app/page.tsx` — 3 tabs, passphrase, stats, image stego UI
8. Fix `decodeMessage` comment and `package.json` typo
9. Final verification: `pnpm build && pnpm test`
