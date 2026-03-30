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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: palette.cream, fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif", display: "flex" }}>
      <aside style={{ width: 180, background: `linear-gradient(180deg, #3d1542 0%, ${palette.darkest} 100%)`, padding: 12, boxSizing: "border-box", position: "sticky", top: 0, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "Italiana, serif", fontSize: 30, letterSpacing: 1.5, color: "#fff", padding: "6px 4px 10px 4px" }}>
          <img src="/logo.png" alt="logo" style={{ height: 48, objectFit: "contain", marginBottom: 4 }} />
          <span style={{ lineHeight: 1 }}>D.I.Y.A</span>
        </div>
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.25)", margin: "0 0 10px 0" }} />
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button
            type="button"
            onClick={() => navigate("/professor/forum")}
            style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 10, border: "none", backgroundColor: "transparent", color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            ← Back to Forum
          </button>
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.2)", margin: "10px 0 8px 0" }} />
        <button
          type="button"
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          Sign out
        </button>
      </aside>

      <main style={{ flex: 1, padding: "32px 36px 56px 24px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 900 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ color: palette.crimson, fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>Question Discussion</div>
            <div style={{ color: palette.deepBurgundy, fontSize: 14, fontWeight: 600 }}>CS 1337 — Computer Science I</div>
          </div>

          {error && (
            <div style={{ marginBottom: 18, padding: "14px 16px", backgroundColor: "#fff", border: "1px solid rgba(220,53,69,0.2)", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", color: palette.crimson, fontSize: 13, fontWeight: 700 }}>
              {error}
            </div>
          )}

          <div style={{ backgroundColor: "#fff", border: `2px solid ${palette.crimson}`, borderRadius: 14, padding: "20px 24px", marginBottom: 24, boxShadow: "0 4px 18px rgba(0,0,0,0.12)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Original Question</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 12, lineHeight: 1.4 }}>{currentQuestion.question}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: palette.sage }}>Asked by {currentQuestion.author}</div>
          </div>

          <div style={{ backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.4)", borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: "0 4px 18px rgba(0,0,0,0.08)", minHeight: 400, maxHeight: 600, overflowY: "auto" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: palette.crimson, marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>Discussion ({replies.length} replies)</div>
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
                    padding: "14px 16px",
                    backgroundColor: reply.isAI ? "rgba(162,34,55,0.04)" : reply.isProfessor ? "rgba(122,155,118,0.08)" : "rgba(214,214,214,0.15)",
                    borderLeft: `3px solid ${reply.isAI ? palette.crimson : reply.isProfessor ? palette.sage : palette.lightGray}`,
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: reply.isAI ? palette.crimson : reply.isProfessor ? palette.sage : palette.deepBurgundy }}>
                      {reply.isAI ? "🤖 " : reply.isProfessor ? "👨‍🏫 " : "👤 "}
                      {reply.author}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(92,30,38,0.5)" }}>{reply.timestamp}</div>
                    {reply.isAI && (
                      <button
                        onClick={handleRejectAI}
                        style={{ marginLeft: "auto", padding: "4px 10px", background: "transparent", color: "#DC3545", border: "1px solid #DC3545", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                      >
                        ✗ Reject & Reply
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: palette.deepBurgundy, lineHeight: 1.5 }}>{reply.message}</div>
                </div>
              ))}
            </div>
          </div>

          {showManualInput && (
            <div style={{ backgroundColor: "#fff", border: `2px solid ${palette.sage}`, borderRadius: 14, padding: 20, boxShadow: "0 4px 18px rgba(0,0,0,0.12)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: palette.sage, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>👨‍🏫 Professor's Manual Response</div>
              <textarea
                value={manualAnswer}
                onChange={(e) => setManualAnswer(e.target.value)}
                placeholder="Type your answer here..."
                style={{ width: "100%", minHeight: 120, padding: "12px 14px", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => void handleSubmitManualAnswer()} disabled={!manualAnswer.trim() || isSubmitting} style={{ padding: "10px 20px", background: !manualAnswer.trim() || isSubmitting ? "rgba(122,155,118,0.35)" : palette.sage, color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: !manualAnswer.trim() || isSubmitting ? "not-allowed" : "pointer" }}>{isSubmitting ? "Sending..." : "Submit Answer"}</button>
                <button onClick={() => setShowManualInput(false)} style={{ padding: "10px 20px", background: "transparent", color: palette.deepBurgundy, border: "1px solid rgba(92,30,38,0.3)", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
