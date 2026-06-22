import { withAuth } from "next-auth/middleware";

/**
 * Protects authenticated areas (R1.7). Unauthenticated browser navigations are
 * redirected to /login; the matcher scopes this to the dashboard segment only,
 * leaving marketing and auth pages public.
 */
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/audits/:path*",
    "/documents/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
