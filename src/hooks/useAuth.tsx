import { useEffect, useState } from "react";
import { auth } from "@/lib/auth";

interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    auth.api.getSession().then((sess) => {
      if (!cancelled) {
        if (sess?.user) {
          setUser({
            id: sess.user.id,
            name: sess.user.email || "",
            email: sess.user.email,
            image: sess.user.image || null,
          });
        } else {
          setUser(null);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user };
}
