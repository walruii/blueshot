import {
  VerificationEmailProps,
  VerificationEmailLinkProps,
} from "@/types/email";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export const VerificationEmail = ({
  verificationCode,
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your verification code for Blueshot</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Verify your email</Heading>
        <Text style={text}>
          Enter the following verification code to finish logging in to your
          account. This code will expire in 10 minutes.
        </Text>
        <Section style={codeContainer}>
          <Text style={code}>{verificationCode}</Text>
        </Section>
        <Text style={footer}>
          If you didn&apos;t request this email, you can safely ignore it.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const VerificationLinkEmail = ({
  verificationLink,
  name = "User",
}: VerificationEmailLinkProps) => (
  <Html>
    <Head />
    <Preview>Verify your Blueshot account</Preview>
    <Body style={mainStyle}>
      <Container style={containerStyle}>
        {/* Header */}
        <Section style={headerSection}>
          <Text style={logoText}>🔵 Blueshot</Text>
        </Section>

        {/* Main Content */}
        <Section style={contentSection}>
          <Heading style={headingStyle}>Welcome to Blueshot!</Heading>
          <Text style={paragraphStyle}>Hi {name},</Text>
          <Text style={paragraphStyle}>
            Thanks for signing up. Please verify your email address to complete
            your registration and unlock full access to your account.
          </Text>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Link href={verificationLink} style={buttonStyle}>
              Verify Email Address
            </Link>
          </Section>

          {/* Fallback Text */}
          <Text style={fallbackTextStyle}>
            Or copy and paste this link in your browser:
          </Text>
          <Link href={verificationLink} style={linkStyle}>
            {verificationLink}
          </Link>

          {/* Security Notice */}
          <Section style={securitySection}>
            <Text style={securityText}>
              This link will expire in 24 hours. If you didn&apos;t create this
              account, you can safely ignore this email.
            </Text>
          </Section>
        </Section>

        {/* Footer */}
        <Section style={footerSection}>
          <Text style={footerText}>© 2024 Blueshot. All rights reserved.</Text>
          <Text style={footerTextSmall}>
            Questions? Reply to this email or contact us at support@blueshot.com
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// --- Old Component Styles ---
const main = {
  backgroundColor: "#f6f9fc",
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e1e1e1",
  borderRadius: "8px",
  margin: "0 auto",
  padding: "40px",
  width: "448px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const text = {
  color: "#444",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "center" as const,
};

const codeContainer = {
  background: "#f4f4f4",
  borderRadius: "4px",
  margin: "24px 0",
  padding: "16px",
};

const code = {
  color: "#000",
  fontSize: "32px",
  fontWeight: "700",
  letterSpacing: "6px",
  lineHeight: "40px",
  margin: "0",
  textAlign: "center" as const,
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  marginTop: "20px",
  textAlign: "center" as const,
};

// --- New Link-Based Email Styles ---
const mainStyle = {
  backgroundColor: "#f8f9fa",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  padding: "20px 0",
};

const containerStyle = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "12px",
  overflow: "hidden" as const,
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
};

const headerSection = {
  backgroundColor: "#0f172a",
  padding: "40px 20px",
  textAlign: "center" as const,
};

const logoText = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0",
  letterSpacing: "-0.5px",
};

const contentSection = {
  padding: "40px 32px",
};

const headingStyle = {
  color: "#0f172a",
  fontSize: "28px",
  fontWeight: "700",
  lineHeight: "36px",
  margin: "0 0 24px 0",
};

const paragraphStyle = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const buttonStyle = {
  backgroundColor: "#0f172a",
  color: "#ffffff",
  padding: "12px 32px",
  textDecoration: "none",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "600",
  display: "inline-block",
  border: "2px solid #0f172a",
};

const fallbackTextStyle = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "20px 0 8px 0",
};

const linkStyle = {
  color: "#0f172a",
  fontSize: "12px",
  lineHeight: "16px",
  wordBreak: "break-all" as const,
};

const securitySection = {
  backgroundColor: "#f1f5f9",
  borderLeft: "4px solid #e0e7ff",
  padding: "16px",
  borderRadius: "6px",
  margin: "32px 0",
};

const securityText = {
  color: "#475569",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};

const footerSection = {
  backgroundColor: "#f8f9fa",
  padding: "24px 32px",
  borderTop: "1px solid #e2e8f0",
  textAlign: "center" as const,
};

const footerText = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 8px 0",
};

const footerTextSmall = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0",
};
