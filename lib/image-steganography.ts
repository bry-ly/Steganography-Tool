import { prepareSecret, extractSecret } from "@/lib/steganography";

export class ImageSteganographyError extends Error {
  name = "ImageSteganographyError";
}

function writeBit(pixels: Uint8ClampedArray, bitIndex: number, bit: number, bpc: number): void {
  const pixelByte = Math.floor(bitIndex / (3 * bpc)) * 4;
  const channelOffset = Math.floor((bitIndex % (3 * bpc)) / bpc);
  const bitInChannel = (bitIndex % (3 * bpc)) % bpc;
  const byteIdx = pixelByte + channelOffset;
  const mask = 1 << (bpc - 1 - bitInChannel);
  if (bit) pixels[byteIdx] |= mask;
  else pixels[byteIdx] &= ~mask;
}

function readBit(pixels: Uint8ClampedArray, bitIndex: number, bpc: number): number {
  const pixelByte = Math.floor(bitIndex / (3 * bpc)) * 4;
  const channelOffset = Math.floor((bitIndex % (3 * bpc)) / bpc);
  const bitInChannel = (bitIndex % (3 * bpc)) % bpc;
  const byteIdx = pixelByte + channelOffset;
  return (pixels[byteIdx] >> (bpc - 1 - bitInChannel)) & 1;
}

export interface CapacityInfo {
  maxBytes: number;
  bitsPerChannel: 1 | 2;
  totalPixels: number;
}

export function getImageCapacity(width: number, height: number, bitsPerChannel: 1 | 2 = 1): CapacityInfo {
  const totalPixels = width * height;
  const totalBits = totalPixels * 3 * bitsPerChannel;
  const usableBits = totalBits - 32;
  return { maxBytes: Math.floor(usableBits / 8), bitsPerChannel, totalPixels };
}

export function encodeIntoImage(
  imageData: ImageData,
  data: Uint8Array,
  bitsPerChannel: 1 | 2 = 1,
): ImageData {
  const pixels = new Uint8ClampedArray(imageData.data);
  const { width, height } = imageData;
  const bpc = bitsPerChannel;
  const maxBits = width * height * 3 * bpc;
  const dataBits = data.length * 8;
  const totalBits = 32 + dataBits;

  if (totalBits > maxBits) {
    throw new ImageSteganographyError(
      `Data too large. Need ${totalBits} bits, but image holds ${maxBits} (${Math.floor(maxBits / 8)} bytes).`,
    );
  }

  let bitOffset = 0;

  for (let i = 0; i < 32; i++) {
    writeBit(pixels, bitOffset++, (dataBits >> i) & 1, bpc);
  }

  for (const byte of data) {
    for (let i = 7; i >= 0; i--) {
      writeBit(pixels, bitOffset++, (byte >> i) & 1, bpc);
    }
  }

  return new ImageData(pixels, width, height);
}

export function decodeFromImage(imageData: ImageData, bitsPerChannel: 1 | 2 = 1): Uint8Array {
  const { data: pixels, width, height } = imageData;
  const bpc = bitsPerChannel;

  let dataBits = 0;
  for (let i = 0; i < 32; i++) {
    const bit = readBit(pixels, i, bpc);
    dataBits |= bit << i;
  }

  if (dataBits === 0 || dataBits > (width * height * 3 * bpc - 32)) {
    throw new ImageSteganographyError("Invalid or missing hidden data.");
  }

  const bytes: number[] = [];
  let currentByte = 0;
  let bitsInByte = 0;

  for (let i = 0; i < dataBits; i++) {
    const bit = readBit(pixels, 32 + i, bpc);
    currentByte = (currentByte << 1) | bit;
    bitsInByte++;
    if (bitsInByte === 8) {
      bytes.push(currentByte);
      currentByte = 0;
      bitsInByte = 0;
    }
  }

  if (bitsInByte > 0) {
    currentByte <<= (8 - bitsInByte);
    bytes.push(currentByte);
  }

  return new Uint8Array(bytes);
}

export function imageDataFromFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.onerror = () => reject(new ImageSteganographyError("Failed to load image."));
    img.src = URL.createObjectURL(file);
  });
}

export function imageDataToPngBlob(imageData: ImageData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(imageData, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new ImageSteganographyError("Failed to encode PNG."));
    }, "image/png");
  });
}
