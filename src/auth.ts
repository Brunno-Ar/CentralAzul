import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { dbSim } from "./lib/db";
import { Company } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Demo Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha (qualquer uma para demo)", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const emailStr = (credentials.email as string).toLowerCase();
        const passwordStr = credentials.password as string;

        // If logging in as admin@grupoazul.com.br, verify the password is admin12345
        if (emailStr === "admin@grupoazul.com.br" && passwordStr !== "admin12345") {
          return null;
        }

        let user = await dbSim.getUserByEmail(emailStr);
        
        if (!user && emailStr.includes("@")) {
          const domain = emailStr.split("@")[1]?.toLowerCase();
          const namePart = emailStr.split("@")[0];
          
          const name = namePart
            .split(/[._-]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          let company: Company = Company.CENTRAL;
          if (domain.includes("borgodelvin")) company = Company.BORGO;
          else if (domain.includes("maplebear")) company = Company.MAPLE_BEAR;
          else if (domain.includes("azulinc")) company = Company.AZUL;

          const isSystemAdmin = emailStr === "admin@grupoazul.com.br";

          user = await dbSim.addUser({
            name: isSystemAdmin ? "Administrador Central" : name,
            email: emailStr,
            role: isSystemAdmin ? "ADMIN" : "VIEWER",
            hierarchyLevel: isSystemAdmin ? 1 : 3,
            company,
          });
        }

        if (user) {
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
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "VIEWER";
        token.hierarchyLevel = (user as any).hierarchyLevel || 3;
        token.company = (user as any).company || Company.CENTRAL;
        token.status = (user as any).status || "ACTIVE";
      }

      // Handle updating the session on role change in the UI
      if (trigger === "update" && session) {
        token.role = session.role ?? token.role;
        token.hierarchyLevel = session.hierarchyLevel ?? token.hierarchyLevel;
        token.company = session.company ?? token.company;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).hierarchyLevel = token.hierarchyLevel;
        (session.user as any).company = token.company;
        (session.user as any).status = token.status;
      }
      return session;
    },
  },
});
