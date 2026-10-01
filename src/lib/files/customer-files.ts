import { getCloudflareContext } from "@opennextjs/cloudflare";

export type CustomerFileKind = "tool_photo" | "damage_photo" | "maintenance_attachment";

type R2GetResult = {
  body: ReadableStream<Uint8Array>;
  httpMetadata?: { contentType?: string };
  size?: number;
};

export type CustomerFilesBucket = {
  put(key: string, value: ArrayBuffer, options?: {
    httpMetadata?: { contentType?: string };
    customMetadata?: Record<string, string>;
  }): Promise<unknown>;
  get(key: string): Promise<R2GetResult | null>;
  delete(key: string): Promise<void>;
};

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maintenanceTypes = new Set([...imageTypes, "application/pdf"]);

export function customerFilesEnabled() {
  return process.env.CUSTOMER_FILES_ENABLED === "true";
}

export function validateCustomerFile(input: {
  kind: CustomerFileKind;
  name: string;
  type: string;
  size: number;
}) {
  const name = input.name.trim();
  const type = input.type.trim().toLowerCase();

  if (!name || name.length > 180 || name.includes("/") || name.includes("\\")) {
    return { ok: false as const, reason: "invalid-name" };
  }
  const maxBytes = input.kind === "maintenance_attachment" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
  if (!Number.isInteger(input.size) || input.size < 1 || input.size > maxBytes) {
    return { ok: false as const, reason: "invalid-size" };
  }

  const allowed = input.kind === "maintenance_attachment" ? maintenanceTypes : imageTypes;
  if (!allowed.has(type)) return { ok: false as const, reason: "invalid-type" };

  return { ok: true as const, name, type };
}

export function detectCustomerFileType(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") return "application/pdf";
  return null;
}

export function getCustomerFilesBucket(): CustomerFilesBucket | null {
  if (!customerFilesEnabled()) return null;
  try {
    const context = getCloudflareContext();
    const env = context.env as Record<string, unknown>;
    return (env.CUSTOMER_FILES_R2_BUCKET as CustomerFilesBucket | undefined) ?? null;
  } catch {
    return null;
  }
}
