import { describe, it, expect } from "vitest";
import {
  encryptMessage,
  decryptMessage,
  EncryptionError,
  ENVELOPE_VERSION,
} from "@/lib/encryption";

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

  it("throws EncryptionError on corrupted ciphertext body", async () => {
    const plaintext = new TextEncoder().encode("secret");
    const encrypted = await encryptMessage(plaintext, passphrase);
    encrypted[encrypted.length - 1] ^= 0xff;
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
    const plaintext = new Uint8Array(10_000).fill(0x41);
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

  it("writes envelope version 2 as the first byte", async () => {
    const plaintext = new TextEncoder().encode("hello");
    const encrypted = await encryptMessage(plaintext, passphrase);
    expect(encrypted[0]).toBe(ENVELOPE_VERSION);
  });

  it("round-trips with custom PBKDF2 iterations", async () => {
    const plaintext = new TextEncoder().encode("custom iter");
    const encrypted = await encryptMessage(plaintext, passphrase, { iterations: 250_000 });
    const decrypted = await decryptMessage(encrypted, passphrase);
    expect(new TextDecoder().decode(decrypted)).toBe("custom iter");
  });

  it("records iteration count in the envelope header", async () => {
    const plaintext = new TextEncoder().encode("x");
    const encrypted = await encryptMessage(plaintext, passphrase, { iterations: 250_000 });
    const stored =
      (encrypted[1] << 24) |
      (encrypted[2] << 16) |
      (encrypted[3] << 8) |
      encrypted[4];
    expect(stored).toBe(250_000);
  });

  it("decrypts legacy v1 envelopes (no header) using default iterations", async () => {
    const plaintext = new TextEncoder().encode("legacy");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt as unknown as BufferSource,
        iterations: 100_000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"],
    );
    const ct = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv as unknown as BufferSource },
        key,
        plaintext as unknown as BufferSource,
      ),
    );
    const legacy = new Uint8Array(salt.length + iv.length + ct.length);
    legacy.set(salt, 0);
    legacy.set(iv, salt.length);
    legacy.set(ct, salt.length + iv.length);

    const decrypted = await decryptMessage(legacy, passphrase);
    expect(new TextDecoder().decode(decrypted)).toBe("legacy");
  });
});