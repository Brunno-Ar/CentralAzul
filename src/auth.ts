import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "./lib/db";
import { verifyTotp } from "./lib/mfa";

async function getAuthDefaults(userRole?: string | null, userLevel?: number | null, userCompany?: string | null) {
  const defaults = await db.getAuthDefaults();
  let role = userRole || defaults.defaultRole;
  let hierarchyLevel = userLevel;
  let company = userCompany;

  // Resolve hierarchy level from role if not set or dynamic sync
  if (hierarchyLevel === null || hierarchyLevel === undefined) {
    try {
      const roles = await db.getRoles();
      const dbRole = roles.find((r: any) => r.name === role);
      hierarchyLevel = dbRole ? dbRole.hierarchyLevel : defaults.defaultHierarchyLevel;
    } catch {
      hierarchyLevel = defaults.defaultHierarchyLevel;
    }
  }

  // Resolve company if not set
  if (!company) {
    company = defaults.defaultCompany;
  }

  return { role, hierarchyLevel, company };
}

// Only enable demo credentials in development mode
const isDevelopment = process.env.NODE_ENV === "development";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    ...(isDevelopment
      ? [
          Credentials({
            name: "Demo Credentials",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Senha (qualquer uma para demo)", type: "password" },
              totpCode: { label: "Codigo TOTP (opcional)", type: "text" },
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password) return null;

              const emailStr = (credentials.email as string).toLowerCase();
              const passwordStr = credentials.password as string;

              // Check if account is locked
              const lockout = await db.checkAccountLockout(emailStr);
              if (lockout.locked) {
                const lockedUntilStr = lockout.lockedUntil
                  ? lockout.lockedUntil.toLocaleString("pt-BR")
                  : "";
                throw new Error(`conta bloqueada${lockedUntilStr ? ` ate ${lockedUntilStr}` : ""}`);
              }

              const user = await db.getUserByEmail(emailStr);

              if (user) {
                // Verify password from the database
                const bcrypt = await import("bcryptjs");
                if (user.password) {
                  const isBcryptHash =
                    user.password.startsWith("$2a$") ||
                    user.password.startsWith("$2b$") ||
                    user.password.startsWith("$2y$");
                  const isPasswordValid = isBcryptHash
                    ? await bcrypt.compare(passwordStr, user.password)
                    : passwordStr === user.password;
                  if (!isPasswordValid) {
                    // Record failed login attempt
                    const failedLockout = await db.recordFailedLoginAttempt(emailStr);
                    if (failedLockout.locked) {
                      const lockedUntilStr = failedLockout.lockedUntil
                        ? failedLockout.lockedUntil.toLocaleString("pt-BR")
                        : "";
                      throw new Error(`conta bloqueada${lockedUntilStr ? ` ate ${lockedUntilStr}` : ""}`);
                    }
                    return null;
                  }
                }
              } else {
                return null;
              }

              // Password is correct - reset failed login attempts
              await db.resetFailedLoginAttempts(emailStr);

              if (user) {
                // Check if MFA is enabled system-wide
                const mfaEnabled = await db.isMfaEnabled();
                if (mfaEnabled) {
                  const userMfa = await db.getUserMfa(user.id);
                  if (userMfa && userMfa.enabled) {
                    const totpCode = credentials.totpCode as string | undefined;
                    if (!totpCode) {
                      throw new Error("mfa_required");
                    }
                    if (!verifyTotp(totpCode, userMfa.secret)) {
                      return null;
                    }
                  }
                }

                return {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  image: user.image,
                  role: user.role,
                  hierarchyLevel: user.hierarchyLevel,
                  company: user.company,
                  status: user.status,
                };
              }
              return null;
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as {
          id?: string;
          name?: string | null;
          email?: string | null;
          image?: string | null;
          role?: string;
          hierarchyLevel?: number;
          company?: string;
          status?: string;
        };
        token.id = u.id;
        token.name = u.name;
        token.email = u.email;
        token.picture = u.image;
        token.status = u.status || "ACTIVE";

        const defaults = await getAuthDefaults(u.role, u.hierarchyLevel, u.company);
        token.role = defaults.role;
        token.hierarchyLevel = defaults.hierarchyLevel;
        token.company = defaults.company;
      }

      // Handle updating the session on profile/role changes in the UI
      if (trigger === "update" && session) {
        const sessionData = session as {
          role?: string;
          hierarchyLevel?: number;
          company?: string;
          user?: { name?: string | null; image?: string | null };
        };
        token.role = sessionData.role ?? token.role;
        token.hierarchyLevel = sessionData.hierarchyLevel ?? token.hierarchyLevel;
        token.company = sessionData.company ?? token.company;
        if (sessionData.user) {
          token.name = sessionData.user.name ?? token.name;
          token.picture = sessionData.user.image ?? token.picture;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as {
          id?: string;
          name?: string | null;
          email?: string | null;
          image?: string | null;
          role?: string;
          hierarchyLevel?: number;
          company?: string;
          status?: string;
        };
        u.id = token.id as string;
        u.name = token.name as string | null | undefined;
        u.email = token.email as string | null | undefined;
        u.image = token.picture as string | null | undefined;
        u.role = token.role as string;
        u.hierarchyLevel = token.hierarchyLevel as number;
        u.company = token.company as string;
        u.status = token.status as string;
      }
      return session;
    },
  },
});
