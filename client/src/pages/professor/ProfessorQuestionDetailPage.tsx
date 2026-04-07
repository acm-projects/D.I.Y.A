import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams, useNavigate } from "react-router-dom";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

interface Reply {
  id: string;
  author: string;
  message: string;
  timestamp: string;
  isAI?: boolean;
  isProfessor?: boolean;
}

type BackendPost = {
  id: string;
  title?: string;
  content?: string;
  authorId?: string;
  aiAnswer?: string;
  isVerified?: boolean;
  createdAt?: { _seconds?: number; seconds?: number } | string;
};

type BackendReply = {
  id: string;
  authorId?: string;
  authorName?: string;
  role?: "student" | "professor";
  text?: string;
  createdAt?: { _seconds?: number; seconds?: number } | string;
};

type BackendUser = {
  id: string;
  authId?: string;
  name?: string;
  email?: string;
};

const POSTS_API_BASE_URL = "/api/posts";
const REPLIES_API_BASE_URL = "/api/replies";
const USERS_API_BASE_URL = "/api/users";

function getTimestampMs(value?: BackendPost["createdAt"] | BackendReply["createdAt"]): number {
  if (!value) return Date.now();

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }

  const seconds = value._seconds ?? value.seconds;
  return typeof seconds === "number" ? seconds * 1000 : Date.now();
}

