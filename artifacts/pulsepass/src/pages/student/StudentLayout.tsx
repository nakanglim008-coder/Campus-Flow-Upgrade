import { useLocation, Link } from "wouter";
import { useAuth } from "../../lib/auth";
import { LayoutDashboard, History, Plus, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/student", icon: LayoutDashboard, label: "Overview" },
    { href: "/student/new", icon: Plus, label: "New Request" },
    { href: "/student/history", icon: History, label: "History" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="glass-card border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1.5 rounded-lg hover:bg-[var(--color-secondary)]" onClick={() => setOpen(o => !o)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-gradient">PulsePass</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-[var(--color-muted-foreground)]">{user?.name}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] p-1.5 rounded-lg hover:bg-[var(--color-secondary)]"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`fixed md:static top-[57px] left-0 bottom-0 z-20 w-56 glass-card border-r border-[var(--color-border)] p-4 flex-col gap-1 transition-transform md:flex ${open ? "flex" : "hidden"}`}>
          <nav className="flex flex-col gap-1">
            {links.map(({ href, icon: Icon, label }) => {
              const active = location === href;
              return (
                <Link key={href} href={href}>
                  <a
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${active ? "bg-[oklch(0.3_0.1_150_/_0.45)] text-[var(--color-primary)] glow-border" : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </a>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
            <div className="px-3 py-2 rounded-xl bg-[var(--color-secondary)]">
              <p className="text-xs text-[var(--color-muted-foreground)]">Matric</p>
              <p className="text-xs font-mono font-semibold truncate">{user?.matric ?? "—"}</p>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {open && <div className="fixed inset-0 z-10 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}

        <main className="flex-1 p-4 md:p-6 max-w-4xl">{children}</main>
      </div>

      <footer className="text-center py-3 text-xs text-[var(--color-muted-foreground)]">
        Made by <span className="text-[var(--color-primary)] font-semibold">shadow</span>
      </footer>
    </div>
  );
}
