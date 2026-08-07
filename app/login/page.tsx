import { LoginForm } from "@/src/components/login-form";
import { getBranding } from "@/src/config/branding";

export default function LoginPage() {
  return <LoginForm branding={getBranding()} />;
}
