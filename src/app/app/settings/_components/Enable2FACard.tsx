"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useAlert } from "@/components/AlertProvider";
import { QRCodeSVG } from "qrcode.react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Copy, Shield, AlertTriangle } from "lucide-react";

type SetupStep = "initial" | "password" | "qrcode" | "verify" | "complete";

interface Enable2FACardProps {
  hasPassword: boolean;
}

export function Enable2FACard({ hasPassword }: Enable2FACardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState<SetupStep>("initial");
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const handleStartSetup = () => {
    if (!hasPassword) {
      showAlert({
        title: "Password required",
        description: "Please set up a password before enabling 2FA.",
        type: "error",
      });
      return;
    }
    setIsDialogOpen(true);
    setStep("password");
    setError("");
    setPassword("");
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setStep("initial");
    setPassword("");
    setVerificationCode("");
    setError("");
    setTotpUri("");
    setBackupCodes([]);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Enabling 2FA with password");
      const result = await authClient.twoFactor.enable({ password });

      console.log("Enable 2FA result:", result);

      if (result.error) {
        console.error("Enable error:", result.error);
        setError(result.error.message || "Failed to enable 2FA");
        setLoading(false);
        return;
      }

      if (result.data) {
        console.log("TOTP URI:", result.data.totpURI);
        console.log("Backup codes:", result.data.backupCodes);
        setTotpUri(result.data.totpURI);
        setBackupCodes(result.data.backupCodes || []);
        setStep("qrcode");
      }
    } catch (err: any) {
      console.error("Enable exception:", err);
      setError(err?.message || "Failed to enable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    showAlert({
      title: "Backup codes copied to clipboard",
      type: "success",
    });
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Verifying TOTP code:", verificationCode);

      await authClient.twoFactor.verifyTotp(
        {
          code: verificationCode,
        },
        {
          onSuccess: () => {
            console.log("Verification successful!");
            setStep("complete");
            setLoading(false);

            // Refresh the session to update twoFactorEnabled status
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          },
          onError: (ctx) => {
            console.error("Verification error:", ctx.error);
            setError(ctx.error.message || "Invalid code. Please try again.");
            setLoading(false);
          },
        },
      );
    } catch (err: any) {
      console.error("Verification exception:", err);
      setError(err?.message || "Invalid code. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by requiring a
            verification code from your authenticator app when signing in.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleStartSetup}>
            Enable Two-Factor Authentication
          </Button>
        </CardFooter>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          {/* Step 1: Password Verification */}
          {step === "password" && (
            <>
              <DialogHeader>
                <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                <DialogDescription>
                  Enter your password to continue setting up 2FA.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setup-password">Password</Label>
                  <Input
                    id="setup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    autoFocus
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Generating..." : "Continue"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}

          {/* Step 2: QR Code & Backup Codes */}
          {step === "qrcode" && (
            <>
              <DialogHeader>
                <DialogTitle>Scan QR Code</DialogTitle>
                <DialogDescription>
                  Scan this QR code with your authenticator app (Google
                  Authenticator, Authy, etc.)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* QR Code */}
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG value={totpUri} size={200} />
                </div>

                {/* Backup Codes */}
                {backupCodes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Backup Codes</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyBackupCodes}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <Alert>
                      <AlertDescription className="text-xs">
                        Save these backup codes in a safe place. You can use
                        them to sign in if you lose access to your authenticator
                        app.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-md font-mono text-xs">
                      {backupCodes.map((code, i) => (
                        <div key={i}>{code}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setStep("verify")}>Next: Verify</Button>
              </DialogFooter>
            </>
          )}

          {/* Step 3: Verify Code */}
          {step === "verify" && (
            <>
              <DialogHeader>
                <DialogTitle>Verify Setup</DialogTitle>
                <DialogDescription>
                  Enter the 6-digit code from your authenticator app to confirm
                  setup.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <Alert>
                  <AlertDescription className="text-xs">
                    <strong>Tip:</strong> TOTP codes refresh every 30 seconds.
                    Make sure your device time is synchronized correctly and try
                    entering a fresh code.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="verify-code">Verification Code</Label>
                  <Input
                    id="verify-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="000000"
                    maxLength={6}
                    disabled={loading}
                    className="text-center text-2xl tracking-widest font-mono"
                    autoFocus
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("qrcode")}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading ? "Verifying..." : "Verify & Enable"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}

          {/* Step 4: Complete */}
          {step === "complete" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  2FA Enabled Successfully!
                </DialogTitle>
                <DialogDescription>
                  Your account is now protected with two-factor authentication.
                  You&apos;ll need to enter a code from your authenticator app
                  when signing in.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={handleCloseDialog}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
