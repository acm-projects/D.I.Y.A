import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

interface Appointment {
  id: string;
  studentName: string;
  email: string;
  date: string;
  time: string;
  startTimeRaw: string;
  reason: string;
  status: "confirmed" | "pending" | "declined";
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatTimeDisplay(value: string): string {
  const [hourText, minuteText] = value.split(":");
  const hours = Number(hourText);
  const minutes = Number(minuteText ?? "0");

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours}:${`${minutes}`.padStart(2, "0")} ${period}`;
}

function getHourValue(value: string): number | null {
  const [hourText] = value.split(":");
  const hours = Number(hourText);
  return Number.isNaN(hours) ? null : hours;
}

export function ProfessorCalendarPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth0();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAppointments = async () => {
      if (!user?.sub) {
        if (isMounted) {
          setAppointments([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("professorId", user.sub);

        const response = await fetch(`${OFFICE_HOURS_API_BASE_URL}?${params.toString()}`);

        if (!response.ok) {
          throw new Error(t("calendar.errors.loadFailed"));
        }

        const requests = (await response.json()) as Array<{
          id: string;
          studentName?: string;
          studentEmail?: string;
          date: string;
          startTime: string;
          reason: string;
          status?: "pending" | "confirmed" | "declined";
        }>;

        const normalizedAppointments = requests
          .map((request) => ({
            id: request.id,
            studentName: request.studentName || t("calendar.fallbacks.studentName"),
            email: request.studentEmail || t("calendar.fallbacks.noEmail"),
            date: request.date,
            time: formatTimeDisplay(request.startTime),
            startTimeRaw: request.startTime,
            reason: request.reason,
            status: request.status ?? "pending",
          }))
          .sort((a, b) => {
            const aValue = `${a.date}T${a.startTimeRaw}`;
            const bValue = `${b.date}T${b.startTimeRaw}`;
            return aValue.localeCompare(bValue);
          });

        if (isMounted) {
          setAppointments(normalizedAppointments);
          if (normalizedAppointments[0]) {
            setCurrentDate(parseDate(normalizedAppointments[0].date));
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : t("calendar.errors.loadFailed"));
          setAppointments([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAppointments();

    return () => {
      isMounted = false;
    };
  }, [user?.sub]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = t("calendar.monthNames", { returnObjects: true }) as string[];
  const dayNames   = t("calendar.dayNames",   { returnObjects: true }) as string[];
  const confirmedCount = appointments.filter((appointment) => appointment.status === "confirmed").length;
  const pendingCount = appointments.filter((appointment) => appointment.status === "pending").length;
  const declinedCount = appointments.filter((appointment) => appointment.status === "declined").length;

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = formatDateKey(date);
    return appointments.filter((apt) => apt.date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return palette.sage;
      case "pending":
        return "#FFA500";
      case "declined":
        return "#DC3545";
      default:
        return palette.crimson;
    }
  };

  const renderMonthView = () => {
    const days = [];
    const totalSlots = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalSlots; i++) {
      const dayNumber = i - firstDayOfMonth + 1;
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
      const dayAppointments = isCurrentMonth ? getAppointmentsForDate(date) : [];
      const today = new Date();
      const isToday = isCurrentMonth && date.toDateString() === today.toDateString();

      days.push(
        <div
          key={i}
          style={{
            minHeight: 110,
            border: "1px solid rgba(214,214,214,0.25)",
            padding: "10px",
            backgroundColor: isCurrentMonth ? (isToday ? "rgba(162,34,55,0.03)" : "#fff") : "rgba(214,214,214,0.06)",
            cursor: isCurrentMonth ? "pointer" : "default",
          }}
        >
          {isCurrentMonth && (
            <>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: isToday ? 900 : 600,
                  color: isToday ? palette.crimson : palette.deepBurgundy,
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isToday ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      backgroundColor: palette.crimson,
                      color: "white",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {dayNumber}
                  </span>
                ) : dayNumber}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {dayAppointments.slice(0, 2).map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => setSelectedAppointment(apt)}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "4px 8px",
                      backgroundColor: getStatusColor(apt.status),
                      color: "white",
                      borderRadius: 6,
                      cursor: "pointer",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {apt.time} · {apt.studentName.split(" ")[0]}
                  </div>
                ))}
                {dayAppointments.length > 2 && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: palette.crimson }}>
                    {t("calendar.calendar.moreAppointments", { count: dayAppointments.length - 2 })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0,
          backgroundColor: "#fff",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(214,214,214,0.3)",
          boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
        }}
      >
        {dayNames.map((day) => (
          <div
            key={day}
            style={{
              padding: "14px",
              backgroundColor: palette.darkest,
              color: "white",
              fontSize: 11,
              fontWeight: 700,
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayAppointments = getAppointmentsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      weekDays.push(
        <div key={i} style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              padding: "14px",
              backgroundColor: isToday ? palette.crimson : palette.darkest,
              color: "white",
              textAlign: "center",
              borderRadius: "12px 12px 0 0",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1 }}>
              {dayNames[date.getDay()]}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 2 }}>{date.getDate()}</div>
          </div>
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid rgba(214,214,214,0.3)",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              padding: "12px 8px",
              minHeight: 280,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {dayAppointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => setSelectedAppointment(apt)}
                style={{
                  padding: "10px",
                  backgroundColor: getStatusColor(apt.status),
                  color: "white",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 2 }}>{apt.time}</div>
                <div style={{ opacity: 0.9, fontSize: 10 }}>{apt.studentName}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <div style={{ display: "flex", gap: 10 }}>{weekDays}</div>;
  };

  const renderDayView = () => {
    const selectedDay = new Date(currentDate);
    const todayAppointments = getAppointmentsForDate(selectedDay);
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);

    return (
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(214,214,214,0.3)",
          boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            padding: "24px 32px",
            background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`,
            color: "white",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>
            {dayNames[selectedDay.getDay()]}, {monthNames[selectedDay.getMonth()]} {selectedDay.getDate()}
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, marginTop: 4, opacity: 0.85 }}>
            {t("calendar.dayView.scheduled", { count: todayAppointments.length })}
          </div>
        </div>
        <div style={{ padding: "16px 24px" }}>
          {hours.map((hour) => {
            const timeStr = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? "12:00 PM" : `${hour}:00 AM`;
            const hourAppointments = todayAppointments.filter((apt) => {
              const hourValue = getHourValue(apt.startTimeRaw);
              return hourValue === hour;
            });

            return (
              <div
                key={hour}
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr",
                  gap: 16,
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(214,214,214,0.2)",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(92,30,38,0.45)", paddingTop: 4 }}>
                  {timeStr}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {hourAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      style={{
                        padding: "14px 18px",
                        backgroundColor: getStatusColor(apt.status),
                        color: "white",
                        borderRadius: 12,
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>
                        {apt.time} · {apt.studentName}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.9 }}>{apt.reason}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, opacity: 0.75 }}>{apt.email}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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
          <button type="button" onClick={() => navigate("/professor/forum")} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "none", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("forum.forumThread.backToForum")}</button>
          {[
            { id: "calendar", label: t("professorSidebar.nav.calendar"), path: "/professor/calendar" },
            { id: "analysis", label: t("professorSidebar.nav.analysis"), path: "/professor/analysis" },
            { id: "requests", label: t("professorSidebar.nav.requests"), path: "/professor/requests" },
            { id: "editgroup", label: t("professorSidebar.nav.editgroup"), path: "/professor/edit-group" },
          ].map((item) => {
            const isActive = item.id === "calendar";
            return <button key={item.id} type="button" onClick={() => navigate(item.path)} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "none", backgroundColor: isActive ? "rgba(255,255,255,0.1)" : "transparent", color: isActive ? "#fff" : "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: isActive ? 700 : 600, cursor: "pointer" }}>{item.label}</button>;
          })}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", margin: "12px 0 10px 0" }} />
        <button type="button" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t("professorSidebar.signOut")}</button>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>
        <div style={{ backgroundColor: "#fff", padding: "56px 64px 52px", borderBottom: "1px solid rgba(214,214,214,0.2)" }}>
          <div style={{ maxWidth: 1400 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>{t("calendar.header.eyebrow")}</div>
            <div style={{ fontSize: 64, fontWeight: 900, color: palette.darkest, letterSpacing: -2.5, lineHeight: 1, marginBottom: 12 }}>{t("calendar.header.title")}</div>
            <div style={{ fontSize: 20, fontWeight: 400, color: "rgba(92,30,38,0.55)", marginBottom: 52 }}>{t("calendar.header.subtitle")}</div>

            <div style={{ display: "flex", gap: 0, alignItems: "stretch", flexWrap: "wrap" }}>
              {[
                { label: t("calendar.stats.total"), value: appointments.length, color: palette.crimson },
                { label: t("calendar.stats.confirmed"), value: confirmedCount, color: palette.sage },
                { label: t("calendar.stats.pending"), value: pendingCount, color: "#FFA500" },
                { label: t("calendar.stats.declined"), value: declinedCount, color: "#DC3545" },
              ].map((stat, i) => (
                <div key={stat.label} style={{ flex: "1 1 220px", minWidth: 180, paddingRight: i < 3 ? 40 : 0, marginRight: i < 3 ? 40 : 0, borderRight: i < 3 ? "1px solid rgba(214,214,214,0.5)" : "none" }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: stat.color, letterSpacing: -1.5, lineHeight: 1, marginBottom: 8 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "32px 64px 24px" }}>
          <div style={{ maxWidth: 1400 }}>
            {error && (
              <div style={{ marginBottom: 20, padding: "14px 16px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid rgba(220,53,69,0.2)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", color: palette.crimson, fontSize: 13, fontWeight: 700 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button onClick={previousMonth} style={{ width: 40, height: 40, backgroundColor: "#fff", border: "1.5px solid rgba(214,214,214,0.5)", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}><ChevronLeft size={18} color={palette.deepBurgundy} /></button>
                <div style={{ fontSize: 28, fontWeight: 900, color: palette.darkest, letterSpacing: -0.8, minWidth: 240 }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</div>
                <button onClick={nextMonth} style={{ width: 40, height: 40, backgroundColor: "#fff", border: "1.5px solid rgba(214,214,214,0.5)", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}><ChevronRight size={18} color={palette.deepBurgundy} /></button>
              </div>
              <div style={{ display: "flex", backgroundColor: "#fff", padding: 4, borderRadius: 14, border: "1.5px solid rgba(214,214,214,0.4)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", gap: 4 }}>
                {(["month", "week", "day"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)} style={{ padding: "8px 22px", backgroundColor: view === v ? palette.crimson : "transparent", color: view === v ? "white" : palette.deepBurgundy, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", textTransform: "capitalize", transition: "all 150ms ease" }}>{t(`calendar.views.${v}`)}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 24, marginBottom: 20, padding: "12px 20px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid rgba(214,214,214,0.25)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", flexWrap: "wrap" }}>
              {[
                { label: t("calendar.status.confirmed"), color: palette.sage },
                { label: t("calendar.status.pending"), color: "#FFA500" },
                { label: t("calendar.status.declined"), color: "#DC3545" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 12, height: 12, backgroundColor: item.color, borderRadius: 4 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>{item.label}</span>
                </div>
              ))}
            </div>

            {isLoading && (
              <div style={{ marginBottom: 20, padding: "20px 24px", backgroundColor: "#fff", borderRadius: 14, border: "1px solid rgba(214,214,214,0.3)", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: palette.deepBurgundy, fontSize: 14, fontWeight: 700 }}>
                {t("calendar.loading")}
              </div>
            )}

            {!isLoading && appointments.length === 0 && (
              <div style={{ marginBottom: 20, padding: "20px 24px", backgroundColor: "#fff", borderRadius: 14, border: "1px solid rgba(214,214,214,0.3)", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: "rgba(92,30,38,0.55)", fontSize: 13, fontWeight: 700 }}>
                {t("calendar.empty")}
              </div>
            )}

            {view === "month" && renderMonthView()}
            {view === "week" && renderWeekView()}
            {view === "day" && renderDayView()}
          </div>
        </div>

        <div style={{ background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`, padding: "40px 64px", marginTop: 8 }}>
          <div style={{ maxWidth: 1400 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{t("calendar.footer.eyebrow")}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>
              {t("calendar.footer.confirmed", { count: confirmedCount})}
            </div>
          </div>
        </div>
      </main>

      {selectedAppointment && (
        <div onClick={() => setSelectedAppointment(null)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#fff", borderRadius: 24, overflow: "hidden", maxWidth: 480, width: "90%", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ height: 6, backgroundColor: getStatusColor(selectedAppointment.status) }} />
            <div style={{ padding: "32px" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: palette.darkest, letterSpacing: -0.8, marginBottom: 24 }}>{t("calendar.appointmentModal.title")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("calendar.appointmentModal.studentLabel")}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: palette.darkest, marginBottom: 2 }}>{selectedAppointment.studentName}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(92,30,38,0.5)" }}>{selectedAppointment.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("calendar.appointmentModal.dateTimeLabel")}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: palette.deepBurgundy }}>
                  {t("calendar.appointmentModal.dateTimeAt", { date: new Date(selectedAppointment.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }), time: selectedAppointment.time })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("calendar.appointmentModal.reasonLabel")}</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: palette.deepBurgundy, fontStyle: "italic" }}>&quot;{selectedAppointment.reason}&quot;</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{t("calendar.appointmentModal.statusLabel")}</div>
                <span style={{ display: "inline-block", padding: "6px 14px", backgroundColor: getStatusColor(selectedAppointment.status), color: "white", fontSize: 12, fontWeight: 700, borderRadius: 8, textTransform: "capitalize" }}>{t(`calendar.status.${selectedAppointment.status}`)}</span>
              </div>
            </div>
            <button onClick={() => setSelectedAppointment(null)} style={{ marginTop: 24, width: "100%", padding: "14px", background: `linear-gradient(135deg, ${palette.crimson}, ${palette.deepBurgundy})`, color: "white", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{t("calendar.appointmentModal.closeButton")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
