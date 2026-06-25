export class EncryptionError extends Error {
  constructor(message?: string) {
    super(message ?? "Decryption failed. Wrong passphrase or corrupted data.");
    this.name = "EncryptionError";
  }
}

export const PBKDF2_DEFAULT_ITERATIONS = 100_000;
export const ENVELOPE_VERSION = 2;
export const VERSION_BYTE_SIZE = 1;
export const ITERATIONS_FIELD_SIZE = 4;
export const ENVELOPE_HEADER_SIZE = VERSION_BYTE_SIZE + ITERATIONS_FIELD_SIZE;
export const SALT_SIZE = 16;
export const IV_SIZE = 12;
const MIN_CIPHERTEXT_SIZE = ENVELOPE_HEADER_SIZE + SALT_SIZE + IV_SIZE;

export type EncryptionOptions = {
  iterations?: number;
};

function toBufferSource(data: Uint8Array): BufferSource {
  return data as unknown as BufferSource;
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
  usages: KeyUsage[] = ["encrypt", "decrypt"],
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toBufferSource(salt),
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    usages,
  );
}

async function decryptCore(
  data: Uint8Array,
  iv: Uint8Array,
  key: CryptoKey,
): Promise<Uint8Array> {
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toBufferSource(iv) },
      key,
      toBufferSource(data),
    );
    return new Uint8Array(decrypted);
  } catch {
    throw new EncryptionError();
  }
}

export async function encryptMessage(
  plaintext: Uint8Array,
  passphrase: string,
  options: EncryptionOptions = {},
): Promise<Uint8Array> {
  const iterations = options.iterations ?? PBKDF2_DEFAULT_ITERATIONS;
  const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE));
  const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));
  const key = await deriveKey(passphrase, salt, iterations);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toBufferSource(iv) },
    key,
    toBufferSource(plaintext),
  );
  const ciphertext = new Uint8Array(encrypted);
  const result = new Uint8Array(
    ENVELOPE_HEADER_SIZE + SALT_SIZE + IV_SIZE + ciphertext.byteLength,
  );
  result[0] = ENVELOPE_VERSION;
  result[1] = (iterations >>> 24) & 0xff;
  result[2] = (iterations >>> 16) & 0xff;
  result[3] = (iterations >>> 8) & 0xff;
  result[4] = iterations & 0xff;
  result.set(salt, ENVELOPE_HEADER_SIZE);
  result.set(iv, ENVELOPE_HEADER_SIZE + SALT_SIZE);
  result.set(ciphertext, ENVELOPE_HEADER_SIZE + SALT_SIZE + IV_SIZE);
  return result;
}

export async function decryptMessage(
  ciphertext: Uint8Array,
  passphrase: string,
): Promise<Uint8Array> {
  const version = ciphertext.length > 0 ? ciphertext[0] : -1;

  if (version === ENVELOPE_VERSION) {
    if (ciphertext.length < MIN_CIPHERTEXT_SIZE) {
      throw new EncryptionError("Ciphertext too short.");
    }
    const iterations =
      (ciphertext[1] << 24) |
      (ciphertext[2] << 16) |
      (ciphertext[3] << 8) |
      ciphertext[4];
    const salt = ciphertext.slice(ENVELOPE_HEADER_SIZE, ENVELOPE_HEADER_SIZE + SALT_SIZE);
    const iv = ciphertext.slice(
      ENVELOPE_HEADER_SIZE + SALT_SIZE,
      ENVELOPE_HEADER_SIZE + SALT_SIZE + IV_SIZE,
    );
    const data = ciphertext.slice(ENVELOPE_HEADER_SIZE + SALT_SIZE + IV_SIZE);
    const key = await deriveKey(passphrase, salt, iterations, ["decrypt"]);
    return decryptCore(data, iv, key);
  }

  if (ciphertext.length < SALT_SIZE + IV_SIZE) {
    throw new EncryptionError("Ciphertext too short.");
  }
  const salt = ciphertext.slice(0, SALT_SIZE);
  const iv = ciphertext.slice(SALT_SIZE, SALT_SIZE + IV_SIZE);
  const data = ciphertext.slice(SALT_SIZE + IV_SIZE);
  const key = await deriveKey(passphrase, salt, PBKDF2_DEFAULT_ITERATIONS, ["decrypt"]);
  return decryptCore(data, iv, key);
}