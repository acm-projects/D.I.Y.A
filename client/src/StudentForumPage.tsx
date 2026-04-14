import { useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import { StudentSidebar } from "./StudentSidebar";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

interface Question {
  id: string;
  author: string;
  question: string;
  replies: number;
  isNew: boolean;
  image?: string;
  aiVerified: boolean;
  upvotes: number;
  createdAtMs: number;
}

type BackendGroup = {
  id: string;
  title?: string;
};

type BackendPost = {
  id: string;
  title?: string;
  content?: string;
  authorId?: string;
  groupId?: string;
  imageUrl?: string;
  isVerified?: boolean;
  createdAt?: { _seconds?: number; seconds?: number } | string;
};

type BackendUpvote = {
  id: string;
  postId: string;
  userId: string;
};

type BackendReply = {
  id: string;
  postId: string;
};

const GROUPS_API_BASE_URL = "/api/groups";
const POSTS_API_BASE_URL = "/api/posts";
const REPLIES_API_BASE_URL = "/api/replies";
const UPVOTES_API_BASE_URL = "/api/upvotes";

function getTimeAgo(createdAtMs: number): string {
  const diffMs = Date.now() - createdAtMs;
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

function getTimestampMs(value?: BackendPost["createdAt"]): number {
  if (!value) return Date.now();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }

  const seconds = value._seconds ?? value.seconds;
  return typeof seconds === "number" ? seconds * 1000 : Date.now();
}

function formatAuthor(authorId: string | undefined, currentUserId: string | undefined): string {
  if (!authorId) return "Student";
  if (currentUserId && authorId === currentUserId) return "You";
  return "Student";
}

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

export function StudentForumPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [query, setQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newImage, setNewImage] = useState<string | undefined>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [groupName, setGroupName] = useState("Forum");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [upvoteDocIds, setUpvoteDocIds] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const popupFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadForumData = async () => {
      if (!groupId) {
        setQuestions([]);
        setGroupName("Forum");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [groupResponse, postsResponse] = await Promise.all([
          fetch(`${GROUPS_API_BASE_URL}/${groupId}`),
          fetch(`${POSTS_API_BASE_URL}/group/${groupId}`),
        ]);

        if (!postsResponse.ok) {
          throw new Error("Failed to load forum questions.");
        }

        if (groupResponse.ok) {
          const group = (await groupResponse.json()) as BackendGroup;
          if (isMounted) {
            setGroupName(group.title ?? groupId);
          }
        } else if (isMounted) {
          setGroupName(groupId);
        }

        const posts = (await postsResponse.json()) as BackendPost[];
        const [upvoteLists, replyLists] = await Promise.all([
          Promise.all(
            posts.map(async (post) => {
              const response = await fetch(`${UPVOTES_API_BASE_URL}/post/${post.id}`);
              if (!response.ok) {
                return [] as BackendUpvote[];
              }
              return (await response.json()) as BackendUpvote[];
            })
          ),
          Promise.all(
            posts.map(async (post) => {
              const response = await fetch(`${REPLIES_API_BASE_URL}/post/${post.id}`);
              if (!response.ok) {
                return [] as BackendReply[];
              }
              return (await response.json()) as BackendReply[];
            })
          ),
        ]);

        const nextUpvotedIds = new Set<string>();
        const nextUpvoteDocIds: Record<string, string> = {};

        const mappedQuestions = posts.map((post, index) => {
          const upvotes = upvoteLists[index];
          const replies = replyLists[index];
          const existingUserUpvote = upvotes.find((upvote) => upvote.userId === user?.sub);
          if (existingUserUpvote) {
            nextUpvotedIds.add(post.id);
            nextUpvoteDocIds[post.id] = existingUserUpvote.id;
          }

          const createdAtMs = getTimestampMs(post.createdAt);

          return {
            id: post.id,
            author: formatAuthor(post.authorId, user?.sub),
            question: post.title ?? post.content ?? "Untitled question",
            replies: replies.length,
            isNew: Date.now() - createdAtMs < 2 * 24 * 60 * 60 * 1000,
            image: post.imageUrl,
            aiVerified: Boolean(post.isVerified),
            upvotes: upvotes.length,
            createdAtMs,
          } satisfies Question;
        });

        if (isMounted) {
          setQuestions(mappedQuestions);
          setUpvotedIds(nextUpvotedIds);
          setUpvoteDocIds(nextUpvoteDocIds);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load forum questions.");
          setQuestions([]);
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
  }, [groupId, user?.sub]);

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return questions;
    const words = q.split(/\s+/);
    return questions.filter((item) => {
      const title = item.question.toLowerCase();
      return words.some((w) => title.includes(w));
    });
  })();

  const sorted = [...filtered].sort((a, b) => {
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    return b.upvotes - a.upvotes;
  });

  const handleCreateQuestion = async () => {
    const title = newTitle.trim();
    if (!title || !groupId || !user?.sub || isPosting) return;

    setIsPosting(true);
    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        if (imageFile.size > 10 * 1024 * 1024) {
          throw new Error("Attached file is too large. Please use a file under 10MB.");
        }

        const storageRef = ref(storage, `forum-images/${groupId}/${Date.now()}-${imageFile.name}`);
        const snapshot = await Promise.race([
          uploadBytes(storageRef, imageFile),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error("File upload timed out. Please try a smaller file or check Firebase Storage config.")), 12000);
          }),
        ]);
        imageUrl = await Promise.race([
          getDownloadURL(snapshot.ref),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error("Could not get uploaded file URL. Check Firebase Storage bucket and rules.")), 8000);
          }),
        ]);
      }

      const response = await fetch(POSTS_API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content: title,
          groupId,
          authorId: user.sub,
          ...(imageUrl ? { imageUrl } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create question.");
      }

      const createdPost = (await response.json()) as BackendPost;
      const createdAtMs = getTimestampMs(createdPost.createdAt);
      const newQ: Question = {
        id: createdPost.id,
        author: "You",
        question: createdPost.title ?? createdPost.content ?? title,
        replies: 0,
        isNew: true,
        image: undefined,
        aiVerified: Boolean(createdPost.isVerified),
        upvotes: 0,
        createdAtMs,
      };

      setQuestions((prev) => [newQ, ...prev]);
      setNewTitle("");
      setNewImage(undefined);
      setImageFile(null);

      // Navigate to the new thread so the user sees the AI reply arrive
      navigate(`/groups/${groupId}/forum/${createdPost.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create question.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleToggleUpvote = async (event: React.MouseEvent<HTMLButtonElement>, questionId: string) => {
    event.stopPropagation();
    if (!user?.sub) return;

    const alreadyVoted = upvotedIds.has(questionId);

    try {
      if (alreadyVoted) {
        const upvoteId = upvoteDocIds[questionId];
        if (!upvoteId) return;

        const response = await fetch(`${UPVOTES_API_BASE_URL}/${upvoteId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to remove upvote.");
        }

        setQuestions((prev) =>
          prev.map((item) =>
            item.id === questionId ? { ...item, upvotes: Math.max(0, item.upvotes - 1) } : item
          )
        );
        setUpvotedIds((prev) => {
          const next = new Set(prev);
          next.delete(questionId);
          return next;
        });
        setUpvoteDocIds((prev) => {
          const next = { ...prev };
          delete next[questionId];
          return next;
        });
        return;
      }

      const response = await fetch(UPVOTES_API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: questionId,
          userId: user.sub,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add upvote.");
      }

      const createdUpvote = (await response.json()) as BackendUpvote;
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === questionId ? { ...item, upvotes: item.upvotes + 1 } : item
        )
      );
      setUpvotedIds((prev) => new Set(prev).add(questionId));
      setUpvoteDocIds((prev) => ({
        ...prev,
        [questionId]: createdUpvote.id,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update upvote.");
    }
  };

  const handlePopupImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    if (file.type.startsWith("image/")) {
      setNewImage(URL.createObjectURL(file));
    } else {
      // Non-image file: store a placeholder so the preview shows
      setNewImage(`file:${file.name}`);
    }
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Inter, system-ui, sans-serif", backgroundColor: palette.cream }}>
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

      {/* main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "32px 36px 14px 24px",
            borderBottom: "1px solid #e0e0e0",
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 850, fontSize: 44, color: palette.deepBurgundy, letterSpacing: -1, lineHeight: 1.1 }}>
            {groupName} Forum Page
          </span>
        </header>

        {/* content area */}
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
          {/* search bar */}
          <div
            style={{
              width: "min(560px, 100%)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 12,
              border: "1px solid rgba(39,1,21,0.15)",
              backgroundColor: "rgba(39,1,21,0.05)",
            }}
          >
            <SearchIcon color={palette.deepBurgundy} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search questions..."
              aria-label="Search questions"
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

          {/* ── Inline Post Composer ── */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              border: "1px solid rgba(39,1,21,0.10)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
              padding: "18px 20px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            <textarea
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleCreateQuestion();
                }
              }}
              placeholder="Ask a question to your peers and the D.I.Y.A AI..."
              rows={3}
              style={{
                width: "100%",
                minHeight: 72,
                resize: "vertical",
                border: "none",
                outline: "none",
                background: "transparent",
                color: palette.deepBurgundy,
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.6,
                fontFamily: "inherit",
                boxSizing: "border-box",
                padding: 0,
              }}
            />

            {newImage && (
              <div style={{ position: "relative", display: "inline-block", marginTop: 10, marginBottom: 4 }}>
                {newImage.startsWith("file:") ? (
                  <div style={{
                    height: 48,
                    padding: "0 14px",
                    borderRadius: 10,
                    backgroundColor: "rgba(39,1,21,0.06)",
                    border: "1px solid rgba(39,1,21,0.10)",
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
                    {newImage.slice(5)}
                  </div>
                ) : (
                  <img
                    src={newImage}
                    alt="Attachment preview"
                    style={{ maxHeight: 100, maxWidth: 180, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(39,1,21,0.10)" }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => { setNewImage(undefined); setImageFile(null); }}
                  aria-label="Remove attachment"
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    border: "none",
                    backgroundColor: palette.crimson,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid rgba(39,1,21,0.07)",
                paddingTop: 12,
                marginTop: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  ref={popupFileRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                  onChange={handlePopupImage}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => popupFileRef.current?.click()}
                  aria-label="Attach file"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(39,1,21,0.12)",
                    backgroundColor: "transparent",
                    color: palette.deepBurgundy,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background-color 120ms ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(39,1,21,0.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke={palette.deepBurgundy} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Attach
                </button>
              </div>

              <button
                type="button"
                onClick={() => void handleCreateQuestion()}
                disabled={!newTitle.trim() || isPosting}
                style={{
                  padding: "9px 22px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: (!newTitle.trim() || isPosting) ? "rgba(74,21,37,0.35)" : "#4A1525",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: (!newTitle.trim() || isPosting) ? "not-allowed" : "pointer",
                  transition: "background-color 120ms ease, opacity 120ms ease",
                  letterSpacing: 0.2,
                }}
              >
                {isPosting ? "Posting..." : "Post Question"}
              </button>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: "rgba(39,1,21,0.12)" }} />

          <div
            style={{
              color: palette.crimson,
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            {query.trim() && filtered.length !== questions.length
              ? `Showing ${filtered.length} of ${questions.length} questions`
              : `${questions.length} question${questions.length !== 1 ? "s" : ""} asked by your peers`}
          </div>

          {isLoading && (
            <div
              style={{
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
                backgroundColor: "#fff",
                border: "1px solid rgba(214,214,214,0.3)",
                borderRadius: 14,
                padding: 22,
                boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ color: palette.deepBurgundy, fontWeight: 900, fontSize: 16 }}>
                Unable to load forum questions
              </div>
              <div style={{ marginTop: 8, color: "rgba(17,17,17,0.6)", fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            </div>
          )}

          {/* question cards — new ones first, outlined in green */}
          {!isLoading && !error && sorted.map((q) => {
            const isQHovered = hoveredId === q.id;
            const borderColor = q.isNew
              ? palette.sage
              : isQHovered
                ? palette.crimson
                : "rgba(214,214,214,0.4)";
            return (
              <div
                key={q.id}
                onClick={() => navigate(`/groups/${groupId}/forum/${q.id}`)}
                onMouseEnter={() => setHoveredId(q.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  position: "relative",
                  textAlign: "left",
                  backgroundColor: "#fff",
                  border: `2px solid ${borderColor}`,
                  borderRadius: 14,
                  padding: "18px 20px",
                  cursor: "pointer",
                  boxShadow: isQHovered
                    ? "0 12px 36px rgba(0,0,0,0.22)"
                    : "0 4px 18px rgba(0,0,0,0.12)",
                  transform: isQHovered ? "translateY(-2px)" : "translateY(0px)",
                  transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
                }}
              >
                {/* NEW badge */}
                {q.isNew && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 14,
                      backgroundColor: palette.sage,
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: 6,
                      letterSpacing: 0.5,
                    }}
                  >
                    NEW
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    paddingRight: q.isNew ? 50 : 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      letterSpacing: -0.2,
                      color: palette.deepBurgundy,
                      lineHeight: 1.3,
                      flex: 1,
                    }}
                  >
                    {q.question}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: palette.deepBurgundy,
                    alignItems: "center",
                  }}
                >
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
                    <span>{q.author}</span>
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 10px",
                      borderRadius: 8,
                      backgroundColor: q.replies === 0 ? "rgba(220,53,69,0.1)" : "rgba(92,30,38,0.08)",
                    }}
                  >
                    <ForumIcon color={q.replies === 0 ? "#DC3545" : palette.deepBurgundy} />
                    <span>{q.replies} {q.replies === 1 ? "reply" : "replies"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => void handleToggleUpvote(e, q.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: upvotedIds.has(q.id) ? `1px solid ${palette.crimson}` : "none",
                      backgroundColor: upvotedIds.has(q.id) ? "rgba(162,34,55,0.18)" : "rgba(162,34,55,0.08)",
                      color: palette.crimson,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 4l-7 8h4v8h6v-8h4L12 4z" fill={palette.crimson} />
                    </svg>
                    {q.upvotes}
                  </button>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "rgba(92,30,38,0.5)",
                      marginLeft: "auto",
                    }}
                  >
                    {getTimeAgo(q.createdAtMs)}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 6,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: palette.crimson }}>
                    View replies
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" stroke={palette.crimson} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {q.aiVerified && (
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      color: palette.sage,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" stroke={palette.sage} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    This question's AI answer has been verified by the professor.
                  </div>
                )}
              </div>
            );
          })}

          {!isLoading && !error && sorted.length === 0 && (
            <div
              style={{
                backgroundColor: "#fff",
                border: "1px solid rgba(214,214,214,0.3)",
                borderRadius: 14,
                padding: 22,
                boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ color: palette.deepBurgundy, fontWeight: 900, fontSize: 16 }}>
                No questions found
              </div>
              <div style={{ marginTop: 8, color: "rgba(17,17,17,0.6)", fontSize: 13, fontWeight: 600 }}>
                Try another search or post the first question for this group.
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
