import { useState } from "react";
import { useParams, useNavigate } from "react-router";

interface Question {
  id: number;
  author: string;
  question: string;
  replies: number;
  aiAnswer: string;
  aiAnswerStatus?: "pending" | "verified" | "rejected";
}

// Helper function to get time ago
function getTimeAgo(id: number): string {
  const times = ["2 hours ago", "5 hours ago", "1 day ago", "2 days ago", "3 days ago", "1 week ago"];
  return times[id % times.length];
}

// Color palette matching the new UI
const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

// SVG Icons
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

export function ForumPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Mock student questions data with AI answers
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      author: "Sarah Johnson",
      question: "Can someone explain the difference between recursion and iteration?",
      replies: 12,
      aiAnswer: "recursion is when a function calls itself to solve smaller instances of the same problem, while iteration uses loops to repeat a process. recursion has a base case to stop, iteration has a condition. recursion can be more elegant but uses more memory due to call stack.",
      aiAnswerStatus: "pending",
    },
    {
      id: 2,
      author: "Michael Chen",
      question: "What's the best way to approach the final project?",
      replies: 8,
      aiAnswer: "start by breaking down the requirements into smaller tasks. create a timeline with milestones. begin with core functionality before adding features. test frequently and don't wait until the last minute. use version control and commit regularly.",
      aiAnswerStatus: "pending",
    },
    {
      id: 3,
      author: "Emily Rodriguez",
      question: "Are we allowed to use external libraries for the assignment?",
      replies: 5,
      aiAnswer: "check the assignment rubric for specific restrictions. generally, you can use standard libraries but should avoid libraries that solve the core problem for you. when in doubt, ask the professor before submission to ensure compliance.",
      aiAnswerStatus: "pending",
    },
    {
      id: 4,
      author: "David Kim",
      question: "When is the deadline for submitting the lab report?",
      replies: 3,
      aiAnswer: "the lab report deadline is typically listed in the syllabus and course calendar. check the course management system for the exact date and time. if you need an extension, contact the professor at least 48 hours before the deadline.",
      aiAnswerStatus: "pending",
    },
    {
      id: 5,
      author: "Jessica Lee",
      question: "How do I set up the development environment for this project?",
      replies: 15,
      aiAnswer: "install the required ide and compiler/interpreter. set up version control with git. install project dependencies using the package manager. configure environment variables if needed. refer to the setup guide provided in the project documentation.",
      aiAnswerStatus: "pending",
    },
    {
      id: 6,
      author: "Ryan Martinez",
      question: "Is there a study guide available for the midterm exam?",
      replies: 0,
      aiAnswer: "study guides are usually posted 1-2 weeks before the exam. review lecture notes, homework assignments, and practice problems. focus on key concepts covered in class. attend review sessions if offered. form study groups with classmates.",
      aiAnswerStatus: "pending",
    },
  ]);

  const handleAIResponse = (questionId: number, action: "verify" | "reject") => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, aiAnswerStatus: action === "verify" ? "verified" : "rejected" }
        : q
    ));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        textAlign: "left",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: "#111",
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
        {/* Logo area */}
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

        {/* Divider line */}
        <div
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.25)",
            margin: "0 0 10px 0",
          }}
        />

        {/* Sidebar navigation buttons */}
        <nav aria-label="Sidebar navigation" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button
            type="button"
            onClick={() => navigate("/")}
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
              transition: "background-color 120ms ease",
            }}
          >
            ← Back to Groups
          </button>
          {[
            { id: "calendar", label: "Calendar", path: `/calendar/${groupName}` },
            { id: "analysis", label: "Analysis", path: `/analysis/${groupName}` },
            { id: "requests", label: "Requests", path: `/requests/${groupName}` },
            { id: "editgroup", label: "Edit Group", path: `/edit-group/${groupName}` },
          ].map((item) => {
            const isActive = false;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: isActive ? "rgba(255,255,255,0.88)" : "transparent",
                  color: isActive ? palette.darkest : "rgba(255,255,255,0.85)",
                  fontSize: 13,
                  fontWeight: isActive ? 800 : 600,
                  cursor: "pointer",
                  transition: "background-color 120ms ease",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Bottom divider */}
        <div
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.2)",
            margin: "10px 0 8px 0",
          }}
        />

        {/* Quick Stats */}
        <div
          style={{
            padding: "10px 10px",
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            Forum Stats
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
            📊 {questions.length} Questions
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
            ✅ {questions.filter(q => q.replies > 0).length} Answered
          </div>
        </div>

        {/* New Post button */}
        <button
          type="button"
          onClick={() => alert("Create new announcement (feature coming soon)")}
          style={{
            width: "100%",
            textAlign: "center",
            padding: "10px 10px",
            borderRadius: 10,
            border: "none",
            backgroundColor: palette.sage,
            color: "white",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 120ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#699066";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = palette.sage;
          }}
        >
          ✏️ New Announcement
        </button>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "32px 36px 56px 24px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1400 }}>
          {/* Welcome Header */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                color: palette.crimson,
                fontSize: 44,
                fontWeight: 850,
                letterSpacing: -1,
                lineHeight: 1.1,
              }}
            >
              {decodeURIComponent(groupName || "")}
            </div>

            {/* Subtitle */}
            <div
              style={{
                marginTop: 8,
                color: palette.deepBurgundy,
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: -0.2,
              }}
            >
              Student Forum & Discussion Board
            </div>
          </div>

          {/* Stats Cards Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "#fff",
                borderRadius: 12,
                border: "1px solid rgba(214,214,214,0.4)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(92,30,38,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Total Questions
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: palette.crimson,
                  lineHeight: 1,
                }}
              >
                {questions.length}
              </div>
            </div>

            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "#fff",
                borderRadius: 12,
                border: "1px solid rgba(214,214,214,0.4)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(92,30,38,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                AI Verified
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: palette.sage,
                  lineHeight: 1,
                }}
              >
                {questions.filter(q => q.aiAnswerStatus === "verified").length}
              </div>
            </div>

            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "#fff",
                borderRadius: 12,
                border: "1px solid rgba(214,214,214,0.4)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(92,30,38,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Pending Review
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#DC3545",
                  lineHeight: 1,
                }}
              >
                {questions.filter(q => q.aiAnswerStatus === "pending").length}
              </div>
            </div>

            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "#fff",
                borderRadius: 12,
                border: "1px solid rgba(214,214,214,0.4)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(92,30,38,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Student Replies
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: palette.deepBurgundy,
                  lineHeight: 1,
                }}
              >
                {questions.reduce((sum, q) => sum + q.replies, 0)}
              </div>
            </div>
          </div>

          {/* Small divider under title */}
          <div
            style={{
              height: 1,
              backgroundColor: "rgba(39,1,21,0.12)",
              marginTop: 14,
              marginBottom: 18,
            }}
          />

          {/* Showing count text */}
          <div
            style={{
              marginTop: 12,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                color: palette.crimson,
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              Recent Student Questions
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: palette.deepBurgundy,
                opacity: 0.7,
              }}
            >
              Last updated: Today at {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>

          {/* Filter/Sort Bar */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <button
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${palette.crimson}`,
                backgroundColor: palette.crimson,
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              All Questions
            </button>
            <button
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid rgba(39,1,21,0.2)`,
                backgroundColor: "transparent",
                color: palette.deepBurgundy,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() => alert("Filter: Unanswered (feature coming soon)")}
            >
              Unanswered
            </button>
            <button
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid rgba(39,1,21,0.2)`,
                backgroundColor: "transparent",
                color: palette.deepBurgundy,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() => alert("Sort: Recent (feature coming soon)")}
            >
              Recent
            </button>
          </div>

          {/* Questions container */}
          <div
            style={{
              marginTop: 20,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {/* Render each question card */}
            {questions.map((q) => {
              const isHovered = hoveredId === q.id;
              return (
                <div
                  key={q.id}
                  onMouseEnter={() => setHoveredId(q.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    textAlign: "left",
                    backgroundColor: "#fff",
                    border: isHovered ? `1px solid ${palette.crimson}` : "1px solid rgba(214,214,214,0.4)",
                    borderRadius: 14,
                    padding: "18px 20px",
                    cursor: "pointer",
                    boxShadow: isHovered
                      ? "0 12px 36px rgba(0,0,0,0.22)"
                      : "0 4px 18px rgba(0,0,0,0.12)",
                    transform: isHovered ? "translateY(-2px)" : "translateY(0px)",
                    transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
                  }}
                >
                  {/* Question header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
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

                    {/* Small status dot */}
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: palette.sage,
                        flex: "0 0 auto",
                      }}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Question stats */}
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
                    {/* Author */}
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

                    {/* Replies */}
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

                    {/* Time ago */}
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "rgba(92,30,38,0.5)",
                        marginLeft: "auto",
                      }}
                    >
                      🕐 {getTimeAgo(q.id)}
                    </div>
                  </div>

                  {/* AI Generated Answer Section */}
                  <div
                    style={{
                      marginTop: 16,
                      padding: "12px 14px",
                      backgroundColor: 
                        q.aiAnswerStatus === "verified" 
                          ? "rgba(122,155,118,0.08)" 
                          : q.aiAnswerStatus === "rejected"
                          ? "rgba(220,53,69,0.05)"
                          : "rgba(162,34,55,0.04)",
                      borderLeft: `3px solid ${
                        q.aiAnswerStatus === "verified"
                          ? palette.sage
                          : q.aiAnswerStatus === "rejected"
                          ? "#DC3545"
                          : palette.crimson
                      }`,
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: palette.crimson,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        marginBottom: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      🤖 AI Generated Answer
                      {q.aiAnswerStatus === "verified" && (
                        <span style={{ color: palette.sage }}>✓ Verified</span>
                      )}
                      {q.aiAnswerStatus === "rejected" && (
                        <span style={{ color: "#DC3545" }}>✗ Rejected</span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: palette.deepBurgundy,
                        lineHeight: 1.5,
                        marginBottom: 10,
                      }}
                    >
                      {q.aiAnswer}
                    </div>
                    
                    {/* Verify/Reject Buttons */}
                    {q.aiAnswerStatus === "pending" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAIResponse(q.id, "verify");
                          }}
                          style={{
                            padding: "6px 12px",
                            background: palette.sage,
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 120ms ease",
                          }}
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
                          style={{
                            padding: "6px 12px",
                            background: "transparent",
                            color: "#DC3545",
                            border: "1px solid #DC3545",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 120ms ease",
                          }}
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

                  {/* View question + arrow */}
                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <button
                      onClick={() => navigate(`/forum/${groupName}/question/${q.id}`)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: palette.crimson }}>
                        View all replies
                      </div>
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
      </main>
    </div>
  );
}