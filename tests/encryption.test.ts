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
    encrypted[28] ^= 0xFF;
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
});
