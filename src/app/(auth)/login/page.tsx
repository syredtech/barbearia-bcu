"use client";
import { Suspense, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { analytics } from "@/lib/analytics";

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const rawCallback  = searchParams.get("callbackUrl");
  const callbackUrl  = rawCallback?.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/";

  const [mode, setMode]     = useState<"login" | "register">("login");
  const [form, setForm]     = useState({ name: "", email: "", password: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [ageConfirmed, setAgeConfirmed]   = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl: callbackUrl });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "register") {
      if (!acceptedTerms || !ageConfirmed) {
        setError("Deve aceitar os termos e confirmar a idade mínima.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/auth/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao cadastrar.");
        setLoading(false);
        return;
      }
      analytics.userSignup();
    }

    const result = await signIn("credentials", {
      email: form.email, password: form.password, redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setError("E-mail ou senha incorretos.");
    } else {
      const session = await getSession();
      if (session?.user.role === "owner") router.push("/painel");
      else if (session?.user.role === "admin") router.push("/admin");
      else if (session?.user.role === "client") router.push("/minha-conta");
      else {
        const safeUrl = callbackUrl?.startsWith("/") ? callbackUrl : "/";
        router.push(safeUrl);
      }
      router.refresh();
    }
  }

  return (
    <main className="min-h-[88vh] flex">
      {/* Left brand panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#f7f4f0] px-14 py-14 shrink-0">
        <Link href="/" className="text-xs text-muted hover:text-ink transition-colors duration-200">
          ← Voltar
        </Link>
        <div>
          <span
            className="pointer-events-none select-none font-serif font-bold leading-none block text-ink/[0.05]"
            style={{ fontSize: "200px" }}
            aria-hidden="true"
          >
            &amp;
          </span>
          <p className="font-serif text-4xl font-bold text-ink leading-tight" style={{ marginTop: "-24px" }}>
            O seu look,<br />agendado.
          </p>
          <p className="text-muted text-sm font-light mt-4 max-w-[260px]">
            Os melhores profissionais de Cabo Verde ao alcance de um toque.
          </p>
        </div>
        <div>
          <p className="font-serif font-bold text-ink text-sm">Bela &amp; Belo</p>
          <p className="text-muted text-xs mt-0.5 uppercase tracking-widest">Barba, Cabelo e Unha</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-[400px]">
          {/* Back link — mobile only */}
          <Link href="/" className="lg:hidden inline-block text-xs text-muted hover:text-ink transition-colors mb-10">
            ← Voltar
          </Link>

          <h1 className="font-serif text-4xl font-bold text-ink mb-1">
            {mode === "login" ? "Bem-vindo." : "Criar conta."}
          </h1>
          <p className="text-muted text-sm font-light mb-8">
            {mode === "login" ? "Aceda à sua conta Bela & Belo" : "Registe-se gratuitamente"}
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-[#ebebeb] rounded-card
                       py-3 text-sm font-light text-ink hover:border-[#bbb] transition-all duration-200 mb-5"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2 14-5.3l-6.5-5.5C29.7 35 27 36 24 36c-5.2 0-9.6-3.4-11.2-8H6.2C9.5 36.1 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.5 5.5C41.7 35.5 44 30.1 44 24c0-1.3-.1-2.7-.4-3.9z"/>
            </svg>
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#ebebeb]" />
            <span className="text-xs text-muted">ou</span>
            <div className="flex-1 h-px bg-[#ebebeb]" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === "register" && (
              <input
                type="text" placeholder="Nome completo"
                aria-label="Nome completo"
                value={form.name} onChange={(e) => update("name", e.target.value)}
                required
                className="border border-[#ebebeb] rounded-card px-4 py-3 text-sm font-light
                           focus:outline-none focus:border-ink transition-colors duration-200"
              />
            )}
            <input
              type="email" placeholder="E-mail"
              aria-label="E-mail"
              value={form.email} onChange={(e) => update("email", e.target.value)}
              required
              className="border border-[#ebebeb] rounded-card px-4 py-3 text-sm font-light
                         focus:outline-none focus:border-ink transition-colors duration-200"
            />
            <input
              type="password" placeholder="Senha"
              aria-label="Senha"
              minLength={mode === "register" ? 8 : undefined}
              maxLength={72}
              value={form.password} onChange={(e) => update("password", e.target.value)}
              required
              className="border border-[#ebebeb] rounded-card px-4 py-3 text-sm font-light
                         focus:outline-none focus:border-ink transition-colors duration-200"
            />

            {mode === "register" && (
              <div className="flex flex-col gap-2.5 mt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox" checked={ageConfirmed}
                    onChange={(e) => { setAgeConfirmed(e.target.checked); setError(""); }}
                    className="mt-0.5 shrink-0 accent-ink"
                  />
                  <span className="text-xs text-muted font-light leading-relaxed">
                    Confirmo que tenho pelo menos 16 anos de idade.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox" checked={acceptedTerms}
                    onChange={(e) => { setAcceptedTerms(e.target.checked); setError(""); }}
                    className="mt-0.5 shrink-0 accent-ink"
                  />
                  <span className="text-xs text-muted font-light leading-relaxed">
                    Li e aceito os{" "}
                    <Link href="/termos" target="_blank" className="text-ink underline underline-offset-2">
                      Termos e Condições
                    </Link>{" "}
                    e a{" "}
                    <Link href="/privacidade" target="_blank" className="text-ink underline underline-offset-2">
                      Política de Privacidade
                    </Link>.
                  </span>
                </label>
              </div>
            )}

            {error && <p className="text-red-500 text-sm font-light">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="bg-ink text-white rounded-card py-3 text-sm font-medium mt-1
                         hover:bg-[#333] transition-all duration-200 disabled:opacity-40"
            >
              {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p className="text-center text-sm text-muted font-light mt-6">
            {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-ink underline underline-offset-2"
            >
              {mode === "login" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
