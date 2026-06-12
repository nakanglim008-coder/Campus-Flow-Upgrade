import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { useEffect } from "react";
import { Shield, QrCode, ClipboardCheck, ArrowRight, Lock } from "lucide-react";

export default function Landing() {
  const { user, loading } = useAuth();
  const [, nav] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") nav("/admin");
      else if (user.role === "security") nav("/security");
      else nav("/student");
    }
  }, [user, loading, nav]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 glass-card border-b border-[var(--color-border)]">
        <span className="text-lg font-bold text-gradient">PulsePass</span>
        <button
          onClick={() => nav("/auth")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Student Login <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 gap-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-primary)] bg-[oklch(0.3_0.1_150_/_0.18)] text-[var(--color-primary)] text-xs font-medium uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
          Smart Campus Movement System
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-gradient max-w-3xl leading-tight">
          Leave campus. Stay safe.
        </h1>
        <p className="text-[var(--color-muted-foreground)] text-lg max-w-xl">
          PulsePass digitises every step of the exeat process — from request to gate scan. No paper. No delays.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <button
            onClick={() => nav("/auth")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold hover:opacity-90 transition-opacity glow-border"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => nav("/auth")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-foreground)] font-medium hover:bg-[var(--color-secondary)] transition-colors"
          >
            <Lock className="w-4 h-4" /> Admin / Security
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-3 gap-4 mt-12 w-full max-w-3xl text-left">
          {[
            { icon: ClipboardCheck, title: "Digital Requests", desc: "Submit and track exeat requests instantly from your phone." },
            { icon: Shield, title: "Admin Review", desc: "Admins approve or reject requests with notes, in real-time." },
            { icon: QrCode, title: "Gate QR Scan", desc: "Security scans the pass QR code to mark departure & return." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card rounded-2xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[oklch(0.3_0.1_150_/_0.4)] flex items-center justify-center">
                <Icon className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-[var(--color-muted-foreground)] text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-5 text-xs text-[var(--color-muted-foreground)]">
        Made by <span className="text-[var(--color-primary)] font-semibold">shadow</span>
      </footer>
    </div>
  );
}
