import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const { data, error } = await supabase.rpc("get_inventory_progress");

  if (error) return NextResponse.json({ error: "PROGRESS_UNAVAILABLE" }, { status: 500 });

  return NextResponse.json({ data: data?.[0] ?? null });
}
