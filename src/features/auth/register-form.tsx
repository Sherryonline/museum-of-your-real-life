"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";
import { getClientErrorMessage } from "@/lib/errors/client-message";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", displayName: "" },
  });

  async function onSubmit(values: RegisterInput) {
    setError(null);
    setNotice(null);
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { display_name: values.displayName } },
      });

      if (signUpError) {
        setError(
          getClientErrorMessage(signUpError, "Registration failed. Check your details and try again."),
        );
        return;
      }

      setNotice("Account created. Check email confirmation if it is enabled.");
      router.refresh();
    } catch (caughtError) {
      setError(
        getClientErrorMessage(caughtError, "Registration failed. Check your details and try again."),
      );
      return;
    }
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <div className="grid gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" autoComplete="name" {...form.register("displayName")} />
        {form.formState.errors.displayName ? (
          <p className="text-sm text-[var(--danger)]">
            {form.formState.errors.displayName.message}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="text-sm text-[var(--danger)]">{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
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
        Register
      </Button>
      <Link className="text-sm text-[var(--muted)] hover:text-slate-950" href="/login">
        Already have an account?
      </Link>
    </form>
  );
}
