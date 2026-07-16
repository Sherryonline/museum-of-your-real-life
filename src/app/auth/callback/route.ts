import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

const allowedNextPaths = new Set(["/app", "/reset-password"]);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const requestedNext = requestUrl.searchParams.get("next") ?? "/app";
  const next = allowedNextPaths.has(requestedNext) ? requestedNext : "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=email_confirmation_failed`);
}
