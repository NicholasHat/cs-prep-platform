import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Single-user auth: Google OAuth with an email allowlist, JWT sessions
 * (no database adapter — nothing auth-related to persist for one user).
 */
const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    signIn({ user }) {
      const email = user.email?.toLowerCase();
      return !!email && allowedEmails.includes(email);
    },
  },
});
