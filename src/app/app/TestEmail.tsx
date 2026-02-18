"use client";
import { Button } from "@/components/ui/button";
import { helloWorldEmail, verificationEmail } from "@/server-actions/email";
import { useState } from "react";

export default function TestEmail() {
  const [loading, setLoading] = useState(false);

  const handleVerfication = async () => {
    if (loading) return;
    setLoading(true);
    const res = await verificationEmail({
      email: "XXX",
      name: "walruii",
      verificationCode: "GET-SOME-GAME-BRUH",
    });
    if (!res.success) {
      console.error(res);
      setLoading(false);
    }
    setLoading(false);
  };
  const handleTestEmail = async () => {
    if (loading) return;
    setLoading(true);
    const res = await helloWorldEmail({
      email: "XXX",
      msg: "hiiiii :)",
    });
    if (!res.success) {
      console.error(res);
      setLoading(false);
    }
    setLoading(false);
  };
  return (
    <>
      <Button disabled={loading} onClick={() => handleTestEmail()}>
        send Hello world email
      </Button>
      <Button disabled={loading} onClick={() => handleVerfication()}>
        send verfication
      </Button>
    </>
  );
}
