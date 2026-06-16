export function readFileAsText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error ?? new Error("Failed to read file"));
    r.readAsText(file);
  });
}

export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  triggerDownload(blob, filename);
}

export function downloadBlob(blob: Blob, filename: string) {
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function withExtensionStripped(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

export async function copyToClipboard(text: string, successMessage = "Copied to clipboard", errorMessage = "Failed to copy") {
  try {
    await navigator.clipboard.writeText(text);
    return { ok: true as const, message: successMessage };
  } catch {
    return { ok: false as const, message: errorMessage };
  }
}
