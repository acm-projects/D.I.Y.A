import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

interface AppointmentRequest {
  id: number;
  studentName: string;
  email: string;
  requestedDate: string;
  requestedTime: string;
  reason: string;
  timestamp: string;
}

export function RequestsPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();
  const [showReschedule, setShowReschedule] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([
    {
      id: 1,
      studentName: "Sarah Johnson",
      email: "sarah.j@university.edu",
      requestedDate: "2026-03-20",
      requestedTime: "2:00 PM",
      reason: "Discuss final project requirements and timeline",
      timestamp: "1 hour ago",
    },
    {
      id: 2,
      studentName: "Michael Chen",
      email: "m.chen@university.edu",
      requestedDate: "2026-03-22",
      requestedTime: "10:00 AM",
      reason: "Questions about the midterm exam material",
      timestamp: "3 hours ago",
    },
    {
      id: 3,
      studentName: "Emily Rodriguez",
      email: "emily.r@university.edu",
      requestedDate: "2026-03-21",
      requestedTime: "3:30 PM",
      reason: "Need help understanding recursion concepts from last lecture",
      timestamp: "5 hours ago",
    },
    {
      id: 4,
      studentName: "David Kim",
      email: "david.kim@university.edu",
      requestedDate: "2026-03-23",
      requestedTime: "11:00 AM",
      reason: "Want to discuss career opportunities in computer science",
      timestamp: "8 hours ago",
    },
    {
      id: 5,
      studentName: "Jessica Lee",
      email: "jessica.l@university.edu",
      requestedDate: "2026-03-24",
      requestedTime: "1:00 PM",
      reason: "Need clarification on assignment 3 requirements",
      timestamp: "12 hours ago",
    },
    {
      id: 6,
      studentName: "Ryan Martinez",
      email: "ryan.m@university.edu",
      requestedDate: "2026-03-25",
      requestedTime: "4:00 PM",
      reason: "Seeking advice on internship applications and resume review",
      timestamp: "1 day ago",
    },
    {
      id: 7,
      studentName: "Olivia Brown",
      email: "olivia.b@university.edu",
      requestedDate: "2026-03-26",
      requestedTime: "9:30 AM",
      reason: "Struggling with data structures concepts, need extra help",
      timestamp: "1 day ago",
    },
    {
      id: 8,
      studentName: "James Wilson",
      email: "j.wilson@university.edu",
      requestedDate: "2026-03-27",
      requestedTime: "2:30 PM",
      reason: "Want to discuss research opportunities in AI and machine learning",
      timestamp: "2 days ago",
    },
  ]);

  const handleApproveAppointment = (id: number) => {
    setAppointmentRequests(appointmentRequests.filter(req => req.id !== id));
    alert("Appointment approved! Confirmation sent to student.");
  };

  const handleRejectAppointment = (id: number) => {
    setAppointmentRequests(appointmentRequests.filter(req => req.id !== id));
    alert("Appointment rejected.");
  };

  const handleReschedule = (id: number) => {
    if (!rescheduleDate || !rescheduleTime) {
      alert("Please select a date and time");
      return;
    }
    setAppointmentRequests(appointmentRequests.filter(req => req.id !== id));
    alert(`Appointment rescheduled to ${rescheduleDate} at ${rescheduleTime}`);
    setShowReschedule(null);
    setRescheduleDate("");
    setRescheduleTime("");
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
          {[
            { id: "calendar", label: "Calendar", path: `/calendar/${groupName}` },
            { id: "analysis", label: "Analysis", path: `/analysis/${groupName}` },
            { id: "requests", label: "Requests", path: `/requests/${groupName}` },
            { id: "editgroup", label: "Edit Group", path: `/edit-group/${groupName}` },
          ].map((item) => {
            const isActive = item.id === "requests";
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
      <main style={{ flex: 1, padding: "32px 36px 56px 24px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1200 }}>
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
              Student Appointments
            </div>
            <div
              style={{
                marginTop: 8,
                color: palette.deepBurgundy,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Review and manage student meeting requests
            </div>
          </div>

          {/* Stats Card */}
          <div
            style={{
              marginBottom: 32,
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                backgroundColor: "#fff",
                borderRadius: 12,
                border: "1px solid rgba(214,214,214,0.4)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                display: "inline-block",
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
                Pending Appointment Requests
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: palette.crimson,
                  lineHeight: 1,
                }}
              >
                {appointmentRequests.length}
              </div>
            </div>
          </div>

          {/* Appointment Requests Section */}
          <div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: palette.crimson,
                marginBottom: 16,
              }}
            >
              Appointment Requests
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {appointmentRequests.map((req) => (
                <div key={req.id}>
                  <div
                    style={{
                      backgroundColor: "#fff",
                      border: "1px solid rgba(214,214,214,0.4)",
                      borderRadius: 14,
                      padding: "20px 24px",
                      boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 20,
                      alignItems: "center",
                    }}
                  >
                    {/* Left: Student Info */}
                    <div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: palette.deepBurgundy,
                          marginBottom: 4,
                        }}
                      >
                        {req.studentName}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "rgba(92,30,38,0.6)",
                          marginBottom: 8,
                        }}
                      >
                        {req.email}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: palette.crimson,
                          marginBottom: 6,
                        }}
                      >
                        📅 {new Date(req.requestedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at {req.requestedTime}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: palette.deepBurgundy,
                          fontStyle: "italic",
                        }}
                      >
                        "{req.reason}"
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "rgba(92,30,38,0.5)",
                          marginTop: 8,
                        }}
                      >
                        Requested {req.timestamp}
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button
                        onClick={() => handleApproveAppointment(req.id)}
                        style={{
                          padding: "10px 18px",
                          background: palette.sage,
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => handleRejectAppointment(req.id)}
                        style={{
                          padding: "10px 18px",
                          background: "transparent",
                          color: "#DC3545",
                          border: "1px solid #DC3545",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✗ Reject
                      </button>
                      <button
                        onClick={() => setShowReschedule(showReschedule === req.id ? null : req.id)}
                        style={{
                          padding: "10px 18px",
                          background: "transparent",
                          color: palette.crimson,
                          border: "1px solid " + palette.crimson,
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        🔄 Reschedule
                      </button>
                    </div>
                  </div>

                  {/* Reschedule Section */}
                  {showReschedule === req.id && (
                    <div
                      style={{
                        marginTop: 12,
                        backgroundColor: "#fff",
                        border: "2px solid " + palette.crimson,
                        borderRadius: 14,
                        padding: "20px",
                        boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: palette.crimson,
                          marginBottom: 12,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Propose New Time
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: 11,
                              fontWeight: 700,
                              color: palette.deepBurgundy,
                              marginBottom: 4,
                            }}
                          >
                            Date
                          </label>
                          <input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              border: "1px solid rgba(214,214,214,0.5)",
                              borderRadius: 6,
                              fontSize: 13,
                              fontFamily: "inherit",
                            }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: 11,
                              fontWeight: 700,
                              color: palette.deepBurgundy,
                              marginBottom: 4,
                            }}
                          >
                            Time
                          </label>
                          <input
                            type="time"
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              border: "1px solid rgba(214,214,214,0.5)",
                              borderRadius: 6,
                              fontSize: 13,
                              fontFamily: "inherit",
                            }}
                          />
                        </div>
                        <button
                          onClick={() => handleReschedule(req.id)}
                          style={{
                            padding: "8px 16px",
                            background: palette.sage,
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Send Proposal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}