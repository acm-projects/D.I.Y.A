import { useParams, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

// Topic data from student questions
const topicData = [
  { id: "topic-1", name: "Recursion & Iteration", value: 28, status: "needs-attention" },
  { id: "topic-2", name: "Data Structures", value: 22, status: "proficient" },
  { id: "topic-3", name: "Development Environment", value: 18, status: "needs-attention" },
  { id: "topic-4", name: "Exam Preparation", value: 14, status: "needs-attention" },
];

const COLORS = {
  "needs-attention": "#DC3545",
  "proficient": "#7A9B76",
};

const aiInsights = [
  {
    topic: "Recursion & Iteration",
    status: "needs-attention",
    insight: "High volume of questions indicates students struggling with fundamental concepts. Consider dedicating extra lecture time or hosting a review session.",
    recommendation: "Schedule 2-hour workshop on recursion patterns and practice problems",
  },
  {
    topic: "Development Environment",
    status: "needs-attention",
    insight: "Multiple setup-related questions suggest initial configuration barriers. Many students may be falling behind due to technical issues.",
    recommendation: "Create step-by-step setup guide with video walkthrough",
  },
  {
    topic: "Exam Preparation",
    status: "needs-attention",
    insight: "Students seeking clarification on exam scope and format. Proactive communication could reduce anxiety and improve performance.",
    recommendation: "Release comprehensive study guide 2 weeks before exam date",
  },
  {
    topic: "Data Structures",
    status: "proficient",
    insight: "Students demonstrating strong understanding with mostly clarification questions. This topic is well-covered in current curriculum.",
    recommendation: "Continue current teaching approach",
  },
];

export function AnalysisPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();

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
          {[
            { id: "calendar", label: "Calendar", path: `/calendar/${groupName}` },
            { id: "analysis", label: "Analysis", path: `/analysis/${groupName}` },
            { id: "requests", label: "Requests", path: `/requests/${groupName}` },
            { id: "editgroup", label: "Edit Group", path: `/edit-group/${groupName}` },
          ].map((item) => {
            const isActive = item.id === "analysis";
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
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "32px 36px 56px 24px", boxSizing: "border-box", overflow: "auto" }}>
        <div style={{ maxWidth: 1400 }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                color: palette.crimson,
                fontSize: 44,
                fontWeight: 850,
                letterSpacing: -1,
                lineHeight: 1.1,
              }}
            >
              AI-Powered Course Analysis
            </div>
            <div
              style={{
                marginTop: 8,
                color: palette.deepBurgundy,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Insights derived from student questions and engagement patterns
            </div>
          </div>

          {/* Stats Overview */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                backgroundColor: "#fff",
                borderRadius: 12,
                border: "1px solid rgba(214,214,214,0.4)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(92,30,38,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                Total Questions Analyzed
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: palette.crimson,
                  lineHeight: 1,
                }}
              >
                82
              </div>
            </div>

            <div
              style={{
                padding: "18px 20px",
                backgroundColor: "#fff",
                borderRadius: 12,
                border: "1px solid rgba(214,214,214,0.4)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(92,30,38,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                Topics Identified
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: palette.sage,
                  lineHeight: 1,
                }}
              >
                {topicData.length}
              </div>
            </div>

            <div
              style={{
                padding: "18px 20px",
                backgroundColor: "#fff",
                borderRadius: 12,
                border: "1px solid rgba(214,214,214,0.4)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(92,30,38,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                Areas Needing Attention
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: "#DC3545",
                  lineHeight: 1,
                }}
              >
                {topicData.filter(t => t.status === "needs-attention").length}
              </div>
            </div>
          </div>

          {/* Main Analysis Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              marginBottom: 32,
            }}
          >
            {/* Pie Chart */}
            <div
              style={{
                backgroundColor: "#fff",
                border: "1px solid rgba(214,214,214,0.4)",
                borderRadius: 14,
                padding: "28px",
                boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: palette.crimson,
                  marginBottom: 20,
                }}
              >
                Question Distribution by Topic
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={topicData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topicData.map((entry) => (
                      <Cell key={entry.id} fill={COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 16, display: "flex", gap: 16, justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: "#DC3545",
                      borderRadius: 4,
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: palette.deepBurgundy }}>
                    Needs Attention
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: palette.sage,
                      borderRadius: 4,
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: palette.deepBurgundy }}>
                    Proficient
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Summary */}
            <div
              style={{
                backgroundColor: "#fff",
                border: "1px solid rgba(214,214,214,0.4)",
                borderRadius: 14,
                padding: "28px",
                boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: palette.crimson,
                  marginBottom: 20,
                }}
              >
                🤖 AI Summary
              </div>
              <div
                style={{
                  padding: "16px 18px",
                  backgroundColor: "rgba(162,34,55,0.04)",
                  borderLeft: `3px solid ${palette.crimson}`,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: palette.deepBurgundy,
                    lineHeight: 1.6,
                    marginBottom: 12,
                  }}
                >
                  Based on 82 student questions analyzed over the past 2 weeks, the AI has identified 3 critical areas requiring immediate attention.
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: palette.deepBurgundy,
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Priority Topics:</strong>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    <li>Recursion & Iteration (18 questions)</li>
                    <li>Development Environment Setup (10 questions)</li>
                    <li>Exam Preparation Guidance (8 questions)</li>
                  </ul>
                </div>
              </div>
              <div
                style={{
                  padding: "16px 18px",
                  backgroundColor: "rgba(122,155,118,0.08)",
                  borderLeft: `3px solid ${palette.sage}`,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: palette.deepBurgundy,
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Positive Indicators:</strong>
                  <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: 12 }}>
                    <li>Data Structures understanding is strong</li>
                    <li>Career-focused questions indicate engagement</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed AI Insights */}
          <div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: palette.crimson,
                marginBottom: 16,
              }}
            >
              Detailed Topic Insights
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {aiInsights.map((insight, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#fff",
                    border: `2px solid ${insight.status === "needs-attention" ? "#DC3545" : palette.sage}`,
                    borderRadius: 14,
                    padding: "20px 24px",
                    boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: palette.deepBurgundy,
                      }}
                    >
                      {insight.topic}
                    </div>
                    <span
                      style={{
                        padding: "4px 12px",
                        backgroundColor: insight.status === "needs-attention" ? "#DC3545" : palette.sage,
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 6,
                        textTransform: "uppercase",
                      }}
                    >
                      {insight.status === "needs-attention" ? "⚠️ Needs Attention" : "✓ Proficient"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: palette.deepBurgundy,
                      lineHeight: 1.6,
                      marginBottom: 12,
                    }}
                  >
                    <strong>AI Insight:</strong> {insight.insight}
                  </div>
                  <div
                    style={{
                      padding: "12px 14px",
                      backgroundColor: insight.status === "needs-attention" ? "rgba(220,53,69,0.05)" : "rgba(122,155,118,0.08)",
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: palette.crimson,
                        marginBottom: 4,
                      }}
                    >
                      💡 Recommended Action:
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: palette.deepBurgundy,
                      }}
                    >
                      {insight.recommendation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}