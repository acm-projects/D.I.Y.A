import { useState } from "react";
import { useNavigate } from "react-router";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
} as const;

export type ProfSidebarActiveId = "calendar" | "analysis" | "requests" | "editgroup";

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
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 9l-5 5-2-2-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RequestsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 13l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface ProfessorSidebarProps {
  activeId: ProfSidebarActiveId;
  groupName: string | undefined;
}

export function ProfessorSidebar({ activeId, groupName }: ProfessorSidebarProps) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const navItems = [
    { id: "calendar" as ProfSidebarActiveId, label: "Calendar", icon: <CalendarIcon />, path: `/calendar/${groupName}` },
    { id: "analysis" as ProfSidebarActiveId, label: "Analysis", icon: <AnalysisIcon />, path: `/analysis/${groupName}` },
    { id: "requests" as ProfSidebarActiveId, label: "Requests", icon: <RequestsIcon />, path: `/requests/${groupName}` },
    { id: "editgroup" as ProfSidebarActiveId, label: "Edit Group", icon: <EditIcon />, path: `/edit-group/${groupName}` },
  ];

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
      {/* Logo */}
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
            width: 38,
            height: 38,
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
          <div style={{ fontFamily: "Italiana, serif", fontSize: 22, letterSpacing: 2.5, color: "#fff", lineHeight: 1 }}>
            D.I.Y.A
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 3 }}>
            Professor View
          </div>
        </div>
      </div>

      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(`/forum/${groupName}`)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "9px 12px",
          borderRadius: 10,
          border: "none",
          backgroundColor: "transparent",
          color: "rgba(255,255,255,0.5)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          outline: "none",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Forum
      </button>

      {/* Section label */}
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
        Menu
      </div>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item) => {
          const isActive = item.id === activeId;
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
                color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
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
              <span style={{ opacity: isActive ? 1 : 0.65, display: "flex" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Group name badge */}
      {groupName && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            paddingTop: 12,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>
              Current Group
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", lineHeight: 1.3 }}>
              {decodeURIComponent(groupName)}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
