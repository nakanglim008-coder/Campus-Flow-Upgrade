import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { ShieldCheck, Eye, EyeOff, Lock } from "lucide-react";

type Props = { role: "admin" | "security" };

export default function InviteSignup({ role }: Props) {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const [, nav] = useLocation();
  const { refresh } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.signup({
        email: form.email,
        password: form.password,
        name: form.name,
        role,
        inviteToken: token,
      });
      await refresh();
      setSuccess(true);
      setTimeout(() => nav(role === "admin" ? "/admin" : "/security"), 1200);
    } catch (err: unknown) {
      setError((err as Error).message ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  const label = role === "admin" ? "Admin" : "Security Officer";
  const color = role === "admin" ? "oklch(0.72 0.18 250)" : "oklch(0.72 0.18 35)";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}22`, boxShadow: `0 0 20px ${color}30` }}>
              {role === "admin" ? <ShieldCheck className="w-6 h-6" style={{ color }} /> : <Lock className="w-6 h-6" style={{ color }} />}
            </div>
          </div>
          <h1 className="text-2xl font-bold" style={{ color }}>
            {label} Registration
          </h1>
          <p className="text-[var(--color-muted-foreground)] text-sm">
            This page is for authorized <b className="text-[var(--color-foreground)]">{label.toLowerCase()}</b> accounts only.
          </p>
        </div>

        {success ? (
          <div className="glass-card rounded-2xl p-8 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <p className="font-semibold text-[var(--color-success)]">Account created! Redirecting…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">Full Name</label>
              <input value={form.name} onChange={set("name")} required className="input-base" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set("email")} required className="input-base" placeholder="you@school.edu.ng" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  required
                  minLength={8}
                  className="input-base pr-10"
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-[var(--color-destructive)] bg-[oklch(0.6_0.22_25_/_0.12)] rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: color, boxShadow: `0 0 20px ${color}40` }}
            >
              {loading ? "Creating account…" : `Register as ${label}`}
            </button>
          </form>
        )}
      </div>

      <footer className="mt-auto pt-10 text-xs text-[var(--color-muted-foreground)]">
        Made by <span className="text-[var(--color-primary)] font-semibold">shadow</span>
      </footer>
    </div>
  );
}
