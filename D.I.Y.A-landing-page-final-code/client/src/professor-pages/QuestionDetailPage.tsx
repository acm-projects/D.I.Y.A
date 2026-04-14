import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProfessorSidebar } from "./ProfessorSidebar.tsx";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

interface Reply {
  id: number;
  author: string;
  message: string;
  timestamp: string;
  isAI?: boolean;
  isProfessor?: boolean;
}

export function QuestionDetailPage() {
  const { groupName, questionId } = useParams<{ groupName: string; questionId: string }>();
  const navigate = useNavigate();
  const [manualAnswer, setManualAnswer] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const questions = [
    {
      id: 1,
      author: "Sarah Johnson",
      question: "Can someone explain the difference between recursion and iteration?",
      aiAnswer: "Recursion is when a function calls itself to solve smaller instances of the same problem, while iteration uses loops to repeat a process. Recursion has a base case to stop, iteration has a condition. Recursion can be more elegant but uses more memory due to call stack.",
    },
    {
      id: 2,
      author: "Michael Chen",
      question: "What's the best way to approach the final project?",
      aiAnswer: "Start by breaking down the requirements into smaller tasks. Create a timeline with milestones. Begin with core functionality before adding features. Test frequently and don't wait until the last minute. Use version control and commit regularly.",
    },
  ];

  const currentQuestion = questions.find(q => q.id === parseInt(questionId || "1")) || questions[0];

  const [replies, setReplies] = useState<Reply[]>([
    {
      id: 1,
      author: "AI Assistant",
      message: currentQuestion.aiAnswer,
      timestamp: "2 hours ago",
      isAI: true,
    },
    {
      id: 2,
      author: "David Kim",
      message: "This helps! Can you also explain tail recursion?",
      timestamp: "1 hour ago",
    },
    {
      id: 3,
      author: "Emma Wilson",
      message: "I agree with the AI answer, but could we get more examples?",
      timestamp: "45 minutes ago",
    },
  ]);

  const handleSubmitManualAnswer = () => {
    if (!manualAnswer.trim()) return;
    const newReply: Reply = {
      id: replies.length + 1,
      author: "Professor",
      message: manualAnswer,
      timestamp: "Just now",
      isProfessor: true,
    };
    setReplies([...replies, newReply]);
    setManualAnswer("");
    setShowManualInput(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
      }}
    >
      <ProfessorSidebar activeId="analysis" groupName={groupName} />

      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Hero Section */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "56px 64px 52px",
            borderBottom: "1px solid rgba(214,214,214,0.2)",
          }}
        >
          {/* Back button */}
          <button
            onClick={() => navigate(`/forum/${groupName}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              marginBottom: 24,
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(92,30,38,0.5)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Forum
          </button>

          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: palette.crimson,
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            Question Discussion
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: palette.darkest,
              letterSpacing: -2,
              lineHeight: 1.1,
              marginBottom: 12,
              maxWidth: 900,
            }}
          >
            {currentQuestion.question}
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, color: "rgba(92,30,38,0.5)" }}>
            Asked by {currentQuestion.author} · {decodeURIComponent(groupName || "")}
          </div>
        </div>

        {/* Discussion Content */}
        <div style={{ padding: "48px 64px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 360px",
              gap: 32,
              alignItems: "start",
            }}
          >
            {/* Left: Replies */}
            <div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: palette.darkest,
                  letterSpacing: -0.8,
                  marginBottom: 24,
                }}
              >
                Discussion ({replies.length} {replies.length === 1 ? "reply" : "replies"})
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                    <div
                      style={{
                        height: 4,
                        backgroundColor: reply.isAI ? palette.crimson : reply.isProfessor ? palette.sage : palette.lightGray,
                      }}
                    />
                    <div style={{ padding: "20px 24px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              backgroundColor: reply.isAI
                                ? "rgba(162,34,55,0.1)"
                                : reply.isProfessor
                                ? "rgba(122,155,118,0.15)"
                                : "rgba(214,214,214,0.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 16,
                            }}
                          >
                            {reply.isAI ? "🤖" : reply.isProfessor ? "👨‍🏫" : "👤"}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 800,
                                color: reply.isAI ? palette.crimson : reply.isProfessor ? palette.sage : palette.darkest,
                              }}
                            >
                              {reply.author}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.4)" }}>
                              {reply.timestamp}
                            </div>
                          </div>
                        </div>

                        {reply.isAI && (
                          <button
                            onClick={() => setShowManualInput(true)}
                            style={{
                              padding: "6px 14px",
                              background: "transparent",
                              color: "#DC3545",
                              border: "1.5px solid #DC3545",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            ✗ Reject & Reply
                          </button>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 500,
                          color: palette.deepBurgundy,
                          lineHeight: 1.65,
                        }}
                      >
                        {reply.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Professor Action Panel */}
            <div style={{ position: "sticky", top: 32 }}>
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: "0 2px 24px rgba(0,0,0,0.08)",
                  marginBottom: 16,
                }}
              >
                <div style={{ height: 5, background: `linear-gradient(90deg, ${palette.crimson}, ${palette.sage})` }} />
                <div style={{ padding: "24px" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: palette.darkest, marginBottom: 16 }}>
                    Professor Actions
                  </div>
                  <button
                    onClick={() => setShowManualInput(true)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`,
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      marginBottom: 10,
                    }}
                  >
                    ✏️ Write Custom Answer
                  </button>
                  <button
                    onClick={() => navigate(`/forum/${groupName}`)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "transparent",
                      color: palette.deepBurgundy,
                      border: "1.5px solid rgba(92,30,38,0.2)",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ← Back to Forum
                  </button>
                </div>
              </div>

              {/* Thread stats */}
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  padding: "20px 24px",
                  boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(92,30,38,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
                  Thread Stats
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>Total replies</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: palette.crimson }}>{replies.length}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>AI responses</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: palette.sage }}>
                      {replies.filter(r => r.isAI).length}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>Professor</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: palette.deepBurgundy }}>
                      {replies.filter(r => r.isProfessor).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Answer Input */}
          {showManualInput && (
            <div
              style={{
                marginTop: 32,
                backgroundColor: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
              }}
            >
              <div style={{ height: 5, backgroundColor: palette.sage }} />
              <div style={{ padding: "28px 32px" }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: palette.darkest,
                    marginBottom: 16,
                  }}
                >
                  👨‍🏫 Your Manual Response
                </div>
                <textarea
                  value={manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  style={{
                    width: "100%",
                    minHeight: 140,
                    padding: "14px 16px",
                    border: "1.5px solid rgba(214,214,214,0.5)",
                    borderRadius: 12,
                    fontSize: 15,
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                    outline: "none",
                    color: palette.deepBurgundy,
                    lineHeight: 1.6,
                  }}
                />
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button
                    onClick={handleSubmitManualAnswer}
                    style={{
                      padding: "12px 24px",
                      background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`,
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Submit Answer
                  </button>
                  <button
                    onClick={() => setShowManualInput(false)}
                    style={{
                      padding: "12px 24px",
                      background: "transparent",
                      color: palette.deepBurgundy,
                      border: "1.5px solid rgba(92,30,38,0.2)",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Banner */}
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`,
            padding: "36px 64px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>
            {decodeURIComponent(groupName || "")}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>
            Keep the conversation going — students are watching.
          </div>
        </div>
      </main>
    </div>
  );
}
