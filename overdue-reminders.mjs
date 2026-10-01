async function rpc(env, name, body = {}) {
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${name} returned ${response.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

async function sendReminder(env, candidate) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.OVERDUE_REMINDER_FROM || "TakeMoveReturn <support@takemovereturn.com>",
      to: [candidate.recipient_email],
      subject: `${candidate.overdue_count} overdue tool${Number(candidate.overdue_count) === 1 ? "" : "s"} · ${candidate.company_name}`,
      text: [
        `TakeMoveReturn found ${candidate.overdue_count} checked-out tool${Number(candidate.overdue_count) === 1 ? "" : "s"} past the expected return date for ${candidate.company_name}.`,
        `Oldest expected return: ${candidate.oldest_due_date}.`,
        "",
        "Open the workspace to review the current holder and recorded location:",
        "https://takemovereturn.com/app/tools?overdue=1",
        "",
        "This reminder is based on recorded handoffs, not live GPS.",
      ].join("\n"),
    }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Resend returned ${response.status}: ${text.slice(0, 300)}`);
}

export async function handleOverdueReminders(env) {
  if (env.OVERDUE_REMINDERS_ENABLED !== "true") return { skipped: "disabled" };
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.RESEND_API_KEY) {
    console.error(JSON.stringify({ event: "overdue_reminders_skipped", reason: "credentials-missing" }));
    return { skipped: "credentials-missing" };
  }

  const candidates = await rpc(env, "overdue_reminder_candidates", { p_limit: 100 });
  let sent = 0;
  let failed = 0;

  for (const candidate of Array.isArray(candidates) ? candidates : []) {
    try {
      await sendReminder(env, candidate);
      await rpc(env, "complete_overdue_reminder", {
        p_dispatch_id: candidate.dispatch_id,
        p_succeeded: true,
        p_error: null,
      });
      sent++;
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message : "Unknown reminder error";
      await rpc(env, "complete_overdue_reminder", {
        p_dispatch_id: candidate.dispatch_id,
        p_succeeded: false,
        p_error: message.slice(0, 1000),
      }).catch(() => undefined);
      console.error(JSON.stringify({ event: "overdue_reminder_failed", dispatchId: candidate.dispatch_id, message: message.slice(0, 300) }));
    }
  }

  console.log(JSON.stringify({ event: "overdue_reminders_completed", sent, failed }));
  return { sent, failed };
}
