"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema, type ResetPasswordInput } from "@/features/auth/schemas";
import { getClientErrorMessage } from "@/lib/errors/client-message";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: values.password });

      if (updateError) {
        setError(
          getClientErrorMessage(
            updateError,
            "Password reset failed. Open the latest reset link and try again.",
          ),
        );
        return;
      }

      router.replace("/app");
      router.refresh();
    } catch (caughtError) {
      setError(
        getClientErrorMessage(
          caughtError,
          "Password reset failed. Open the latest reset link and try again.",
        ),
      );
      return;
    }
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <div className="grid gap-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
        {form.formState.errors.password ? (
          <p className="text-sm text-[var(--danger)]">{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword ? (
          <p className="text-sm text-[var(--danger)]">
            {form.formState.errors.confirmPassword.message}
          </p>
        ) : null}
      </div>
      <Button disabled={form.formState.isSubmitting} type="submit">
        Update password
      </Button>
    </form>
  );
}
