# Security Policy

## What This Tool Is

StegnoHide is a **steganography** tool with **optional** symmetric encryption. Steganography hides the *existence* of a message inside an innocent-looking carrier. Encryption hides the *content* of a message. They are complementary, not substitutes.

> **Steganography is not encryption.** Without a passphrase, anyone who knows to look can extract the hidden bytes. Always use the passphrase option if the content matters.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security-sensitive reports.** Email the maintainer privately (see the GitHub profile for the current contact) and include:

- A clear description of the issue
- Steps to reproduce
- Impact assessment (what an attacker can do)
- A proof-of-concept if possible

You should receive an acknowledgement within 72 hours. We'll work with you on coordinated disclosure.

## Cryptography Details

When the passphrase option is enabled, the tool uses:

- **PBKDF2** with 100,000 iterations, SHA-256, and a 16-byte random salt for key derivation
- **AES-256-GCM** with a 12-byte random IV
- **Output format:** `salt(16) || iv(12) || ciphertext+tag`

The Web Crypto API in the user's browser does the actual work. There is no server-side cryptography, no telemetry, and no key escrow. The encryption is only as strong as the passphrase the user picks.

| Property        | Value                                       |
|-----------------|---------------------------------------------|
| Algorithm       | AES-256-GCM                                 |
| Key derivation  | PBKDF2-SHA256, 100,000 iterations           |
| Salt size       | 16 bytes (random per message)               |
| IV size         | 12 bytes (random per message)               |
| Auth tag        | 16 bytes (standard GCM, appended to cipher) |
| Output envelope | `salt ‖ iv ‖ ciphertext ‖ tag`              |

## Threat Model — What This Tool Protects Against

- A passive observer who does **not** know that steganography is in use will see only the cover text or cover image. The hidden data is invisible.
- An attacker who knows the tool was used but **does not** have the passphrase cannot read the message (the encryption layer is genuine AES-256-GCM with a unique salt + IV per message).
- A passive observer who can apply statistical analysis may be able to *detect* that text steganography was used (the ZW-character distribution is non-natural) or that an image was modified (LSB analysis). They still cannot read the message without the passphrase.

## What This Tool Does Not Protect Against

- **An attacker with the passphrase.** This is just encryption at that point — the passphrase is the secret.
- **A motivated forensic analyst with the cover source.** If the attacker has the original unmodified cover, they can diff to detect modifications.
- **Lossy platforms.** Most chat apps, social networks, and rich-text editors normalize, strip, or re-encode content. Many destroy the very bits the tool relies on. See [`content/docs/limitations.mdx`](content/docs/limitations.mdx).
- **Keyloggers, screen capture, and shoulder-surfing.** The passphrase is typed into a normal HTML input. Use a password manager.
- **Compromised browser extensions or hosting.** The tool runs in your browser. A malicious extension or a hostile CDN can read the passphrase and the data.

## Operational Notes

- The tool runs entirely client-side. There is no server, no database, and no logging.
- The output PNG is always lossless. The tool re-encodes to PNG to preserve LSBs, so JPEG-in-PNG-out is expected.
- The cover text you paste stays in the page's memory. Refresh to clear it. Closing the tab clears everything.
- The passphrase, secret, and cover are **never** written to localStorage, sessionStorage, IndexedDB, cookies, or any persistent storage. They live in JavaScript memory only.
- There are **no third-party network calls** at runtime. Static assets are served from the same origin as the app.
