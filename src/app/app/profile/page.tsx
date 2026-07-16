import { notFound } from "next/navigation";

import { ProfileForm } from "@/features/profile/profile-form";
import { requireUser } from "@/lib/auth/guards";

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="mt-2 text-[var(--muted)]">Only editable profile fields are exposed here.</p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
