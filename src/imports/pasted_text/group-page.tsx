import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

// Defining the shape of a group object
type Group = {
  id: string;
  name: string;
  membersCount: number;
  forumPostsCount: number;
};

// Color palette
const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

// SVG Icons
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke={color} strokeWidth="2" />
      <path d="M4 20.5c1.6-3.2 4.5-5 8-5s6.4 1.8 8 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ForumIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

  // Filter groups based on search query
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

  const totalCount = groups.length;
  const showingCount = filteredGroups.length;
  const showingLabel =
    query.trim().length > 0 && showingCount !== totalCount
      ? `Showing ${showingCount} of ${totalCount} groups`
      : `You're teaching ${totalCount} group${totalCount === 1 ? "" : "s"}`;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        textAlign: "left",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: "#111",
        display: "flex",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 180,
          background: `linear-gradient(180deg, #3d1542 0%, ${palette.darkest} 100%)`,
          padding: 12,
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo area */}
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

        {/* Divider line */}
        <div
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.25)",
            margin: "0 0 10px 0",
          }}
        />

        {/* Sidebar navigation buttons */}
        <nav aria-label="Sidebar navigation" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { id: "profile", label: "Profile" },
            { id: "groups", label: "Groups" },
            { id: "analysis", label: "Analysis" },
            { id: "requests", label: "Requests" },
            { id: "editgroup", label: "Edit Group" },
          ].map((item) => {
            const isActive = item.id === "groups";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "groups") return;
                  alert(`${item.label} (feature coming soon)`);
                }}
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

        {/* Bottom divider */}
        <div
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.2)",
            margin: "10px 0 8px 0",
          }}
        />

        {/* Quick Stats */}
        <div
          style={{
            padding: "10px 10px",
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            Quick Stats
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
            📚 {groups.length} Classes
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
            👥 {groups.reduce((sum, g) => sum + g.membersCount, 0)} Total Students
          </div>
        </div>

        {/* Sign out button */}
        <button
          type="button"
          onClick={() => alert("Signed out (auth not wired yet)")}
          style={{
            width: "100%",
            textAlign: "center",
            padding: "10px 10px",
            borderRadius: 10,
            border: "none",
            backgroundColor: "#DC3545",
            color: "white",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 120ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#c82333";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#DC3545";
          }}
        >
          Sign Out
        </button>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "32px 36px 56px 24px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1400 }}>
          {/* Page title */}
          <div
            style={{
              color: palette.crimson,
              fontSize: 44,
              fontWeight: 850,
              letterSpacing: -1,
              lineHeight: 1.1,
            }}
          >
            Groups
          </div>

          {/* Small divider under title */}
          <div
            style={{
              height: 1,
              backgroundColor: "rgba(39,1,21,0.12)",
              marginTop: 14,
              marginBottom: 18,
            }}
          />

          {/* Add new group section */}
          <div
            style={{
              width: "min(100%, 100%)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 12,
              border: `1px solid rgba(39,1,21,0.15)`,
              backgroundColor: "#fff",
              marginBottom: 20,
            }}
          >
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddGroup()}
              type="text"
              placeholder="Add a new group (e.g., CS 3341 — Probability & Statistics)..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                color: palette.deepBurgundy,
                fontSize: 14,
                fontWeight: 500,
              }}
            />
            <button
              onClick={handleAddGroup}
              style={{
                padding: "8px 16px",
                background: palette.sage,
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 120ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#699066";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = palette.sage;
              }}
            >
              + Add
            </button>
          </div>

          {/* Search bar */}
          <div
            style={{
              width: "min(560px, 100%)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 12,
              border: `1px solid rgba(39,1,21,0.15)`,
              backgroundColor: "rgba(39,1,21,0.05)",
            }}
          >
            <SearchIcon color={palette.deepBurgundy} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search your groups by name..."
              aria-label="Search groups by name"
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                color: palette.deepBurgundy,
                fontSize: 14,
                fontWeight: 500,
              }}
            />
          </div>

          {/* Showing count text */}
          <div
            style={{
              marginTop: 12,
              color: palette.crimson,
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            {showingLabel}
          </div>

          {/* Group cards container */}
          <div
            style={{
              marginTop: 20,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            {/* Render each group card */}
            {filteredGroups.map((g) => {
              const isHovered = hoveredId === g.id;
              return (
                <div
                  key={g.id}
                  onMouseEnter={() => setHoveredId(g.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    position: "relative",
                    textAlign: "left",
                    backgroundColor: "#fff",
                    border: isHovered ? `1px solid ${palette.crimson}` : "1px solid rgba(214,214,214,0.4)",
                    borderRadius: 14,
                    padding: "18px 20px",
                    cursor: "pointer",
                    boxShadow: isHovered
                      ? "0 12px 36px rgba(0,0,0,0.22)"
                      : "0 4px 18px rgba(0,0,0,0.12)",
                    transform: isHovered ? "translateY(-2px)" : "translateY(0px)",
                    transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
                  }}
                  onClick={() => navigate(`/forum/${encodeURIComponent(g.name)}`)}
                >
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(g.id);
                    }}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: "none",
                      background: "rgba(220, 53, 69, 0.1)",
                      color: "#DC3545",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 120ms ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#DC3545";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(220, 53, 69, 0.1)";
                      e.currentTarget.style.color = "#DC3545";
                    }}
                  >
                    ×
                  </button>

                  {/* Card header — name + dot indicator */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      paddingRight: 20,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        letterSpacing: -0.2,
                        color: palette.deepBurgundy,
                        lineHeight: 1.3,
                      }}
                    >
                      {g.name}
                    </div>

                    {/* Small status dot */}
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: palette.sage,
                        flex: "0 0 auto",
                      }}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Card stats — members & posts */}
                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: palette.deepBurgundy,
                    }}
                  >
                    {/* Members */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                        backgroundColor: "rgba(122,155,118,0.12)",
                      }}
                    >
                      <UsersIcon color={palette.sage} />
                      <span>{g.membersCount} members</span>
                    </div>

                    {/* Forum posts */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                        backgroundColor: "rgba(92,30,38,0.08)",
                      }}
                    >
                      <ForumIcon color={palette.deepBurgundy} />
                      <span>{g.forumPostsCount} posts</span>
                    </div>
                  </div>

                  {/* View group + arrow */}
                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: palette.crimson }}>
                      View group
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 18l6-6-6-6" stroke={palette.crimson} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              );
            })}

            {/* Fallback if no groups match search */}
            {filteredGroups.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  backgroundColor: "#fff",
                  border: "1px solid rgba(214,214,214,0.3)",
                  borderRadius: 14,
                  padding: 22,
                  boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ color: palette.deepBurgundy, fontWeight: 900, fontSize: 16 }}>
                  No groups match "{query.trim()}"
                </div>
                <div style={{ marginTop: 8, color: "rgba(17,17,17,0.6)", fontSize: 13, fontWeight: 600 }}>
                  Try a shorter name, course code, or remove extra spaces.
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}