import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Color palette
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

  // Mock question data
  const questions = [
    {
      id: 1,
      author: "Sarah Johnson",
      question: "Can someone explain the difference between recursion and iteration?",
      aiAnswer: "recursion is when a function calls itself to solve smaller instances of the same problem, while iteration uses loops to repeat a process. recursion has a base case to stop, iteration has a condition. recursion can be more elegant but uses more memory due to call stack.",
    },
    {
      id: 2,
      author: "Michael Chen",
      question: "What's the best way to approach the final project?",
      aiAnswer: "start by breaking down the requirements into smaller tasks. create a timeline with milestones. begin with core functionality before adding features. test frequently and don't wait until the last minute. use version control and commit regularly.",
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

  const handleRejectAI = () => {
    setShowManualInput(true);
  };

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
      {/* Sidebar */}
      <aside
        style={{
          width: 180,
          background: `linear-gradient(180deg, #3d1542 0%, ${palette.darkest} 100%)`,
          padding: 12,
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily: "Italiana, serif",
            fontSize: 30,
            letterSpacing: 1.5,
            color: "#fff",
            padding: "6px 4px 10px 4px",
          }}
        >
          <img src="/logo.png" alt="logo" style={{ height: 48, objectFit: "contain", marginBottom: 4 }} />
          <span style={{ lineHeight: 1 }}>D.I.Y.A</span>
        </div>

        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.25)", margin: "0 0 10px 0" }} />

        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button
            type="button"
            onClick={() => navigate(`/forum/${groupName}`)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "8px 10px",
              borderRadius: 10,
              border: "none",
              backgroundColor: "transparent",
              color: "rgba(255,255,255,0.85)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Back to Forum
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "32px 36px 56px 24px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 900 }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                color: palette.crimson,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: -0.5,
                marginBottom: 8,
              }}
            >
              Question Discussion
            </div>
            <div
              style={{
                color: palette.deepBurgundy,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {decodeURIComponent(groupName || "")}
            </div>
          </div>

          {/* Original Question Card */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "2px solid " + palette.crimson,
              borderRadius: 14,
              padding: "20px 24px",
              marginBottom: 24,
              boxShadow: "0 4px 18px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: palette.crimson,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              Original Question
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: palette.deepBurgundy,
                marginBottom: 12,
                lineHeight: 1.4,
              }}
            >
              {currentQuestion.question}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: palette.sage,
              }}
            >
              Asked by {currentQuestion.author}
            </div>
          </div>

          {/* Chat Container */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid rgba(214,214,214,0.4)",
              borderRadius: 14,
              padding: "20px",
              marginBottom: 20,
              boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
              minHeight: 400,
              maxHeight: 600,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: palette.crimson,
                marginBottom: 16,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Discussion ({replies.length} replies)
            </div>

            {/* Replies */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  style={{
                    padding: "14px 16px",
                    backgroundColor: reply.isAI
                      ? "rgba(162,34,55,0.04)"
                      : reply.isProfessor
                      ? "rgba(122,155,118,0.08)"
                      : "rgba(214,214,214,0.15)",
                    borderLeft: `3px solid ${
                      reply.isAI
                        ? palette.crimson
                        : reply.isProfessor
                        ? palette.sage
                        : palette.lightGray
                    }`,
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: reply.isAI
                          ? palette.crimson
                          : reply.isProfessor
                          ? palette.sage
                          : palette.deepBurgundy,
                      }}
                    >
                      {reply.isAI ? "🤖 " : reply.isProfessor ? "👨‍🏫 " : "👤 "}
                      {reply.author}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "rgba(92,30,38,0.5)",
                      }}
                    >
                      {reply.timestamp}
                    </div>
                    {reply.isAI && (
                      <button
                        onClick={handleRejectAI}
                        style={{
                          marginLeft: "auto",
                          padding: "4px 10px",
                          background: "transparent",
                          color: "#DC3545",
                          border: "1px solid #DC3545",
                          borderRadius: 6,
                          fontSize: 10,
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
                      fontSize: 14,
                      fontWeight: 500,
                      color: palette.deepBurgundy,
                      lineHeight: 1.5,
                    }}
                  >
                    {reply.message}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Answer Input */}
          {showManualInput && (
            <div
              style={{
                backgroundColor: "#fff",
                border: "2px solid " + palette.sage,
                borderRadius: 14,
                padding: "20px",
                boxShadow: "0 4px 18px rgba(0,0,0,0.12)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: palette.sage,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                👨‍🏫 Professor's Manual Response
              </div>
              <textarea
                value={manualAnswer}
                onChange={(e) => setManualAnswer(e.target.value)}
                placeholder="Type your answer here..."
                style={{
                  width: "100%",
                  minHeight: 120,
                  padding: "12px 14px",
                  border: "1px solid rgba(214,214,214,0.5)",
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  onClick={handleSubmitManualAnswer}
                  style={{
                    padding: "10px 20px",
                    background: palette.sage,
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Submit Answer
                </button>
                <button
                  onClick={() => setShowManualInput(false)}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    color: palette.deepBurgundy,
                    border: "1px solid rgba(92,30,38,0.3)",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
