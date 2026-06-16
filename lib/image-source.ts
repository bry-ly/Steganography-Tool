export function isLikelyLossySource(file: File): boolean {
  return /^image\/(jpeg|webp|heic|heif|avif)$/i.test(file.type);
}
