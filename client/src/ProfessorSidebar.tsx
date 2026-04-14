import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfessorGroups } from "./ProfessorGroupContext";

const palette = {
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
} as const;

function HomeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M3 12l9-8 9 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ForumIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 7.5A4.5 4.5 0 0 1 10.5 3h3A4.5 4.5 0 0 1 18 7.5v3A4.5 4.5 0 0 1 13.5 15H11l-4.5 3V15A4.5 4.5 0 0 1 6 10.5v-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function AnalysisIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 15V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 15V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 15v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RequestsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EditGroupIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const navItems = [
  { id: "home", label: "Home", path: "/professor/home", icon: <HomeIcon /> },
  { id: "forum", label: "Forum", path: "/professor/forum", icon: <ForumIcon /> },
  { id: "calendar", label: "Calendar", path: "/professor/calendar", icon: <CalendarIcon /> },
  { id: "analysis", label: "Analysis", path: "/professor/analysis", icon: <AnalysisIcon /> },
  { id: "requests", label: "Requests", path: "/professor/requests", icon: <RequestsIcon /> },
  { id: "editgroup", label: "Edit Group", path: "/professor/edit-group", icon: <EditGroupIcon /> },
  { id: "profile", label: "Profile", path: "/professor/profile", icon: <ProfileIcon /> },
] as const;

export type ProfessorSidebarItem = (typeof navItems)[number]["id"];

function GroupSelector() {
  const { groups, selectedGroupId, setSelectedGroupId, isLoading } = useProfessorGroups();

  if (isLoading || groups.length === 0) return null;

  return (
    <div style={{ padding: "12px 8px 0" }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "rgba(255,255,255,0.28)",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        Active Group
      </div>
      <select
        value={selectedGroupId ?? ""}
        onChange={(e) => setSelectedGroupId(e.target.value || null)}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
          backgroundColor: "rgba(255,255,255,0.08)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          outline: "none",
          cursor: "pointer",
          appearance: "none",
          WebkitAppearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.5)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
          paddingRight: 28,
        }}
      >
        {groups.map((g) => (
          <option key={g.id} value={g.id} style={{ color: "#111", backgroundColor: "#fff" }}>
            {g.title}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProfessorSidebar({
  activeItem,
  onSignOut,
  children,
}: {
  activeItem: ProfessorSidebarItem;
  onSignOut: () => void;
  children?: ReactNode;
}) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <aside
      style={{
        width: 220,
        background: "linear-gradient(160deg, #4a1850 0%, #2d0f38 50%, #1c0a24 100%)",
        padding: "0 10px 16px",
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.25)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "18px 8px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, #a22237 0%, #5C1E26 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 10px rgba(162,34,55,0.45)",
          }}
        >
          <img src="/logo.png" alt="logo" style={{ height: 22, objectFit: "contain" }} />
        </div>
        <div>
          <div
            style={{
              fontFamily: "Italiana, serif",
              fontSize: 22,
              letterSpacing: 2.5,
              color: "#fff",
              lineHeight: 1,
            }}
          >
            D.I.Y.A
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginTop: 3,
            }}
          >
            Professor View
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "rgba(255,255,255,0.28)",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          padding: "0 8px",
          marginBottom: 8,
        }}
      >
        Navigation
      </div>

      <nav aria-label="Professor sidebar navigation" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item) => {
          const isActive = item.id === activeItem;
          const isHovered = hoveredId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                backgroundColor: isActive
                  ? "rgba(255,255,255,0.1)"
                  : isHovered
                    ? "rgba(255,255,255,0.05)"
                    : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                fontSize: 13,
                fontWeight: isActive ? 700 : 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "all 130ms ease",
                position: "relative",
                outline: "none",
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 20,
                    borderRadius: "0 4px 4px 0",
                    backgroundColor: palette.crimson,
                  }}
                />
              )}
              <span style={{ opacity: isActive ? 1 : 0.7, display: "flex" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <GroupSelector />

      {children ? <div style={{ marginTop: 12 }}>{children}</div> : null}

      <div style={{ flex: 1 }} />
      <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", margin: "12px 0 10px 0" }} />
      <button
        type="button"
        onClick={onSignOut}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "rgba(255,255,255,0.04)",
          color: "rgba(255,255,255,0.6)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </aside>
  );
}
