"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/ui/logo";
import { useRouter } from "next/navigation";
import {
  Mail01Icon,
  Loading03Icon,
  Alert01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";
import { toast } from "sonner";
import { Field, FieldLabel, FieldContent } from "@/components/ui/field";

export function AuthLoginForm() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session?.user && !isPending) {
      router.push("/documents");
    }
  }, [session, isPending, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || "Failed to sign in");
        toast.error("Login failed", {
          description: res.error.message,
        });
      } else {
        toast.success("Welcome back!");
        router.push("/documents");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid email or password";
      setError(msg);
      toast.error("Login failed", { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden p-6 md:p-10">
      {/* Background radial accent */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="absolute h-[600px] w-[600px] rounded-full bg-zinc-200/50 dark:bg-zinc-800/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo size={48} className="size-12 text-foreground shrink-0" />
          <h1 className="font-sans text-2xl font-bold tracking-tight">
            BhuSamanvay
          </h1>
          <p className="text-sm text-muted-foreground text-balance">
            Intelligent Land Record Digitization and Validation
          </p>
        </div>

        <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Sign in with your registered email credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                <HugeiconsIcon icon={Alert01Icon} className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <FieldContent>
                  <Input
                    id="email"
                    name="email"
                    autoComplete="username"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </FieldContent>
              </Field>
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <FieldContent className="relative">
                  <Input
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 w-full transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-0 cursor-pointer"
                  >
                    <HugeiconsIcon icon={showPassword ? ViewOffSlashIcon : ViewIcon} className="h-4 w-4" />
                  </button>
                </FieldContent>
              </Field>
              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Mail01Icon} className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
