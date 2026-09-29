import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { customerFilesEnabled, detectCustomerFileType, getCustomerFilesBucket, validateCustomerFile, type CustomerFileKind } from "../../../../lib/files/customer-files";

const kinds = new Set<CustomerFileKind>(["tool_photo", "damage_photo", "maintenance_attachment"]);

function redirectTarget(kind: CustomerFileKind, subjectId: string, notice: string, request: Request) {
  const path = kind === "tool_photo" ? `/app/tools/${subjectId}`
    : kind === "damage_photo" ? "/app/damage"
    : "/app/maintenance";
  const url = new URL(path, request.url);
  url.searchParams.set("notice", notice);
  return Response.redirect(url, 303);
}

export async function POST(request: Request) {
  if (!customerFilesEnabled()) return new Response("Customer file uploads are not enabled", { status: 503 });
  if (!isSupabaseConfigured()) return new Response("Storage unavailable", { status: 503 });

  const bucket = getCustomerFilesBucket();
  if (!bucket) return new Response("Customer file storage is not provisioned", { status: 503 });

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 11 * 1024 * 1024) {
    return new Response("Upload too large", { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response("Invalid multipart upload", { status: 400 });
  }
  const kindValue = form.get("kind");
  const subjectId = form.get("subjectId");
  const file = form.get("file");

  if (typeof kindValue !== "string" || !kinds.has(kindValue as CustomerFileKind) ||
      typeof subjectId !== "string" || !/^[0-9a-f-]{36}$/i.test(subjectId) ||
      !(file instanceof File)) {
    return new Response("Invalid upload", { status: 400 });
  }

  const kind = kindValue as CustomerFileKind;
  const validated = validateCustomerFile({ kind, name: file.name, type: file.type, size: file.size });
  if (!validated.ok) return redirectTarget(kind, subjectId, `file-${validated.reason}`, request);

  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return redirectTarget(kind, subjectId, "file-unavailable", request);
  }
  if (detectCustomerFileType(bytes) !== validated.type) {
    return redirectTarget(kind, subjectId, "file-invalid-type", request);
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return new Response("Authentication required", { status: 401 });

  const { data: reservation, error: reserveError } = await supabase.rpc("reserve_customer_file", {
    p_kind: kind,
    p_subject_id: subjectId,
    p_original_name: validated.name,
    p_content_type: validated.type,
    p_size_bytes: file.size,
  }).single();

  if (reserveError || !reservation) {
    const reason = reserveError?.message?.includes("Storage limit reached") ? "file-quota" : "file-unavailable";
    return redirectTarget(kind, subjectId, reason, request);
  }

  const reservationRecord = reservation as Record<string, unknown>;
  const fileId = reservationRecord.file_id;
  const objectKey = reservationRecord.object_key;
  if (typeof fileId !== "string" || !/^[0-9a-f-]{36}$/i.test(fileId) ||
      typeof objectKey !== "string" || !objectKey.includes("/")) {
    return redirectTarget(kind, subjectId, "file-unavailable", request);
  }

  try {
    await bucket.put(objectKey, bytes, {
      httpMetadata: { contentType: validated.type },
      customMetadata: {
        fileId,
        companyFileKind: kind,
        uploadedBy: String(claims.claims.sub),
      },
    });

    const { error: readyError } = await supabase.rpc("mark_customer_file_ready", { p_file_id: fileId });
    if (readyError) {
      await bucket.delete(objectKey).catch(() => undefined);
      await supabase.rpc("abandon_customer_file", { p_file_id: fileId });
      return redirectTarget(kind, subjectId, "file-unavailable", request);
    }
  } catch {
    await bucket.delete(objectKey).catch(() => undefined);
    await supabase.rpc("abandon_customer_file", { p_file_id: fileId });
    return redirectTarget(kind, subjectId, "file-unavailable", request);
  }

  return redirectTarget(kind, subjectId, "file-uploaded", request);
}
