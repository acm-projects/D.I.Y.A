import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { ProfessorSidebar } from "../../ProfessorSidebar";
import { useProfessorGroups } from "../../ProfessorGroupContext";

interface Question {
  id: string;
  author: string;
  question: string;
  replies: number;
  aiAnswer: string;
  aiAnswerStatus: "pending" | "verified" | "rejected";
  createdAtMs: number;
}

type BackendPost = {
  id: string;
  title?: string;
  content?: string;
  groupId?: string;
  authorId?: string;
  aiAnswer?: string;
  aiReviewStatus?: "pending" | "verified" | "rejected";
  isVerified?: boolean;
  createdAt?: { _seconds?: number; seconds?: number } | string;
};

type BackendGroup = {
  id: string;
  professor?: string;
  title?: string;
};

type BackendReply = {
  id: string;
};

type BackendUser = {
  id: string;
  authId?: string;
  name?: string;
  email?: string;
};

type AnnouncementRecord = {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  message: string;
  createdAt?: { _seconds?: number; seconds?: number } | string;
};

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

const GROUPS_API_BASE_URL = "/api/groups";
const POSTS_API_BASE_URL = "/api/posts";
const REPLIES_API_BASE_URL = "/api/replies";
const USERS_API_BASE_URL = "/api/users";
const ANNOUNCEMENTS_API_BASE_URL = "/api/announcements";

