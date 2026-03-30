import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

type Group = {
  id: string;
  name: string;
  membersCount: number;
  forumPostsCount: number;
};

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

function SearchIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke={color} strokeWidth="2" />
      <path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke={color} strokeWidth="2" />
      <path d="M4 20.5c1.6-3.2 4.5-5 8-5s6.4 1.8 8 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ForumIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 7.5A4.5 4.5 0 0 1 10.5 3h3A4.5 4.5 0 0 1 18 7.5v3A4.5 4.5 0 0 1 13.5 15H11l-4.5 3V15A4.5 4.5 0 0 1 6 10.5v-3Z"
        stroke={color} strokeWidth="2" strokeLinejoin="round"
      />
    </svg>
  );
}

export function GroupPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState<Group[]>([
    { id: "cs1337", name: "CS 1337 — Computer Science I", membersCount: 128, forumPostsCount: 42 },
    { id: "cs2305", name: "CS 2305 — Discrete Mathematics", membersCount: 96, forumPostsCount: 31 },
    { id: "math2413", name: "MATH 2413 — Differential Calculus", membersCount: 211, forumPostsCount: 58 },
  ]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sidebarHoveredId, setSidebarHoveredId] = useState<string | null>(null);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  const handleAddGroup = () => {
    const trimmed = groupName.trim();
    if (trimmed && !groups.find((g) => g.name === trimmed)) {
      setGroups([
        ...groups,
        {
          id: `group-${Date.now()}`,
          name: trimmed,
          membersCount: Math.floor(Math.random() * 100) + 20,
          forumPostsCount: Math.floor(Math.random() * 50) + 5,
        },
      ]);
      setGroupName("");
    }
  };

  const handleRemove = (id: string) => {
    setGroups(groups.filter((g) => g.id !== id));
  };

  const totalStudents = groups.reduce((sum, g) => sum + g.membersCount, 0);
  const totalPosts = groups.reduce((sum, g) => sum + g.forumPostsCount, 0);

  const sidebarItems = [
    { id: "groups", label: "Groups", icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke="currentColor" strokeWidth="2" /><path d="M4 20.5c1.6-3.2 4.5-5 8-5s6.4 1.8 8 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    )},
    { id: "analysis", label: "Analysis", icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M18 9l-5 5-2-2-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    )},
    { id: "requests", label: "Requests", icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    )},
    { id: "settings", label: "Settings", icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" /><path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    )},
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
      }}
    >
      {/* Sidebar */}
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
          {sidebarItems.map((item) => {
            const isActive = item.id === "groups";
            const isHovered = sidebarHoveredId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id !== "groups") alert(`${item.label} (feature coming soon)`);
                }}
                onMouseEnter={() => setSidebarHoveredId(item.id)}
                onMouseLeave={() => setSidebarHoveredId(null)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: isActive ? "rgba(255,255,255,0.1)" : isHovered ? "rgba(255,255,255,0.05)" : "transparent",
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

        {/* Stats badge */}
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
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>
              Quick Stats
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>
              📚 {groups.length} Classes
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
              👥 {totalStudents} Students
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert("Signed out (auth not wired yet)")}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 10,
              border: "none",
              backgroundColor: "rgba(220,53,69,0.15)",
              color: "#ff6b7a",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              outline: "none",
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Hero Section */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "56px 64px 52px",
            borderBottom: "1px solid rgba(214,214,214,0.2)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: palette.crimson,
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            Professor Dashboard
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: palette.darkest,
              letterSpacing: -2.5,
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            Welcome back.
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "rgba(92,30,38,0.6)",
              marginBottom: 52,
            }}
          >
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {[
              { label: "Classes", value: groups.length, color: palette.crimson },
              { label: "Students", value: totalStudents, color: palette.sage },
              { label: "Discussions", value: totalPosts, color: palette.deepBurgundy },
              { label: "Pending", value: 12, color: "#DC3545" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  paddingRight: i < 3 ? 40 : 0,
                  marginRight: i < 3 ? 40 : 0,
                  borderRight: i < 3 ? "1px solid rgba(214,214,214,0.5)" : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 900,
                    color: stat.color,
                    letterSpacing: -1.5,
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "rgba(92,30,38,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Classes Section */}
        <div style={{ padding: "48px 64px" }}>
          {/* Section header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 32,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 900,
                  color: palette.darkest,
                  letterSpacing: -1.5,
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                Your Classes
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "rgba(92,30,38,0.5)" }}>
                {filteredGroups.length === groups.length
                  ? `Teaching ${groups.length} group${groups.length === 1 ? "" : "s"}`
                  : `Showing ${filteredGroups.length} of ${groups.length} groups`}
              </div>
            </div>

            {/* Search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 18px",
                borderRadius: 14,
                border: "1.5px solid rgba(39,1,21,0.12)",
                backgroundColor: "#fff",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                minWidth: 280,
              }}
            >
              <SearchIcon color={palette.deepBurgundy} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder="Search classes..."
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: palette.deepBurgundy,
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* Add new group */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 20px",
              borderRadius: 16,
              border: "1.5px dashed rgba(162,34,55,0.25)",
              backgroundColor: "rgba(162,34,55,0.02)",
              marginBottom: 32,
            }}
          >
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddGroup()}
              type="text"
              placeholder="Add a new class (e.g., CS 3341 — Probability & Statistics)..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                color: palette.deepBurgundy,
                fontSize: 15,
                fontWeight: 500,
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleAddGroup}
              style={{
                padding: "10px 20px",
                background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`,
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(162,34,55,0.3)",
              }}
            >
              + Add Class
            </button>
          </div>

          {/* Group cards grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 24,
            }}
          >
            {filteredGroups.map((g) => {
              const isHovered = hoveredId === g.id;
              return (
                <div
                  key={g.id}
                  onMouseEnter={() => setHoveredId(g.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: isHovered
                      ? "0 20px 60px rgba(0,0,0,0.18)"
                      : "0 2px 24px rgba(0,0,0,0.06)",
                    transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                    transition: "transform 200ms ease, box-shadow 200ms ease",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => navigate(`/forum/${encodeURIComponent(g.name)}`)}
                >
                  {/* Top accent bar */}
                  <div
                    style={{
                      height: 5,
                      background: `linear-gradient(90deg, ${palette.crimson}, ${palette.sage})`,
                    }}
                  />

                  <div style={{ padding: "28px 28px 24px" }}>
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(g.id);
                      }}
                      style={{
                        position: "absolute",
                        top: 18,
                        right: 18,
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: "none",
                        background: "rgba(220,53,69,0.08)",
                        color: "#DC3545",
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#DC3545";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(220,53,69,0.08)";
                        e.currentTarget.style.color = "#DC3545";
                      }}
                    >
                      ×
                    </button>

                    {/* Group name */}
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: palette.darkest,
                        letterSpacing: -0.5,
                        lineHeight: 1.3,
                        marginBottom: 20,
                        paddingRight: 32,
                      }}
                    >
                      {g.name}
                    </div>

                    {/* Stats row */}
                    <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 12px",
                          borderRadius: 10,
                          backgroundColor: "rgba(122,155,118,0.1)",
                        }}
                      >
                        <UsersIcon color={palette.sage} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy }}>
                          {g.membersCount} members
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 12px",
                          borderRadius: 10,
                          backgroundColor: "rgba(162,34,55,0.06)",
                        }}
                      >
                        <ForumIcon color={palette.crimson} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy }}>
                          {g.forumPostsCount} posts
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: palette.crimson }}>
                        Open Forum
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke={palette.crimson} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredGroups.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  padding: "40px",
                  textAlign: "center",
                  boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <div style={{ color: palette.darkest, fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
                  No classes match "{query.trim()}"
                </div>
                <div style={{ color: "rgba(92,30,38,0.5)", fontSize: 14, fontWeight: 500 }}>
                  Try a shorter name or course code.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom banner */}
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`,
            padding: "40px 64px",
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            D.I.Y.A Platform
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginBottom: 6 }}>
            AI-powered teaching assistant.
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
            Monitor engagement, analyze learning gaps, and respond smarter.
          </div>
        </div>
      </main>
    </div>
  );
}
