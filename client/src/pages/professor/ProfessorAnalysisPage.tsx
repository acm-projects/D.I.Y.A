import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ProfessorSidebar } from "../../ProfessorSidebar";
import { useProfessorGroups } from "../../ProfessorGroupContext";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const { user, logout } = useAuth0();
  const { selectedGroupId } = useProfessorGroups();
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
        const [groupsResponse, postsResponse] = await Promise.all([
          fetch(GROUPS_API_BASE_URL, { signal: controller.signal }),
          fetch(POSTS_API_BASE_URL, { signal: controller.signal }),
        ]);

        if (!groupsResponse.ok || !postsResponse.ok) {
          throw new Error("Failed to load analysis data.");
        }

        const groups = (await groupsResponse.json()) as LiveGroup[];
        const posts = (await postsResponse.json()) as LivePost[];

        const relevantPosts = selectedGroupId
          ? posts.filter((post) => post.groupId === selectedGroupId)
          : posts;
        const professorGroups = selectedGroupId
          ? groups.filter((g) => g.id === selectedGroupId)
          : groups;
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
  }, [user?.email, user?.name, user?.sub, selectedGroupId]);

  const totalTopicQuestions = useMemo(
    () => topicData.reduce((sum, topic) => sum + topic.value, 0),
    [topicData],
  );

  const attentionTopics = useMemo(
    () => topicData.filter((topic) => topic.status === "needs-attention"),
    [topicData],
  );

  const proficientTopics = useMemo(
    () => topicData.filter((topic) => topic.status === "proficient"),
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
      <ProfessorSidebar activeItem="analysis" onSignOut={() => {
        window.localStorage.removeItem("diya_role");
        window.sessionStorage.removeItem("pendingSignupRole");
        void logout({ logoutParams: { returnTo: window.location.origin } });
      }} />

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto" }}>
        <div style={{ backgroundColor: "#fff", padding: "56px 64px 52px", borderBottom: "1px solid rgba(214,214,214,0.2)" }}>
          <div style={{ maxWidth: 1400 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>
              {t("analysis.badge")}
            </div>
            <div style={{ fontSize: 64, fontWeight: 900, color: palette.darkest, letterSpacing: -2.5, lineHeight: 1, marginBottom: 12 }}>
              {t("analysis.title")}
            </div>
            <div style={{ fontSize: 20, fontWeight: 400, color: "rgba(92,30,38,0.55)", marginBottom: 52 }}>
              {t("analysis.subtitle")}
            </div>

            <div style={{ display: "flex", gap: 0, alignItems: "stretch", flexWrap: "wrap" }}>
              {[
                { label: t("analysis.stats.postsAnalyzed"), value: analyzedPostCount, color: palette.crimson },
                { label: t("analysis.stats.groupsIncluded"), value: analyzedGroupCount, color: palette.sage },
                { label: t("analysis.stats.topicsIdentified"), value: topicData.length, color: palette.deepBurgundy },
                { label: t("analysis.stats.needAttention"), value: attentionTopics.length, color: "#DC3545" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    flex: "1 1 220px",
                    minWidth: 180,
                    paddingRight: i < 3 ? 40 : 0,
                    marginRight: i < 3 ? 40 : 0,
                    borderRight: i < 3 ? "1px solid rgba(214,214,214,0.5)" : "none",
                  }}
                >
                  <div style={{ fontSize: 48, fontWeight: 900, color: stat.color, letterSpacing: -1.5, lineHeight: 1, marginBottom: 8 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "48px 64px 40px" }}>
          <div style={{ maxWidth: 1400 }}>
            {error && (
              <div style={{ marginBottom: 20, padding: "16px 18px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid rgba(220,53,69,0.2)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", color: palette.crimson, fontSize: 13, fontWeight: 700 }}>
                {error}
              </div>
            )}

            {/* Main Analysis Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                gap: 28,
                marginBottom: 40,
              }}
            >
            {/* Pie Chart */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ height: 5, backgroundColor: palette.crimson }} />
              <div style={{ padding: "28px 32px 32px" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.darkest, letterSpacing: -0.5, marginBottom: 8 }}>
                  {t("analysis.distribution.title")}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(92,30,38,0.5)", marginBottom: 24 }}>
                  {t("analysis.distribution.subtitle")}
                </div>
              {isLoading ? (
                <div style={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(92,30,38,0.6)", fontSize: 14, fontWeight: 700 }}>
                  {t("analysis.distribution.loading")}
                </div>
              ) : topicData.length === 0 ? (
                <div style={{ minHeight: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10, color: "rgba(92,30,38,0.6)" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: palette.crimson }}>{t("analysis.distribution.empty")}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, maxWidth: 360, lineHeight: 1.6 }}>
                    {t("analysis.distribution.emptyDetail")}
                  </div>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                      <Pie
                        data={topicData}
                        cx="50%"
                        cy="50%"
                        labelLine={{ stroke: "rgba(92,30,38,0.3)", strokeWidth: 1 }}
                        label={renderTopicLabel}
                        outerRadius={96}
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
                  <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
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
                      <span style={{ fontSize: 12, fontWeight: 600, color: palette.deepBurgundy }}>{t("analysis.distribution.legendNeedsAttention")}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 16, height: 16, backgroundColor: palette.sage, borderRadius: 4 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: palette.deepBurgundy }}>{t("analysis.distribution.legendLowerVolume")}</span>
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>

            {/* Live Summary */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ height: 5, backgroundColor: palette.sage }} />
              <div style={{ padding: "28px 32px 32px" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.darkest, letterSpacing: -0.5, marginBottom: 24 }}>
                  {t("analysis.summary.title")}
                </div>
              {isLoading ? (
                <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(92,30,38,0.55)", lineHeight: 1.6 }}>
                  {t("analysis.summary.loading")}
                </div>
              ) : topicData.length === 0 ? (
                <div style={{ padding: "16px 18px", backgroundColor: "rgba(214,214,214,0.14)", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "rgba(92,30,38,0.6)", lineHeight: 1.6 }}>
                  {t("analysis.summary.empty")}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ padding: "18px 20px", backgroundColor: "rgba(162,34,55,0.04)", borderLeft: `4px solid ${palette.crimson}`, borderRadius: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: palette.deepBurgundy, lineHeight: 1.6, marginBottom: 8 }}>
                      {t("analysis.summary.postsSummary", { count: analyzedPostCount, groups: analyzedGroupCount, mentions: totalTopicQuestions })}
                    </div>
                    {topTopic && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy, lineHeight: 1.6 }}>
                        <strong>{t("analysis.summary.mostActiveTopic")}</strong>{" "}
                          {t("analysis.summary.mostActiveDetail", {
                            name: topTopic.name,
                            count: topTopic.value,
                            percent: Math.round(topTopic.share * 100),
                          })}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                      {t("analysis.summary.priorityTopics")}
                    </div>
                    {attentionTopics.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                        {attentionTopics.slice(0, 3).map((topic) => (
                          <div key={topic.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: palette.deepBurgundy }}>{topic.name}</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: "#DC3545" }}>{topic.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(92,30,38,0.6)", marginBottom: 20 }}>
                        {t("analysis.summary.noAttentionTopics")}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "14px 16px", backgroundColor: "rgba(122,155,118,0.08)", borderLeft: `4px solid ${palette.sage}`, borderRadius: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: palette.sage, marginBottom: 6 }}>✓ Positive Indicators</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: palette.deepBurgundy, lineHeight: 1.6 }}>
                      {proficientTopics.length > 0
                        ? t("analysis.summary.positiveWithTopics", {
                            topics: proficientTopics.slice(0, 2).map((topic) => topic.name).join(` ${t("common.and")} `),
                          })
                        : t("analysis.summary.positiveNoTopics")}
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Detailed Topic Insights */}
          <div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: palette.darkest,
                letterSpacing: -1,
                marginBottom: 24,
              }}
            >
              {t("analysis.insights.title")}
            </div>

            {isLoading ? (
              <div style={{ backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.3)", borderRadius: 14, padding: "20px 24px", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: palette.deepBurgundy, fontSize: 14, fontWeight: 700 }}>
                {t("analysis.insights.loading")}
              </div>
            ) : topicData.length === 0 ? (
              <div style={{ backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.3)", borderRadius: 14, padding: "20px 24px", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: "rgba(92,30,38,0.55)", fontSize: 13, fontWeight: 700 }}>
                {t("analysis.insights.empty")}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
                {topicData.map((topic) => (
                  <div
                    key={topic.id}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 20,
                      overflow: "hidden",
                      boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div style={{ height: 5, backgroundColor: topic.status === "needs-attention" ? "#DC3545" : palette.sage }} />
                    <div style={{ padding: "24px 28px 28px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: palette.darkest, letterSpacing: -0.3 }}>{topic.name}</div>
                        <span style={{ padding: "4px 12px", backgroundColor: topic.status === "needs-attention" ? "rgba(220,53,69,0.1)" : "rgba(122,155,118,0.12)", color: topic.status === "needs-attention" ? "#DC3545" : palette.sage, fontSize: 11, fontWeight: 700, borderRadius: 8, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                          {topic.status === "needs-attention" ? t("analysis.insights.badgeAttention") : t("analysis.insights.badgeStrong")}
                        </span>
                        <span style={{ marginLeft: "auto", fontSize: 20, fontWeight: 900, color: topic.status === "needs-attention" ? "#DC3545" : palette.sage }}>
                          {topic.value}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: palette.deepBurgundy, lineHeight: 1.65, marginBottom: 16 }}>
                        {getTopicInsight(topic)}
                      </div>
                      <div style={{ padding: "12px 16px", backgroundColor: topic.status === "needs-attention" ? "rgba(220,53,69,0.04)" : "rgba(122,155,118,0.06)", borderRadius: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
                          {t("analysis.insights.recommendedAction")}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>
                          {getTopicRecommendation(topic)}
                        </div>
                      </div>
                      <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(92,30,38,0.55)" }}>
                          {Math.round(topic.share * 100)}% {t("analysis.insights.discussionVolume")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 40, background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`, padding: "40px 48px", borderRadius: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
              D.I.Y.A {t("analysis.footer.badge")}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginBottom: 6 }}>
              {t("analysis.footer.title", { count: attentionTopics.length })}
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>
              {t("analysis.footer.subtitle")}
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
