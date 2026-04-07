import { useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

const professors = [
  { id: "prof-a", name: "Prof. A", email: "prof.a@university.edu", department: "Computer Science" },
  { id: "prof-b", name: "Prof. B", email: "prof.b@university.edu", department: "Mathematics" },
  { id: "prof-c", name: "Prof. C", email: "prof.c@university.edu", department: "Physics" },
  { id: "ta-a", name: "TA A", email: "ta.a@university.edu", department: "Computer Science" },
  { id: "ta-b", name: "TA B", email: "ta.b@university.edu", department: "Mathematics" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(39,1,21,0.15)",
  fontSize: 14,
  fontWeight: 500,
  outline: "none",
  boxSizing: "border-box",
  backgroundColor: "#fff",
  color: "#111",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: palette.deepBurgundy,
  marginBottom: 6,
  display: "block",
};

interface PastRequest {
  id: number;
  professorName: string;
  reason: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingType: "online" | "in-person";
  meetingLink?: string;
  status: "pending" | "confirmed" | "declined";
}

const demoPastRequests: PastRequest[] = [
  {
    id: 1,
    professorName: "Prof. A",
    reason: "Need help understanding recursion concepts before the midterm.",
    date: "2026-03-12",
    startTime: "14:00",
    endTime: "14:30",
    meetingType: "online",
    meetingLink: "https://zoom.us/j/123456789",
    status: "confirmed",
  },
  {
    id: 2,
    professorName: "Prof. B",
    reason: "Discuss final project proposal ideas.",
    date: "2026-03-07",
    startTime: "10:00",
    endTime: "10:30",
    meetingType: "in-person",
    status: "pending",
  },
];

export function StudentOfficeHours() {
  const navigate = useNavigate();
  void navigate; // used by sidebar

  const [selectedProf, setSelectedProf] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [meetingType, setMeetingType] = useState<"online" | "in-person" | "">("");
  const [meetingLink, setMeetingLink] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pastRequests, setPastRequests] = useState<PastRequest[]>(demoPastRequests);

  const canSubmit = selectedProf && reason.trim() && date && startTime && endTime && meetingType;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const prof = professors.find((p) => p.id === selectedProf);
    const newReq: PastRequest = {
      id: Date.now(),
      professorName: prof?.name ?? selectedProf,
      reason,
      date,
      startTime,
      endTime,
      meetingType: meetingType as "online" | "in-person",
      meetingLink: meetingType === "online" ? meetingLink : undefined,
      status: "pending",
    };
    setPastRequests((prev) => [newReq, ...prev]);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSelectedProf("");
    setReason("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setMeetingType("");
    setMeetingLink("");
    setSubmitted(false);
  };

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "rgba(39,1,21,0.06)", text: "rgba(39,1,21,0.55)", label: "Pending" },
    confirmed: { bg: "rgba(122,155,118,0.12)", text: palette.sage, label: "Confirmed" },
    declined: { bg: "rgba(162,34,55,0.08)", text: palette.crimson, label: "Declined" },
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
      }}
    >
      <Sidebar activeId="request" />

      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Hero Section */}
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`,
            padding: "56px 64px 52px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            Student Portal
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: -2.5,
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            Office Hours
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 52,
            }}
          >
            Request a meeting with your professor or teaching assistant.
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {[
              { label: "Total Requests", value: pastRequests.length, color: "#fff" },
              { label: "Confirmed", value: pastRequests.filter(r => r.status === "confirmed").length, color: "rgba(255,255,255,0.9)" },
              { label: "Pending", value: pastRequests.filter(r => r.status === "pending").length, color: "rgba(255,255,255,0.9)" },
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
                <div style={{ fontSize: 48, fontWeight: 900, color: stat.color, letterSpacing: -1.5, lineHeight: 1, marginBottom: 8 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: "48px 64px 56px" }}>
          {/* Request Form */}
          {!submitted ? (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                maxWidth: 660,
                marginBottom: 40,
              }}
            >
              <div style={{ height: 5, backgroundColor: palette.crimson }} />
              <div style={{ padding: "28px 32px 32px" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.darkest, letterSpacing: -0.5, marginBottom: 4 }}>
                  New Request
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(92,30,38,0.55)", marginBottom: 24 }}>
                  Fill out the form below to request a meeting.
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Requesting Professor or TA? *</label>
                  <select
                    value={selectedProf}
                    onChange={(e) => setSelectedProf(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="">Select a professor or TA</option>
                    {professors.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>What is this request for? *</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe why you'd like to meet..."
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Proposed Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Start Time *</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>End Time *</label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="">Select duration</option>
                      <option value="15 min">15 min</option>
                      <option value="30 min">30 min</option>
                      <option value="45 min">45 min</option>
                      <option value="60 min">60 min</option>
                      <option value="60+ min">60+ min</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Meeting Type *</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {(["online", "in-person"] as const).map((type) => {
                      const isSelected = meetingType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setMeetingType(type)}
                          style={{
                            flex: 1,
                            padding: "12px 16px",
                            borderRadius: 10,
                            border: isSelected ? `2px solid ${palette.sage}` : "1px solid rgba(39,1,21,0.15)",
                            backgroundColor: isSelected ? "rgba(122,155,118,0.08)" : "#fff",
                            color: isSelected ? palette.sage : palette.deepBurgundy,
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            {type === "online" ? (
                              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            ) : (
                              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            )}
                          </svg>
                          {type === "online" ? "Online Meeting" : "In-Person Meeting"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 12,
                    border: "none",
                    backgroundColor: canSubmit ? palette.crimson : "rgba(162,34,55,0.25)",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    marginTop: 6,
                  }}
                >
                  Submit Request
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                maxWidth: 660,
                marginBottom: 40,
                textAlign: "center",
              }}
            >
              <div style={{ height: 5, backgroundColor: palette.sage }} />
              <div style={{ padding: "32px 32px" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    backgroundColor: "rgba(122,155,118,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke={palette.sage} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 8 }}>
                  Request Submitted!
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(92,30,38,0.6)", lineHeight: 1.5, marginBottom: 6 }}>
                  Your office hours request has been sent. You'll receive an email confirmation once your professor responds.
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: palette.sage, marginBottom: 20 }}>
                  Check your email at <span style={{ fontWeight: 700 }}>student@university.edu</span> for updates.
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    padding: "12px 28px",
                    borderRadius: 10,
                    border: "none",
                    backgroundColor: palette.crimson,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          )}

          {/* Past requests */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: palette.darkest,
              letterSpacing: -1,
              marginBottom: 24,
            }}
          >
            Your Requests
          </div>

          {pastRequests.length === 0 && (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: "24px 28px",
                boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                color: "rgba(92,30,38,0.5)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              No requests yet. Submit your first one above.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {pastRequests.map((req) => {
              const sc = statusColors[req.status];
              return (
                <div
                  key={req.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ height: 4, backgroundColor: req.status === "confirmed" ? palette.sage : req.status === "declined" ? palette.crimson : "rgba(39,1,21,0.15)" }} />
                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 999,
                            backgroundColor: "rgba(39,1,21,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M16 11a4 4 0 10-8 0 4 4 0 008 0z" stroke={palette.deepBurgundy} strokeWidth="2" />
                            <path d="M4 20.5c1.6-3.2 4.5-5 8-5s6.4 1.8 8 5" stroke={palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: palette.deepBurgundy }}>
                            {req.professorName}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.5)" }}>
                            {new Date(req.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            {" · "}
                            {req.startTime} – {req.endTime}
                            {" · "}
                            {req.meetingType === "online" ? "Online" : "In-Person"}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "4px 12px",
                          borderRadius: 8,
                          backgroundColor: sc.bg,
                          color: sc.text,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {sc.label}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        backgroundColor: "rgba(39,1,21,0.03)",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "rgba(17,17,17,0.7)",
                        lineHeight: 1.5,
                      }}
                    >
                      {req.reason}
                    </div>

                    {req.meetingType === "online" && req.meetingLink && (
                      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: palette.sage }}>
                        Meeting link: {req.meetingLink}
                      </div>
                    )}
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
