import { resendVerificationEmail } from "@/server-actions/resendVerification";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await resendVerificationEmail(email);

    if (result.success) {
      return NextResponse.json(
        { success: true, message: "Verification email sent successfully" },
        { status: 200 },
      );
    } else {
      // Check if it's a rate limit error by looking for the "wait X seconds" message
      const retryMatch = result.error?.match(/wait (\d+) seconds/);
      if (retryMatch) {
        const retryAfter = parseInt(retryMatch[1], 10);
        return NextResponse.json(
          {
            error: result.error,
            retryAfter,
          },
          { status: 429 }, // Too Many Requests
        );
      }

      return NextResponse.json(
        { error: result.error || "Failed to resend verification email" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error in resend verification endpoint:", error);
    return NextResponse.json(
      { error: "An internal error occurred" },
      { status: 500 },
    );
  }
}
