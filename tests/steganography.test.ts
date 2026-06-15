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
