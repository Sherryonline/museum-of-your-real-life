"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { getClientErrorMessage } from "@/lib/errors/client-message";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setError(null);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword(values);

      if (signInError) {
        setError(getClientErrorMessage(signInError, "Invalid email or password."));
        return;
      }

      router.replace(searchParams.get("next") ?? "/app");
      router.refresh();
    } catch (caughtError) {
      setError(getClientErrorMessage(caughtError, "Invalid email or password."));
      return;
    }
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="text-sm text-[var(--danger)]">{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-[var(--danger)]">{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      <Button disabled={form.formState.isSubmitting} type="submit">
        Log in
      </Button>
      <div className="flex justify-between text-sm text-[var(--muted)]">
        <Link className="hover:text-slate-950" href="/forgot-password">
          Forgot password?
        </Link>
        <Link className="hover:text-slate-950" href="/register">
          Create account
        </Link>
      </div>
    </form>
  );
}
