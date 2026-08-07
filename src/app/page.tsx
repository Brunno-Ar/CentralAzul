"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Lock, Mail, ArrowRight, Info } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check: if the hidden website_url field has any value, a bot filled it
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const honeypotValue = formData.get("website_url");
    if (honeypotValue && String(honeypotValue).trim() !== "") {
      console.warn("[SECURITY] Honeypot triggered on login form - bot detected", {
        honeypotValue: String(honeypotValue).substring(0, 100),
      });
      // Silently appear successful to the bot but do nothing
      setLoading(true);
      return;
    }

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = (await signIn("credentials", {
        email,
        password,
        redirect: false,
      })) as { error?: string | null } | undefined;

      if (result && result.error) {
        setError("Credenciais invalidas ou usuario nao cadastrado.");
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Erro inesperado no servidor. Tente novamente.");
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert("Solicitacao de redefinicao de senha enviada para o administrador de TI.");
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-principal">
        <span className="w-8 h-8 border-4 border-brand-secundar border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuroraBackground className="px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-brand-extra1/15 bg-white shadow-2xl relative z-10 text-brand-terciar"
      >
        {/* Header/Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-secundar to-brand-extra3 shadow-md mb-4">
            <Shield className="w-6 h-6 text-brand-principal" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-brand-secundar sm:text-2xl">
            AZUL INCORPORACOES
          </h1>
          <p className="mt-1.5 text-xs text-brand-extra1/80 uppercase tracking-widest font-mono font-semibold">
            Central Integrada
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 text-xs text-red-700 border border-red-200 bg-red-50 rounded-lg flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Corporate Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {/* Honeypot field - hidden from humans, filled by bots */}
          <input
            type="text"
            name="website_url"
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />
          <div className="space-y-1.5">
            <label className="text-[10px] text-brand-terciar/70 font-mono uppercase font-bold block">
              E-mail Corporativo
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-brand-extra1/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome.sobrenome@azulinc.com.br"
                className="w-full pl-9 pr-4 py-2 bg-brand-principal/20 border border-brand-extra1/15 rounded-xl text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-brand-terciar/70 font-mono uppercase font-bold block">
                Senha de Acesso
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[10px] text-brand-secundar font-semibold hover:underline focus:outline-none"
              >
                Esqueci a senha
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-brand-extra1/40" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insira sua senha corporativa"
                className="w-full pl-9 pr-4 py-2 bg-brand-principal/20 border border-brand-extra1/15 rounded-xl text-xs text-brand-terciar placeholder-brand-terciar/45 focus:outline-none focus:border-brand-secundar focus:bg-white transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center w-full px-4 py-3 mt-6 text-xs font-bold text-white bg-brand-secundar rounded-xl hover:bg-brand-secundar/90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-extra3 shadow-md cursor-pointer group disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Autenticando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Entrar no Sistema
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </button>
        </form>

        {/* Access Warning Notice */}
        <div className="mt-8 pt-5 border-t border-brand-extra1/10 text-center">
          <p className="text-[9px] text-brand-terciar/65 uppercase tracking-widest font-mono leading-relaxed">
            Aviso: Este e um sistema interno do Grupo Azul Incorporacoes destinado exclusivamente para funcionarios autorizados. Todas as tentativas de acesso sao registradas e auditadas.
          </p>
        </div>
      </motion.div>
    </AuroraBackground>
  );
}
