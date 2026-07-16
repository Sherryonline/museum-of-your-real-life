import "server-only";

import { Resend } from "resend";
import { z } from "zod";

const resendEnvSchema = z.object({
  RESEND_API_KEY: z
    .string()
    .min(1, "RESEND_API_KEY is required")
    .startsWith("re_", "RESEND_API_KEY should start with re_"),
  RESEND_FROM_EMAIL: z.email().default("onboarding@resend.dev"),
});

function getResendEnv() {
  const result = resendEnvSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  });

  if (!result.success) {
    const details = result.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid Resend environment: ${details}`);
  }

  return result.data;
}

export function createResendClient() {
  const env = getResendEnv();
  return new Resend(env.RESEND_API_KEY);
}

export async function sendResendTestEmail() {
  const env = getResendEnv();
  const resend = new Resend(env.RESEND_API_KEY);

  return resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: "sherrytranonline@gmail.com",
    subject: "Hello World",
    html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
  });
}
