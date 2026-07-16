import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const { itemId } = await params;
  const { data, error } = await supabase.rpc("get_artifact_timeline", { p_item_id: itemId });

  if (error) return NextResponse.json({ error: "TIMELINE_UNAVAILABLE" }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}
