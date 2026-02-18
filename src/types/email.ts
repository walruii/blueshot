export type VerificationEmail = {
  verificationCode: string;
  email: string;
  name: string;
};

export type HelloWorldEmail = {
  email: string;
  msg: string;
};

export interface VerificationEmailProps {
  verificationCode: string;
}

export interface HelloWorldEmailProps {
  msg: string;
}
