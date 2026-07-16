import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const url = new URL(request.url);
  const { data, error } = await supabase.rpc("get_inventory_book", {
    p_category_id: url.searchParams.get("category_id") || null,
    p_page: Number(url.searchParams.get("page") ?? "1"),
  });

  if (error) return NextResponse.json({ error: "BOOK_UNAVAILABLE" }, { status: 500 });

  return NextResponse.json({ data });
}
