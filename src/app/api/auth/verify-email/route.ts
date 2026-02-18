import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(req: NextRequest) {
  const client = await pool.connect();
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/verify-email?error=invalid", req.url),
      );
    }

    // Find the verification record for this token
    const verificationResult = await client.query(
      `SELECT * FROM verification WHERE value = $1 AND "expiresAt" > NOW()`,
      [token],
    );

    if (verificationResult.rows.length === 0) {
      return NextResponse.redirect(
        new URL("/auth/verify-email?error=expired", req.url),
      );
    }

    const verification = verificationResult.rows[0];

    // Get the user based on the identifier (email)
    const userResult = await client.query(
      `SELECT id, name, email FROM "user" WHERE email = $1`,
      [verification.identifier],
    );

    if (userResult.rows.length === 0) {
      return NextResponse.redirect(
        new URL("/auth/verify-email?error=invalid", req.url),
      );
    }

    const user = userResult.rows[0];

    // Check if user is already verified
    if (user.emailVerified === true) {
      // Already verified - redirect to signin with verified message
      return NextResponse.redirect(
        new URL("/auth/signin?verified=true", req.url),
      );
    }

    // Update user's emailVerified flag
    await client.query(
      `UPDATE "user" SET "emailVerified" = true, "updatedAt" = NOW() WHERE id = $1`,
      [user.id],
    );

    // Delete the used verification token
    await client.query(`DELETE FROM verification WHERE id = $1`, [
      verification.id,
    ]);

    // Create a session for the verified user
    const sessionId = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await client.query(
      `INSERT INTO session (id, "userId", "expiresAt", token, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [sessionId, user.id, expiresAt, sessionId],
    );

    // Create response with redirect to signin to show success message
    const response = NextResponse.redirect(
      new URL("/auth/signin?verified=true", req.url),
    );

    // Set the session cookie
    response.cookies.set({
      name: "better-auth.session_token",
      value: sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Email verification error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isExpired = errorMessage.toLowerCase().includes("expired");
    const errorCode = isExpired ? "expired" : "invalid";

    return NextResponse.redirect(
      new URL(`/auth/verify-email?error=${errorCode}`, req.url),
    );
  } finally {
    client.release();
  }
}
