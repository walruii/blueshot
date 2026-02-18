import { VerificationEmailProps } from "@/types/email";
import {
  Body,
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

// --- Styles ---
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
