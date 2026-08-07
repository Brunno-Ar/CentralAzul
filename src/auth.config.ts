import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { db } from "./lib/db";

const providers = [];

if (process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID || "common"}/v2.0`,
    })
  );
}

// Carrega a duracao da sessao dinamicamente do banco de dados
let sessionMaxAge = 60 * 60 * 24; // 24h padrao
try {
  const maxAgeConfig = await db.getSystemConfig("sessionMaxAge");
  if (maxAgeConfig) {
    sessionMaxAge = parseInt(maxAgeConfig, 10);
  }
} catch (e) {
  console.warn("Nao foi possivel carregar sessionMaxAge dinamicamente:", e);
}

export const authConfig = {
  providers,
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: sessionMaxAge,
    updateAge: 60 * 60,   // 1h silent refresh
  },
  jwt: {
    maxAge: sessionMaxAge,
  },
} satisfies NextAuthConfig;
