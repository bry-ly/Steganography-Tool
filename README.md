# StegnoHide

> Hide secret messages inside plain text or images using steganography. 100% client-side, no server, no tracking.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](./package.json)

StegnoHide is a Next.js web app that lets you hide a secret message inside ordinary-looking cover text or inside a PNG image. The hidden data can optionally be encrypted with a passphrase (AES-256-GCM) and is compressed (zlib) before embedding. Everything runs in the browser using the Web Crypto API and Canvas — your cover text, secret, and passphrases never leave your device.

## Features

- **Text steganography** — embed messages using zero-width Unicode characters that are invisible to readers.
- **Image steganography** — embed messages in the least significant bits (LSB) of image pixels.
- **Optional AES-256-GCM encryption** with PBKDF2 key derivation (100k iterations, SHA-256).
- **zlib compression** of payloads to minimize footprint.
- **Dark mode** with system preference detection.
- **No server, no analytics, no telemetry** — open the page, it works offline.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The tool is at the root, the documentation site is at `/docs`.

### Other Commands

```bash
pnpm build      # production build
pnpm start      # run the production build
pnpm test       # run unit tests (vitest)
pnpm test:watch # vitest in watch mode
pnpm lint       # eslint
pnpm typecheck  # tsc --noEmit
```

## How It Works (Quick Version)

### Text mode

1. Secret is compressed with zlib (or skipped if compression makes it larger).
2. If a passphrase is provided, the compressed payload is encrypted with AES-256-GCM.
3. The resulting bytes are split into bits. Each bit maps to a zero-width character (`0` → char A, `1` → char B). A third character marks the end of the payload.
4. The ZW sequence is inserted after the first whitespace in the cover text.

### Image mode

1. Same compress → encrypt → bytes pipeline as text mode.
2. The first 32 pixels of LSBs encode the payload length (little-endian).
3. The remaining bits are written into the red, green, and blue channels of each pixel (alpha is preserved). The output is always a PNG to avoid lossy re-encoding.
4. Decoding reads the length, then reads that many bits back.

## Security & Limitations

**Steganography is not encryption.** The cover text or image looks unchanged, but anyone who knows to look can extract the hidden bytes. For actual confidentiality you **must** enable the passphrase option (AES-256-GCM).

Other things to know:

- **Text mode is fragile across platforms.** WhatsApp, Slack, Discord, Google Docs, and many rich-text editors strip or normalize zero-width characters. Always test the round-trip in the channel you intend to use.
- **Image mode is fragile across platforms too.** Facebook, Twitter/X, Instagram, and most chat apps re-encode uploaded images and destroy LSBs. Use a lossless file transfer (email attachment, cloud drive link, S3, etc.) or use text mode.
- **Lossy sources (JPEG) are converted to PNG** on encode. The LSBs of a JPEG-derived image are already noisy, which is fine for stego but means there's no benefit to the extra noise.
- **No stego key.** The "selection" of zero-width characters is not a cryptographic key — it's an alphabet. Don't reuse the same secret across channels without changing the cover text and (ideally) the passphrase.

A full threat model is in [`content/docs/security.mdx`](./content/docs/security.mdx) (also browsable at `/docs/security`).

## Project Structure

```
app/                    Next.js app router
  page.tsx              Main tool UI (encode/decode/image)
  docs/                 Fumadocs documentation site
  layout.tsx            Root layout (theme, fonts, toaster)
components/             Shared React components
  ui/                   shadcn/ui primitives
  zw-char-selector.tsx  Zero-width character picker
  pass-phrase-input.tsx Reusable passphrase input
  theme-toggle.tsx      Light/dark toggle
content/docs/           MDX documentation source
  getting-started/      Install, run, project structure
  guides/               Topic guides (text, image, encryption, platforms)
  reference/            API reference, wire protocol
lib/                    Core steganography + crypto
  steganography.ts      ZW-character encode/decode
  image-steganography.ts LSB image encode/decode
  encryption.ts         AES-256-GCM helpers
  file.ts               Browser file I/O helpers
tests/                  Vitest unit tests
docs/superpowers/       Internal planning + spec docs
```

## Documentation

The full documentation site lives at `/docs` when you run the dev server. The MDX source is in [`content/docs/`](./content/docs/). To add or edit a page, edit the corresponding `.mdx` file — no rebuild of the navigation is required.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Bug reports and security disclosures follow [`SECURITY.md`](./SECURITY.md).

## License

[MIT](./LICENSE) — see the license file for details.
