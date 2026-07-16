import { AuthFormCard } from "@/features/auth/auth-form-card";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthFormCard description="Choose a new password after opening a valid reset link." title="New password">
      <ResetPasswordForm />
    </AuthFormCard>
  );
}
