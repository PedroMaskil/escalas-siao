"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    // Busca o perfil para saber se é admin ou usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role === "admin") {
      router.push("/dashboard/admin");
    } else {
      router.push("/dashboard");
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Digite seu e-mail acima para recuperar a senha.");
      return;
    }
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setError(null);
    setLoading(false);
    alert("E-mail de recuperação enviado. Verifique sua caixa de entrada.");
  }

  return (
    <main className="login-root">
      <div className="login-card">
        {/* Logo / marca */}
        <div className="login-brand">
          <div className="login-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect
                x="3" y="5" width="18" height="14" rx="3"
                stroke="currentColor" strokeWidth="1.5"
              />
              <path
                d="M8 10h8M8 14h5"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              />
            </svg>
          </div>
          <h1>Escalas</h1>
          <p>Som · Transmissão · Luz · Projeção</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} noValidate>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <button
          type="button"
          className="btn-forgot"
          onClick={handleForgotPassword}
          disabled={loading}
        >
          Esqueci minha senha
        </button>
      </div>

      <style>{`
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f4f0;
          padding: 24px;
          font-family: 'Geist', 'Inter', sans-serif;
        }

        .login-card {
          background: #ffffff;
          border: 0.5px solid rgba(0,0,0,0.1);
          border-radius: 16px;
          padding: 40px 36px 32px;
          width: 100%;
          max-width: 380px;
        }

        /* Brand */
        .login-brand {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: #EEEDFE;
          color: #534AB7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
        }

        .login-brand h1 {
          font-size: 22px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 4px;
          letter-spacing: -0.4px;
        }

        .login-brand p {
          font-size: 13px;
          color: #888;
          margin: 0;
        }

        /* Campos */
        .field {
          margin-bottom: 16px;
        }

        .field label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #444;
          margin-bottom: 6px;
        }

        .field input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border: 0.5px solid rgba(0,0,0,0.15);
          border-radius: 8px;
          font-size: 14px;
          color: #1a1a1a;
          background: #fff;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }

        .field input:focus {
          border-color: #534AB7;
          box-shadow: 0 0 0 3px rgba(83, 74, 183, 0.12);
        }

        .field input::placeholder {
          color: #bbb;
        }

        /* Erro */
        .login-error {
          font-size: 13px;
          color: #A32D2D;
          background: #FCEBEB;
          border-radius: 8px;
          padding: 8px 12px;
          margin: 0 0 14px;
        }

        /* Botão principal */
        .btn-primary {
          width: 100%;
          height: 42px;
          border-radius: 8px;
          background: #534AB7;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          margin-top: 6px;
          transition: background 0.15s, opacity 0.15s;
          letter-spacing: 0.01em;
        }

        .btn-primary:hover:not(:disabled) {
          background: #4338a0;
        }

        .btn-primary:active:not(:disabled) {
          transform: scale(0.98);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Link esqueci senha */
        .btn-forgot {
          display: block;
          width: 100%;
          margin-top: 14px;
          background: none;
          border: none;
          font-size: 13px;
          color: #888;
          cursor: pointer;
          text-align: center;
          padding: 4px;
          transition: color 0.15s;
        }

        .btn-forgot:hover {
          color: #534AB7;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .login-root {
            background: #111110;
          }
          .login-card {
            background: #1c1c1a;
            border-color: rgba(255,255,255,0.08);
          }
          .login-brand h1 {
            color: #f0ede8;
          }
          .login-brand p {
            color: #666;
          }
          .field label {
            color: #aaa;
          }
          .field input {
            background: #252523;
            border-color: rgba(255,255,255,0.1);
            color: #f0ede8;
          }
          .field input:focus {
            border-color: #7F77DD;
            box-shadow: 0 0 0 3px rgba(127,119,221,0.15);
          }
          .field input::placeholder {
            color: #555;
          }
          .btn-forgot {
            color: #555;
          }
          .btn-forgot:hover {
            color: #7F77DD;
          }
        }
      `}</style>
    </main>
  );
}