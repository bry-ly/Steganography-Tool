import { describe, it, expect, beforeAll } from "vitest";
import {
  encodeIntoImage,
  decodeFromImage,
  getImageCapacity,
  ImageSteganographyError,
} from "@/lib/image-steganography";

// Polyfill ImageData for jsdom (no Canvas support)
beforeAll(() => {
  if (typeof globalThis.ImageData === "undefined") {
    class MockImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(data: Uint8ClampedArray, width: number, height?: number) {
        this.data = data;
        this.width = width;
        this.height = height ?? data.length / 4 / width;
      }
    }
    (globalThis as any).ImageData = MockImageData;
  }
});

function createTestImage(width: number, height: number): ImageData {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i++) {
    pixels[i] = 128;
  }
  return new ImageData(pixels, width, height);
}

describe("getImageCapacity", () => {
  it("calculates capacity correctly", () => {
    const cap = getImageCapacity(100, 100, 1);
    expect(cap.maxBytes).toBe(3746);
    expect(cap.totalPixels).toBe(10000);
  });

  it("2 bpc gives more capacity than 1 bpc", () => {
    const cap1 = getImageCapacity(10, 10, 1);
    const cap2 = getImageCapacity(10, 10, 2);
    expect(cap2.maxBytes).toBeGreaterThan(cap1.maxBytes * 2);
    expect(cap2.bitsPerChannel).toBe(2);
  });
});

describe("encodeIntoImage / decodeFromImage", () => {
  it("round-trips a simple message at 1 bpc", () => {
    const img = createTestImage(32, 32);
    const data = new TextEncoder().encode("Hello, Image!");
    const encoded = encodeIntoImage(img, data, 1);
    const decoded = decodeFromImage(encoded, 1);
    expect(new TextDecoder().decode(decoded)).toBe("Hello, Image!");
  });

  it("round-trips at 2 bpc", () => {
    const img = createTestImage(32, 32);
    const data = new TextEncoder().encode("2 bpc test");
    const encoded = encodeIntoImage(img, data, 2);
    const decoded = decodeFromImage(encoded, 2);
    expect(new TextDecoder().decode(decoded)).toBe("2 bpc test");
  });

  it("round-trips binary data", () => {
    const img = createTestImage(64, 64);
    const data = crypto.getRandomValues(new Uint8Array(128));
    const encoded = encodeIntoImage(img, data, 1);
    const decoded = decodeFromImage(encoded, 1);
    expect(decoded).toEqual(data);
  });

  it("throws on data that exceeds capacity", () => {
    const img = createTestImage(1, 1);
    const data = new TextEncoder().encode("too much data");
    expect(() => encodeIntoImage(img, data, 1)).toThrow(ImageSteganographyError);
  });

  it("throws on image with no hidden data", () => {
    const img = createTestImage(32, 32);
    expect(() => decodeFromImage(img)).toThrow(ImageSteganographyError);
  });

  it("preserves non-modified pixels (covers all pixels)", () => {
    const img = createTestImage(16, 16);
    const data = new TextEncoder().encode("short");
    const before = new Uint8Array(img.data);
    const encoded = encodeIntoImage(img, data, 1);
    const after = encoded.data;
    expect(after.length).toBe(before.length);
    let changed = 0;
    for (let i = 0; i < after.length; i++) {
      if (Math.abs(before[i] - after[i]) > 1) changed++;
    }
    expect(changed).toBeLessThan(50);
  });
});
