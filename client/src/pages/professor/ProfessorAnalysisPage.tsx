import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

 type TopicStatus = "needs-attention" | "proficient";

 interface TopicData {
   id: string;
   name: string;
   value: number;
   status: TopicStatus;
   share: number;
 }

 interface LiveGroup {
   id: string;
   professor?: string;
 }

 interface LiveUser {
   id: string;
   authId?: string;
   email?: string;
   name?: string;
 }

 interface LivePost {
   id: string;
   title?: string;
   content?: string;
   groupId?: string;
   topic?: string;
   tags?: string[];
 }

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

const GROUPS_API_BASE_URL = "/api/groups";
const POSTS_API_BASE_URL = "/api/posts";
const USERS_API_BASE_URL = "/api/users";

const COLORS: Record<TopicStatus, string> = {
  "needs-attention": "#DC3545",
  "proficient": "#7A9B76",
};

function abbreviateTopicLabel(name: string): string {
  return name.length > 8 ? `${name.slice(0, 5)}...` : name;
}

function normalizeTopicName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractTopicsFromPost(post: LivePost): string[] {
  const normalizedTags = Array.isArray(post.tags)
    ? post.tags.map((tag) => normalizeTopicName(tag)).filter(Boolean)
    : [];

  if (normalizedTags.length > 0) {
    return Array.from(new Set(normalizedTags));
  }

  const normalizedTopic = normalizeTopicName(post.topic ?? "");
  if (normalizedTopic) {
    return [normalizedTopic];
  }

  const normalizedTitle = normalizeTopicName(post.title ?? "");
  if (normalizedTitle) {
    return [normalizedTitle];
  }

  const normalizedContent = normalizeTopicName(post.content ?? "");
  if (!normalizedContent) {
    return ["Uncategorized"];
  }

  return [normalizedContent.split(" ").slice(0, 3).join(" ")];
}

