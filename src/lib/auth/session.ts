import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

/** Get the current session on the server (route handlers, server components). */
export function getSession() {
  return getServerSession(authOptions);
}

/**
 * Returns the authenticated user id, or null if there is no session.
 * Use in API routes to enforce authentication (R1.7).
 */
export async function requireUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}
