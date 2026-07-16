"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { PageWrapper } from "@/components/PageWrapper";
import { User, Key, Camera, Sliders } from "lucide-react";
import { SessionUser } from "@/types/auth";

interface ConfiguracoesClientProps {
  initialUser: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    hierarchyLevel: number;
  };
}

export default function ConfiguracoesClient({ initialUser }: ConfiguracoesClientProps) {
  const { data: session, update } = useSession();
  const user = session?.user as SessionUser | undefined;

  // Profile fields state
  const [name, setName] = useState(user?.name || initialUser.name || "");
  const [imageUrl, setImageUrl] = useState(user?.image || initialUser.image || "");
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({ type: "error", text: "A foto de perfil deve ter no maximo 5MB" });
      return;
    }

    setUploadingImage(true);
    setProfileMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/users/profile/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.imageUrl);
        setProfileMessage({ type: "success", text: "Foto de perfil enviada com sucesso" });
        
        // Update Session
        await update({
          ...session,
          user: {
            ...session?.user,
            image: data.imageUrl,
          }
        });
      } else {
        const errData = await res.json();
        setProfileMessage({ type: "error", text: errData.error || "Erro ao carregar foto" });
      }
    } catch (e) { console.error(e);
      setProfileMessage({ type: "error", text: "Erro ao enviar arquivo para o servidor" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMessage(null);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setProfileMessage({ type: "success", text: "Nome de perfil atualizado com sucesso" });
        
        // Update Session
        await update({
          ...session,
          user: {
            ...session?.user,
            name,
          }
        });
      } else {
        const errData = await res.json();
        setProfileMessage({ type: "error", text: errData.error || "Erro ao atualizar perfil" });
      }
    } catch (e) { console.error(e);
      setProfileMessage({ type: "error", text: "Erro de conexao com o servidor" });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "As novas senhas nao coincidem" });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "A nova senha deve ter pelo menos 6 caracteres" });
      return;
    }

    setUpdatingPassword(true);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setPasswordMessage({ type: "success", text: "Senha alterada com sucesso" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const errData = await res.json();
        setPasswordMessage({ type: "error", text: errData.error || "Erro ao alterar senha" });
      }
    } catch (e) { console.error(e);
      setPasswordMessage({ type: "error", text: "Erro de conexao com o servidor" });
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-brand-extra1">Configuracoes da Conta</h1>
          <p className="text-xs text-brand-terciar/65">
            Gerencie suas informacoes de perfil, faca upload de sua foto e atualize sua credencial de acesso.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Card: Account Summary */}
          <div className="lg:col-span-1 p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm flex flex-col items-center justify-between text-center space-y-4">
            <div className="space-y-3 w-full flex flex-col items-center">
              <label className="relative group cursor-pointer block w-20 h-20 rounded-full overflow-hidden border border-brand-terciar/15 shadow-sm transform-gpu transition-transform hover:scale-105 active:scale-95">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"}
                  alt={name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>

              <div>
                <h2 className="text-sm font-bold text-brand-extra1">{name}</h2>
                <p className="text-[10px] text-brand-terciar/50">{user?.email || initialUser.email}</p>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-principal text-[10px] font-bold text-brand-secundar uppercase tracking-wider border border-brand-terciar/5">
                <Sliders className="w-3 h-3 text-brand-secundar" />
                Lvl {user?.hierarchyLevel || initialUser.hierarchyLevel} ({user?.role || initialUser.role})
              </div>
            </div>

            <div className="w-full border-t border-brand-terciar/10 pt-4 text-left space-y-2">
              <p className="text-[10px] text-brand-terciar/65 font-mono uppercase tracking-wider">Metadados da Conta</p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-brand-terciar/50 block">Id Interno:</span>
                  <span className="font-mono text-brand-extra1 truncate block">{user?.id || initialUser.id}</span>
                </div>
                <div>
                  <span className="text-brand-terciar/50 block">Status:</span>
                  <span className="text-emerald-700 font-bold block">ATIVO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-brand-terciar" />
                Detalhes do Perfil
              </h3>

              {profileMessage && (
                <div className={`p-3 rounded-lg text-xs border ${
                  profileMessage.type === "success" 
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold" 
                    : "border-red-200 bg-red-50 text-red-800"
                }`}>
                  {profileMessage.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase block">Foto de Perfil</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand-principal border border-brand-terciar/15 rounded-lg text-xs font-bold text-brand-secundar hover:bg-brand-principal/80 transition-colors cursor-pointer w-full text-center">
                        <Camera className="w-4 h-4 text-brand-secundar" />
                        Enviar Nova Foto
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                    {uploadingImage && (
                      <span className="text-[9px] text-brand-secundar font-semibold animate-pulse block mt-1">Enviando arquivo...</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="px-4 py-1.5 bg-brand-secundar text-white font-bold rounded-lg text-xs hover:bg-brand-secundar/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {updatingProfile ? "Salvando..." : "Salvar Nome"}
                  </button>
                </div>
              </form>
            </div>

            {/* Card: Change Password */}
            <div className="p-5 rounded-2xl border border-brand-terciar/10 bg-white shadow-sm space-y-4">
              <h3 className="text-xs font-mono uppercase text-brand-terciar/60 tracking-wider flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-brand-terciar" />
                Alterar Senha de Acesso
              </h3>

              {passwordMessage && (
                <div className={`p-3 rounded-lg text-xs border ${
                  passwordMessage.type === "success" 
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold" 
                    : "border-red-200 bg-red-50 text-red-800"
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Senha Atual</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Sua senha atual"
                      className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Nova Senha</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nova senha forte"
                      className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-brand-terciar/70 font-mono uppercase">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme a senha"
                      className="w-full px-3 py-1.5 bg-white border border-brand-terciar/15 rounded-lg text-xs text-brand-terciar focus:outline-none focus:border-brand-secundar"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="px-4 py-1.5 bg-brand-secundar text-white font-bold rounded-lg text-xs hover:bg-brand-secundar/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {updatingPassword ? "Alterando..." : "Alterar Senha"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>
    </PageWrapper>
  );
}
