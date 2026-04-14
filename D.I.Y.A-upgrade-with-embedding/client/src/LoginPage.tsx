import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  cream: "#FBF5F0",
} as const;

export function LoginPage() {
  const { loginWithRedirect } = useAuth0();

  const handleLogin = () => {
    window.sessionStorage.removeItem("pendingSignupRole");

    void loginWithRedirect({
      authorizationParams: { prompt: "login" },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(140deg, #270115 0%, #3d1542 35%, #5C1E26 70%, #a22237 100%)",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at top left, rgba(255,255,255,0.18), transparent 32%), radial-gradient(circle at bottom right, rgba(255,255,255,0.1), transparent 28%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "min(100%, 430px)",
          borderRadius: 28,
          padding: "40px 34px",
          backgroundColor: "rgba(251,245,240,0.96)",
          border: "1px solid rgba(255,255,255,0.38)",
          boxShadow: "0 28px 90px rgba(10, 3, 10, 0.32)",
          position: "relative",
          zIndex: 1,
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 16,
            background: "linear-gradient(135deg, #a22237 0%, #5C1E26 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 16px 30px rgba(92,30,38,0.22)",
            marginBottom: 24,
          }}
        >
          <img src="/logo.png" alt="D.I.Y.A logo" style={{ height: 30, objectFit: "contain" }} />
        </div>

        <div style={{ fontFamily: "Italiana, serif", fontSize: 58, lineHeight: 0.95, color: palette.darkest }}>
          D.I.Y.A
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: -0.8,
            color: palette.deepBurgundy,
          }}
        >
          Welcome back
        </div>
        <p
          style={{
            marginTop: 12,
            marginBottom: 0,
            fontSize: 15,
            lineHeight: 1.75,
            color: "rgba(39,1,21,0.74)",
          }}
        >
          Continue securely with Auth0 to access your D.I.Y.A workspace, assignments, discussions, and feedback tools.
        </p>

        <button
          type="button"
          onClick={handleLogin}
          style={{
            width: "100%",
            marginTop: 28,
            padding: "15px 18px",
            borderRadius: 16,
            border: "none",
            background: "linear-gradient(135deg, #5C1E26 0%, #7b1f33 100%)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 16px 36px rgba(92,30,38,0.25)",
          }}
        >
          Log in with Auth0
        </button>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            justifyContent: "center",
            fontSize: 14,
            color: "rgba(39,1,21,0.68)",
          }}
        >
          New to D.I.Y.A?&nbsp;
          <Link to="/signup" style={{ color: palette.crimson, fontWeight: 700, textDecoration: "none" }}>
            Create your account
          </Link>
        </div>
      </div>
    </div>
  );
}