function formatTimeAgo(timestampMs: number): string {
  const diffMs = Date.now() - timestampMs;
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function ProfessorQuestionDetailPage() {
  const { user, logout } = useAuth0();
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const [manualAnswer, setManualAnswer] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
    author: "Student",
    question: "Loading question...",
    aiAnswer: "",
  });
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadThread = async () => {
      if (!questionId) {
        if (isMounted) {
          setCurrentQuestion({ author: "Student", question: "Question not found", aiAnswer: "" });
          setReplies([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [postResponse, repliesResponse, usersResponse] = await Promise.all([
          fetch(`${POSTS_API_BASE_URL}/${questionId}`),
          fetch(`${REPLIES_API_BASE_URL}/post/${questionId}`),
          fetch(USERS_API_BASE_URL),
        ]);

        if (!postResponse.ok) {
          throw new Error("Failed to load forum thread.");
        }

        if (!repliesResponse.ok) {
          throw new Error("Failed to load replies.");
        }

        const post = (await postResponse.json()) as BackendPost;
        const rawReplies = (await repliesResponse.json()) as BackendReply[];
        const users = usersResponse.ok ? ((await usersResponse.json()) as BackendUser[]) : [];

        const userNameById = new Map<string, string>();
        users.forEach((liveUser) => {
          const displayName = liveUser.name || liveUser.email || "Student";
          userNameById.set(liveUser.id, displayName);
          if (liveUser.authId) {
            userNameById.set(liveUser.authId, displayName);
          }
        });

        const aiReply: Reply[] = post.aiAnswer
          ? [
              {
                id: `ai-${post.id}`,
                author: post.isVerified ? "Professor Verified AI" : "D.I.Y.A AI",
                message: post.aiAnswer,
                timestamp: formatTimeAgo(getTimestampMs(post.createdAt)),
                isAI: true,
              },
            ]
          : [];

        const mappedReplies: Reply[] = rawReplies.map((reply) => ({
          id: reply.id,
          author:
            reply.authorId === user?.sub
              ? "You"
              : reply.authorName || userNameById.get(reply.authorId ?? "") || "Student",
          message: reply.text || "",
          timestamp: formatTimeAgo(getTimestampMs(reply.createdAt)),
          isProfessor: reply.role === "professor",
        }));

        if (isMounted) {
          setCurrentQuestion({
            author: post.authorId === user?.sub ? "You" : userNameById.get(post.authorId ?? "") || "Student",
            question: post.title ?? post.content ?? "Question not available",
            aiAnswer: post.aiAnswer ?? "",
          });
          setReplies([...aiReply, ...mappedReplies]);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load forum thread.");
          setCurrentQuestion({ author: "Student", question: "Question unavailable", aiAnswer: "" });
          setReplies([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadThread();

    return () => {
      isMounted = false;
    };
  }, [questionId, user?.sub]);

  const handleRejectAI = () => {
    setShowManualInput(true);
  };

  const handleSubmitManualAnswer = async () => {
    const text = manualAnswer.trim();
    if (!text || !questionId || !user?.sub) return;

    try {
      setError(null);
      setIsSubmitting(true);

      const response = await fetch(REPLIES_API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: questionId,
          authorId: user.sub,
          authorName: user.name || user.email || "Professor",
          role: "professor",
          text,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send professor reply.");
      }

      const createdReply = (await response.json()) as BackendReply;
      setReplies((currentReplies) => [
        ...currentReplies,
        {
          id: createdReply.id,
          author: "You",
          message: createdReply.text || text,
          timestamp: formatTimeAgo(getTimestampMs(createdReply.createdAt)),
          isProfessor: true,
        },
      ]);
      setManualAnswer("");
      setShowManualInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send professor reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const aiReplyCount = replies.filter((reply) => reply.isAI).length;
  const professorReplyCount = replies.filter((reply) => reply.isProfessor).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: palette.cream, fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif", display: "flex" }}>
      <aside style={{ width: 220, background: "linear-gradient(160deg, #4a1850 0%, #2d0f38 50%, #1c0a24 100%)", padding: "0 10px 16px", boxSizing: "border-box", position: "sticky", top: 0, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.05)", boxShadow: "4px 0 32px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 8px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #a22237 0%, #5C1E26 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 10px rgba(162,34,55,0.45)" }}>
            <img src="/logo.png" alt="logo" style={{ height: 22, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontFamily: "Italiana, serif", fontSize: 22, letterSpacing: 2.5, color: "#fff", lineHeight: 1 }}>D.I.Y.A</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 3 }}>Professor View</div>
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", letterSpacing: 1.5, textTransform: "uppercase", padding: "0 8px", marginBottom: 8 }}>Navigation</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button
            type="button"
            onClick={() => navigate("/professor/forum")}
            style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "none", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            ← Back to Forum
          </button>
          {[
            { id: "calendar", label: "Calendar", path: "/professor/calendar" },
            { id: "analysis", label: "Analysis", path: "/professor/analysis" },
            { id: "requests", label: "Requests", path: "/professor/requests" },
            { id: "editgroup", label: "Edit Group", path: "/professor/edit-group" },
          ].map((item) => (
            <button key={item.id} type="button" onClick={() => navigate(item.path)} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "none", backgroundColor: "transparent", color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", margin: "12px 0 10px 0" }} />
        <button
          type="button"
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          Sign out
        </button>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>
        <div style={{ backgroundColor: "#fff", padding: "56px 64px 52px", borderBottom: "1px solid rgba(214,214,214,0.2)" }}>
          <div style={{ maxWidth: 1200 }}>
            <button
              onClick={() => navigate("/professor/forum")}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", cursor: "pointer", padding: 0, marginBottom: 24, fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.5)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Forum
            </button>

            <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>Question Discussion</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: palette.darkest, letterSpacing: -2, lineHeight: 1.1, marginBottom: 12, maxWidth: 900 }}>{currentQuestion.question}</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "rgba(92,30,38,0.5)" }}>Asked by {currentQuestion.author} · CS 1337 — Computer Science I</div>
          </div>
        </div>

        <div style={{ padding: "48px 64px" }}>
          <div style={{ maxWidth: 1200 }}>

          {error && (
            <div style={{ marginBottom: 18, padding: "14px 16px", backgroundColor: "#fff", border: "1px solid rgba(220,53,69,0.2)", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", color: palette.crimson, fontSize: 13, fontWeight: 700 }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 32, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: palette.darkest, letterSpacing: -0.8, marginBottom: 24 }}>
                Discussion ({replies.length} {replies.length === 1 ? "reply" : "replies"})
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {isLoading && (
                <div style={{ padding: "14px 16px", backgroundColor: "rgba(214,214,214,0.15)", borderRadius: 10, color: palette.deepBurgundy, fontSize: 14, fontWeight: 700 }}>
                  Loading discussion...
                </div>
              )}

              {!isLoading && replies.length === 0 && (
                <div style={{ padding: "14px 16px", backgroundColor: "rgba(214,214,214,0.15)", borderRadius: 10, color: "rgba(92,30,38,0.55)", fontSize: 13, fontWeight: 700 }}>
                  No replies yet. You can post the first professor response below.
                </div>
              )}

              {replies.map((reply) => (
                <div
                  key={reply.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ height: 4, backgroundColor: reply.isAI ? palette.crimson : reply.isProfessor ? palette.sage : palette.lightGray }} />
                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: reply.isAI ? "rgba(162,34,55,0.1)" : reply.isProfessor ? "rgba(122,155,118,0.15)" : "rgba(214,214,214,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                          {reply.isAI ? "🤖" : reply.isProfessor ? "👨‍🏫" : "👤"}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: reply.isAI ? palette.crimson : reply.isProfessor ? palette.sage : palette.darkest }}>{reply.author}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.4)" }}>{reply.timestamp}</div>
                        </div>
                      </div>

                      {reply.isAI && (
                        <button
                          onClick={handleRejectAI}
                          style={{ padding: "6px 14px", background: "transparent", color: "#DC3545", border: "1.5px solid #DC3545", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          ✗ Reject & Reply
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: palette.deepBurgundy, lineHeight: 1.65 }}>{reply.message}</div>
                  </div>
                </div>
              ))}
              </div>
            </div>

            <div style={{ position: "sticky", top: 32 }}>
              <div style={{ backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 24px rgba(0,0,0,0.08)", marginBottom: 16 }}>
                <div style={{ height: 5, background: `linear-gradient(90deg, ${palette.crimson}, ${palette.sage})` }} />
                <div style={{ padding: "24px" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: palette.darkest, marginBottom: 16 }}>Professor Actions</div>
                  <button onClick={() => setShowManualInput(true)} style={{ width: "100%", padding: "12px", background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`, color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>✏️ Write Custom Answer</button>
                  <button onClick={() => navigate("/professor/forum")} style={{ width: "100%", padding: "12px", background: "transparent", color: palette.deepBurgundy, border: "1.5px solid rgba(92,30,38,0.2)", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>← Back to Forum</button>
                </div>
              </div>

              <div style={{ backgroundColor: "#fff", borderRadius: 20, padding: "20px 24px", boxShadow: "0 2px 24px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(92,30,38,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Thread Stats</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>Total replies</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: palette.crimson }}>{replies.length}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>AI responses</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: palette.sage }}>{aiReplyCount}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>Professor replies</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: palette.deepBurgundy }}>{professorReplyCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showManualInput && (
            <div style={{ marginTop: 32, backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 32px rgba(0,0,0,0.12)" }}>
              <div style={{ height: 5, backgroundColor: palette.sage }} />
              <div style={{ padding: "28px 32px" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: palette.darkest, marginBottom: 16 }}>👨‍🏫 Your Manual Response</div>
                <textarea
                  value={manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  style={{ width: "100%", minHeight: 140, padding: "14px 16px", border: "1.5px solid rgba(214,214,214,0.5)", borderRadius: 12, fontSize: 15, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", outline: "none", color: palette.deepBurgundy, lineHeight: 1.6 }}
                />
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button onClick={() => void handleSubmitManualAnswer()} disabled={!manualAnswer.trim() || isSubmitting} style={{ padding: "12px 24px", background: !manualAnswer.trim() || isSubmitting ? "rgba(122,155,118,0.35)" : `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`, color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: !manualAnswer.trim() || isSubmitting ? "not-allowed" : "pointer" }}>{isSubmitting ? "Sending..." : "Submit Answer"}</button>
                  <button onClick={() => setShowManualInput(false)} style={{ padding: "12px 24px", background: "transparent", color: palette.deepBurgundy, border: "1.5px solid rgba(92,30,38,0.2)", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        <div style={{ background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`, padding: "36px 64px" }}>
          <div style={{ maxWidth: 1200 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>CS 1337 — Computer Science I</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>Keep the conversation going — your class is counting on you.</div>
          </div>
        </div>
      </main>
    </div>
  );
}
