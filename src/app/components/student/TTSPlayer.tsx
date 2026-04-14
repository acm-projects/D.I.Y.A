import { useState } from "react";
import { useTTS } from "./TTSContext";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
} as const;

const RATES = [0.75, 1, 1.25, 1.5, 2] as const;

// ── Animated sound wave ───────────────────────────────────────────────────────

function SoundWave({ playing }: { playing: boolean }) {
  const bars = [
    { delay: "0s",     maxH: 10 },
    { delay: "0.18s",  maxH: 18 },
    { delay: "0.09s",  maxH: 14 },
    { delay: "0.27s",  maxH: 8  },
  ];
  return (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        height: 20,
        width: 26,
        flexShrink: 0,
      }}
    >
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: b.maxH,
            borderRadius: 2,
            backgroundColor: playing ? palette.crimson : "rgba(92,30,38,0.25)",
            transformOrigin: "center",
            transform: playing ? undefined : "scaleY(0.4)",
            animation: playing
              ? `tts-bar 0.75s ease-in-out ${b.delay} infinite`
              : "none",
            transition: "background-color 200ms ease",
          }}
        />
      ))}
    </div>
  );
}

// ── Icon set ──────────────────────────────────────────────────────────────────

function IconPause() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="4" width="4" height="16" rx="1.5" fill="currentColor" />
      <rect x="14" y="4" width="4" height="16" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M5 3l14 9-14 9V3z" fill="currentColor" />
    </svg>
  );
}

function IconStop() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="2.5" fill="currentColor" />
    </svg>
  );
}

function IconChevronUp() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 15l-6-6-6 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Control button ────────────────────────────────────────────────────────────

function CtrlBtn({
  onClick,
  label,
  primary,
  children,
}: {
  onClick: () => void;
  label: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        border: primary ? "none" : "1px solid rgba(39,1,21,0.12)",
        backgroundColor: primary ? palette.crimson : "rgba(39,1,21,0.04)",
        color: primary ? "#fff" : palette.deepBurgundy,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "opacity 120ms ease",
      }}
    >
      {children}
    </button>
  );
}

// ── Player ────────────────────────────────────────────────────────────────────

export function TTSPlayer() {
  const {
    isActive,
    isPaused,
    currentLabel,
    currentText,
    rate,
    voices,
    selectedVoice,
    pause,
    resume,
    stop,
    setRate,
    setVoice,
  } = useTTS();

  const [expanded, setExpanded] = useState(false);

  if (!isActive) return null;

  const isPlaying = !isPaused;
  const preview =
    currentText.length > 72 ? currentText.slice(0, 72) + "…" : currentText;

  // Only show English voices in the selector
  const enVoices = voices.filter((v) => v.lang.startsWith("en"));

  return (
    <div
      role="region"
      aria-label="Text-to-speech player"
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 9998,
        width: 368,
        backgroundColor: "#fff",
        borderRadius: 22,
        boxShadow:
          "0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(39,1,21,0.1)",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, Segoe UI, Roboto, sans-serif",
        animation: "tts-slide-up 260ms cubic-bezier(0.22,1,0.36,1) forwards",
      }}
    >
      {/* Gradient accent bar */}
      <div
        style={{
          height: 4,
          background: `linear-gradient(90deg, ${palette.crimson}, ${palette.sage})`,
        }}
      />

      {/* ── Compact header row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "13px 14px",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        <SoundWave playing={isPlaying} />

        {/* Label + preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {currentLabel && (
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: palette.crimson,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 2,
              }}
            >
              {currentLabel}
            </div>
          )}
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: palette.deepBurgundy,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.35,
            }}
          >
            {preview}
          </div>
        </div>

        {/* Quick controls */}
        <div
          style={{ display: "flex", gap: 6, alignItems: "center" }}
          onClick={(e) => e.stopPropagation()}
        >
          <CtrlBtn
            label={isPaused ? "Resume" : "Pause"}
            primary
            onClick={() => (isPaused ? resume() : pause())}
          >
            {isPaused ? <IconPlay /> : <IconPause />}
          </CtrlBtn>
          <CtrlBtn label="Stop" onClick={stop}>
            <IconStop />
          </CtrlBtn>
        </div>

        {/* Expand toggle */}
        <div
          style={{
            color: "rgba(92,30,38,0.35)",
            display: "flex",
            alignItems: "center",
            marginLeft: 2,
          }}
        >
          {expanded ? <IconChevronDown /> : <IconChevronUp />}
        </div>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid rgba(39,1,21,0.07)",
            padding: "14px 14px 16px",
          }}
        >
          {/* Full text preview */}
          <div
            style={{
              marginBottom: 14,
              padding: "10px 12px",
              borderRadius: 10,
              backgroundColor: "rgba(39,1,21,0.03)",
              border: "1px solid rgba(39,1,21,0.07)",
              fontSize: 12,
              fontWeight: 500,
              color: palette.darkest,
              lineHeight: 1.65,
              maxHeight: 84,
              overflowY: "auto",
            }}
          >
            {currentText}
          </div>

          {/* Speed */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "rgba(92,30,38,0.45)",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 6,
              }}
            >
              Speed
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {RATES.map((r) => {
                const active = rate === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRate(r)}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: 8,
                      border: active
                        ? `1.5px solid ${palette.crimson}`
                        : "1px solid rgba(39,1,21,0.12)",
                      backgroundColor: active
                        ? "rgba(162,34,55,0.07)"
                        : "transparent",
                      color: active ? palette.crimson : palette.deepBurgundy,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 100ms ease",
                    }}
                  >
                    {r}×
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice selector */}
          {enVoices.length > 1 && (
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: "rgba(92,30,38,0.45)",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  marginBottom: 6,
                }}
              >
                Voice
              </div>
              <select
                value={selectedVoice?.name ?? ""}
                onChange={(e) => {
                  const v = enVoices.find((v) => v.name === e.target.value);
                  if (v) setVoice(v);
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 9,
                  border: "1px solid rgba(39,1,21,0.15)",
                  backgroundColor: "#fff",
                  color: palette.deepBurgundy,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              >
                {enVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
