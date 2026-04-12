import { useState } from "react";
import { useNavigate } from "react-router-dom";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
} as const;

export type ProfSidebarActiveId = "calendar" | "analysis" | "requests" | "editgroup";

function CalendarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function AnalysisIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 9l-5 5-2-2-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RequestsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 13l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
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
  const [collapsed, setCollapsed] = useState(false);

  const segment = groupName ? encodeURIComponent(groupName) : "";
  const navItems = [
    { id: "calendar" as ProfSidebarActiveId, label: "Calendar", icon: <CalendarIcon />, path: segment ? `/calendar/${segment}` : "/calendar" },
    { id: "analysis" as ProfSidebarActiveId, label: "Analysis", icon: <AnalysisIcon />, path: segment ? `/analysis/${segment}` : "/analysis" },
    { id: "requests" as ProfSidebarActiveId, label: "Requests", icon: <RequestsIcon />, path: segment ? `/requests/${segment}` : "/requests" },
    { id: "editgroup" as ProfSidebarActiveId, label: "Edit Group", icon: <EditIcon />, path: segment ? `/edit-group/${segment}` : "/edit-group" },
  ];

  const handleSignOut = () => {
    navigate("/");
  };

  /* Same widths as student Sidebar: 300px expanded rail, 72px collapsed (logo + chevron stack) */
  const W = collapsed ? 72 : 300;

  return (
    <aside
      style={{
        width: W,
        minWidth: W,
        /* Shared shell with student Sidebar (gradient, border, shadow) */
        background: "linear-gradient(160deg, #4a1850 0%, #2d0f38 50%, #1c0a24 100%)",
        padding: collapsed ? "0 8px 16px" : "0 14px 16px",
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.25)",
        flexShrink: 0,
        transition: "width 200ms ease, min-width 200ms ease, padding 200ms ease",
      }}
    >
      {/* Header: identical layout rules to student Sidebar — stretch row, tight gap/padding so logo can scale in fixed 300px */}
      <div
        style={{
          display: "flex",
          flexDirection: collapsed ? "column" : "row",
          alignItems: collapsed ? "center" : "stretch",
          justifyContent: collapsed ? "center" : "space-between",
          gap: collapsed ? 10 : 6,
          padding: collapsed ? "14px 0 12px" : "18px 2px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 16,
        }}
      >
        {/* Logo cell — same dimensions as student Sidebar (/logo.png, no backing box) */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            minHeight: collapsed ? undefined : 82,
          }}
        >
          <img
            src="/logo.png"
            alt="logo"
            style={{
              /* Expanded: 82px height, maxWidth 154 — fills header band beside titles; object-fit contain */
              height: collapsed ? 42 : 82,
              width: "auto",
              maxWidth: collapsed ? 56 : 154,
              objectFit: "contain",
              objectPosition: "left center",
              display: "block",
            }}
          />
        </div>

        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {/* Wordmark + subtitle sizing matches student Sidebar; label reads “Professor View” here */}
            <div style={{ fontFamily: "Italiana, serif", fontSize: 28, letterSpacing: 3, color: "#fff", lineHeight: 1.05 }}>
              D.I.Y.A
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.38)", letterSpacing: 1.3, textTransform: "uppercase", marginTop: 5 }}>
              Professor View
            </div>
          </div>
        )}

        {/* Collapse control — alignSelf center when expanded to sit visually centered vs tall logo */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            flexShrink: 0,
            alignSelf: collapsed ? undefined : "center",
            width: 28,
            height: 28,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            backgroundColor: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            outline: "none",
            transition: "background 130ms",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            {collapsed
              ? <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              : <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            }
          </svg>
        </button>
      </div>

      {/* Back to Group */}
      <button
        type="button"
        onClick={() => navigate(groupName ? `/forum/${encodeURIComponent(groupName)}` : "/edit-group")}
        title={collapsed ? "Back to your groups" : undefined}
        style={{
          width: "100%",
          textAlign: collapsed ? "center" : "left",
          padding: collapsed ? "10px 0" : "10px 14px",
          borderRadius: 10,
          border: "none",
          backgroundColor: "transparent",
          color: "rgba(255,255,255,0.5)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 9,
          marginBottom: 10,
          outline: "none",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {!collapsed && "Back to your groups"}
      </button>

      {/* Section label — same 11px “Menu” treatment as student Sidebar */}
      {!collapsed && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.28)",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            padding: "0 6px",
            marginBottom: 8,
          }}
        >
          Menu
        </div>
      )}

      {/* Nav list — button padding, active crimson strip, font 14: parity with student Sidebar */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
              title={collapsed ? item.label : undefined}
              style={{
                width: "100%",
                textAlign: collapsed ? "center" : "left",
                padding: collapsed ? "11px 0" : "11px 14px",
                borderRadius: 10,
                border: "none",
                backgroundColor: isActive
                  ? "rgba(255,255,255,0.12)"
                  : isHovered
                  ? "rgba(255,255,255,0.06)"
                  : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: 11,
                transition: "all 130ms ease",
                position: "relative",
                outline: "none",
              }}
            >
              {isActive && !collapsed && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 22,
                    borderRadius: "0 4px 4px 0",
                    backgroundColor: palette.crimson,
                  }}
                />
              )}
              <span style={{ opacity: isActive ? 1 : 0.7, display: "flex", flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Group name badge + sign out */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14 }}>
        {groupName && !collapsed && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>
              Current Group
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", lineHeight: 1.3 }}>
              {decodeURIComponent(groupName)}
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          style={{
            width: "100%",
            textAlign: collapsed ? "center" : "left",
            padding: collapsed ? "10px 0" : "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.5)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 9,
            outline: "none",
            transition: "background 130ms",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
