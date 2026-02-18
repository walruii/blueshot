import { HelloWorldEmailProps } from "@/types/email";

export function HelloWorldEmail({ msg }: HelloWorldEmailProps) {
  return (
    <div>
      <h1>Hello, World</h1>
      <p>{msg}</p>
    </div>
  );
}
