import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
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

/** Lightweight markdown-to-HTML: handles bold, numbered/bulleted lists, and line breaks */
function renderFormattedText(text: string): string {
  let html = text
    // Escape HTML entities
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Split into lines for list detection
  const lines = html.split("\n");
  const result: string[] = [];
  let inList: "ol" | "ul" | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Numbered list: "1. ", "2. ", etc.
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    // Bullet list: "- ", "• ", or "* "
    const ulMatch = trimmed.match(/^[-•*]\s+(.*)$/);

    if (olMatch) {
      if (inList !== "ol") {
        if (inList) result.push(inList === "ul" ? "</ul>" : "</ol>");
        result.push('<ol style="margin:4px 0 4px 18px;padding:0;list-style:decimal">');
        inList = "ol";
      }
      result.push(`<li style="margin-bottom:3px">${olMatch[2]}</li>`);
    } else if (ulMatch) {
      if (inList !== "ul") {
        if (inList) result.push(inList === "ol" ? "</ol>" : "</ul>");
        result.push('<ul style="margin:4px 0 4px 18px;padding:0;list-style:disc">');
        inList = "ul";
      }
      result.push(`<li style="margin-bottom:3px">${ulMatch[1]}</li>`);
    } else {
      if (inList) {
        result.push(inList === "ol" ? "</ol>" : "</ul>");
        inList = null;
      }
      result.push(trimmed === "" ? "<br/>" : `<p style="margin:2px 0">${trimmed}</p>`);
    }
  }
  if (inList) result.push(inList === "ol" ? "</ol>" : "</ul>");

  return result.join("");
}

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
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | undefined>();
  const [questionTitle, setQuestionTitle] = useState("Your question");
  const [questionAuthor, setQuestionAuthor] = useState("You");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());

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
        const mappedReplies: Reply[] = rawReplies.map((reply) => {
          const role: Reply["role"] = reply.role === "professor" ? "professor" : "student";
          const isAI = reply.authorId === "diya-ai";

          return {
            id: reply.id,
            author: isAI
              ? (post.isVerified ? "Professor Verified AI" : "D.I.Y.A AI")
              : reply.authorId === user?.sub ? "You" : reply.authorName || "Student",
            role,
            text: reply.text || "",
            image: reply.imageUrl,
            timestamp: new Date(getTimestampMs(reply.createdAt)),
          };
        });

        if (isMounted) {
          setQuestionTitle(post.title ?? post.content ?? "Your question");
          setQuestionAuthor(post.authorId === user?.sub ? "You" : "Student");
          setReplies(mappedReplies);

          // If this is a fresh post with no AI reply yet, start polling
          const hasAiReply = mappedReplies.some((r) => r.author === "D.I.Y.A AI" || r.author === "Professor Verified AI");
          const postAgeMs = Date.now() - getTimestampMs(post.createdAt);
          if (!hasAiReply && postAgeMs < 60000) {
            setIsAiThinking(true);
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
            pollTimerRef.current = setTimeout(() => void pollForAiReply(Date.now()), 2000);
          }
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
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [questionId, user?.sub]);

  // Keep knownIdsRef in sync whenever replies change
  useEffect(() => {
    knownIdsRef.current = new Set(replies.map((r) => r.id));
  }, [replies]);

  const pollForAiReply = useCallback(async (startTime: number) => {
    if (!questionId) return;
    if (Date.now() - startTime > 30000) {
      setIsAiThinking(false);
      return;
    }

    try {
      const resp = await fetch(`${REPLIES_API_BASE_URL}/post/${questionId}`);
      if (resp.ok) {
        const raw = (await resp.json()) as BackendReply[];
        const newAiReplies = raw.filter(
          (r) => r.authorId === "diya-ai" && !knownIdsRef.current.has(r.id)
        );
        if (newAiReplies.length > 0) {
          const postResp = await fetch(`${POSTS_API_BASE_URL}/${questionId}`);
          const post = postResp.ok ? ((await postResp.json()) as BackendPost) : null;
          const mapped: Reply[] = newAiReplies.map((r) => ({
            id: r.id,
            author: post?.isVerified ? "Professor Verified AI" : "D.I.Y.A AI",
            role: "professor" as const,
            text: r.text || "",
            image: r.imageUrl,
            timestamp: new Date(getTimestampMs(r.createdAt)),
          }));
          setReplies((prev) => [...prev, ...mapped]);
          setIsAiThinking(false);
          requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
          return;
        }
      }
    } catch {
      // ignore poll errors, try again
    }

    pollTimerRef.current = setTimeout(() => void pollForAiReply(startTime), 2000);
  }, [questionId]);

  const handleSend = async () => {
    const text = draft.trim();
    if ((!text && !imagePreview && !fileObj) || !questionId || !user?.sub || isSending) return;

    setIsSending(true);
    try {
      // Upload file to Firebase Storage if present
      let uploadedUrl: string | undefined;
      if (fileObj && groupId) {
        if (fileObj.size > 10 * 1024 * 1024) {
          throw new Error("Attached file is too large. Please use a file under 10MB.");
        }

        if (fileObj.type.startsWith("image/") && imagePreview) {
          uploadedUrl = imagePreview;
        } else {
          const storageRef = ref(storage, `forum-images/${groupId}/${Date.now()}-${fileObj.name}`);
          const snapshot = await Promise.race([
            uploadBytes(storageRef, fileObj),
            new Promise<never>((_, reject) => {
              window.setTimeout(() => reject(new Error("File upload timed out. Please try a smaller file or check Firebase Storage config.")), 12000);
            }),
          ]);
          uploadedUrl = await Promise.race([
            getDownloadURL(snapshot.ref),
            new Promise<never>((_, reject) => {
              window.setTimeout(() => reject(new Error("Could not get uploaded file URL. Check Firebase Storage bucket and rules.")), 8000);
            }),
          ]);
        }
      }

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 12000);

      const response = await fetch(REPLIES_API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          postId: questionId,
          authorId: user.sub,
          authorName: user.name || user.email || "Student",
          role: "student",
          text: text || `(${fileName || "file"})`,
          imageUrl: uploadedUrl || imagePreview,
        }),
      });

      window.clearTimeout(timeoutId);

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
      setFileObj(null);
      setFileName(undefined);
      setIsAiThinking(true);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));

      // Start polling for AI reply
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      pollTimerRef.current = setTimeout(() => void pollForAiReply(Date.now()), 2000);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Reply request timed out. Make sure the backend server is running.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to send reply.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileObj(file);
    setFileName(file.name);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // For non-image files (PDFs, etc.), show a placeholder
      setImagePreview(undefined);
    }
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
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

        {/* replies area */}
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
              <div
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: isSelf ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "65%",
                    padding: "10px 14px",
                    borderRadius: 14,
                    borderBottomRightRadius: isSelf ? 4 : 14,
                    borderBottomLeftRadius: isSelf ? 14 : 4,
                    backgroundColor: isSelf
                      ? "rgba(162,34,55,0.08)"
                      : isProf
                        ? "rgba(122,155,118,0.1)"
                        : "#fff",
                    border: isProf
                      ? `1px solid ${palette.sage}`
                      : isSelf
                        ? `1px solid rgba(162,34,55,0.2)`
                        : "1px solid #ddd",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      marginBottom: 4,
                      color: isProf ? palette.sage : palette.deepBurgundy,
                    }}
                  >
                    {r.author}{isProf && r.author !== "D.I.Y.A AI" && r.author !== "Professor Verified AI" && " (Professor)"}
                  </div>
                  {r.image && (
                    <img
                      src={r.image}
                      alt="attachment"
                      style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 6 }}
                    />
                  )}
                  {(r.author === "D.I.Y.A AI" || r.author === "Professor Verified AI") ? (
                    <div
                      style={{ fontSize: 14, lineHeight: 1.55, color: "#111", textAlign: "left" }}
                      dangerouslySetInnerHTML={{ __html: renderFormattedText(r.text) }}
                    />
                  ) : (
                    <div style={{ fontSize: 14, lineHeight: 1.45, color: "#111" }}>{r.text}</div>
                  )}
                  <div style={{ fontSize: 10, marginTop: 6, opacity: 0.5, textAlign: "right" }}>
                    {r.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          {isAiThinking && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "65%",
                  padding: "12px 18px",
                  borderRadius: 14,
                  borderBottomLeftRadius: 4,
                  backgroundColor: "rgba(122,155,118,0.1)",
                  border: `1px solid ${palette.sage}`,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    marginBottom: 6,
                    color: palette.sage,
                  }}
                >
                  D.I.Y.A AI
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 14,
                    color: "rgba(92,30,38,0.55)",
                    fontWeight: 600,
                    fontStyle: "italic",
                  }}
                >
                  <span className="ai-thinking-dots">Thinking</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

          {/* Related discussions sidebar */}
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

        {/* file preview strip */}
        {(imagePreview || fileName) && (
          <div style={{ padding: "6px 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
            {imagePreview ? (
              <img src={imagePreview} alt="preview" style={{ height: 48, borderRadius: 6 }} />
            ) : (
              <div style={{
                height: 48,
                padding: "0 12px",
                borderRadius: 6,
                backgroundColor: "rgba(39,1,21,0.06)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: palette.deepBurgundy,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {fileName}
              </div>
            )}
            <button
              type="button"
              onClick={() => { setImagePreview(undefined); setFileObj(null); setFileName(undefined); }}
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
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
            onChange={handleFileSelect}
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
            placeholder={isSending ? "Sending..." : "Type your reply..."}
            disabled={isSending}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid rgba(39,1,21,0.2)`,
              fontSize: 14,
              outline: "none",
              opacity: isSending ? 0.5 : 1,
            }}
          />

          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={isSending}
            aria-label="Send reply"
            style={{
              background: palette.crimson,
              border: "none",
              borderRadius: 8,
              padding: "8px 10px",
              cursor: isSending ? "not-allowed" : "pointer",
              opacity: isSending ? 0.6 : 1,
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
