"use server";

import { HelloWorldEmail } from "@/components/emails/HelloWorld";
import { VerificationLinkEmail } from "@/components/emails/VerifyEmail";
import {
  HelloWorldEmail as THelloWorldEmail,
  VerificationEmailLink,
} from "@/types/email";
import { Result } from "@/types/returnType";
import { CreateEmailResponseSuccess, Resend } from "resend";
import crypto from "crypto";
import { Pool } from "pg";

const resend = new Resend(process.env.RESEND_API_KEY);
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
  info: VerificationEmailLink,
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
      subject: "Verify your Blueshot account",
      react: VerificationLinkEmail({
        verificationLink: info.verificationLink,
        name: info.name,
      }),
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

export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string,
): Promise<Result<CreateEmailResponseSuccess>> {
  try {
    if (!email) {
      console.error("No email provided");
      return { success: false, error: "No email provided" };
    }
    if (!token) {
      console.error("No verification token provided");
      return { success: false, error: "No verification token provided" };
    }
    if (!RESEND_FROM_EMAIL) {
      console.error("NO RESEND EMAIL");
      return { success: false, error: "Missing RESEND_FROM_EMAIL" };
    }

    const verificationLink = `${BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    const { data, error } = await resend.emails.send({
      from: `Blueshot <${RESEND_FROM_EMAIL}>`,
      to: email,
      subject: "Verify your Blueshot account",
      react: VerificationLinkEmail({
        verificationLink,
        name: name || "User",
      }),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: String(error) };
  }
}

export async function sendSignupVerificationEmail(
  email: string,
  name: string,
): Promise<Result<{ success: boolean; message: string }>> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const client = await pool.connect();

  try {
    if (!email) {
      return { success: false, error: "Email is required" };
    }
    if (!RESEND_FROM_EMAIL) {
      return { success: false, error: "Missing RESEND_FROM_EMAIL" };
    }

    // Generate a verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token in database
    await client.query(
      `INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [crypto.randomUUID(), email, verificationToken, expiresAt],
    );

    // Send verification email
    const result = await sendVerificationEmail(email, verificationToken, name);

    if (!result.success) {
      // Delete the token if email sending failed
      await client.query(`DELETE FROM verification WHERE value = $1`, [
        verificationToken,
      ]);
      return result;
    }

    return {
      success: true,
      data: {
        success: true,
        message: "Verification email sent successfully",
      },
    };
  } catch (error) {
    console.error("Error sending signup verification email:", error);
    return {
      success: false,
      error: `Failed to send verification email: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    client.release();
  }
}
