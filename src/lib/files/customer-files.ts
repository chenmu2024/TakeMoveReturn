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
  if (!Number.isInteger(input.size) || input.size < 1 || input.size > 10 * 1024 * 1024) {
    return { ok: false as const, reason: "invalid-size" };
  }

  const allowed = input.kind === "maintenance_attachment" ? maintenanceTypes : imageTypes;
  if (!allowed.has(type)) return { ok: false as const, reason: "invalid-type" };

  return { ok: true as const, name, type };
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
