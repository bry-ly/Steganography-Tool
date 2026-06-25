# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note for the docs site:** this file is the source of truth. Each release section is mirrored to `content/docs/changelog/<date>-<version>.mdx` by `scripts/sync-changelog.mjs`. Run `pnpm sync-changelog` to refresh the docs site.

## [Unreleased]

## [0.1.2] - 2026-06-26

### Added
- KDF strength selector for passphrase-protected text and image encoding, with PBKDF2 presets from 100k to 1M iterations.
- Versioned encryption and steganography envelopes that record payload metadata, including PBKDF2 iteration counts for encrypted messages.
- Text cover capacity estimates and overflow warnings before encoding.
- Reusable `FileUploadButton` for hidden file inputs.
- Image encoding round-trip self-test before reporting a successful download.

### Changed
- Use the shared `Logo` component for the navigation title and the website favicon source via Next.js `app/icon.png` convention.
- Update site metadata from placeholder URLs to the deployed Vercel URL and reuse `/icon.png` for social preview images.
- Correct placeholder GitHub URLs in `getting-started`, `security`, and `changelog` docs pages to the real repository (`bry-ly/steganography-tool`).

### Fixed
- Restored text cover `.txt` uploads by replacing the missing inline upload icon/ref wiring with the shared upload button.

## [0.1.1] - 2026-06-16

### Added
- `PassphraseInput` component to deduplicate the show/hide password input
- `lib/file.ts` with shared browser file I/O helpers
- `lib/image-source.ts` with detection for lossy image sources
- Lossy-source warning when a JPEG is uploaded for image stego
- Image capacity guard before encoding
- OpenGraph and Twitter card metadata
- Documentation pages: `about`, `security`, `limitations`, `faq`, `platform-compatibility`, `image-api`, `protocol`
- GitHub Actions CI workflow (lint, typecheck, test, build)
- Root `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`
- Changelog site with per-release pages (`/docs/changelog`)

### Changed
- `app/page.tsx` split into `TextEncodeTab`, `TextDecodeTab`, `ImageStegoTab` to reduce a 506-line client component
- `package.json` declares `engines`, `packageManager`, `repository`, `bugs`, `homepage`
- `README.md` rewritten with project-specific content
- Brand name standardized to **StegnoHide** across UI, metadata, and docs
- `.gitignore` extended to cover IDE files, OS files, and test artifacts
- Documentation `getting-started` project structure updated to match the real layout

## [0.1.0] - 2026-06-16

### Added
- Text steganography via zero-width Unicode characters
- Image steganography via LSB
- Optional AES-256-GCM encryption with PBKDF2 key derivation
- zlib compression of payloads
- Fumadocs documentation site at `/docs`
- Dark mode toggle
