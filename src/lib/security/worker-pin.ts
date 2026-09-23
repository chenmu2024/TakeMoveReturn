const PIN_ITERATIONS = 600_000;
const SALT_BYTES = 16;

export type WorkerPinHash = {
  hash: string;
  salt: string;
  iterations: number;
  version: 1;
};

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64"));
}

function assertPin(pin: string): void {
  if (!/^\d{6}$/.test(pin)) throw new Error("A worker PIN must be exactly six digits.");
}

async function pepperPin(pin: string, pepper: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(pin)));
}

async function derive(pin: string, pepper: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const peppered = await pepperPin(pin, pepper);
  const key = await crypto.subtle.importKey("raw", peppered as BufferSource, "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256,
  ));
}

export async function hashWorkerPin(pin: string, pepper: string): Promise<WorkerPinHash> {
  assertPin(pin);
  if (!pepper) throw new Error("WORKER_PIN_PEPPER is required.");
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(pin, pepper, salt, PIN_ITERATIONS);
  return { hash: toBase64(hash), salt: toBase64(salt), iterations: PIN_ITERATIONS, version: 1 };
}

export async function verifyWorkerPin(pin: string, pepper: string, stored: WorkerPinHash): Promise<boolean> {
  assertPin(pin);
  if (!pepper || stored.version !== 1 || stored.iterations < PIN_ITERATIONS) return false;
  const expected = fromBase64(stored.hash);
  const actual = await derive(pin, pepper, fromBase64(stored.salt), stored.iterations);
  if (expected.length !== actual.length) return false;
  let different = 0;
  for (let index = 0; index < expected.length; index += 1) different |= expected[index] ^ actual[index];
  return different === 0;
}
