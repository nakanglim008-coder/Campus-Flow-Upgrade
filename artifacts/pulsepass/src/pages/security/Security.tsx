import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { api, type ExeatDTO } from "../../lib/api";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, LogOut, ScanLine, Users } from "lucide-react";

type ScanResult = {
  kind: "valid-out" | "valid-in" | "invalid" | "expired";
  message: string;
};

export default function Security() {
  const { user, logout } = useAuth();
  const [, nav] = useLocation();
  const [tab, setTab] = useState<"scan" | "active">("scan");
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [active, setActive] = useState<ExeatDTO[]>([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (!user) { nav("/auth"); return; }
    if (user.role !== "security") { nav("/"); return; }
    return () => { stopScanner(); };
  }, [user]);

  useEffect(() => {
    if (tab === "active") loadActive();
  }, [tab]);

  async function loadActive() {
    setLoadingActive(true);
    api.exeats.active().then(setActive).finally(() => setLoadingActive(false));
  }

  async function startScanner() {
    setResult(null);
    setScanning(true);
    try {
      const qr = new Html5Qrcode("qr-reader");
      scannerRef.current = qr;
      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (code) => {
          if (processingRef.current) return;
          processingRef.current = true;
          await handleScan(code);
          await stopScanner();
        },
        () => {},
      );
    } catch (err) {
      setScanning(false);
      setResult({ kind: "invalid", message: "Camera not available. Use manual entry." });
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
    processingRef.current = false;
  }

  async function handleScan(code: string) {
    const trimmed = code.trim().toUpperCase();
    try {
      const r = await api.exeats.scan(trimmed);
      setResult(r);
    } catch {
      setResult({ kind: "invalid", message: "Network error. Try again." });
    }
  }

  async function handleManual(e: React.FormEvent) {
    e.preventDefault();
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    setResult(null);
    await handleScan(code);
  }

  const resultBg = {
    "valid-out": "oklch(0.70 0.20 150)",
    "valid-in": "oklch(0.72 0.18 250)",
    invalid: "oklch(0.60 0.22 25)",
    expired: "oklch(0.78 0.16 80)",
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="glass-card border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gradient">PulsePass</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[oklch(0.72_0.18_35_/_0.2)] text-[oklch(0.72_0.18_35)] font-medium">Security</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-[var(--color-muted-foreground)]">{user?.name}</span>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] p-1.5 rounded-lg hover:bg-[var(--color-secondary)]">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 p-4 pb-0 max-w-lg mx-auto w-full">
        {(["scan", "active"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${tab === t ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]"}`}
          >
            {t === "scan" ? <span className="flex items-center justify-center gap-1.5"><ScanLine className="w-4 h-4" /> Scan</span> : <span className="flex items-center justify-center gap-1.5"><Users className="w-4 h-4" /> Active Passes</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4">
        {tab === "scan" && (
          <>
            {/* Scanner box */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="relative bg-black" style={{ minHeight: scanning ? 280 : 0 }}>
                <div id="qr-reader" className="w-full" />
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Corners */}
                    <div className="absolute top-[14%] left-[14%] w-10 h-10 border-t-2 border-l-2 border-[var(--color-primary)]" />
                    <div className="absolute top-[14%] right-[14%] w-10 h-10 border-t-2 border-r-2 border-[var(--color-primary)]" />
                    <div className="absolute bottom-[14%] left-[14%] w-10 h-10 border-b-2 border-l-2 border-[var(--color-primary)]" />
                    <div className="absolute bottom-[14%] right-[14%] w-10 h-10 border-b-2 border-r-2 border-[var(--color-primary)]" />
                    {/* Scan line */}
                    <div className="absolute left-[14%] right-[14%] h-0.5 scan-beam-anim" style={{ background: "linear-gradient(to right, transparent, var(--color-primary), transparent)" }} />
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col items-center gap-3">
                {!scanning ? (
                  <button
                    onClick={startScanner}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold glow-border hover:opacity-90"
                  >
                    <Camera className="w-5 h-5" /> Start Camera Scan
                  </button>
                ) : (
                  <button
                    onClick={stopScanner}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-secondary)] font-medium hover:opacity-90"
                  >
                    <CameraOff className="w-5 h-5" /> Stop Scanner
                  </button>
                )}
                <p className="text-xs text-[var(--color-muted-foreground)] text-center">
                  Point camera at student's QR pass code
                </p>
              </div>
            </div>

            {/* Manual entry */}
            <form onSubmit={handleManual} className="glass-card rounded-2xl p-4 flex gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="input-base font-mono text-sm tracking-wider"
                placeholder="Enter pass code (e.g. PP-A1B2C)"
                maxLength={20}
              />
              <button type="submit" className="flex-shrink-0 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold text-sm hover:opacity-90">
                Check
              </button>
            </form>

            {/* Result */}
            {result && (
              <div
                className="rounded-2xl p-5 text-center space-y-2"
                style={{ background: `${resultBg[result.kind]}22`, border: `1px solid ${resultBg[result.kind]}55` }}
              >
                <div className="text-4xl">
                  {result.kind === "valid-out" ? "🚪" : result.kind === "valid-in" ? "🏠" : result.kind === "expired" ? "⏰" : "❌"}
                </div>
                <p className="font-bold text-lg" style={{ color: resultBg[result.kind] }}>
                  {result.kind === "valid-out" ? "Cleared to Depart" : result.kind === "valid-in" ? "Returned to Campus" : result.kind === "expired" ? "Pass Expired" : "Invalid Pass"}
                </p>
                <p className="text-sm text-[var(--color-foreground)] font-medium">{result.message}</p>
                <button onClick={() => { setResult(null); setManualCode(""); }} className="mt-2 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] underline">
                  Scan another
                </button>
              </div>
            )}
          </>
        )}

        {tab === "active" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{active.length} active pass{active.length !== 1 ? "es" : ""}</p>
              <button onClick={loadActive} className="text-xs text-[var(--color-primary)] hover:underline">Refresh</button>
            </div>

            {loadingActive && <p className="text-center py-8 text-[var(--color-muted-foreground)] text-sm">Loading…</p>}

            {!loadingActive && active.length === 0 && (
              <div className="glass-card rounded-2xl p-10 text-center text-[var(--color-muted-foreground)]">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No active passes</p>
              </div>
            )}

            {active.map((e) => {
              const statusColor = e.status === "departed" ? "oklch(0.72 0.18 250)" : "oklch(0.70 0.20 150)";
              return (
                <div key={e.id} className="glass-card rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{e.studentName}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{e.matric} · {e.hostel}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: `${statusColor}22`, color: statusColor }}>
                      {e.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-muted-foreground)]">{e.destination}</span>
                    <span className="font-mono font-bold text-[var(--color-primary)]">{e.code}</span>
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Returns: {e.returnDate}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="text-center py-3 text-xs text-[var(--color-muted-foreground)]">
        Made by <span className="text-[var(--color-primary)] font-semibold">shadow</span>
      </footer>
    </div>
  );
}
