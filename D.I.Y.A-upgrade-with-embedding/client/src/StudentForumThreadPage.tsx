import { useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams, useNavigate } from "react-router-dom";
import { StudentSidebar } from "./StudentSidebar";
import { useRelatedPosts } from "./api/useRelatedPosts";

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
  role: "student" | "professor";
  text: string;
  image?: string;
  timestamp: Date;
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
  imageUrl?: string;
  createdAt?: { _seconds?: number; seconds?: number } | string;
};

const POSTS_API_BASE_URL = "/api/posts";
const REPLIES_API_BASE_URL = "/api/replies";

function getTimestampMs(value?: BackendPost["createdAt"] | BackendReply["createdAt"]): number {
  if (!value) return Date.now();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }

  const seconds = value._seconds ?? value.seconds;
  return typeof seconds === "number" ? seconds * 1000 : Date.now();
}

export function StudentForumThreadPage() {
  const { user } = useAuth0();
  const { groupId, questionId } = useParams<{ groupId: string; questionId: string }>();
  const navigate = useNavigate();
  const { relatedPosts, loading: relatedLoading } = useRelatedPosts(questionId ?? null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [draft, setDraft] = useState("");
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [questionTitle, setQuestionTitle] = useState("Your question");
  const [questionAuthor, setQuestionAuthor] = useState("You");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadThread = async () => {
      if (!questionId) {
        if (isMounted) {
          setQuestionTitle("Your question");
          setQuestionAuthor("You");
          setReplies([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [postResponse, repliesResponse] = await Promise.all([
          fetch(`${POSTS_API_BASE_URL}/${questionId}`),
          fetch(`${REPLIES_API_BASE_URL}/post/${questionId}`),
        ]);

        if (!postResponse.ok) {
          throw new Error("Failed to load forum thread.");
        }

        if (!repliesResponse.ok) {
          throw new Error("Failed to load replies.");
        }

        const post = (await postResponse.json()) as BackendPost;
        const rawReplies = (await repliesResponse.json()) as BackendReply[];
        const aiReply: Reply[] = post.aiAnswer
          ? [{
              id: `ai-${post.id}`,
              author: post.isVerified ? "Professor Verified AI" : "D.I.Y.A AI",
              role: "professor" as const,
              text: post.aiAnswer,
              timestamp: new Date(getTimestampMs(post.createdAt)),
            }]
          : [];

        const mappedReplies: Reply[] = rawReplies.map((reply) => {
          const role: Reply["role"] = reply.role === "professor" ? "professor" : "student";

          return {
            id: reply.id,
            author: reply.authorId === user?.sub ? "You" : reply.authorName || "Student",
            role,
            text: reply.text || "",
            image: reply.imageUrl,
            timestamp: new Date(getTimestampMs(reply.createdAt)),
          };
        });

        if (isMounted) {
          setQuestionTitle(post.title ?? post.content ?? "Your question");
          setQuestionAuthor(post.authorId === user?.sub ? "You" : "Student");
          setReplies([...aiReply, ...mappedReplies]);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load forum thread.");
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

  const handleSend = async () => {
    const text = draft.trim();
    if ((!text && !imagePreview) || !questionId || !user?.sub) return;

    try {
      const response = await fetch(REPLIES_API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: questionId,
          authorId: user.sub,
          authorName: user.name || user.email || "Student",
          role: "student",
          text: text || "(image)",
          imageUrl: imagePreview,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reply.");
      }

      const createdReply = (await response.json()) as BackendReply;
      setReplies((prev) => [
        ...prev,
        {
          id: createdReply.id,
          author: "You",
          role: "student",
          text: createdReply.text || text || "(image)",
          image: createdReply.imageUrl,
          timestamp: new Date(getTimestampMs(createdReply.createdAt)),
        },
      ]);
      setDraft("");
      setImagePreview(undefined);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply.");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* collapsible sidebar */}
      <aside
        style={{
          width: sidebarOpen ? 220 : 0,
          overflow: "hidden",
          transition: "width 200ms ease",
          background: "linear-gradient(160deg, #4a1850 0%, #2d0f38 50%, #1c0a24 100%)",
          padding: sidebarOpen ? "0 10px 16px" : 0,
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,0.05)",
          boxShadow: sidebarOpen ? "4px 0 32px rgba(0,0,0,0.25)" : "none",
        }}
      >
        <StudentSidebar activeItem="groups" />
      </aside>

      {/* main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            borderBottom: "1px solid #e0e0e0",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            style={{
              background: "none",
              border: "1px solid #ccc",
              borderRadius: 6,
              padding: "6px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/groups/${groupId}/forum`)}
            style={{
              background: "none",
              border: "none",
              color: palette.crimson,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
            }}
          >
            ← Back to Forum
          </button>
        </header>

        {/* question banner */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `2px solid ${palette.sage}`,
            backgroundColor: "rgba(122,155,118,0.06)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.sage, marginBottom: 4 }}>
            Asked by {questionAuthor}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: palette.deepBurgundy,
              lineHeight: 1.35,
            }}
          >
            {questionTitle}
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, flexDirection: "row", overflow: "hidden" }}>
          
          {/* Replies area*/}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {isLoading && (
              <div style={{ textAlign: "center", color: "rgba(92,30,38,0.4)", fontSize: 14, fontWeight: 600, marginTop: 40 }}>
                Loading thread...
              </div>
            )}

            {!isLoading && error && (
              <div style={{ textAlign: "center", color: palette.crimson, fontSize: 14, fontWeight: 700, marginTop: 40 }}>
                {error}
              </div>
            )}

            {!isLoading && !error && replies.length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(92,30,38,0.4)", fontSize: 14, fontWeight: 600, marginTop: 40 }}>
                No replies yet — be the first to respond!
              </div>
            )}

            {!isLoading && !error && replies.map((r) => {
              const isSelf = r.author === "You";
              const isProf = r.role === "professor";
              return (
                <div key={r.id} style={{ display: "flex", justifyContent: isSelf ? "flex-end" : "flex-start" }}>
                  <div style={{
                      maxWidth: "65%",
                      padding: "10px 14px",
                      borderRadius: 14,
                      backgroundColor: isSelf ? "rgba(162,34,55,0.08)" : isProf ? "rgba(122,155,118,0.1)" : "#fff",
                      border: isProf ? `1px solid ${palette.sage}` : isSelf ? `1px solid rgba(162,34,55,0.2)` : "1px solid #ddd",
                    }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: isProf ? palette.sage : palette.deepBurgundy }}>
                      {r.author} {isProf && "(Professor)"}
                    </div>
                    {r.image && <img src={r.image} alt="attachment" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 6 }} />}
                    <div style={{ fontSize: 14, lineHeight: 1.45, color: "#111" }}>{r.text}</div>
                    <div style={{ fontSize: 10, marginTop: 6, opacity: 0.5, textAlign: "right" }}>
                      {r.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Side bar with related questions */}
          <aside
            style={{
              width: 260,
              borderLeft: "1px solid #e0e0e0",
              backgroundColor: palette.cream,
              display: "flex",
              flexDirection: "column",
              padding: "20px 16px",
              overflowY: "auto",
              flexShrink: 0,
            }}
          >
            <h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: palette.deepBurgundy, marginBottom: 16, fontWeight: 800 }}>
              Related Discussions
            </h3>

            {relatedLoading ? (
              <div style={{ fontSize: 13, color: "#666", fontStyle: "italic" }}>Finding similar topics...</div>
            ) : relatedPosts && relatedPosts.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {relatedPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/groups/${groupId}/forum/${post.id}`)}
                    style={{
                      padding: "12px",
                      backgroundColor: "#fff",
                      border: `1px solid ${palette.lightGray}`,
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: palette.darkest, lineHeight: 1.4 }}>
                      {post.title || "Untitled Post"}
                    </div>
                    <div style={{ fontSize: 11, color: palette.sage, marginTop: 4, fontWeight: 600 }}>
                      View Thread →
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#999" }}>No similar posts found.</div>
            )}
          </aside>
        </div>

        {/* image preview strip */}
        {imagePreview && (
          <div style={{ padding: "6px 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <img src={imagePreview} alt="preview" style={{ height: 48, borderRadius: 6 }} />
            <button
              type="button"
              onClick={() => setImagePreview(undefined)}
              style={{
                background: "none",
                border: "none",
                color: palette.crimson,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        )}

        {/* input bar */}
        <div
          style={{
            borderTop: "1px solid #e0e0e0",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload image"
            style={{
              background: "none",
              border: `1px solid rgba(39,1,21,0.2)`,
              borderRadius: 8,
              padding: "8px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>

          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder="Type your reply..."
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid rgba(39,1,21,0.2)`,
              fontSize: 14,
              outline: "none",
            }}
          />

          <button
            type="button"
            onClick={handleSend}
            aria-label="Send reply"
            style={{
              background: palette.crimson,
              border: "none",
              borderRadius: 8,
              padding: "8px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
