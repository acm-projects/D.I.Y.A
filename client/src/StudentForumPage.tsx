import { useRef, useState } from "react";
import { useParams } from "react-router-dom";

type Message = {
  id: string;
  text: string;
  image?: string;
  sender: "self" | "other";
  authorName: string;
  timestamp: Date;
};


export function StudentForumPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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


  const handleSend = () => {
    setDraft("");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          width: sidebarOpen ? 240 : 0,
          overflow: "hidden",
          transition: "width 200ms ease",
          borderRight: sidebarOpen ? "1px solid #e0e0e0" : "none",
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        
        <div style={{ width: 240, height: "100%", padding: 16, boxSizing: "border-box" }} />
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

          <span style={{ fontWeight: 700, fontSize: 16 }}>
            {groupId ? groupId.replace(/-/g, " ") : "Forum"}
          </span>
        </header>

        {/* messages area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.map((msg) => {
            const isSelf = msg.sender === "self";
            return (
              <div
                key={msg.id}
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
                    border: "1px solid #ddd",
                    borderBottomRightRadius: isSelf ? 4 : 14,
                    borderBottomLeftRadius: isSelf ? 14 : 4,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                    {msg.authorName}
                  </div>
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt={msg.text}
                      style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 6 }}
                    />
                  )}
                  <div style={{ fontSize: 14, lineHeight: 1.45 }}>{msg.text}</div>
                  <div style={{ fontSize: 10, marginTop: 6, opacity: 0.5, textAlign: "right" }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        

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
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: "8px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            placeholder="Type your question..."
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ccc",
              fontSize: 14,
              outline: "none",
            }}
          />

          <button
            type="button"
            onClick={handleSend}
            aria-label="Send message"
            style={{
              background: "none",
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: "8px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
