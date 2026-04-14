import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProfessorSidebar } from "./ProfessorSidebar.tsx";

interface Question {
  id: number;
  author: string;
  question: string;
  replies: number;
  aiAnswer: string;
  aiAnswerStatus?: "pending" | "verified" | "rejected";
}

function getTimeAgo(id: number): string {
  const times = ["2 hours ago", "5 hours ago", "1 day ago", "2 days ago", "3 days ago", "1 week ago"];
  return times[id % times.length];
}

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

function UsersIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke={color} strokeWidth="2" />
      <path d="M4 20.5c1.6-3.2 4.5-5 8-5s6.4 1.8 8 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ForumPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      author: "Sarah Johnson",
      question: "Can someone explain the difference between recursion and iteration?",
      replies: 12,
      aiAnswer: "Recursion is when a function calls itself to solve smaller instances of the same problem, while iteration uses loops to repeat a process. Recursion has a base case to stop, iteration has a condition. Recursion can be more elegant but uses more memory due to call stack.",
      aiAnswerStatus: "pending",
    },
    {
      id: 2,
      author: "Michael Chen",
      question: "What's the best way to approach the final project?",
      replies: 8,
      aiAnswer: "Start by breaking down the requirements into smaller tasks. Create a timeline with milestones. Begin with core functionality before adding features. Test frequently and don't wait until the last minute. Use version control and commit regularly.",
      aiAnswerStatus: "pending",
    },
    {
      id: 3,
      author: "Emily Rodriguez",
      question: "Are we allowed to use external libraries for the assignment?",
      replies: 5,
      aiAnswer: "Check the assignment rubric for specific restrictions. Generally, you can use standard libraries but should avoid libraries that solve the core problem for you. When in doubt, ask the professor before submission to ensure compliance.",
      aiAnswerStatus: "pending",
    },
    {
      id: 4,
      author: "David Kim",
      question: "When is the deadline for submitting the lab report?",
      replies: 3,
      aiAnswer: "The lab report deadline is typically listed in the syllabus and course calendar. Check the course management system for the exact date and time. If you need an extension, contact the professor at least 48 hours before the deadline.",
      aiAnswerStatus: "pending",
    },
    {
      id: 5,
      author: "Jessica Lee",
      question: "How do I set up the development environment for this project?",
      replies: 15,
      aiAnswer: "Install the required IDE and compiler/interpreter. Set up version control with git. Install project dependencies using the package manager. Configure environment variables if needed. Refer to the setup guide provided in the project documentation.",
      aiAnswerStatus: "pending",
    },
    {
      id: 6,
      author: "Ryan Martinez",
      question: "Is there a study guide available for the midterm exam?",
      replies: 0,
      aiAnswer: "Study guides are usually posted 1-2 weeks before the exam. Review lecture notes, homework assignments, and practice problems. Focus on key concepts covered in class. Attend review sessions if offered. Form study groups with classmates.",
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

  const pendingCount = questions.filter(q => q.aiAnswerStatus === "pending").length;
  const verifiedCount = questions.filter(q => q.aiAnswerStatus === "verified").length;
  const totalReplies = questions.reduce((sum, q) => sum + q.replies, 0);

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
            Student Forum
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: palette.darkest,
              letterSpacing: -2.5,
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            {decodeURIComponent(groupName || "")}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "rgba(92,30,38,0.55)",
              marginBottom: 52,
            }}
          >
            Discussion board & AI answer management
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {[
              { label: "Total Questions", value: questions.length, color: palette.crimson },
              { label: "AI Verified", value: verifiedCount, color: palette.sage },
              { label: "Pending Review", value: pendingCount, color: "#DC3545" },
              { label: "Student Replies", value: totalReplies, color: palette.deepBurgundy },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  paddingRight: i < 3 ? 40 : 0,
                  marginRight: i < 3 ? 40 : 0,
                  borderRight: i < 3 ? "1px solid rgba(214,214,214,0.5)" : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 900,
                    color: stat.color,
                    letterSpacing: -1.5,
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(92,30,38,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Questions Section */}
        <div style={{ padding: "48px 64px" }}>
          {/* Section Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: palette.darkest,
                letterSpacing: -1,
              }}
            >
              Recent Questions
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["All", "Pending", "Verified"].map((label) => (
                <button
                  key={label}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    border: label === "All" ? "none" : "1.5px solid rgba(39,1,21,0.12)",
                    backgroundColor: label === "All" ? palette.crimson : "transparent",
                    color: label === "All" ? "white" : palette.deepBurgundy,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {questions.map((q) => {
              const isHovered = hoveredId === q.id;
              const statusColor = q.aiAnswerStatus === "verified" ? palette.sage : q.aiAnswerStatus === "rejected" ? "#DC3545" : palette.crimson;
              return (
                <div
                  key={q.id}
                  onMouseEnter={() => setHoveredId(q.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: isHovered ? "0 20px 60px rgba(0,0,0,0.14)" : "0 2px 24px rgba(0,0,0,0.06)",
                    transform: isHovered ? "translateY(-3px)" : "translateY(0)",
                    transition: "transform 200ms ease, box-shadow 200ms ease",
                  }}
                >
                  {/* Top accent */}
                  <div style={{ height: 4, backgroundColor: statusColor }} />

                  <div style={{ padding: "28px 32px 24px" }}>
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ flex: 1, paddingRight: 24 }}>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: palette.darkest,
                            letterSpacing: -0.4,
                            lineHeight: 1.35,
                            marginBottom: 10,
                          }}
                        >
                          {q.question}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "5px 10px",
                              borderRadius: 8,
                              backgroundColor: "rgba(122,155,118,0.1)",
                            }}
                          >
                            <UsersIcon color={palette.sage} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: palette.deepBurgundy }}>{q.author}</span>
                          </div>
                          <div
                            style={{
                              padding: "5px 10px",
                              borderRadius: 8,
                              backgroundColor: q.replies === 0 ? "rgba(220,53,69,0.08)" : "rgba(92,30,38,0.06)",
                              fontSize: 12,
                              fontWeight: 700,
                              color: q.replies === 0 ? "#DC3545" : palette.deepBurgundy,
                            }}
                          >
                            {q.replies} {q.replies === 1 ? "reply" : "replies"}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.4)" }}>
                            {getTimeAgo(q.id)}
                          </span>
                        </div>
                      </div>

                      {/* Status badge */}
                      <div
                        style={{
                          padding: "6px 14px",
                          borderRadius: 10,
                          backgroundColor: q.aiAnswerStatus === "verified"
                            ? "rgba(122,155,118,0.12)"
                            : q.aiAnswerStatus === "rejected"
                            ? "rgba(220,53,69,0.1)"
                            : "rgba(162,34,55,0.08)",
                          fontSize: 11,
                          fontWeight: 800,
                          color: statusColor,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {q.aiAnswerStatus === "verified" ? "✓ Verified" : q.aiAnswerStatus === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                      </div>
                    </div>

                    {/* AI Answer */}
                    <div
                      style={{
                        padding: "16px 20px",
                        backgroundColor: q.aiAnswerStatus === "verified"
                          ? "rgba(122,155,118,0.06)"
                          : q.aiAnswerStatus === "rejected"
                          ? "rgba(220,53,69,0.04)"
                          : "rgba(162,34,55,0.03)",
                        borderRadius: 14,
                        borderLeft: `4px solid ${statusColor}`,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: palette.crimson,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          marginBottom: 8,
                        }}
                      >
                        AI Generated Answer
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: palette.deepBurgundy,
                          lineHeight: 1.65,
                        }}
                      >
                        {q.aiAnswer}
                      </div>
                    </div>

                    {/* Actions row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {q.aiAnswerStatus === "pending" && (
                          <>
                            <button
                              onClick={() => handleAIResponse(q.id, "verify")}
                              style={{
                                padding: "8px 16px",
                                background: palette.sage,
                                color: "white",
                                border: "none",
                                borderRadius: 10,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              ✓ Verify Answer
                            </button>
                            <button
                              onClick={() => handleAIResponse(q.id, "reject")}
                              style={{
                                padding: "8px 16px",
                                background: "transparent",
                                color: "#DC3545",
                                border: "1.5px solid #DC3545",
                                borderRadius: 10,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                      </div>
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
                          fontSize: 13,
                          fontWeight: 700,
                          color: palette.crimson,
                        }}
                      >
                        View Discussion
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18l6-6-6-6" stroke={palette.crimson} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Banner */}
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`,
            padding: "40px 64px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            AI Forum Management
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginBottom: 4 }}>
            {pendingCount > 0 ? `${pendingCount} answers awaiting your review.` : "All AI answers reviewed. Great work."}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>
            Verify or override AI-generated responses to keep students informed.
          </div>
        </div>
      </main>
    </div>
  );
}
