import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { api, type ExeatDTO } from "../../lib/api";
import { Clock, CheckCircle2, XCircle, ClipboardCheck, LogOut, Menu, X, Users, FileText } from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "oklch(0.78 0.16 80)", icon: Clock },
  approved: { label: "Approved", color: "oklch(0.70 0.20 150)", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "oklch(0.60 0.22 25)", icon: XCircle },
  departed: { label: "Departed", color: "oklch(0.72 0.18 250)", icon: ClipboardCheck },
  returned: { label: "Returned", color: "oklch(0.70 0.20 150)", icon: CheckCircle2 },
};

type Filter = "all" | "pending" | "approved" | "rejected";

export default function Admin() {
  const { user, logout } = useAuth();
  const [, nav] = useLocation();
  const [exeats, setExeats] = useState<ExeatDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [reviewing, setReviewing] = useState<ExeatDTO | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function load() {
    setLoading(true);
    api.exeats.all().then(setExeats).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!user) { nav("/auth"); return; }
    if (user.role !== "admin") { nav("/"); return; }
    load();
  }, [user]);

  async function handleReview(status: "approved" | "rejected") {
    if (!reviewing) return;
    if (status === "rejected" && !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await api.exeats.review(reviewing.id, status, rejectReason || undefined);
      setReviewing(null);
      setRejectReason("");
      await load();
    } catch {}
    setActionLoading(false);
  }

  const filtered = filter === "all" ? exeats : exeats.filter((e) => e.status === filter);
  const pendingCount = exeats.filter((e) => e.status === "pending").length;
  const stats = [
    { label: "Total", value: exeats.length, color: "oklch(0.62 0.18 150)" },
    { label: "Pending", value: pendingCount, color: "oklch(0.78 0.16 80)" },
    { label: "Approved", value: exeats.filter((e) => e.status === "approved" || e.status === "departed").length, color: "oklch(0.70 0.20 150)" },
    { label: "Rejected", value: exeats.filter((e) => e.status === "rejected").length, color: "oklch(0.60 0.22 25)" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="glass-card border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gradient">PulsePass</span>
          <span className="hidden sm:block text-xs px-2 py-0.5 rounded-full bg-[oklch(0.72_0.18_250_/_0.2)] text-[oklch(0.72_0.18_250)] font-medium">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-[var(--color-muted-foreground)]">{user?.name}</span>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] p-1.5 rounded-lg hover:bg-[var(--color-secondary)]">
            <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Admin Dashboard</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Manage student exeat requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-4 text-center space-y-1">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["pending", "all", "approved", "rejected"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-sm font-medium transition-colors capitalize ${filter === f ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"}`}
            >
              {f} {f === "pending" && pendingCount > 0 && <span className="ml-1 bg-[oklch(0.78_0.16_80_/_0.3)] text-[oklch(0.78_0.16_80)] rounded-full px-1.5 text-xs">{pendingCount}</span>}
            </button>
          ))}
        </div>

        {/* Requests list */}
        {loading && <p className="text-center py-12 text-[var(--color-muted-foreground)] text-sm">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--color-muted-foreground)]">
            <FileText className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No {filter !== "all" ? filter : ""} requests</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((e) => {
            const cfg = STATUS_CONFIG[e.status];
            const Icon = cfg.icon;
            return (
              <div key={e.id} className="glass-card rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${cfg.color}22` }}>
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{e.studentName}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{e.matric} · {e.hostel}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0" style={{ background: `${cfg.color}22`, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>

                <div className="pl-13 pl-[52px] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[var(--color-muted-foreground)]">Destination: </span>
                    <span className="font-medium">{e.destination}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-muted-foreground)]">Type: </span>
                    <span className="font-medium capitalize">{e.type}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-muted-foreground)]">Dates: </span>
                    <span className="font-medium">{e.departDate} → {e.returnDate}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-muted-foreground)]">Code: </span>
                    <span className="font-mono font-bold text-[var(--color-primary)]">{e.code}</span>
                  </div>
                </div>

                <p className="text-xs text-[var(--color-muted-foreground)] pl-[52px]">{e.reason}</p>

                {e.rejectReason && (
                  <p className="text-xs text-[var(--color-destructive)] pl-[52px]">Rejection: {e.rejectReason}</p>
                )}

                {e.status === "pending" && (
                  <div className="flex gap-2 pl-[52px]">
                    <button
                      onClick={() => setReviewing(e)}
                      className="px-4 py-1.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-semibold hover:opacity-90"
                    >
                      Review
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <footer className="text-center py-3 text-xs text-[var(--color-muted-foreground)]">
        Made by <span className="text-[var(--color-primary)] font-semibold">shadow</span>
      </footer>

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setReviewing(null)}>
          <div className="glass-card rounded-3xl p-6 w-full max-w-md space-y-5" onClick={(e) => e.stopPropagation()}>
            <div>
              <h2 className="text-lg font-bold">Review Request</h2>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                {reviewing.studentName} · {reviewing.destination}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">Rejection reason (required if rejecting)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="input-base resize-none"
                placeholder="Reason for rejection…"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleReview("approved")}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold text-sm hover:opacity-90 disabled:opacity-50"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleReview("rejected")}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[oklch(0.60_0.22_25_/_0.25)] text-[oklch(0.60_0.22_25)] font-semibold text-sm hover:opacity-90 disabled:opacity-40"
              >
                ✕ Reject
              </button>
            </div>

            <button onClick={() => setReviewing(null)} className="w-full py-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
