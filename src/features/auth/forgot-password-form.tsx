"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/features/auth/schemas";
import { getClientErrorMessage } from "@/lib/errors/client-message";
import { getPublicEnv } from "@/lib/env/client";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setError(null);
    setNotice(null);
    try {
      const supabase = createClient();
      const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
      });

      if (resetError) {
        setError(getClientErrorMessage(resetError, "Password reset failed. Try again later."));
        return;
      }

      setNotice("If that email is registered, password reset instructions have been sent.");
    } catch (caughtError) {
      setError(getClientErrorMessage(caughtError, "Password reset failed. Try again later."));
      return;
    }
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="text-sm text-[var(--danger)]">{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <Button disabled={form.formState.isSubmitting} type="submit">
        Send reset link
      </Button>
    </form>
  );
}
