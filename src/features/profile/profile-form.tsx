"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/features/profile/schemas";
import { getClientErrorMessage } from "@/lib/errors/client-message";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile }: Readonly<{ profile: Profile }>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: profile.display_name,
      avatarKey: profile.avatar_key,
      museumVisibility: profile.museum_visibility,
    },
  });

  async function onSubmit(values: ProfileUpdateInput) {
    setError(null);
    setNotice(null);
    const supabase = createClient();
    const updateResult = await supabase
      .from("profiles")
      .update({
        display_name: values.displayName,
        avatar_key: values.avatarKey,
        museum_visibility: values.museumVisibility,
      })
      .eq("id", profile.id)
      .then(
        (result) => result,
        (caughtError: unknown) => ({
          data: null,
          count: null,
          status: 0,
          statusText: "",
          error: new Error(getClientErrorMessage(caughtError, "Profile update failed.")),
        }),
      );
    const { error: updateError } = updateResult;

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotice("Profile saved.");
    router.refresh();
  }

  return (
    <form className="grid max-w-xl gap-5" onSubmit={form.handleSubmit(onSubmit)}>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <div className="grid gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" {...form.register("displayName")} />
        {form.formState.errors.displayName ? (
          <p className="text-sm text-[var(--danger)]">
            {form.formState.errors.displayName.message}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="avatarKey">Avatar key</Label>
        <Input id="avatarKey" placeholder="default" {...form.register("avatarKey")} />
        {form.formState.errors.avatarKey ? (
          <p className="text-sm text-[var(--danger)]">{form.formState.errors.avatarKey.message}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="museumVisibility">Museum visibility</Label>
        <select
          className="focus-ring h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm shadow-sm"
          id="museumVisibility"
          {...form.register("museumVisibility")}
        >
          <option value="PRIVATE">Private</option>
          <option value="PUBLIC">Public</option>
        </select>
      </div>
      <Button className="w-fit" disabled={form.formState.isSubmitting} type="submit">
        <Save aria-hidden="true" className="h-4 w-4" />
        Save profile
      </Button>
    </form>
  );
}
