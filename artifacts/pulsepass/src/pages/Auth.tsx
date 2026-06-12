import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Shield, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function Auth() {
  const [, nav] = useLocation();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    matric: "",
    hostel: "",
  });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await api.auth.login(form.email, form.password);
      } else {
        await api.auth.signup({
          email: form.email,
          password: form.password,
          name: form.name,
          role: "student",
          matric: form.matric,
          hostel: form.hostel,
        });
      }
      await refresh();
      nav("/student");
    } catch (err: unknown) {
      setError((err as Error).message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[oklch(0.3_0.1_150_/_0.4)] flex items-center justify-center glow-border">
              <Shield className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gradient">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-[var(--color-muted-foreground)] text-sm">
            {mode === "login" ? "Sign in to your student account" : "Register as a student"}
          </p>
        </div>

        {/* Card */}
        <form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">Full Name</label>
              <input value={form.name} onChange={set("name")} required className="input-base" placeholder="Ada Obi" />
            </div>
          )}
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">Matric Number</label>
                <input value={form.matric} onChange={set("matric")} required className="input-base" placeholder="CSC/2021/001" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">Hostel</label>
                <input value={form.hostel} onChange={set("hostel")} required className="input-base" placeholder="Block A, Room 12" />
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-[var(--color-destructive)] bg-[oklch(0.6_0.22_25_/_0.12)] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity glow-border"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--color-muted-foreground)]">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="text-[var(--color-primary)] font-medium hover:underline"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>

        <button onClick={() => nav("/")} className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mx-auto">
          <ArrowLeft className="w-3 h-3" /> Back to home
        </button>
      </div>

      <footer className="mt-auto pt-10 text-xs text-[var(--color-muted-foreground)]">
        Made by <span className="text-[var(--color-primary)] font-semibold">shadow</span>
      </footer>
    </div>
  );
}
