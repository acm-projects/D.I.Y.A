import { useState } from "react";
import { useNavigate } from "react-router-dom";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
} as const;

export type SidebarActiveId = "profile" | "groups" | "request" | "selfcheck";

function ProfileIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GroupsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckDocIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function Sidebar({ activeId }: { activeId: SidebarActiveId | null }) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: "profile" as SidebarActiveId, label: "Profile", icon: <ProfileIcon /> },
    { id: "groups" as SidebarActiveId, label: "Groups", icon: <GroupsIcon /> },
    { id: "request" as SidebarActiveId, label: "Office Hours", icon: <CalendarIcon /> },
    { id: "selfcheck" as SidebarActiveId, label: "Self-Check", icon: <CheckDocIcon /> },
  ];

  const handleNav = (id: SidebarActiveId) => {
    if (id === "profile") { navigate("/profile"); return; }
    if (id === "groups") { navigate("/groups"); return; }
    if (id === "request") { navigate("/office-hours"); return; }
    if (id === "selfcheck") { navigate("/self-check"); return; }
  };

  const handleSignOut = () => {
    navigate("/");
  };

  /* Sidebar width: 300px expanded (fixed rail, matches ProfessorSidebar); 72px collapsed — enough for stacked logo + chevron */
  const W = collapsed ? 72 : 300;

  return (
    <aside
      style={{
        width: W,
        minWidth: W,
        /* Same gradient / chrome as professor rail for a unified shell */
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
        /* Animate width/padding when collapsing so the rail feels smooth */
        transition: "width 200ms ease, min-width 200ms ease, padding 200ms ease",
      }}
    >
      {/* Header: expanded = row [logo | titles | collapse]; collapsed = column stack. stretch + tight horizontal padding = more room for logo without widening sidebar */}
      <div
        style={{
          display: "flex",
          flexDirection: collapsed ? "column" : "row",
          alignItems: collapsed ? "center" : "stretch",
          justifyContent: collapsed ? "center" : "space-between",
          /* gap 6 (expanded): slightly tighter than default so logo can use horizontal space toward titles */
          gap: collapsed ? 10 : 6,
          /* 2px horizontal (expanded): minimal side inset — frees a few px for logo vs titles inside fixed 300px */
          padding: collapsed ? "14px 0 12px" : "18px 2px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 16,
        }}
      >
        {/* Logo: plain /logo.png (no gradient tile). minHeight matches expanded image height so row aligns with title block */}
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
              /* Expanded: tall mark (82) + maxWidth 154 fills header band next to titles; contain keeps aspect ratio */
              height: collapsed ? 42 : 82,
              width: "auto",
              maxWidth: collapsed ? 56 : 154,
              objectFit: "contain",
              objectPosition: "left center",
              display: "block",
            }}
          />
        </div>

        {/* Titles: flex:1 takes remaining width after logo + button; minWidth:0 allows shrink if needed */}
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {/* Primary wordmark — size/letterSpacing tuned to pair with larger logo */}
            <div style={{ fontFamily: "Italiana, serif", fontSize: 28, letterSpacing: 3, color: "#fff", lineHeight: 1.05 }}>
              D.I.Y.A
            </div>
            {/* Subtitle — 11px uppercase, matches ProfessorSidebar “Menu” / rail hierarchy */}
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.38)", letterSpacing: 1.3, textTransform: "uppercase", marginTop: 5 }}>
              Student Portal
            </div>
          </div>
        )}

        {/* Collapse: always visible; alignSelf center when expanded so chevron sits mid-rail next to tall logo row */}
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

      {/* “Menu” — 11px section label, aligned with ProfessorSidebar nav chrome */}
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

      {/* Nav: padding/gap/active strip styling matches ProfessorSidebar for one pattern */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map((item) => {
          const isActive = activeId !== null && item.id === activeId;
          const isHovered = hoveredId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
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

      {/* User + sign out */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14 }}>
        {/* Avatar row */}
        <div
          style={{
            padding: collapsed ? "6px 0" : "8px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "linear-gradient(135deg, rgba(162,34,55,0.7) 0%, rgba(92,30,38,0.7) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            S
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.88)", whiteSpace: "nowrap" }}>
                Student
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                student@university.edu
              </div>
            </div>
          )}
        </div>

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
