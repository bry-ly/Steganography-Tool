// Zero-width character steganography

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

// Default characters: first three (bit0, bit1, delimiter)
export const DEFAULT_SELECTED = ["\u200B", "\u200C", "\u200D"];

// Converts a UTF-8 string to a binary string (e.g. "A" → "01000001")
function toBinary(text: string): string {
  return Array.from(new TextEncoder().encode(text))
    .map((b) => b.toString(2).padStart(8, "0"))
    .join("");
}

// Converts a binary string back to a UTF-8 string
function fromBinary(bits: string): string {
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Hides a secret message inside cover text using the provided zero-width chars.
// chars[0] = bit 0, chars[1] = bit 1, chars[2] = end delimiter
export function encodeMessage(coverText: string, secret: string, chars = DEFAULT_SELECTED): string {
  if (!coverText.trim()) throw new Error("Cover text cannot be empty.");
  if (!secret) throw new Error("Secret message cannot be empty.");
  if (chars.length < 3) throw new Error("At least 3 zero-width characters must be selected.");

  const [ZW0, ZW1, ZWD] = chars;
  const bits = toBinary(secret);
  const hidden = bits.split("").map((b) => (b === "0" ? ZW0 : ZW1)).join("") + ZWD;

  const firstSpace = coverText.search(/\s/);
  if (firstSpace === -1) return coverText + hidden;
  return coverText.slice(0, firstSpace) + hidden + coverText.slice(firstSpace);
}

// Extracts the hidden message from stego text. Tries all known zero-width chars as potential delimiters.
export function decodeMessage(stegoText: string, chars = DEFAULT_SELECTED): string {
  if (chars.length < 3) throw new Error("At least 3 zero-width characters must be selected.");

  const [ZW0, ZW1, ZWD] = chars;
  const delimIdx = stegoText.indexOf(ZWD);
  if (delimIdx === -1) throw new Error("No hidden message found.");

  let bits = "";
  for (const ch of stegoText.slice(0, delimIdx)) {
    if (ch === ZW0) bits += "0";
    else if (ch === ZW1) bits += "1";
  }

  if (!bits) throw new Error("No hidden message found.");
  return fromBinary(bits);
}
