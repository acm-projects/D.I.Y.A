import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { formatTimeRangeToCST } from "../../utils/formatTime";
import { useTranslation } from "react-i18next";

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

function formatCalendarStamp(date: string, time: string) {
  const [hourText, minuteText] = time.split(":");
  const hours = Number(hourText);
  const minutes = Number(minuteText ?? "0");

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return `${date.replace(/-/g, "")}T${`${hours}`.padStart(2, "0")}${`${minutes}`.padStart(2, "0")}00`;
}

function buildGoogleCalendarUrl(request: AppointmentRequest) {
  const startStamp = formatCalendarStamp(request.requestedDate, request.requestedTime);
  const endStamp = formatCalendarStamp(request.requestedDate, request.requestedEndTime || request.requestedTime);

  if (!startStamp || !endStamp) {
    return "https://calendar.google.com/calendar/render?action=TEMPLATE";
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Office Hours — ${request.studentName || "Student"}`,
    dates: `${startStamp}/${endStamp}`,
    details: request.reason,
    add: request.email,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookUrl(request: AppointmentRequest) {
  const startISO = `${request.requestedDate}T${request.requestedTime}:00`;
  const endISO = `${request.requestedDate}T${request.requestedEndTime || request.requestedTime}:00`;

  const params = new URLSearchParams({
    subject: `Office Hours — ${request.studentName || "Student"}`,
    startdt: startISO,
    enddt: endISO,
    body: request.reason,
    to: request.email,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function ProfessorRequestsPage() {
  const { t } = useTranslation();
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
          studentName: request.studentName || t("sidebar.defaultName"),
          email: request.studentEmail || t("professorRequests.card.fallbackEmail"),
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
          setError(err instanceof Error ? err.message : t("professorRequests.errors.loadFailed"));
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
      setError(err instanceof Error ? err.message : t("professorRequests.errors.approveFailed"));
    }
  };

  const handleRejectAppointment = async (id: string) => {
    try {
      setError(null);
      await updateRequest(id, { status: "declined" });
      setAppointmentRequests((currentRequests) => currentRequests.filter((request) => request.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("professorRequests.errors.rejectFailed"));
    }
  };

  const handleReschedule = async (id: string) => {
    if (!rescheduleDate || !rescheduleTime) {
      setError(t("professorRequests.reschedulePanel.validationError"));
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
      setError(err instanceof Error ? err.message : t("professorRequests.errors.rescheduleFailed"));
    }
  };

  const pendingCount = useMemo(() => appointmentRequests.length, [appointmentRequests]);

  const { thisWeekCount, nextWeekCount } = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfNextWeek = new Date(startOfWeek);
    startOfNextWeek.setDate(startOfWeek.getDate() + 7);

    const startOfWeekAfterNext = new Date(startOfNextWeek);
    startOfWeekAfterNext.setDate(startOfNextWeek.getDate() + 7);

    return appointmentRequests.reduce(
      (counts, request) => {
        const requestDate = new Date(request.requestedDate);
        if (Number.isNaN(requestDate.getTime())) {
          return counts;
        }

        requestDate.setHours(0, 0, 0, 0);

        if (requestDate >= startOfWeek && requestDate < startOfNextWeek) {
          counts.thisWeekCount += 1;
        } else if (requestDate >= startOfNextWeek && requestDate < startOfWeekAfterNext) {
          counts.nextWeekCount += 1;
        }

        return counts;
      },
      { thisWeekCount: 0, nextWeekCount: 0 },
    );
  }, [appointmentRequests]);

  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const minutes = Math.max(1, Math.floor(diffMs / 60000));
    if (minutes < 60) return t("professorRequests.timeAgo.minute", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("professorRequests.timeAgo.hour", { count: hours });
    const days = Math.floor(hours / 24);
    return t("professorRequests.timeAgo.day", { count: days });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: palette.cream, fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif", display: "flex" }}>
      <aside style={{ width: 220, background: "linear-gradient(160deg, #4a1850 0%, #2d0f38 50%, #1c0a24 100%)", padding: "0 10px 16px", boxSizing: "border-box", position: "sticky", top: 0, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.05)", boxShadow: "4px 0 32px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 8px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #a22237 0%, #5C1E26 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 10px rgba(162,34,55,0.45)" }}>
            <img src="/logo.png" alt="logo" style={{ height: 22, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontFamily: "Italiana, serif", fontSize: 22, letterSpacing: 2.5, color: "#fff", lineHeight: 1 }}>D.I.Y.A</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 3 }}>{t("professorSidebar.appSubtitle")}</div>
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", letterSpacing: 1.5, textTransform: "uppercase", padding: "0 8px", marginBottom: 8 }}>{t("professorSidebar.navigationLabel")}</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button type="button" onClick={() => navigate("/professor/forum")} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "none", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("professorRequests.nav.backToForum")}</button>
          {[
            { id: "calendar", label: t("professorSidebar.nav.calendar"), path: "/professor/calendar" },
            { id: "analysis", label: t("professorSidebar.nav.analysis"), path: "/professor/analysis" },
            { id: "requests", label: t("professorSidebar.nav.requests"), path: "/professor/requests" },
            { id: "editgroup", label: t("professorSidebar.nav.editGroup"), path: "/professor/edit-group" },
          ].map((item) => {
            const isActive = item.id === "requests";
            return <button key={item.id} type="button" onClick={() => navigate(item.path)} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "none", backgroundColor: isActive ? "rgba(255,255,255,0.1)" : "transparent", color: isActive ? "#fff" : "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: isActive ? 700 : 600, cursor: "pointer" }}>{item.label}</button>;
          })}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", margin: "12px 0 10px 0" }} />
        <button type="button" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t("professorRequests.nav.signOut")}</button>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>
        <div style={{ backgroundColor: "#fff", padding: "56px 64px 52px", borderBottom: "1px solid rgba(214,214,214,0.2)" }}>
          <div style={{ maxWidth: 1200 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>{t("professorRequests.header.eyebrow")}</div>
            <div style={{ fontSize: 64, fontWeight: 900, color: palette.darkest, letterSpacing: -2.5, lineHeight: 1, marginBottom: 12 }}>{t("professorRequests.header.title")}</div>
            <div style={{ fontSize: 20, fontWeight: 400, color: "rgba(92,30,38,0.55)", marginBottom: 52 }}>{t("professorRequests.header.subtitle")}</div>

            <div style={{ display: "flex", gap: 0, alignItems: "stretch", flexWrap: "wrap" }}>
              {[
                { label: t("professorRequests.stats.pendingRequests"), value: pendingCount, color: palette.crimson },
                { label: t("professorRequests.stats.thisWeek"), value: thisWeekCount, color: palette.sage },
                { label: t("professorRequests.stats.nextWeek"), value: nextWeekCount, color: palette.deepBurgundy },
              ].map((stat, i) => (
                <div key={stat.label} style={{ flex: "1 1 220px", minWidth: 180, paddingRight: i < 2 ? 40 : 0, marginRight: i < 2 ? 40 : 0, borderRight: i < 2 ? "1px solid rgba(214,214,214,0.5)" : "none" }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: stat.color, letterSpacing: -1.5, lineHeight: 1, marginBottom: 8 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "48px 64px" }}>
          <div style={{ maxWidth: 1200 }}>

          {error && (
            <div style={{ marginBottom: 20, padding: "14px 16px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid rgba(220,53,69,0.2)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", color: palette.crimson, fontSize: 13, fontWeight: 700 }}>
              {error}
            </div>
          )}

          <div>
            <div style={{ fontSize: 32, fontWeight: 900, color: palette.darkest, letterSpacing: -1, marginBottom: 28 }}>{t("professorRequests.list.heading")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {isLoading && (
                <div style={{ backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.3)", borderRadius: 14, padding: "20px 24px", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: palette.deepBurgundy, fontSize: 14, fontWeight: 700 }}>
                  {t("professorRequests.list.loading")}
                </div>
              )}

              {!isLoading && appointmentRequests.length === 0 && (
                <div style={{ backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.3)", borderRadius: 14, padding: "20px 24px", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: "rgba(92,30,38,0.55)", fontSize: 13, fontWeight: 700 }}>
                  {t("professorRequests.list.empty")}
                </div>
              )}

              {appointmentRequests.map((req) => (
                <div key={req.id}>
                  <div style={{ backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 24px rgba(0,0,0,0.06)" }}>
                    <div style={{ height: 4, background: `linear-gradient(90deg, ${palette.crimson}, ${palette.sage})` }} />
                    <div style={{ padding: "24px 32px", display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
                            {(req.studentName || t("sidebar.defaultName")).charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: 17, fontWeight: 800, color: palette.darkest, letterSpacing: -0.3 }}>{req.studentName || t("sidebar.defaultName")}</div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(92,30,38,0.5)" }}>{req.email}</div>
                          </div>
                        </div>
                        {req.groupName && (
                          <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999, backgroundColor: "rgba(122,155,118,0.12)", color: palette.sage, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                            {req.groupName}
                          </div>
                        )}
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", backgroundColor: "rgba(162,34,55,0.06)", borderRadius: 10, marginBottom: 12 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="4" width="18" height="18" rx="2" stroke={palette.crimson} strokeWidth="2" />
                            <path d="M16 2v4M8 2v4M3 10h18" stroke={palette.crimson} strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: 14, fontWeight: 700, color: palette.crimson }}>
                            {new Date(req.requestedDate).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })} · {formatTimeRangeToCST(req.requestedTime, req.requestedEndTime)}
                          </span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: palette.deepBurgundy, lineHeight: 1.6, fontStyle: "italic", marginBottom: 8 }}>&quot;{req.reason}&quot;</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(92,30,38,0.4)" }}>{t("professorRequests.card.requestedAgo")} {formatTimeAgo(req.timestamp)}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
                        <button onClick={() => void handleApproveAppointment(req.id)} style={{ padding: "11px 16px", background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`, color: "white", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(122,155,118,0.3)" }}>✓ {t("professorRequests.card.accept")}</button>
                        <a href={buildGoogleCalendarUrl(req)} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 12px", borderRadius: 12, backgroundColor: "rgba(66,133,244,0.08)", border: "1.5px solid rgba(66,133,244,0.25)", color: "#4285F4", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                          {t("professorRequests.card.googleCal")}
                        </a>
                        <a href={buildOutlookUrl(req)} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 12px", borderRadius: 12, backgroundColor: "rgba(0,120,212,0.07)", border: "1.5px solid rgba(0,120,212,0.22)", color: "#0078D4", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                          {t("professorRequests.card.outlook")}
                        </a>
                        <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 12px", borderRadius: 12, backgroundColor: "rgba(52,168,83,0.08)", border: "1.5px solid rgba(52,168,83,0.25)", color: "#34A853", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          {t("professorRequests.card.meet")}
                        </a>
                        <button onClick={() => setShowReschedule(showReschedule === req.id ? null : req.id)} style={{ padding: "9px 16px", background: "transparent", color: palette.crimson, border: "1.5px solid rgba(162,34,55,0.3)", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>🔄 {t("professorRequests.card.reschedule")}</button>
                        <button onClick={() => void handleRejectAppointment(req.id)} style={{ padding: "9px 16px", background: "transparent", color: "#DC3545", border: "1.5px solid rgba(220,53,69,0.35)", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>✗ {t("professorRequests.card.reject")}</button>
                      </div>
                    </div>
                  </div>

                  {showReschedule === req.id && (
                    <div style={{ marginTop: 12, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
                      <div style={{ height: 4, backgroundColor: palette.crimson }} />
                      <div style={{ padding: "20px 32px" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: palette.darkest, marginBottom: 16 }}>{t("professorRequests.reschedulePanel.title")}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 14, alignItems: "end" }}>
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("professorRequests.reschedulePanel.dateLabel")}</label>
                            <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid rgba(214,214,214,0.5)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("professorRequests.reschedulePanel.timeLabel")}</label>
                            <input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid rgba(214,214,214,0.5)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                          </div>
                          <button onClick={() => void handleReschedule(req.id)} style={{ padding: "10px 20px", background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("professorRequests.reschedulePanel.sendProposal")}</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>

        <div style={{ background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`, padding: "40px 64px" }}>
          <div style={{ maxWidth: 1200 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{t("professorRequests.footer.eyebrow")}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginBottom: 6 }}>{t("professorRequests.footer.waiting", { count: appointmentRequests.length })}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>{t("professorRequests.footer.description")}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
