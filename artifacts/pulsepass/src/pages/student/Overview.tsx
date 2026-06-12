import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { api, type ExeatDTO } from "../../lib/api";
import { QRCodeSVG } from "qrcode.react";
import { ClipboardCheck, Clock, XCircle, CheckCircle2, Plus } from "lucide-react";
import StudentLayout from "./StudentLayout";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "oklch(0.78 0.16 80)", icon: Clock },
  approved: { label: "Approved", color: "oklch(0.70 0.20 150)", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "oklch(0.60 0.22 25)", icon: XCircle },
  departed: { label: "Departed", color: "oklch(0.72 0.18 250)", icon: ClipboardCheck },
  returned: { label: "Returned", color: "oklch(0.70 0.20 150)", icon: CheckCircle2 },
};

export default function Overview() {
  const { user } = useAuth();
  const [, nav] = useLocation();
  const [exeats, setExeats] = useState<ExeatDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState<ExeatDTO | null>(null);

  useEffect(() => {
    api.exeats.my().then(setExeats).finally(() => setLoading(false));
  }, []);

  const active = exeats.find((e) => e.status === "approved" || e.status === "departed");
  const recent = exeats.slice(0, 5);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Good day, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            {user?.hostel} · {user?.matric}
          </p>
        </div>

        {/* Active pass */}
        {active && (
          <div className="glass-card rounded-2xl p-5 border border-[oklch(0.7_0.2_150_/_0.4)] glow-border">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-primary)]">Active Pass</span>
                <h2 className="font-semibold text-lg">{active.destination}</h2>
                <p className="text-sm text-[var(--color-muted-foreground)]">Returns: {active.returnDate}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-mono text-sm bg-[var(--color-secondary)] px-2 py-0.5 rounded">{active.code}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${STATUS_CONFIG[active.status].color}22`, color: STATUS_CONFIG[active.status].color }}>
                    {STATUS_CONFIG[active.status].label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowQr(active)}
                className="flex-shrink-0 w-16 h-16 bg-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
              >
                <QRCodeSVG value={active.code} size={52} level="M" />
              </button>
            </div>
          </div>
        )}

        {!active && !loading && (
          <button
            onClick={() => nav("/student/new")}
            className="w-full py-6 glass-card rounded-2xl border-dashed border-[var(--color-primary)] border flex flex-col items-center gap-2 hover:bg-[oklch(0.3_0.1_150_/_0.1)] transition-colors"
          >
            <Plus className="w-6 h-6 text-[var(--color-primary)]" />
            <span className="text-sm font-medium text-[var(--color-primary)]">Submit an exeat request</span>
          </button>
        )}

        {/* Recent requests */}
        {recent.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">Recent Requests</h2>
            <div className="space-y-2">
              {recent.map((e) => {
                const cfg = STATUS_CONFIG[e.status];
                const Icon = cfg.icon;
                return (
                  <div key={e.id} className="glass-card rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: `${cfg.color}22` }}>
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{e.destination}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{e.departDate} → {e.returnDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(e.status === "approved" || e.status === "departed") && (
                        <button
                          onClick={() => setShowQr(e)}
                          className="text-xs text-[var(--color-primary)] font-medium hover:underline"
                        >
                          QR
                        </button>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${cfg.color}22`, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-[var(--color-muted-foreground)] text-sm">Loading…</div>
        )}
      </div>

      {/* QR Modal */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowQr(null)}>
          <div className="glass-card rounded-3xl p-8 flex flex-col items-center gap-5 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-lg">Pass QR Code</h2>
            <div className="bg-white rounded-2xl p-4">
              <QRCodeSVG value={showQr.code} size={180} level="H" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-mono font-bold text-xl text-[var(--color-primary)]">{showQr.code}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">{showQr.destination}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Show to security at the gate</p>
            </div>
            <button onClick={() => setShowQr(null)} className="w-full py-2.5 rounded-xl bg-[var(--color-secondary)] text-sm font-medium hover:opacity-90">
              Close
            </button>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
