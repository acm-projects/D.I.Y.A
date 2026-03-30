import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

const palette = {
  darkest: "#270115",
} as const;

const navItems = [
  { id: "profile", label: "Profile", path: "/profile" },
  { id: "groups", label: "Groups", path: "/groups" },
  { id: "request", label: "Request Office Hours", path: "/office-hours" },
  { id: "selfcheck", label: "Self-Check", path: "/self-check" },
] as const;

export type StudentSidebarItem = (typeof navItems)[number]["id"];

export function StudentSidebar({ activeItem }: { activeItem: StudentSidebarItem }) {
  const navigate = useNavigate();
  const { logout } = useAuth0();

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "Italiana, serif",
          fontSize: 30,
          letterSpacing: 1.5,
          color: "#fff",
          padding: "6px 4px 10px 4px",
        }}
      >
        <img src="/logo.png" alt="logo" style={{ height: 48, objectFit: "contain", marginBottom: 4 }} />
        <span style={{ lineHeight: 1 }}>D.I.Y.A</span>
      </div>

      <div
        style={{
          height: 1,
          backgroundColor: "rgba(255,255,255,0.25)",
          margin: "0 0 10px 0",
        }}
      />

      <nav aria-label="Sidebar navigation" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map((item) => {
          const isActive = item.id === activeItem;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 10,
                border: "none",
                backgroundColor: isActive ? "rgba(255,255,255,0.88)" : "transparent",
                color: isActive ? palette.darkest : "rgba(255,255,255,0.85)",
                fontSize: 13,
                fontWeight: isActive ? 800 : 600,
                cursor: "pointer",
                transition: "background-color 120ms ease",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <div
        style={{
          height: 1,
          backgroundColor: "rgba(255,255,255,0.2)",
          margin: "10px 0 8px 0",
        }}
      />

      <button
        type="button"
        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.2)",
          backgroundColor: "rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.9)",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </>
  );
}
