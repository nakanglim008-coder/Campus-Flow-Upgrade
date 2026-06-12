import { useState } from "react";
import { useLocation } from "wouter";
import { api, type ExeatType } from "../../lib/api";
import StudentLayout from "./StudentLayout";
import { Send } from "lucide-react";

const TYPES: { value: ExeatType; label: string; desc: string }[] = [
  { value: "regular", label: "Regular", desc: "Standard weekend or holiday leave" },
  { value: "medical", label: "Medical", desc: "Hospital visit or health-related" },
  { value: "academic", label: "Academic", desc: "Study trip, conference, exam" },
  { value: "emergency", label: "Emergency", desc: "Auto-approved — urgent situations only" },
];

export default function NewRequest() {
  const [, nav] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    destination: "",
    reason: "",
    type: "regular" as ExeatType,
    departDate: "",
    returnDate: "",
  });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.returnDate < form.departDate) {
      setError("Return date must be on or after departure date");
      return;
    }
    setLoading(true);
    try {
      await api.exeats.create(form);
      nav("/student");
    } catch (err: unknown) {
      setError((err as Error).message ?? "Failed to submit request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StudentLayout>
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">New Exeat Request</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Fill in the details of your campus leave</p>
        </div>

        <form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">Leave Type</label>
            <select value={form.type} onChange={set("type")} className="input-base">
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">Destination</label>
            <input value={form.destination} onChange={set("destination")} required className="input-base" placeholder="Home, Lagos / Hospital, Enugu" />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">Reason</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              required
              rows={3}
              className="input-base resize-none"
              placeholder="Brief description of why you need to leave campus"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">Departure Date</label>
              <input type="date" value={form.departDate} onChange={set("departDate")} required className="input-base" min={new Date().toISOString().slice(0, 10)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">Return Date</label>
              <input type="date" value={form.returnDate} onChange={set("returnDate")} required className="input-base" min={form.departDate || new Date().toISOString().slice(0, 10)} />
            </div>
          </div>

          {form.type === "emergency" && (
            <div className="flex items-start gap-2 bg-[oklch(0.78_0.16_80_/_0.12)] border border-[oklch(0.78_0.16_80_/_0.35)] rounded-xl p-3">
              <span className="text-sm">⚡</span>
              <p className="text-xs text-[oklch(0.78_0.16_80)]">Emergency leaves are <b>auto-approved</b> and can be scanned immediately.</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-[var(--color-destructive)] bg-[oklch(0.6_0.22_25_/_0.12)] rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold text-sm hover:opacity-90 disabled:opacity-50 glow-border"
          >
            {loading ? "Submitting…" : <><Send className="w-4 h-4" /> Submit Request</>}
          </button>
        </form>
      </div>
    </StudentLayout>
  );
}
