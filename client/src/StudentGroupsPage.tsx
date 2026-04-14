import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { StudentSidebar } from "./StudentSidebar";
import { useFirestoreDisplayName } from "./hooks/useFirestoreDisplayName";

// Defining the shape of a group object
type StudentGroup = {
  id: string;
  name: string;
  membersCount: number;
  forumPostsCount: number;
};

type BackendGroup = {
  id: string;
  title?: string;
  members?: string[];
};

type BackendPost = {
  id: string;
  groupId?: string;
};

const GROUPS_API_URL = "/api/groups";
const POSTS_API_URL = "/api/posts";

// Creating a constant pallete to help when styling how pages are going to look
const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

// For the group name search bar: magnifying glass icon
function SearchIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke={color} strokeWidth="2" />
      <path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// For the SVG images, paths used to draw out the images like the logo in the Groups page.
// This is the users/members icon used in the group cards
function UsersIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke={color} strokeWidth="2" />
      <path d="M4 20.5c1.6-3.2 4.5-5 8-5s6.4 1.8 8 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// This is the forum/posts icon used in the group cards
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

// Main page component for displaying student groups
export function StudentGroupsPage() {
  const { user } = useAuth0();
  const firestoreName = useFirestoreDisplayName(user?.sub?.trim());
  const navigate = useNavigate(); // for navigating to other pages
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(""); // search input state
  const [hoveredId, setHoveredId] = useState<string | null>(null); // for hover effects on group cards

  useEffect(() => {
    let isMounted = true;

    const loadGroups = async () => {
      if (!user?.sub) {
        if (isMounted) {
          setGroups([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [groupsResponse, postsResponse] = await Promise.all([
          fetch(GROUPS_API_URL),
          fetch(POSTS_API_URL),
        ]);

        if (!groupsResponse.ok) {
          throw new Error("Failed to load groups.");
        }

        if (!postsResponse.ok) {
          throw new Error("Failed to load forum post counts.");
        }

        const rawGroups = (await groupsResponse.json()) as BackendGroup[];
        const rawPosts = (await postsResponse.json()) as BackendPost[];

        const currentUserIdentifiers = [user.sub, user.email, user.name].filter(
          (value): value is string => Boolean(value),
        );

        const myGroups = rawGroups.filter((group) => {
          const members = Array.isArray(group.members) ? group.members : [];
          return members.some((memberId) => currentUserIdentifiers.includes(memberId));
        });

        const postCounts = rawPosts.reduce<Record<string, number>>((counts, post) => {
          if (!post.groupId) return counts;
          counts[post.groupId] = (counts[post.groupId] ?? 0) + 1;
          return counts;
        }, {});

        const mappedGroups = myGroups.map((group) => ({
          id: group.id,
          name: group.title ?? group.id,
          membersCount: Array.isArray(group.members) ? group.members.length : 0,
          forumPostsCount: postCounts[group.id] ?? 0,
        }));

        if (isMounted) {
          setGroups(mappedGroups);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load groups.");
          setGroups([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadGroups();

    return () => {
      isMounted = false;
    };
  }, [user?.email, user?.name, user?.sub]);

  // Filter groups based on search query
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups; // if no query, return all
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  // Helper vars for showing counts
  const totalCount = groups.length;
  const showingCount = filteredGroups.length;
  const showingLabel =
    query.trim().length > 0 && showingCount !== totalCount
      ? `Showing ${showingCount} of ${totalCount} groups`
      : `You're a member of ${totalCount} group${totalCount === 1 ? "" : "s"}`;


      

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


      {/* sidebar — (30%) color*/}
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
        }}
      >
        <StudentSidebar activeItem="groups" />
      </aside>













      {/* main content — plain background (60%) */}
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
            Welcome Back, {firestoreName || user?.name || user?.email || 'Student'}!
          </div>

          {/* small divider under title */}
          <div
            style={{
              height: 1,
              backgroundColor: "rgba(39,1,21,0.12)",
              marginTop: 14,
              marginBottom: 18,
            }}
          />

          {/* search bar — light gray accent (10%) */}
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








          {/* showing number of groups (group count) text */}
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

          {isLoading && (
            <div
              style={{
                marginTop: 20,
                backgroundColor: "#fff",
                border: "1px solid rgba(214,214,214,0.3)",
                borderRadius: 14,
                padding: 22,
                boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
                color: palette.deepBurgundy,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Loading...
            </div>
          )}

          {!isLoading && error && (
            <div
              style={{
                marginTop: 20,
                backgroundColor: "#fff",
                border: "1px solid rgba(214,214,214,0.3)",
                borderRadius: 14,
                padding: 22,
                boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ color: palette.deepBurgundy, fontWeight: 900, fontSize: 16 }}>
                Unable to load groups
              </div>
              <div style={{ marginTop: 8, color: "rgba(17,17,17,0.6)", fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            </div>
          )}












          {/* group cards container */}
          <div
            style={{
              marginTop: 20,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            {/* render each group card */}
            {!isLoading && !error && filteredGroups.map((g) => {
              const isHovered = hoveredId === g.id; // handle hover effects
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => navigate(`/groups/${g.id}/forum`)}
                  onMouseEnter={() => setHoveredId(g.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
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
                >











                  {/* card header — group name */}
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





                  {/* card stats — members & posts */}
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





                    {/* members */}
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





                    {/* forum posts */}
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







                  {/* view group + arrow */}
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
                </button>
              );
            })}










            {/* fallback if no groups match search */}
            {!isLoading && !error && filteredGroups.length === 0 && (
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