"use client";
import { authClient } from "@/lib/auth-client";
import { sendSignupVerificationEmail } from "@/server-actions/email";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAlert } from "@/components/AlertProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { showAlert } = useAlert();

  const signUp = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    await authClient.signUp.email(
      { email, password, name },
      {
        onRequest: () => setLoading(true),
        onError: (ctx) => {
          setLoading(false);
          setError(ctx.error.message);
        },
        onSuccess: async () => {
          try {
            // Send verification email
            const emailResult = await sendSignupVerificationEmail(email, name);
            if (!emailResult.success) {
              showAlert({
                title: "Warning",
                description:
                  "Account created but verification email failed. Please try resending.",
                type: "error",
              });
            }
            // Redirect to verify-email page
            router.push(
              `/auth/verify-email?email=${encodeURIComponent(email)}`,
            );
          } catch (err) {
            router.push("/app");
            showAlert({
              title: "Error",
              description:
                "Account created but failed to send verification email. Please try resending.",
              type: "error",
            });
          } finally {
            setLoading(false);
          }
        },
      },
    );
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 md:mb-12">
        Blueshot
      </h1>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-destructive text-sm mb-4">{error}</div>
          )}
          <form onSubmit={(e) => signUp(e)} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
