"use server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const addPasswordAction = async (newPassword: string) => {
  const data = await auth.api.setPassword({
    body: {
      newPassword: newPassword,
    },
    headers: await headers(),
  });

  return data;
};
