import type { CSSProperties } from "react";
import { Link } from "react-router";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

const landingBackgroundStyle: CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  backgroundColor: palette.cream,
  backgroundImage: [
    "radial-gradient(ellipse 150% 110% at 50% -25%, rgba(39, 1, 21, 0.16) 0%, rgba(39, 1, 21, 0.05) 32%, transparent 58%)",
    "radial-gradient(ellipse 150% 110% at 50% 125%, rgba(39, 1, 21, 0.14) 0%, rgba(39, 1, 21, 0.045) 36%, transparent 60%)",
    "radial-gradient(ellipse 85% 65% at 6% 104%, rgba(39, 1, 21, 0.07) 0%, transparent 52%)",
    "radial-gradient(ellipse 85% 65% at 94% 104%, rgba(39, 1, 21, 0.07) 0%, transparent 52%)",
    `radial-gradient(ellipse 90% 75% at 50% 48%, ${palette.cream} 0%, ${palette.cream} 55%, rgba(251, 245, 240, 0) 72%)`,
    `linear-gradient(180deg, ${palette.cream} 0%, ${palette.cream} 100%)`,
  ].join(", "),
};

export function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        fontFamily:
          "Inter, system-ui, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <main style={landingBackgroundStyle}>
        {/* Above-the-fold hero — logo + title */}
        <section
          aria-labelledby="landing-brand-heading"
          style={{
            position: "relative",
            zIndex: 15,
            minHeight: "100svh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            paddingLeft: "clamp(20px, 5vw, 48px)",
            paddingRight: "clamp(20px, 5vw, 48px)",
            paddingTop: "clamp(88px, 12vh, 140px)",
            paddingBottom: "clamp(30vh, 36%, 44%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "clamp(18px, 2.5vw, 32px)",
            }}
          >
            <img
              src="/logo.png"
              alt=""
              style={{
                height: "clamp(80px, 15vw, 128px)",
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
            <h1
              id="landing-brand-heading"
              style={{
                margin: 0,
                fontFamily: "Italiana, serif",
                fontSize: "clamp(48px, 9vw, 96px)",
                fontWeight: 400,
                letterSpacing: "0.06em",
                color: "rgba(17, 17, 17, 0.92)",
                lineHeight: 1.02,
                whiteSpace: "nowrap",
              }}
            >
              D.I.Y.A
            </h1>
          </div>
        </section>

        {/* Login / Sign up — top right, no header bar */}
        <nav
          aria-label="Account"
          style={{
            position: "absolute",
            top: "clamp(16px, 3vh, 28px)",
            right: "clamp(20px, 4vw, 48px)",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
          <Link
            to="/login"
            style={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.01em",
              color: "rgba(39, 1, 21, 0.82)",
              textDecoration: "none",
            }}
          >
            Login
          </Link>
          <Link
            to="/signup"
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: palette.darkest,
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: 980,
              border: "1px solid rgba(255, 255, 255, 0.4)",
              backgroundColor: "rgba(251, 245, 240, 0.96)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            }}
          >
            Sign up
          </Link>
        </nav>

        {/* Bottom waves */}
        <svg
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "min(58vh, 52%)",
            zIndex: 10,
            opacity: 0.88,
            pointerEvents: "none",
          }}
          viewBox="0 0 1440 600"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="landingWaveBack" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a1830" />
              <stop offset="55%" stopColor="#282a55" />
              <stop offset="100%" stopColor="#1f2248" />
            </linearGradient>
          </defs>
          <path
            d="M0 320 C240 180 480 480 720 340 C960 200 1200 440 1440 300 L1440 600 L0 600Z"
            fill="url(#landingWaveBack)"
          />
        </svg>
        <svg
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "min(44vh, 40%)",
            zIndex: 11,
            opacity: 0.78,
            pointerEvents: "none",
          }}
          viewBox="0 0 1440 500"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="landingWaveFront" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8f3d48" />
              <stop offset="50%" stopColor="#7a2a38" />
              <stop offset="100%" stopColor="#4e2229" />
            </linearGradient>
          </defs>
          <path
            d="M0 280 C360 400 600 160 900 300 C1100 400 1300 220 1440 340 L1440 500 L0 500Z"
            fill="url(#landingWaveFront)"
          />
        </svg>
      </main>
    </div>
  );
}
