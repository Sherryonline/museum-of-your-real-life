import { AuthFormCard } from "@/features/auth/auth-form-card";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthFormCard description="Request a reset link for the account email." title="Reset password">
      <ForgotPasswordForm />
    </AuthFormCard>
  );
}
