"use server";

import { HelloWorldEmail } from "@/components/emails/HelloWorld";
import { VerificationEmail } from "@/components/emails/VerifyEmail";
import {
  HelloWorldEmail as THelloWorldEmail,
  VerificationEmail as TVerificationEmail,
} from "@/types/email";
import { Result } from "@/types/returnType";
import { CreateEmailResponseSuccess, Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

export async function helloWorldEmail(
  info: THelloWorldEmail,
): Promise<Result<CreateEmailResponseSuccess>> {
  try {
    if (!info || !info.email) {
      console.error("No Email sent");
      return { success: false, error: "No emails provided" };
    }
    if (!RESEND_FROM_EMAIL) {
      console.error("NO RESEND EMAIL");
      return { success: false, error: "Missing RESEND_FROM_EMAIL" };
    }

    const { data, error } = await resend.emails.send({
      from: `Blueshot <${RESEND_FROM_EMAIL}>`,
      to: info.email,
      subject: "Hello world",
      react: HelloWorldEmail(info),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: String(error) };
  }
}

export async function verificationEmail(
  info: TVerificationEmail,
): Promise<Result<CreateEmailResponseSuccess>> {
  try {
    if (!info || !info.email) {
      console.error("No Email sent");
      return { success: false, error: "No emails provided" };
    }
    if (!RESEND_FROM_EMAIL) {
      console.error("NO RESEND EMAIL");
      return { success: false, error: "Missing RESEND_FROM_EMAIL" };
    }

    const { data, error } = await resend.emails.send({
      from: `Blueshot <${RESEND_FROM_EMAIL}>`,
      to: info.email,
      subject: "Verification email",
      react: VerificationEmail(info),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: String(error) };
  }
}
