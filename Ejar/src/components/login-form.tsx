import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

type LoginFormProps = React.ComponentProps<"div">;

export const LoginForm: React.FC<LoginFormProps> = ({ className, ...props }) => {
  const navigate = useNavigate();
  const { login, isLoading, error, user, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      await login(email, password);
      
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string; verification_required?: boolean; email?: string; phone_number?: string } } };

      if (errorObj.response?.data?.verification_required) {
        navigate("/verify", {
          replace: true,
          state: {
            channel: "email",
            email: errorObj.response.data.email ?? email,
            phone_number: errorObj.response.data.phone_number,
          },
        });
        return;
      }

      const errorMessage =
        errorObj.response?.data?.detail ||
        (err instanceof Error ? err.message : "Login failed");
      setFormError(errorMessage);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="backdrop-blur-lg text-white text-2xl font-black">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email and password to login</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin}>
            <FieldGroup>
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500 text-red-500 text-sm">
                  {formError}
                </div>
              )}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <Button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-900 w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <a href="/register" className="hover:bg-white hover:text-black p-2 rounded-2xl">
                    Sign up
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