function aggregateTopics(posts: LivePost[]): TopicData[] {
  const counts = new Map<string, number>();

  posts.forEach((post) => {
    extractTopicsFromPost(post).forEach((topic) => {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    });
  });

  const totalMentions = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([name, value], index) => ({
      id: `topic-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name,
      value,
      status: totalMentions > 0 && value / totalMentions >= 0.25 ? "needs-attention" : "proficient",
      share: totalMentions > 0 ? value / totalMentions : 0,
    }));
}

function getTopicInsight(topic: TopicData): string {
  if (topic.status === "needs-attention") {
    return `${topic.name} represents ${Math.round(topic.share * 100)}% of the analyzed discussion volume, which suggests students are repeatedly returning to this area for help.`;
  }

  return `${topic.name} appears less frequently in the question stream, which suggests the current materials are supporting students more effectively here.`;
}

function getTopicRecommendation(topic: TopicData): string {
  if (topic.status === "needs-attention") {
    return `Prioritize a short review, announcement, or office-hours emphasis for ${topic.name} before the next class checkpoint.`;
  }

  return `Keep the current support approach for ${topic.name} and monitor for any increase in question volume.`;
}

function renderTopicLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
  value?: number;
  name?: string;
}) {
  const { cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0, value = 0, name = "" } = props;
  const radius = outerRadius + 28;
  const radians = Math.PI / 180;
  const x = cx + radius * Math.cos(-midAngle * radians);
  const y = cy + radius * Math.sin(-midAngle * radians);
  const label = `${abbreviateTopicLabel(name)} ${value} (${(percent * 100).toFixed(0)}%)`;

  return (
    <text
      x={x}
      y={y}
      fill={palette.deepBurgundy}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{ fontSize: 11, fontWeight: 700 }}
    >
      {label}
    </text>
  );
}

export function ProfessorAnalysisPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth0();
  const [topicData, setTopicData] = useState<TopicData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzedPostCount, setAnalyzedPostCount] = useState(0);
  const [analyzedGroupCount, setAnalyzedGroupCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadAnalysis = async () => {
      if (!user?.sub) {
        if (isMounted) {
          setTopicData([]);
          setAnalyzedPostCount(0);
          setAnalyzedGroupCount(0);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [groupsResponse, postsResponse, usersResponse] = await Promise.all([
          fetch(GROUPS_API_BASE_URL, { signal: controller.signal }),
          fetch(POSTS_API_BASE_URL, { signal: controller.signal }),
          fetch(USERS_API_BASE_URL, { signal: controller.signal }),
        ]);

        if (!groupsResponse.ok || !postsResponse.ok || !usersResponse.ok) {
          throw new Error("Failed to load analysis data.");
        }

        const groups = (await groupsResponse.json()) as LiveGroup[];
        const posts = (await postsResponse.json()) as LivePost[];
        const users = (await usersResponse.json()) as LiveUser[];

        const currentProfessor = users.find((liveUser) => {
          const candidateValues = [liveUser.id, liveUser.authId, liveUser.email, liveUser.name].filter(
            (value): value is string => Boolean(value),
          );

          return candidateValues.some((value) => [user.sub, user.email, user.name].filter((item): item is string => Boolean(item)).includes(value));
        }) ?? null;

        const professorIdentifiers = [user.sub, user.email, user.name, currentProfessor?.id, currentProfessor?.authId].filter(
          (value): value is string => Boolean(value),
        );

        const professorGroups = groups.filter((group) => professorIdentifiers.includes(group.professor ?? ""));
        const groupIds = new Set(professorGroups.map((group) => group.id));
        const relevantPosts = posts.filter((post) => groupIds.has(post.groupId ?? ""));
        const aggregatedTopics = aggregateTopics(relevantPosts);

        if (isMounted) {
          setTopicData(aggregatedTopics);
          setAnalyzedPostCount(relevantPosts.length);
          setAnalyzedGroupCount(professorGroups.length);
        }
      } catch (err) {
        if (controller.signal.aborted || !isMounted) {
          return;
        }

        setTopicData([]);
        setAnalyzedPostCount(0);
        setAnalyzedGroupCount(0);
        setError(err instanceof Error ? err.message : "Failed to load analysis data.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAnalysis();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [user?.email, user?.name, user?.sub]);

  const totalTopicQuestions = useMemo(
    () => topicData.reduce((sum, topic) => sum + topic.value, 0),
    [topicData],
  );

  const attentionTopics = useMemo(
    () => topicData.filter((topic) => topic.status === "needs-attention"),
    [topicData],
  );

  const topTopic = topicData[0] ?? null;

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
            onClick={() => navigate("/professor/forum")}
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
            { id: "calendar", label: "Calendar", path: "/professor/calendar" },
            { id: "analysis", label: "Analysis", path: "/professor/analysis" },
            { id: "requests", label: "Requests", path: "/professor/requests" },
            { id: "editgroup", label: "Edit Group", path: "/professor/edit-group" },
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
        <div style={{ flex: 1 }} />
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.2)", margin: "10px 0 8px 0" }} />
        <button
          type="button"
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          Sign out
        </button>
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

          {error && (
            <div style={{ marginBottom: 20, padding: "16px 18px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid rgba(220,53,69,0.2)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", color: palette.crimson, fontSize: 13, fontWeight: 700 }}>
              {error}
            </div>
          )}

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
                Total Posts Analyzed
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: palette.crimson,
                  lineHeight: 1,
                }}
              >
                {analyzedPostCount}
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
                Groups Included
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: palette.sage,
                  lineHeight: 1,
                }}
              >
                {analyzedGroupCount}
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
                  color: palette.deepBurgundy,
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
                {attentionTopics.length}
              </div>
            </div>
          </div>

          {/* Main Analysis Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
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
              {isLoading ? (
                <div style={{ minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(92,30,38,0.6)", fontSize: 14, fontWeight: 700 }}>
                  Analyzing current professor groups...
                </div>
              ) : topicData.length === 0 ? (
                <div style={{ minHeight: 420, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10, color: "rgba(92,30,38,0.6)" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: palette.crimson }}>Not enough data to analyze yet.</div>
                  <div style={{ fontSize: 14, fontWeight: 600, maxWidth: 360, lineHeight: 1.6 }}>
                    Once students start posting questions in your groups, this dashboard will summarize the most discussed topics automatically.
                  </div>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={420}>
                    <PieChart margin={{ top: 36, right: 96, bottom: 36, left: 96 }}>
                      <Pie
                        data={topicData}
                        cx="50%"
                        cy="50%"
                        labelLine={{ stroke: "rgba(92,30,38,0.3)", strokeWidth: 1 }}
                        label={renderTopicLabel}
                        outerRadius={88}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {topicData.map((entry) => (
                          <Cell key={entry.id} fill={COLORS[entry.status]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => {
                          const numericValue = typeof value === "number" ? value : Number(value) || 0;
                          const percent = totalTopicQuestions > 0 ? Math.round((numericValue / totalTopicQuestions) * 100) : 0;
                          return [`${numericValue} questions (${percent}%)`, `${name}`];
                        }}
                        contentStyle={{ borderRadius: 12, border: "1px solid rgba(214,214,214,0.4)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
                    {topicData.map((topic) => (
                      <div key={topic.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, backgroundColor: "rgba(214,214,214,0.14)" }}>
                        <div style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: COLORS[topic.status], flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: palette.deepBurgundy, lineHeight: 1.3 }}>{topic.name}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.55)" }}>{topic.value} mentions ({Math.round(topic.share * 100)}%)</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, display: "flex", gap: 16, justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 16, height: 16, backgroundColor: "#DC3545", borderRadius: 4 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: palette.deepBurgundy }}>Needs Attention</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 16, height: 16, backgroundColor: palette.sage, borderRadius: 4 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: palette.deepBurgundy }}>Lower Volume</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Live Summary */}
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
                Live Summary
              </div>
              {isLoading ? (
                <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(92,30,38,0.55)", lineHeight: 1.6 }}>
                  Calculating topic activity from live posts...
                </div>
              ) : topicData.length === 0 ? (
                <div style={{ padding: "16px 18px", backgroundColor: "rgba(214,214,214,0.14)", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "rgba(92,30,38,0.6)", lineHeight: 1.6 }}>
                  Not enough data to analyze yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ padding: "16px 18px", backgroundColor: "rgba(162,34,55,0.04)", borderLeft: `3px solid ${palette.crimson}`, borderRadius: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: palette.deepBurgundy, lineHeight: 1.6, marginBottom: 8 }}>
                      {analyzedPostCount} posts across {analyzedGroupCount} group{analyzedGroupCount === 1 ? "" : "s"} generated {totalTopicQuestions} topic mention{totalTopicQuestions === 1 ? "" : "s"}.
                    </div>
                    {topTopic && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy, lineHeight: 1.6 }}>
                        <strong>Most active topic:</strong> {topTopic.name} with {topTopic.value} mention{topTopic.value === 1 ? "" : "s"} ({Math.round(topTopic.share * 100)}% of current discussion).
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "16px 18px", backgroundColor: "rgba(122,155,118,0.08)", borderLeft: `3px solid ${palette.sage}`, borderRadius: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy, lineHeight: 1.5, marginBottom: 8 }}>
                      Priority topics
                    </div>
                    {attentionTopics.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: palette.deepBurgundy, lineHeight: 1.7 }}>
                        {attentionTopics.slice(0, 3).map((topic) => (
                          <li key={topic.id}>{topic.name} ({topic.value} mentions)</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(92,30,38,0.6)" }}>
                        No topics currently exceed the attention threshold.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Topic Insights */}
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

            {isLoading ? (
              <div style={{ backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.3)", borderRadius: 14, padding: "20px 24px", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: palette.deepBurgundy, fontSize: 14, fontWeight: 700 }}>
                Building topic insights from live discussion data...
              </div>
            ) : topicData.length === 0 ? (
              <div style={{ backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.3)", borderRadius: 14, padding: "20px 24px", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: "rgba(92,30,38,0.55)", fontSize: 13, fontWeight: 700 }}>
                Not enough data to analyze yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {topicData.map((topic) => (
                  <div
                    key={topic.id}
                    style={{
                      backgroundColor: "#fff",
                      border: `2px solid ${topic.status === "needs-attention" ? "#DC3545" : palette.sage}`,
                      borderRadius: 14,
                      padding: "20px 24px",
                      boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: palette.deepBurgundy }}>{topic.name}</div>
                      <span style={{ padding: "4px 12px", backgroundColor: topic.status === "needs-attention" ? "#DC3545" : palette.sage, color: "white", fontSize: 11, fontWeight: 700, borderRadius: 6, textTransform: "uppercase" }}>
                        {topic.status === "needs-attention" ? "Needs Attention" : "Lower Volume"}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(92,30,38,0.55)" }}>
                        {topic.value} mention{topic.value === 1 ? "" : "s"} ({Math.round(topic.share * 100)}%)
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: palette.deepBurgundy, lineHeight: 1.6, marginBottom: 12 }}>
                      <strong>Insight:</strong> {getTopicInsight(topic)}
                    </div>
                    <div style={{ padding: "12px 14px", backgroundColor: topic.status === "needs-attention" ? "rgba(220,53,69,0.05)" : "rgba(122,155,118,0.08)", borderRadius: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: palette.crimson, marginBottom: 4 }}>Recommended Action</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: palette.deepBurgundy }}>
                        {getTopicRecommendation(topic)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
