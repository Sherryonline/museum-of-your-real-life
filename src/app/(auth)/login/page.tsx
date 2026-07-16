import { AuthFormCard } from "@/features/auth/auth-form-card";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <AuthFormCard description="Use your email and password to access your private museum." title="Log in">
      <LoginForm />
    </AuthFormCard>
  );
}
