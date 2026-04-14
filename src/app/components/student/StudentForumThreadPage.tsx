import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { ListenButton } from "./TTSContext";

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

const questionMap: Record<string, { question: string; author: string; image?: string }> = {
  "1": { question: "Can someone explain the difference between recursion and iteration?", author: "Student A" },
  "2": { question: "What's the best way to approach the final project?", author: "Student B" },
  "3": { question: "Are we allowed to use external libraries for the assignment?", author: "Student C" },
  "4": { question: "When is the deadline for submitting the lab report?", author: "Student D" },
  "5": { question: "How do I set up the development environment for this project?", author: "Student E" },
  "6": { question: "Is there a study guide available for the midterm exam?", author: "Student F" },
};

const demoReplies: Reply[] = [
  { id: "r1", author: "Prof. A", role: "professor", text: "Great question! Recursion calls itself with a smaller subproblem, while iteration uses loops. Both can solve the same problems but have different trade-offs in readability and performance.", timestamp: new Date("2026-03-10T14:30:00") },
  { id: "r2", author: "Student A", role: "student", text: "I think of recursion like Russian nesting dolls — each one opens to reveal a smaller version of itself.", timestamp: new Date("2026-03-10T14:45:00") },
  { id: "r3", author: "Student B", role: "student", text: "The textbook on page 214 has a really good diagram comparing the call stack for both approaches.", timestamp: new Date("2026-03-10T15:10:00") },
];

export function StudentForumThreadPage() {
  const { groupId, questionId } = useParams<{ groupId: string; questionId: string }>();
  const navigate = useNavigate();
  const [replies, setReplies] = useState<Reply[]>(questionId && parseInt(questionId) <= 6 ? demoReplies : []);
  const [draft, setDraft] = useState("");
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const info = questionId ? questionMap[questionId] : undefined;
  const questionTitle = info?.question ?? "Your question";
  const questionAuthor = info?.author ?? "You";

  const handleSend = () => {
    const text = draft.trim();
    if (!text && !imagePreview) return;
    setReplies((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        author: "You",
        role: "student",
        text: text || "(image)",
        image: imagePreview,
        timestamp: new Date(),
      },
    ]);
    setDraft("");
    setImagePreview(undefined);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
        height: "100vh",
      }}
    >
      <Sidebar activeId="groups" />

      {/* main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Hero / question banner */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "32px 48px",
            flexShrink: 0,
            borderBottom: "1px solid rgba(214,214,214,0.3)",
          }}
        >
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
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Forum
          </button>

          <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            Asked by {questionAuthor}
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: palette.darkest,
              lineHeight: 1.25,
              letterSpacing: -1,
              marginBottom: 14,
            }}
          >
            {questionTitle}
          </div>
          <ListenButton
            text={`Asked by ${questionAuthor}. ${questionTitle}`}
            label="Question"
            id={`thread-question-${questionId ?? "0"}`}
            size="md"
          />
        </div>

        {/* replies area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "28px 48px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {replies.length === 0 && (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: "32px",
                textAlign: "center",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                color: "rgba(92,30,38,0.4)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              No replies yet — be the first to respond!
            </div>
          )}

          {replies.map((r) => {
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
                    padding: "12px 16px",
                    borderRadius: 16,
                    borderBottomRightRadius: isSelf ? 4 : 16,
                    borderBottomLeftRadius: isSelf ? 16 : 4,
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
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
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
                    {r.author} {isProf && "(Professor)"}
                  </div>
                  {r.image && (
                    <img
                      src={r.image}
                      alt="attachment"
                      style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 6 }}
                    />
                  )}
                  <div style={{ fontSize: 14, lineHeight: 1.5, color: "#111" }}>{r.text}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, gap: 8 }}>
                    <ListenButton
                      text={`${r.author}${isProf ? ", professor" : ""}. ${r.text}`}
                      label={r.author}
                      id={`reply-${r.id}`}
                    />
                    <div style={{ fontSize: 10, opacity: 0.45, whiteSpace: "nowrap" }}>
                      {r.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* image preview strip */}
        {imagePreview && (
          <div style={{ padding: "6px 48px 0", display: "flex", alignItems: "center", gap: 8 }}>
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
            borderTop: "1px solid rgba(214,214,214,0.4)",
            padding: "14px 48px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            backgroundColor: "#fff",
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