function getTimeAgo(createdAtMs: number): string {
  const diffMs = Date.now() - createdAtMs;
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

function getTimestampMs(value?: BackendPost["createdAt"] | AnnouncementRecord["createdAt"]): number {
  if (!value) return Date.now();

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }

  const seconds = value._seconds ?? value.seconds;
  return typeof seconds === "number" ? seconds * 1000 : Date.now();
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
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfessorForumPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth0();
  const { selectedGroupId, groups } = useProfessorGroups();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [groupTitle, setGroupTitle] = useState("Professor Forum");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyUnanswered, setShowOnlyUnanswered] = useState(false);
  const [sortMode, setSortMode] = useState<"recent" | "engagement">("recent");
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadForumData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [groupsResponse, postsResponse, usersResponse, announcementsResponse] = await Promise.all([
          fetch(GROUPS_API_BASE_URL),
          fetch(POSTS_API_BASE_URL),
          fetch(USERS_API_BASE_URL),
          fetch(ANNOUNCEMENTS_API_BASE_URL),
        ]);

        if (!groupsResponse.ok) {
          throw new Error("Failed to load professor forum groups.");
        }

        if (!postsResponse.ok) {
          throw new Error("Failed to load professor forum posts.");
        }

        const allGroups = (await groupsResponse.json()) as BackendGroup[];
        const posts = (await postsResponse.json()) as BackendPost[];
        const users = usersResponse.ok ? ((await usersResponse.json()) as BackendUser[]) : [];
        const liveAnnouncements = announcementsResponse.ok
          ? ((await announcementsResponse.json()) as AnnouncementRecord[])
          : [];

        const contextGroup = groups.find((g) => g.id === selectedGroupId) ?? null;
        const selectedGroup = contextGroup
          ? allGroups.find((g) => g.id === contextGroup.id) ?? null
          : null;

        const repliesByPost = await Promise.all(
          posts.map(async (post) => {
            const response = await fetch(`${REPLIES_API_BASE_URL}/post/${post.id}`);
            if (!response.ok) {
              return [] as BackendReply[];
            }

            return (await response.json()) as BackendReply[];
          }),
        );

        const userNameById = new Map<string, string>();
        users.forEach((liveUser) => {
          const displayName = liveUser.name || liveUser.email || "Student";
          userNameById.set(liveUser.id, displayName);
          if (liveUser.authId) {
            userNameById.set(liveUser.authId, displayName);
          }
        });

        const groupScopedPosts = selectedGroup
          ? posts.filter((post) => post.groupId === selectedGroup.id)
          : posts;

        const groupScopedRepliesByPost = selectedGroup
          ? posts.reduce<BackendReply[][]>((accumulator, post, index) => {
              if (post.groupId === selectedGroup.id) {
                accumulator.push(repliesByPost[index] ?? []);
              }

              return accumulator;
            }, [])
          : repliesByPost;

        const relevantPosts = groupScopedPosts.length > 0 ? groupScopedPosts : posts;
        const relevantRepliesByPost = groupScopedPosts.length > 0 ? groupScopedRepliesByPost : repliesByPost;

        const mappedQuestions = relevantPosts
          .map((post, index) => ({
            id: post.id,
            author: userNameById.get(post.authorId ?? "") || "Student",
            question: post.title ?? post.content ?? "Untitled question",
            replies: relevantRepliesByPost[index]?.length ?? 0,
            aiAnswer: post.aiAnswer ?? "No AI answer available yet.",
            aiAnswerStatus: post.aiReviewStatus ?? (post.isVerified ? "verified" : "pending"),
            createdAtMs: getTimestampMs(post.createdAt),
          }))
          .sort((a, b) => b.createdAtMs - a.createdAtMs);

        const sortedAnnouncements = [...liveAnnouncements].sort(
          (a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt),
        );

        if (isMounted) {
          setQuestions(mappedQuestions);
          setAnnouncements(sortedAnnouncements);
          setGroupTitle(selectedGroup?.title?.trim() || "Professor Forum");
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load professor forum data.");
          setQuestions([]);
          setAnnouncements([]);
          setGroupTitle("Professor Forum");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadForumData();

    return () => {
      isMounted = false;
    };
  }, [user?.email, user?.name, user?.sub, selectedGroupId, groups]);

  const visibleQuestions = useMemo(() => {
    const filteredQuestions = showOnlyUnanswered
      ? questions.filter((question) => question.replies === 0)
      : questions;

    return [...filteredQuestions].sort((a, b) => {
      if (sortMode === "engagement") {
        return b.replies - a.replies;
      }

      return b.createdAtMs - a.createdAtMs;
    });
  }, [questions, showOnlyUnanswered, sortMode]);

  const pendingCount = useMemo(
    () => questions.filter((question) => question.aiAnswerStatus === "pending").length,
    [questions],
  );

  const verifiedCount = useMemo(
    () => questions.filter((question) => question.aiAnswerStatus === "verified").length,
    [questions],
  );

  const totalReplies = useMemo(
    () => questions.reduce((sum, question) => sum + question.replies, 0),
    [questions],
  );

  const answeredCount = useMemo(
    () => questions.filter((question) => question.replies > 0).length,
    [questions],
  );

  const handleAIResponse = async (questionId: string, action: "verify" | "reject") => {
    try {
      setError(null);

      const response = await fetch(`${POSTS_API_BASE_URL}/${questionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isVerified: action === "verify",
          aiReviewStatus: action === "verify" ? "verified" : "rejected",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update AI review status.");
      }

      setQuestions((currentQuestions) =>
        currentQuestions.map((question) =>
          question.id === questionId
            ? { ...question, aiAnswerStatus: action === "verify" ? "verified" : "rejected" }
            : question,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update AI review status.");
    }
  };

  const closeAnnouncementModal = () => {
    setShowAnnouncementModal(false);
    setAnnouncementTitle("");
    setAnnouncementMessage("");
  };

  const handlePostAnnouncement = async () => {
    const title = announcementTitle.trim();
    const message = announcementMessage.trim();

    if (!title || !message || !user?.sub) {
      return;
    }

    try {
      setIsSubmittingAnnouncement(true);
      setError(null);

      const response = await fetch(ANNOUNCEMENTS_API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorId: user.sub,
          authorName: user.name || user.email || "Professor",
          title,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post announcement.");
      }

      const createdAnnouncement = (await response.json()) as AnnouncementRecord;
      setAnnouncements((currentAnnouncements) => [createdAnnouncement, ...currentAnnouncements]);
      closeAnnouncementModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post announcement.");
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: palette.cream, textAlign: "left", fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif", color: "#111", display: "flex" }}>
      <ProfessorSidebar activeItem="forum" onSignOut={() => {
        window.localStorage.removeItem("diya_role");
        window.sessionStorage.removeItem("pendingSignupRole");
        void logout({ logoutParams: { returnTo: window.location.origin } });
      }}>
        <div style={{ padding: "12px 12px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Forum Stats</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>📊 {questions.length} Questions</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>✅ {answeredCount} Answered</div>
        </div>
        <button
          type="button"
          onClick={() => setShowAnnouncementModal(true)}
          style={{ width: "100%", textAlign: "center", padding: "11px 10px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 120ms ease", boxShadow: "0 2px 12px rgba(122,155,118,0.3)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#699066";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`;
          }}
        >
          ✏️ New Announcement
        </button>
      </ProfessorSidebar>

      <main style={{ flex: 1, overflow: "auto" }}>
        <div style={{ backgroundColor: "#fff", padding: "56px 64px 52px", borderBottom: "1px solid rgba(214,214,214,0.2)" }}>
          <div style={{ maxWidth: 1400 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>Forum Management</div>
            <div style={{ fontSize: 64, fontWeight: 900, color: palette.darkest, letterSpacing: -2.5, lineHeight: 1, marginBottom: 12 }}>{groupTitle}</div>
            <div style={{ fontSize: 20, fontWeight: 400, color: "rgba(92,30,38,0.55)", marginBottom: 52 }}>Discussion board & AI answer management</div>

            <div style={{ display: "flex", gap: 0, alignItems: "stretch", flexWrap: "wrap" }}>
              {[
                { label: "Total Questions", value: questions.length, color: palette.crimson },
                { label: "AI Verified", value: verifiedCount, color: palette.sage },
                { label: "Pending Review", value: pendingCount, color: "#DC3545" },
                { label: "Discussion Replies", value: totalReplies, color: palette.deepBurgundy },
              ].map((stat, i) => (
                <div key={stat.label} style={{ flex: "1 1 220px", minWidth: 180, paddingRight: i < 3 ? 40 : 0, marginRight: i < 3 ? 40 : 0, borderRight: i < 3 ? "1px solid rgba(214,214,214,0.5)" : "none" }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: stat.color, letterSpacing: -1.5, lineHeight: 1, marginBottom: 8 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "48px 64px" }}>
        <div style={{ maxWidth: 1400 }}>

          {error && (
            <div style={{ marginBottom: 18, padding: "14px 16px", backgroundColor: "#fff", border: "1px solid rgba(220,53,69,0.2)", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", color: palette.crimson, fontSize: 13, fontWeight: 700 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20, padding: "20px 22px", backgroundColor: "#fff", borderRadius: 14, border: "1px solid rgba(214,214,214,0.4)", boxShadow: "0 4px 18px rgba(0,0,0,0.08)" }}>
            <div style={{ color: palette.crimson, fontSize: 20, fontWeight: 800, marginBottom: 14 }}>Latest Announcements</div>
            {announcements.length === 0 ? (
              <div style={{ color: "rgba(92,30,38,0.55)", fontSize: 13, fontWeight: 600 }}>No announcements posted yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {announcements.map((announcement) => (
                  <div key={announcement.id} style={{ padding: "14px 16px", backgroundColor: "rgba(122,155,118,0.08)", borderRadius: 12, border: "1px solid rgba(122,155,118,0.18)" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: palette.deepBurgundy }}>{announcement.title}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.5)" }}>{getTimeAgo(getTimestampMs(announcement.createdAt))}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: palette.deepBurgundy, lineHeight: 1.5, marginBottom: 8 }}>{announcement.message}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: palette.sage }}>Posted by {announcement.authorName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: palette.darkest, fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>Recent Questions</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy, opacity: 0.7 }}>Last updated: {questions[0] ? getTimeAgo(questions[0].createdAtMs) : "No posts yet"}</div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={() => setShowOnlyUnanswered(false)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${!showOnlyUnanswered ? palette.crimson : "rgba(39,1,21,0.2)"}`, backgroundColor: !showOnlyUnanswered ? palette.crimson : "transparent", color: !showOnlyUnanswered ? "white" : palette.deepBurgundy, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>All Questions</button>
            <button onClick={() => setShowOnlyUnanswered(true)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${showOnlyUnanswered ? palette.crimson : "rgba(39,1,21,0.2)"}`, backgroundColor: showOnlyUnanswered ? palette.crimson : "transparent", color: showOnlyUnanswered ? "white" : palette.deepBurgundy, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Unanswered</button>
            <button onClick={() => setSortMode((currentSortMode) => currentSortMode === "recent" ? "engagement" : "recent")} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(39,1,21,0.2)", backgroundColor: "transparent", color: palette.deepBurgundy, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{sortMode === "recent" ? "Recent" : "Most Replies"}</button>
          </div>

          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 18 }}>
            {isLoading && (
              <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid rgba(214,214,214,0.3)", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: palette.deepBurgundy, fontSize: 14, fontWeight: 700 }}>
                Loading professor forum...
              </div>
            )}

            {!isLoading && visibleQuestions.length === 0 && (
              <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: "20px 24px", border: "1px solid rgba(214,214,214,0.3)", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: "rgba(92,30,38,0.55)", fontSize: 13, fontWeight: 700 }}>
                No questions match the current filter.
              </div>
            )}

            {!isLoading && visibleQuestions.map((q) => {
              const isHovered = hoveredId === q.id;
              return (
                <div
                  key={q.id}
                  onMouseEnter={() => setHoveredId(q.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ textAlign: "left", backgroundColor: "#fff", border: isHovered ? `1px solid ${palette.crimson}` : "1px solid rgba(214,214,214,0.4)", borderRadius: 14, padding: "18px 20px", cursor: "pointer", boxShadow: isHovered ? "0 12px 36px rgba(0,0,0,0.22)" : "0 4px 18px rgba(0,0,0,0.12)", transform: isHovered ? "translateY(-2px)" : "translateY(0px)", transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.2, color: palette.deepBurgundy, lineHeight: 1.3, flex: 1 }}>{q.question}</div>
                    <div style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: palette.sage, flex: "0 0 auto" }} aria-hidden="true" />
                  </div>

                  <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12, fontWeight: 700, color: palette.deepBurgundy, alignItems: "center" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, backgroundColor: "rgba(122,155,118,0.12)" }}>
                      <UsersIcon color={palette.sage} />
                      <span>{q.author}</span>
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, backgroundColor: q.replies === 0 ? "rgba(220,53,69,0.1)" : "rgba(92,30,38,0.08)" }}>
                      <ForumIcon color={q.replies === 0 ? "#DC3545" : palette.deepBurgundy} />
                      <span>{q.replies} {q.replies === 1 ? "reply" : "replies"}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.5)", marginLeft: "auto" }}>🕐 {getTimeAgo(q.createdAtMs)}</div>
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      padding: "12px 14px",
                      backgroundColor: q.aiAnswerStatus === "verified" ? "rgba(122,155,118,0.08)" : q.aiAnswerStatus === "rejected" ? "rgba(220,53,69,0.05)" : "rgba(162,34,55,0.04)",
                      borderLeft: `3px solid ${q.aiAnswerStatus === "verified" ? palette.sage : q.aiAnswerStatus === "rejected" ? "#DC3545" : palette.crimson}`,
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      🤖 AI Generated Answer
                      {q.aiAnswerStatus === "verified" && <span style={{ color: palette.sage }}>✓ Verified</span>}
                      {q.aiAnswerStatus === "rejected" && <span style={{ color: "#DC3545" }}>✗ Rejected</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: palette.deepBurgundy, lineHeight: 1.5, marginBottom: 10 }}>{q.aiAnswer}</div>
                    {q.aiAnswerStatus === "pending" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAIResponse(q.id, "verify");
                          }}
                          style={{ padding: "6px 12px", background: palette.sage, color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 120ms ease" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#699066";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = palette.sage;
                          }}
                        >
                          ✓ Verify
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAIResponse(q.id, "reject");
                          }}
                          style={{ padding: "6px 12px", background: "transparent", color: "#DC3545", border: "1px solid #DC3545", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 120ms ease" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#DC3545";
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#DC3545";
                          }}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <button onClick={() => navigate(`/professor/forum/${q.id}`)} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: palette.crimson }}>View all replies</div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M9 18l6-6-6-6" stroke={palette.crimson} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>

        <div style={{ background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`, padding: "40px 64px" }}>
          <div style={{ maxWidth: 1400 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>AI Forum Management</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginBottom: 4 }}>
              {pendingCount > 0 ? `${pendingCount} answers awaiting your review.` : "All AI answers reviewed. Great work."}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>
              Verify or override AI-generated responses to keep students informed.
            </div>
          </div>
        </div>
      </main>

      {showAnnouncementModal && (
        <div onClick={closeAnnouncementModal} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(520px, 92vw)", backgroundColor: "#fff", borderRadius: 18, padding: "24px 24px 20px", boxShadow: "0 20px 60px rgba(0,0,0,0.28)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 16 }}>New Announcement</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Announcement Title</div>
            <input value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} placeholder="Enter a short title" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(39,1,21,0.18)", fontSize: 14, fontWeight: 500, boxSizing: "border-box", marginBottom: 14, fontFamily: "inherit" }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Message</div>
            <textarea value={announcementMessage} onChange={(e) => setAnnouncementMessage(e.target.value)} placeholder="Share an update with your students..." style={{ width: "100%", minHeight: 140, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(39,1,21,0.18)", fontSize: 14, fontWeight: 500, boxSizing: "border-box", resize: "vertical", marginBottom: 18, fontFamily: "inherit" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={closeAnnouncementModal} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(39,1,21,0.18)", backgroundColor: "transparent", color: palette.deepBurgundy, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={handlePostAnnouncement} disabled={!announcementTitle.trim() || !announcementMessage.trim() || isSubmittingAnnouncement} style={{ padding: "10px 18px", borderRadius: 10, border: "none", backgroundColor: !announcementTitle.trim() || !announcementMessage.trim() || isSubmittingAnnouncement ? "rgba(162,34,55,0.25)" : palette.crimson, color: "white", fontSize: 13, fontWeight: 700, cursor: !announcementTitle.trim() || !announcementMessage.trim() || isSubmittingAnnouncement ? "not-allowed" : "pointer" }}>{isSubmittingAnnouncement ? "Posting..." : "Post Announcement"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
