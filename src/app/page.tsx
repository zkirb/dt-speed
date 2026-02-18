// FILE: src/app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────
const TOTAL_DAYS = 28;

// ─── HELPERS ─────────────────────────────────────────────────
function parseMMSS(str: string): number | null {
  if (!str || typeof str !== "string") return null;
  const cleaned = str.replace(/[^0-9:]/g, "");
  const parts = cleaned.split(":");
  if (parts.length !== 2) return null;
  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);
  if (isNaN(mins) || isNaN(secs)) return null;
  if (mins < 0 || secs < 0 || secs > 59) return null;
  return mins * 60 + secs;
}

function formatMMSS(totalSeconds: number | null): string {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds))
    return "--:--";
  const clamped = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getWeekDay(dayOfPeriod: number) {
  const week = Math.ceil(dayOfPeriod / 7);
  const day = ((dayOfPeriod - 1) % 7) + 1;
  return { week, day };
}

// ─── LOCALSTORAGE ────────────────────────────────────────────
const STORAGE_KEY = "dt-speed-calc";

function loadState(): { goal: string; dayOfPeriod: string; currentAvg: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveState(obj: { goal: string; dayOfPeriod: string; currentAvg: string }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {}
}

// ─── ICONS (inline SVG) ─────────────────────────────────────
function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ─── RESULT COLOR ────────────────────────────────────────────
type Status = "ok" | "ahead" | "final" | "day1";

function getResultColor(
  status: Status,
  requiredSec: number | null,
  goalSec: number | null
) {
  if (status === "ahead" || status === "day1")
    return { bg: "#0d3320", border: "#16a34a", text: "#4ade80", accent: "#22c55e" };
  if (status === "final")
    return { bg: "#1e1b4b", border: "#7c3aed", text: "#a78bfa", accent: "#8b5cf6" };
  if (requiredSec !== null && goalSec !== null && requiredSec > goalSec * 1.15)
    return { bg: "#3b1118", border: "#ef4444", text: "#f87171", accent: "#ef4444" };
  if (requiredSec !== null && goalSec !== null && requiredSec > goalSec)
    return { bg: "#3b2508", border: "#f59e0b", text: "#fbbf24", accent: "#f59e0b" };
  return { bg: "#0d3320", border: "#16a34a", text: "#4ade80", accent: "#22c55e" };
}

// ─── PAGE COMPONENT ──────────────────────────────────────────
export default function Home() {
  const saved = useRef(loadState()).current;
  const [goal, setGoal] = useState(saved?.goal ?? "3:45");
  const [dayOfPeriod, setDayOfPeriod] = useState(saved?.dayOfPeriod ?? "1");
  const [currentAvg, setCurrentAvg] = useState(saved?.currentAvg ?? "");
  const [hasInteracted, setHasInteracted] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    saveState({ goal, dayOfPeriod, currentAvg });
  }, [goal, dayOfPeriod, currentAvg]);

  // ─── CALCULATIONS ──────────────────────────────────────────
  const goalSec = parseMMSS(goal);
  const dayNum = parseInt(dayOfPeriod, 10);
  const validDay = !isNaN(dayNum) && dayNum >= 1 && dayNum <= 28;
  const daysDone = validDay ? dayNum - 1 : 0;
  const daysLeft = validDay ? TOTAL_DAYS - daysDone : 0;
  const currentAvgSec = parseMMSS(currentAvg);
  const { week, day: dayInWeek } = validDay
    ? getWeekDay(dayNum)
    : { week: 0, day: 0 };

  let requiredSec: number | null = null;
  let status: Status | null = null;

  if (goalSec !== null && validDay) {
    if (daysDone === 0) {
      requiredSec = goalSec;
      status = "day1";
    } else if (daysLeft <= 0) {
      status = "final";
    } else if (currentAvgSec !== null) {
      const raw =
        (goalSec * TOTAL_DAYS - currentAvgSec * daysDone) / daysLeft;
      if (raw < 0) {
        requiredSec = 0;
        status = "ahead";
      } else {
        requiredSec = raw;
        status = "ok";
      }
    }
  }

  const canCalculate =
    status !== null &&
    (status === "day1" || status === "final" || currentAvgSec !== null);
  const needsCurrentAvg = daysDone > 0;
  const rc = canCalculate && status ? getResultColor(status, requiredSec, goalSec) : null;

  function handleReset() {
    setGoal("3:45");
    setDayOfPeriod("1");
    setCurrentAvg("");
    setHasInteracted(false);
  }

  // ─── RENDER ────────────────────────────────────────────────
  return (
    <main className="min-h-screen pb-12">
      {/* HEADER */}
      <div
        className="px-5 pt-6 pb-4"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.01)",
        }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
            }}
          >
            <ClockIcon />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">
              DT Speed Calculator
            </h1>
            <p
              className="text-[11px] font-medium tracking-wide"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              28-DAY PERIOD PLANNER
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-5">
        {/* HELPER TEXT */}
        <p
          className="text-[13px] leading-relaxed mb-6 px-0.5"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Enter your day &amp; current average to find the speed you must run
          from today forward to finish the 28-day period at your goal.
        </p>

        {/* ─── INPUTS ──────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Goal Speed */}
          <InputField
            icon={<TargetIcon />}
            label="Goal Speed (mm:ss)"
            type="text"
            inputMode="numeric"
            value={goal}
            placeholder="3:45"
            onChange={(v) => {
              setGoal(v);
              setHasInteracted(true);
            }}
            error={
              hasInteracted && goalSec === null && goal.length > 0
                ? "Enter time as m:ss (e.g. 3:45)"
                : undefined
            }
          />

          {/* Day of Period */}
          <div>
            <InputField
              icon={<CalendarIcon />}
              label="Day of Period (1–28)"
              type="number"
              inputMode="numeric"
              value={dayOfPeriod}
              placeholder="1"
              onChange={(v) => {
                setDayOfPeriod(v);
                setHasInteracted(true);
              }}
              error={
                hasInteracted && dayOfPeriod.length > 0 && !validDay
                  ? "Must be 1–28"
                  : undefined
              }
            />
            {validDay && (
              <div className="flex gap-1.5 mt-2">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-bold tracking-wide"
                  style={{
                    background: "rgba(99,102,241,0.15)",
                    color: "#a5b4fc",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Week {week}
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-bold tracking-wide"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Day {dayInWeek}
                </span>
              </div>
            )}
          </div>

          {/* Current Period Avg */}
          {needsCurrentAvg && (
            <div className="animate-slide-up">
              <InputField
                icon={<ClockIcon />}
                label="Current Period Avg (mm:ss)"
                type="text"
                inputMode="numeric"
                value={currentAvg}
                placeholder="4:10"
                onChange={(v) => {
                  setCurrentAvg(v);
                  setHasInteracted(true);
                }}
                error={
                  hasInteracted && currentAvg.length > 0 && currentAvgSec === null
                    ? "Enter time as m:ss (e.g. 4:10)"
                    : undefined
                }
              />
            </div>
          )}
        </div>

        {/* ─── PROGRESS BAR ────────────────────────────────── */}
        {validDay && (
          <div className="mt-5">
            <div className="flex justify-between mb-1.5">
              <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                Period progress
              </span>
              <span
                className="text-[12px]"
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {daysDone}/{TOTAL_DAYS} days done
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(daysDone / TOTAL_DAYS) * 100}%`,
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
              </span>
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                {Math.round((daysDone / TOTAL_DAYS) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* ─── RESULT CARD ─────────────────────────────────── */}
        {canCalculate && rc && status && (
          <div
            key={`${status}-${requiredSec}`}
            className="animate-slide-up mt-6 relative rounded-2xl p-6 overflow-hidden"
            style={{
              background: rc.bg,
              border: `1.5px solid ${rc.border}33`,
            }}
          >
            {/* Decorative glow */}
            <div
              className="absolute -top-10 -right-10 w-28 h-28 rounded-full"
              style={{
                background: `radial-gradient(circle, ${rc.accent}15, transparent)`,
              }}
            />

            {status === "day1" && (
              <div className="relative">
                <div className="flex items-center gap-2 mb-3" style={{ color: rc.text }}>
                  <CheckIcon />
                  <span className="text-sm font-bold uppercase tracking-wide">
                    Day 1 — Hit Your Goal
                  </span>
                </div>
                <p className="text-[13px] mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                  No history yet. Run at goal speed to start on track.
                </p>
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Target Speed
                  </p>
                  <p
                    className="text-5xl font-bold text-white"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      textShadow: `0 0 30px ${rc.accent}40`,
                    }}
                  >
                    {formatMMSS(goalSec)}
                  </p>
                </div>
              </div>
            )}

            {status === "final" && (
              <div className="relative">
                <div className="flex items-center gap-2 mb-2" style={{ color: rc.text }}>
                  <CheckIcon />
                  <span className="text-sm font-bold uppercase tracking-wide">
                    Period Complete
                  </span>
                </div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  All 28 days are done. Your final average is your period result.
                </p>
              </div>
            )}

            {status === "ahead" && (
              <div className="relative">
                <div className="flex items-center gap-2 mb-3" style={{ color: rc.text }}>
                  <CheckIcon />
                  <span className="text-sm font-bold uppercase tracking-wide">
                    Ahead of Goal
                  </span>
                </div>
                <p className="text-[13px] mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Even at 0:00 the math says you&apos;re beating goal. Keep it up!
                </p>
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Required Remaining Avg
                  </p>
                  <p
                    className="text-5xl font-bold text-white"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    0:00
                  </p>
                </div>
              </div>
            )}

            {status === "ok" && requiredSec !== null && (
              <div className="relative">
                <p
                  className="text-[11px] uppercase tracking-widest mb-1 text-center"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Required Avg From Today
                </p>
                <p
                  className="text-[56px] font-bold text-white text-center leading-none"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    textShadow: `0 0 40px ${rc.accent}30`,
                  }}
                >
                  {formatMMSS(requiredSec)}
                </p>

                {/* Sub-stats */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <StatBox label="Goal" value={formatMMSS(goalSec)} />
                  <StatBox label="Current Avg" value={formatMMSS(currentAvgSec)} />
                </div>

                {/* Contextual note */}
                {requiredSec > (goalSec ?? 0) * 1.15 ? (
                  <StatusNote
                    icon={<AlertIcon />}
                    bgColor="rgba(239,68,68,0.1)"
                    borderColor="rgba(239,68,68,0.2)"
                    textColor="#fca5a5"
                    message={`Significantly behind — you'll need to push hard for ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`}
                  />
                ) : requiredSec < (goalSec ?? 0) ? (
                  <StatusNote
                    icon={<CheckIcon />}
                    bgColor="rgba(34,197,94,0.08)"
                    borderColor="rgba(34,197,94,0.15)"
                    textColor="#86efac"
                    message="Trending ahead — required speed is faster than your goal."
                  />
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* ─── RESET BUTTON ────────────────────────────────── */}
        <button
          onClick={handleReset}
          className="mt-6 w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 hover:bg-white/[0.08] hover:text-white/70"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <RefreshIcon /> Reset to Defaults
        </button>

        {/* ─── FORMULA REFERENCE ───────────────────────────── */}
        <details className="mt-8">
          <summary
            className="text-[12px] cursor-pointer flex items-center gap-1"
            style={{ color: "rgba(255,255,255,0.25)", listStyle: "none" }}
          >
            <span className="text-[10px]">▸</span> How the math works
          </summary>
          <div
            className="mt-2 p-4 rounded-xl text-[12px] leading-relaxed"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.35)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <p>required = (goal × 28 − currentAvg × daysDone) / daysLeft</p>
            <p className="mt-2">daysDone = dayOfPeriod − 1</p>
            <p>daysLeft = 28 − daysDone</p>
            <p
              className="mt-2 italic"
              style={{ fontFamily: "'DM Sans', system-ui" }}
            >
              Period performance is a simple average of all 28 daily speeds.
            </p>
          </div>
        </details>
      </div>
    </main>
  );
}

// ─── SUBCOMPONENTS ─────────────────────────────────────────────

function InputField({
  icon,
  label,
  type,
  inputMode,
  value,
  placeholder,
  onChange,
  error,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  inputMode?: "numeric" | "text";
  value: string;
  placeholder: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label
        className="flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-wide mb-2"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        {icon} {label}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-3.5 text-lg outline-none transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1.5px solid rgba(255,255,255,0.1)",
          color: "#f0f0f5",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 500,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.15)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          e.currentTarget.style.boxShadow = "none";
        }}
        min={type === "number" ? 1 : undefined}
        max={type === "number" ? 28 : undefined}
      />
      {error && (
        <p className="text-[12px] mt-1.5" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      <p
        className="text-[10px] uppercase tracking-wide mb-0.5"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {label}
      </p>
      <p
        className="text-lg font-bold"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: "rgba(255,255,255,0.8)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function StatusNote({
  icon,
  bgColor,
  borderColor,
  textColor,
  message,
}: {
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  textColor: string;
  message: string;
}) {
  return (
    <div
      className="mt-3.5 px-3 py-2 rounded-lg flex items-center gap-2"
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        color: textColor,
      }}
    >
      {icon}
      <p className="text-[12px]">{message}</p>
    </div>
  );
}
