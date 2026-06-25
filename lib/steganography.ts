import { encryptMessage, decryptMessage, EncryptionError } from "@/lib/encryption";
import pako from "pako";

export const ENVELOPE_VERSION = 2;

export class SteganographyError extends Error {
  name = "SteganographyError";
}
export class EncodeError extends SteganographyError {
  name = "EncodeError";
}
export class DecodeError extends SteganographyError {
  name = "DecodeError";
}

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

const TEXT_ENVELOPE_OVERHEAD_BYTES = 5;

export function getTextCapacity(coverText: string, chars = DEFAULT_SELECTED): number {
  if (chars.length < 3) return 0;
  const zwSlots = coverText.length;
  const usableBits = zwSlots - 1;
  if (usableBits <= 0) return 0;
  const usableBytes = Math.floor(usableBits / 8);
  return Math.max(0, usableBytes - TEXT_ENVELOPE_OVERHEAD_BYTES);
}

function textToUint8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function uint8ToText(data: Uint8Array): string {
  return new TextDecoder().decode(data);
}

function toBits(data: Uint8Array): Uint8Array {
  const bits = new Uint8Array(data.length * 8);
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < 8; j++) {
      bits[i * 8 + j] = (data[i] >> (7 - j)) & 1;
    }
  }
  return bits;
}

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

export type EncodeOptions = {
  iterations?: number;
};

export async function prepareSecret(
  secret: string | Uint8Array,
  passphrase?: string,
  options: EncodeOptions = {},
): Promise<Uint8Array> {
  const bytes = typeof secret === "string" ? textToUint8(secret) : secret;
  const packed = packSecret(bytes);
  let inner: Uint8Array;
  if (passphrase) {
    inner = await encryptMessage(packed, passphrase, { iterations: options.iterations });
  } else {
    inner = packed;
  }
  const result = new Uint8Array(1 + inner.length);
  result[0] = ENVELOPE_VERSION;
  result.set(inner, 1);
  return result;
}

export async function extractSecret(
  data: Uint8Array,
  passphrase?: string,
): Promise<string> {
  if (data.length < 1) throw new DecodeError("No hidden message found.");
  const version = data[0];
  let bytes: Uint8Array;
  if (version === ENVELOPE_VERSION) {
    bytes = data.slice(1);
  } else if (version === 1) {
    bytes = data;
  } else {
    throw new DecodeError(`Unsupported envelope version: ${version}`);
  }
  if (passphrase) {
    try {
      bytes = await decryptMessage(bytes, passphrase);
    } catch (e) {
      if (e instanceof EncryptionError) throw new DecodeError(e.message);
      throw new DecodeError("Failed to decrypt. Wrong passphrase?");
    }
  }
  const decompressed = unpackSecret(bytes);
  return uint8ToText(decompressed);
}

export async function encodeMessage(
  coverText: string,
  secret: string | Uint8Array,
  chars = DEFAULT_SELECTED,
  passphrase?: string,
  options: EncodeOptions = {},
): Promise<string> {
  if (!coverText.trim()) throw new EncodeError("Cover text cannot be empty.");
  if (!secret || (typeof secret === "string" && !secret)) throw new EncodeError("Secret message cannot be empty.");
  if (chars.length < 3) throw new EncodeError("At least 3 zero-width characters must be selected.");

  const [ZW0, ZW1, ZWD] = chars;
  const payload = await prepareSecret(secret, passphrase, options);
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
