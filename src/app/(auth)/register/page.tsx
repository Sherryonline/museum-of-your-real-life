import { AuthFormCard } from "@/features/auth/auth-form-card";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthFormCard description="Create a secure account before adding any personal archive data." title="Register">
      <RegisterForm />
    </AuthFormCard>
  );
}
