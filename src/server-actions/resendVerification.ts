"use server";

import { Pool } from "pg";
import { Result } from "@/types/returnType";
import { sendVerificationEmail } from "@/server-actions/email";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface ResendVerificationResult {
  success: boolean;
  message: string;
  retryAfter?: number;
  error?: string;
}

export async function resendVerificationEmail(
  email: string,
): Promise<Result<ResendVerificationResult>> {
  const client = await pool.connect();

  try {
    // Validate email format
    if (!email || !email.includes("@")) {
      return {
        success: false,
        error: "Invalid email address",
      };
    }

    // Check if user exists
    const userResult = await client.query(
      `SELECT id, name FROM "user" WHERE email = $1`,
      [email],
    );

    if (userResult.rows.length === 0) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const user = userResult.rows[0];

    // Check if user is already verified
    const verifiedResult = await client.query(
      `SELECT "emailVerified" FROM "user" WHERE email = $1`,
      [email],
    );

    if (verifiedResult.rows[0].emailVerified) {
      return {
        success: false,
        error: "Email is already verified",
      };
    }

    // Rate limiting: check if a verification email was sent in the last 60 seconds
    const recentVerificationResult = await client.query(
      `SELECT "createdAt" FROM verification
       WHERE identifier = $1
       AND "createdAt" > NOW() - INTERVAL '60 seconds'
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      [email],
    );

    if (recentVerificationResult.rows.length > 0) {
      // Calculate how many seconds until the next resend is allowed
      const lastCreatedAt = new Date(
        recentVerificationResult.rows[0].createdAt,
      );
      const secondsElapsed = Math.floor(
        (Date.now() - lastCreatedAt.getTime()) / 1000,
      );
      const retryAfter = Math.max(1, 60 - secondsElapsed);

      return {
        success: false,
        error: `Please wait ${retryAfter} seconds before requesting a new verification email`,
      };
    }

    // Generate a new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create a new verification record
    await client.query(
      `INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [crypto.randomUUID(), email, verificationToken, expiresAt],
    );

    // Send verification email
    const emailResult = await sendVerificationEmail(
      email,
      verificationToken,
      user.name,
    );

    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error || "Failed to send verification email",
      };
    }

    return {
      success: true,
      data: {
        success: true,
        message: "Verification email sent successfully",
      } as ResendVerificationResult,
    };
  } catch (error) {
    console.error("Error resending verification email:", error);
    return {
      success: false,
      error: "An error occurred while resending the verification email",
    };
  } finally {
    client.release();
  }
}
