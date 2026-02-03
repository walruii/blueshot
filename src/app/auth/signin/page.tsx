// import { signIn } from "@/auth";

export default function Page() {
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <h1>LOGIN</h1>
      <form className="flex flex-col">
        <label>
          email
          <input name="email" type="email" />
        </label>
        <label>
          password
          <input name="password" type="password" />
        </label>
        <button>Sign in</button>
      </form>
    </div>
  );
}
