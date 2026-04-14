import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ── Inject animation CSS (once) ───────────────────────────────────────────────

const TTS_STYLE_ID = "diya-tts-styles";
if (typeof document !== "undefined" && !document.getElementById(TTS_STYLE_ID)) {
  const s = document.createElement("style");
  s.id = TTS_STYLE_ID;
  s.textContent = `
    @keyframes tts-bar {
      0%, 100% { transform: scaleY(0.25); }
      50%       { transform: scaleY(1); }
    }
    @keyframes tts-slide-up {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
}

// ── Voice selection ───────────────────────────────────────────────────────────

function selectBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const en = voices.filter((v) => v.lang.startsWith("en"));
  const pool = en.length ? en : voices;
  return (
    pool.find((v) => /(premium|enhanced)/i.test(v.name)) ??
    pool.find((v) => /google us english/i.test(v.name)) ??
    pool.find((v) => /google.*english/i.test(v.name)) ??
    pool.find((v) => /google/i.test(v.name)) ??
    pool.find((v) => v.lang === "en-US") ??
    pool[0]
  );
}

// ── Context types ─────────────────────────────────────────────────────────────

export interface TTSContextValue {
  supported: boolean;
  isActive: boolean;
  isPaused: boolean;
  currentId: string | null;
  currentLabel: string;
  currentText: string;
  rate: number;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  /** Speak, or pause/resume if the same id is already active */
  toggle: (text: string, label?: string, id?: string) => void;
  /** Always restart from the beginning */
  speak: (text: string, label?: string, id?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (r: number) => void;
  setVoice: (v: SpeechSynthesisVoice) => void;
}

const TTSCtx = createContext<TTSContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function TTSProvider({ children }: { children: ReactNode }) {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentLabel, setCurrentLabel] = useState("");
  const [currentText, setCurrentText] = useState("");
  const [rate, setRateState] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Refs so speak() never goes stale in its closure
  const rateRef = useRef(1);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const activeIdRef = useRef<string | null>(null);

  // ── Load voices ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (!v.length) return;
      setVoices(v);
      setSelectedVoice((prev) => {
        if (prev) return prev;
        const best = selectBestVoice(v);
        voiceRef.current = best;
        return best;
      });
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [supported]);

  // ── Core actions ─────────────────────────────────────────────────────────────

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    activeIdRef.current = null;
    setIsActive(false);
    setIsPaused(false);
    setCurrentId(null);
    setCurrentLabel("");
    setCurrentText("");
  }, [supported]);

  const speak = useCallback(
    (text: string, label = "", id = "") => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const cleaned = text.replace(/\s+/g, " ").trim();
      if (!cleaned) return;

      const safeId = id || String(Date.now());
      activeIdRef.current = safeId;

      const utter = new SpeechSynthesisUtterance(cleaned);
      utter.rate = rateRef.current;
      utter.pitch = 1;
      if (voiceRef.current) utter.voice = voiceRef.current;

      utter.onstart = () => {
        setIsActive(true);
        setIsPaused(false);
        setCurrentId(safeId);
        setCurrentLabel(label);
        setCurrentText(cleaned);
      };
      utter.onend = () => {
        if (activeIdRef.current === safeId) {
          activeIdRef.current = null;
          setIsActive(false);
          setIsPaused(false);
          setCurrentId(null);
          setCurrentLabel("");
          setCurrentText("");
        }
      };
      utter.onerror = (e) => {
        if (e.error !== "interrupted" && activeIdRef.current === safeId) {
          activeIdRef.current = null;
          setIsActive(false);
          setIsPaused(false);
          setCurrentId(null);
        }
      };

      window.speechSynthesis.speak(utter);
    },
    [supported]
  );

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [supported]);

  const toggle = useCallback(
    (text: string, label = "", id = "") => {
      const safeId = id || label || text.slice(0, 30);
      if (activeIdRef.current === safeId && isActive) {
        if (isPaused) resume();
        else pause();
      } else {
        speak(text, label, safeId);
      }
    },
    [isActive, isPaused, pause, resume, speak]
  );

  const setRate = useCallback((r: number) => {
    rateRef.current = r;
    setRateState(r);
  }, []);

  const setVoice = useCallback((v: SpeechSynthesisVoice) => {
    voiceRef.current = v;
    setSelectedVoice(v);
  }, []);

  const value: TTSContextValue = {
    supported,
    isActive,
    isPaused,
    currentId,
    currentLabel,
    currentText,
    rate,
    voices,
    selectedVoice,
    toggle,
    speak,
    pause,
    resume,
    stop,
    setRate,
    setVoice,
  };

  return <TTSCtx.Provider value={value}>{children}</TTSCtx.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTTS(): TTSContextValue {
  const ctx = useContext(TTSCtx);
  if (!ctx) throw new Error("useTTS must be used within TTSProvider");
  return ctx;
}

// ── Shared palette (used by ListenButton) ─────────────────────────────────────

const btnPalette = {
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
} as const;

// ── ListenButton ──────────────────────────────────────────────────────────────

function SpeakerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" />
      <path
        d="M15.54 8.46a5 5 0 0 1 0 7.07"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PauseIconSm() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
      <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
    </svg>
  );
}

export function ListenButton({
  text,
  label,
  id,
  size = "sm",
}: {
  text: string;
  label?: string;
  id: string;
  size?: "sm" | "md";
}) {
  const { toggle, isActive, isPaused, currentId, supported } = useTTS();
  if (!supported) return null;

  const isThis = currentId === id && isActive;
  const isPlaying = isThis && !isPaused;

  return (
    <button
      type="button"
      aria-label={
        isThis
          ? isPaused
            ? "Resume reading"
            : "Pause reading"
          : `Listen to ${label ?? "this content"}`
      }
      onClick={(e) => {
        e.stopPropagation();
        toggle(text, label, id);
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: size === "md" ? "8px 14px" : "6px 10px",
        borderRadius: 8,
        border: isThis
          ? `1.5px solid ${btnPalette.crimson}`
          : "1px solid rgba(39,1,21,0.13)",
        backgroundColor: isThis
          ? "rgba(162,34,55,0.07)"
          : "rgba(39,1,21,0.025)",
        color: isThis ? btnPalette.crimson : btnPalette.deepBurgundy,
        fontSize: size === "md" ? 13 : 12,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 120ms ease",
        fontFamily: "inherit",
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {isPlaying ? <PauseIconSm /> : <SpeakerIcon />}
      {isThis ? (isPaused ? "Resume" : "Pause") : "Listen"}
    </button>
  );
}
