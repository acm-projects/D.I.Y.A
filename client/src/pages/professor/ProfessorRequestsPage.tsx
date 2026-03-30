import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { formatTimeRangeToCST } from "../../utils/formatTime";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

const OFFICE_HOURS_API_BASE_URL = "/api/office-hours";

interface AppointmentRequest {
  id: string;
  studentName?: string;
  email: string;
  groupName?: string;
  requestedDate: string;
  requestedTime: string;
  requestedEndTime?: string;
  reason: string;
  timestamp: number;
}

export function ProfessorRequestsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth0();
  const [showReschedule, setShowReschedule] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      if (!user?.sub) {
        if (isMounted) {
          setAppointmentRequests([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ status: "pending" });
        params.set("professorId", user.sub);

        const response = await fetch(`${OFFICE_HOURS_API_BASE_URL}?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to load pending office hour requests.");
        }

        const requests = (await response.json()) as Array<{
          id: string;
          studentName?: string;
          studentEmail?: string;
          groupName?: string;
          requestedDate?: string;
          date: string;
          startTime: string;
          endTime?: string;
          reason: string;
          createdAt?: { _seconds?: number; seconds?: number } | string;
        }>;

        const normalizedRequests = requests.map((request) => ({
          id: request.id,
          studentName: request.studentName || "Student",
          email: request.studentEmail || "No email provided",
          groupName: request.groupName,
          requestedDate: request.requestedDate || request.date,
          requestedTime: request.startTime,
          requestedEndTime: request.endTime,
          reason: request.reason,
          timestamp: typeof request.createdAt === "string"
            ? Date.parse(request.createdAt)
            : ((request.createdAt?._seconds ?? request.createdAt?.seconds ?? Date.now() / 1000) * 1000),
        }));

        if (isMounted) {
          setAppointmentRequests(normalizedRequests);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load office hour requests.");
          setAppointmentRequests([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadRequests();

    return () => {
      isMounted = false;
    };
  }, [user?.sub]);

  const updateRequest = async (id: string, updates: Record<string, string>) => {
    const response = await fetch(`${OFFICE_HOURS_API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to update office hour request.");
    }
  };

  const handleApproveAppointment = async (id: string) => {
    try {
      setError(null);
      await updateRequest(id, { status: "confirmed" });
      setAppointmentRequests((currentRequests) => currentRequests.filter((request) => request.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve appointment.");
    }
  };

  const handleRejectAppointment = async (id: string) => {
    try {
      setError(null);
      await updateRequest(id, { status: "declined" });
      setAppointmentRequests((currentRequests) => currentRequests.filter((request) => request.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject appointment.");
    }
  };

  const handleReschedule = async (id: string) => {
    if (!rescheduleDate || !rescheduleTime) {
      setError("Please select a date and time.");
      return;
    }

    try {
      setError(null);
      await updateRequest(id, {
        date: rescheduleDate,
        startTime: rescheduleTime,
      });
      setAppointmentRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === id
            ? { ...request, requestedDate: rescheduleDate, requestedTime: rescheduleTime }
            : request,
        ),
      );
      setShowReschedule(null);
      setRescheduleDate("");
      setRescheduleTime("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reschedule appointment.");
    }
  };

  const pendingCount = useMemo(() => appointmentRequests.length, [appointmentRequests]);

  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const minutes = Math.max(1, Math.floor(diffMs / 60000));
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: palette.cream, fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif", display: "flex" }}>
      <aside style={{ width: 180, background: `linear-gradient(180deg, #3d1542 0%, ${palette.darkest} 100%)`, padding: 12, boxSizing: "border-box", position: "sticky", top: 0, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "Italiana, serif", fontSize: 30, letterSpacing: 1.5, color: "#fff", padding: "6px 4px 10px 4px" }}>
          <img src="/logo.png" alt="logo" style={{ height: 48, objectFit: "contain", marginBottom: 4 }} />
          <span style={{ lineHeight: 1 }}>D.I.Y.A</span>
        </div>
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.25)", margin: "0 0 10px 0" }} />
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button type="button" onClick={() => navigate("/professor/forum")} style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 10, border: "none", backgroundColor: "transparent", color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Back to Forum</button>
          {[
            { id: "calendar", label: "Calendar", path: "/professor/calendar" },
            { id: "analysis", label: "Analysis", path: "/professor/analysis" },
            { id: "requests", label: "Requests", path: "/professor/requests" },
            { id: "editgroup", label: "Edit Group", path: "/professor/edit-group" },
          ].map((item) => {
            const isActive = item.id === "requests";
            return <button key={item.id} type="button" onClick={() => navigate(item.path)} style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 10, border: "none", backgroundColor: isActive ? "rgba(255,255,255,0.88)" : "transparent", color: isActive ? palette.darkest : "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: isActive ? 800 : 600, cursor: "pointer" }}>{item.label}</button>;
          })}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.2)", margin: "10px 0 8px 0" }} />
        <button type="button" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Sign out</button>
      </aside>

      <main style={{ flex: 1, padding: "32px 36px 56px 24px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1200 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ color: palette.crimson, fontSize: 44, fontWeight: 850, letterSpacing: -1, lineHeight: 1.1 }}>Student Appointments</div>
            <div style={{ marginTop: 8, color: palette.deepBurgundy, fontSize: 16, fontWeight: 600 }}>Review and manage student meeting requests</div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ padding: "20px 24px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid rgba(214,214,214,0.4)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "inline-block" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Pending Appointment Requests</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: palette.crimson, lineHeight: 1 }}>{pendingCount}</div>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 20, padding: "14px 16px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid rgba(220,53,69,0.2)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", color: palette.crimson, fontSize: 13, fontWeight: 700 }}>
              {error}
            </div>
          )}

          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: palette.crimson, marginBottom: 16 }}>Appointment Requests</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {isLoading && (
                <div style={{ backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.3)", borderRadius: 14, padding: "20px 24px", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: palette.deepBurgundy, fontSize: 14, fontWeight: 700 }}>
                  Loading appointment requests...
                </div>
              )}

              {!isLoading && appointmentRequests.length === 0 && (
                <div style={{ backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.3)", borderRadius: 14, padding: "20px 24px", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: "rgba(92,30,38,0.55)", fontSize: 13, fontWeight: 700 }}>
                  No pending office hour requests right now.
                </div>
              )}

              {appointmentRequests.map((req) => (
                <div key={req.id}>
                  <div style={{ backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.4)", borderRadius: 14, padding: "20px 24px", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 4 }}>{req.studentName || "Student"}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.6)", marginBottom: req.groupName ? 6 : 8 }}>{req.email}</div>
                      {req.groupName && (
                        <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999, backgroundColor: "rgba(122,155,118,0.12)", color: palette.sage, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                          {req.groupName}
                        </div>
                      )}
                      <div style={{ fontSize: 14, fontWeight: 600, color: palette.crimson, marginBottom: 6 }}>📅 {new Date(req.requestedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at {formatTimeRangeToCST(req.requestedTime, req.requestedEndTime)}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: palette.deepBurgundy, fontStyle: "italic" }}>&quot;{req.reason}&quot;</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.5)", marginTop: 8 }}>Requested {formatTimeAgo(req.timestamp)}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button onClick={() => void handleApproveAppointment(req.id)} style={{ padding: "10px 18px", background: palette.sage, color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>✓ Accept</button>
                      <button onClick={() => void handleRejectAppointment(req.id)} style={{ padding: "10px 18px", background: "transparent", color: "#DC3545", border: "1px solid #DC3545", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>✗ Reject</button>
                      <button onClick={() => setShowReschedule(showReschedule === req.id ? null : req.id)} style={{ padding: "10px 18px", background: "transparent", color: palette.crimson, border: `1px solid ${palette.crimson}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>🔄 Reschedule</button>
                    </div>
                  </div>

                  {showReschedule === req.id && (
                    <div style={{ marginTop: 12, backgroundColor: "#fff", border: `2px solid ${palette.crimson}`, borderRadius: 14, padding: 20, boxShadow: "0 4px 18px rgba(0,0,0,0.08)" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: palette.crimson, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Propose New Time</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 4 }}>Date</label>
                          <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 6, fontSize: 13, fontFamily: "inherit" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 4 }}>Time</label>
                          <input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 6, fontSize: 13, fontFamily: "inherit" }} />
                        </div>
                        <button onClick={() => void handleReschedule(req.id)} style={{ padding: "8px 16px", background: palette.sage, color: "white", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Send Proposal</button>
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
