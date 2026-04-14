import { type CSSProperties } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  formatMeetingDate,
  formatMeetingTime,
  ForumIcon,
  inputRowStyle,
  memberCount,
  palette,
  primarySageButtonStyle,
  type StudentStudyGroupsOutletContext,
  UsersIcon,
} from "./studyGroupsShared";

export function StudentStudyGroups() {
  const navigate = useNavigate();
  const {
    studyGroups,
    groupNameDraft,
    setGroupNameDraft,
    openNewGroupModal,
    hoveredId,
    setHoveredId,
  } = useOutletContext<StudentStudyGroupsOutletContext>();

  const adminCount = studyGroups.filter((g) => g.role === "admin").length;

  return (
    <>
      <div
        style={{
          background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`,
          padding: "64px 72px 58px",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "rgba(255,255,255,0.55)",
            textTransform: "uppercase",
            letterSpacing: 2,
            marginBottom: 18,
          }}
        >
          Student Portal
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: -2.5,
            lineHeight: 1,
            marginBottom: 14,
          }}
        >
          Your Study Groups
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: "rgba(255,255,255,0.7)",
            margin: "0 auto 56px",
            maxWidth: 720,
            lineHeight: 1.45,
            textAlign: "center",
          }}
        >
          Create groups, invite classmates, and collaborate outside your courses.
        </div>

        <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
          {[
            { label: "Study groups", value: studyGroups.length, color: "#fff" },
            { label: "Groups you run", value: adminCount, color: "rgba(255,255,255,0.9)" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                paddingRight: i < 2 ? 40 : 0,
                marginRight: i < 2 ? 40 : 0,
                borderRight: i < 2 ? "1px solid rgba(255,255,255,0.2)" : "none",
              }}
            >
              <div
                style={{
                  fontSize: 54,
                  fontWeight: 900,
                  color: stat.color,
                  letterSpacing: -1.5,
                  lineHeight: 1,
                  marginBottom: 10,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.55)",
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

      <div style={{ padding: "52px 72px 64px" }}>
        <div
          style={{
            width: "min(720px, 100%)",
            margin: "0 auto 44px",
            backgroundColor: "#fff",
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ height: 6, backgroundColor: palette.sage }} />
          <div style={{ padding: "32px 36px 36px" }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: palette.darkest,
                letterSpacing: -0.5,
                marginBottom: 22,
              }}
            >
              Create a study group
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "stretch", marginBottom: 18 }}>
              <input
                type="text"
                value={groupNameDraft}
                onChange={(e) => setGroupNameDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && openNewGroupModal()}
                placeholder="Enter a group name…"
                aria-label="New study group name"
                style={inputRowStyle}
              />
              <button type="button" onClick={openNewGroupModal} style={primarySageButtonStyle}>
                Create
              </button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(92,30,38,0.5)", lineHeight: 1.5 }}>
              Next, you&apos;ll propose a meeting time, date, duration, and location for the group (like an office hours
              request), then add invites.
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "rgba(92,30,38,0.55)",
            marginBottom: 26,
          }}
        >
          {studyGroups.length === 0
            ? "You have not created a study group yet."
            : `${studyGroups.length} study group${studyGroups.length === 1 ? "" : "s"} — click a group to open its page.`}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 24,
            alignItems: "stretch",
          }}
        >
          {studyGroups.map((g) => {
            const isHovered = hoveredId === g.id;
            const isAdmin = g.role === "admin";
            const cardShellStyle: CSSProperties = {
              textAlign: "left",
              backgroundColor: "#fff",
              border: isHovered ? `1px solid ${palette.crimson}` : "1px solid rgba(214,214,214,0.4)",
              borderRadius: 22,
              padding: "26px 28px",
              cursor: "pointer",
              boxShadow: isHovered ? "0 12px 36px rgba(0,0,0,0.16)" : "0 2px 24px rgba(0,0,0,0.06)",
              transform: isHovered ? "translateY(-2px)" : "translateY(0px)",
              transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
              overflow: "hidden",
              position: "relative",
              width: "100%",
              boxSizing: "border-box",
            };

            const cardInner = (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    backgroundColor: palette.crimson,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      letterSpacing: -0.2,
                      color: palette.darkest,
                      lineHeight: 1.3,
                      flex: 1,
                    }}
                  >
                    {g.name}
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      padding: "5px 10px",
                      borderRadius: 8,
                      backgroundColor: isAdmin ? "rgba(122,155,118,0.2)" : "rgba(92,30,38,0.1)",
                      color: isAdmin ? palette.sage : palette.deepBurgundy,
                    }}
                  >
                    {isAdmin ? "Admin" : "Member"}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "rgba(92,30,38,0.55)",
                    marginBottom: 12,
                    lineHeight: 1.45,
                  }}
                >
                  {formatMeetingDate(g.proposedMeeting.date)} · {formatMeetingTime(g.proposedMeeting.startTime)} ·{" "}
                  {g.proposedMeeting.duration || "—"} · {g.proposedMeeting.location || "—"}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    color: palette.deepBurgundy,
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 10,
                      backgroundColor: "rgba(122,155,118,0.12)",
                    }}
                  >
                    <UsersIcon color={palette.sage} />
                    <span>{memberCount(g)} members</span>
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 10,
                      backgroundColor: "rgba(92,30,38,0.08)",
                    }}
                  >
                    <ForumIcon color={palette.deepBurgundy} />
                    <span>{g.forumPostsCount} posts</span>
                  </div>
                </div>

                <div style={{ fontSize: 14, fontWeight: 700, color: palette.crimson, lineHeight: 1.4 }}>
                  {isAdmin
                    ? "Open group page for members, invites, poll & chat"
                    : "Open group page to respond to your invite"}
                </div>
              </>
            );

            return (
              <button
                key={g.id}
                type="button"
                onClick={() => navigate(`/study-groups/${g.id}`)}
                onMouseEnter={() => setHoveredId(g.id)}
                onMouseLeave={() => setHoveredId(null)}
                title="Open group"
                style={{
                  ...cardShellStyle,
                  font: "inherit",
                  fontFamily: "inherit",
                }}
              >
                {cardInner}
              </button>
            );
          })}

          {studyGroups.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                backgroundColor: "#fff",
                borderRadius: 22,
                padding: "44px 36px",
                textAlign: "center",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                color: "rgba(92,30,38,0.5)",
                fontSize: 17,
                fontWeight: 600,
              }}
            >
              Enter a name above and click Create to start your first study group.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
