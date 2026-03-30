import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
          throw new Error("Failed to load office hour schedule.");
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
            studentName: request.studentName || "Student",
            email: request.studentEmail || "No email provided",
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
          setError(err instanceof Error ? err.message : "Failed to load office hour schedule.");
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
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
        <div key={i} style={{ minHeight: 120, border: "1px solid rgba(214,214,214,0.3)", padding: 8, backgroundColor: isCurrentMonth ? "#fff" : "rgba(214,214,214,0.1)", position: "relative", cursor: isCurrentMonth ? "pointer" : "default" }}>
          {isCurrentMonth && (
            <>
              <div style={{ fontSize: 14, fontWeight: isToday ? 800 : 600, color: isToday ? palette.crimson : palette.deepBurgundy, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                {dayNumber}
                {isToday && <span style={{ fontSize: 8, fontWeight: 700, backgroundColor: palette.crimson, color: "white", padding: "2px 6px", borderRadius: 4 }}>TODAY</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {dayAppointments.slice(0, 2).map((apt) => (
                  <div key={apt.id} onClick={() => setSelectedAppointment(apt)} style={{ fontSize: 10, fontWeight: 600, padding: "4px 6px", backgroundColor: getStatusColor(apt.status), color: "white", borderRadius: 4, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {apt.time} - {apt.studentName}
                  </div>
                ))}
                {dayAppointments.length > 2 && <div style={{ fontSize: 9, fontWeight: 700, color: palette.crimson, textAlign: "center" }}>+{dayAppointments.length - 2} more</div>}
              </div>
            </>
          )}
        </div>,
      );
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(214,214,214,0.4)", boxShadow: "0 4px 18px rgba(0,0,0,0.08)" }}>
        {dayNames.map((day) => (
          <div key={day} style={{ padding: 12, backgroundColor: palette.deepBurgundy, color: "white", fontSize: 12, fontWeight: 700, textAlign: "center", textTransform: "uppercase" }}>{day}</div>
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
          <div style={{ padding: 12, backgroundColor: isToday ? palette.crimson : palette.deepBurgundy, color: "white", fontSize: 11, fontWeight: 700, textAlign: "center", borderRadius: "8px 8px 0 0" }}>
            <div style={{ fontSize: 10, opacity: 0.9 }}>{dayNames[date.getDay()]}</div>
            <div style={{ fontSize: 18, marginTop: 2 }}>{date.getDate()}</div>
          </div>
          <div style={{ backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.4)", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "12px 8px", minHeight: 300, display: "flex", flexDirection: "column", gap: 6 }}>
            {dayAppointments.map((apt) => (
              <div key={apt.id} onClick={() => setSelectedAppointment(apt)} style={{ padding: 8, backgroundColor: getStatusColor(apt.status), color: "white", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{apt.time}</div>
                <div style={{ fontSize: 10 }}>{apt.studentName}</div>
              </div>
            ))}
          </div>
        </div>,
      );
    }
    return <div style={{ display: "flex", gap: 12, backgroundColor: palette.cream }}>{weekDays}</div>;
  };

  const renderDayView = () => {
    const selectedDay = new Date(currentDate);
    const todayAppointments = getAppointmentsForDate(selectedDay);
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);
    return (
      <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid rgba(214,214,214,0.4)", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", backgroundColor: palette.crimson, color: "white" }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{dayNames[selectedDay.getDay()]}, {monthNames[selectedDay.getMonth()]} {selectedDay.getDate()}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, opacity: 0.9 }}>{todayAppointments.length} appointment{todayAppointments.length !== 1 ? "s" : ""} scheduled</div>
        </div>
        <div style={{ padding: 16 }}>
          {hours.map((hour) => {
            const timeStr = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? "12:00 PM" : `${hour}:00 AM`;
            const hourAppointments = todayAppointments.filter((apt) => {
              const hourValue = getHourValue(apt.startTimeRaw);
              return hourValue === hour;
            });
            return (
              <div key={hour} style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 16, padding: "12px 0", borderBottom: "1px solid rgba(214,214,214,0.3)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy }}>{timeStr}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {hourAppointments.map((apt) => (
                    <div key={apt.id} onClick={() => setSelectedAppointment(apt)} style={{ padding: "12px 16px", backgroundColor: getStatusColor(apt.status), color: "white", borderRadius: 8, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{apt.time} - {apt.studentName}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.95 }}>{apt.reason}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, marginTop: 6, opacity: 0.8 }}>{apt.email}</div>
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
            const isActive = item.id === "calendar";
            return <button key={item.id} type="button" onClick={() => navigate(item.path)} style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 10, border: "none", backgroundColor: isActive ? "rgba(255,255,255,0.88)" : "transparent", color: isActive ? palette.darkest : "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: isActive ? 800 : 600, cursor: "pointer" }}>{item.label}</button>;
          })}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.2)", margin: "10px 0 8px 0" }} />
        <button type="button" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Sign out</button>
      </aside>

      <main style={{ flex: 1, padding: "32px 36px 56px 24px", boxSizing: "border-box", overflow: "auto" }}>
        <div style={{ maxWidth: 1400 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ color: palette.crimson, fontSize: 44, fontWeight: 850, letterSpacing: -1, lineHeight: 1.1 }}>Appointment Calendar</div>
            <div style={{ marginTop: 8, color: palette.deepBurgundy, fontSize: 16, fontWeight: 600 }}>Manage your student appointments and schedule</div>
          </div>

          {error && (
            <div style={{ marginBottom: 20, padding: "14px 16px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid rgba(220,53,69,0.2)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", color: palette.crimson, fontSize: 13, fontWeight: 700 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={previousMonth} style={{ padding: "8px 12px", backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center" }}><ChevronLeft size={20} color={palette.deepBurgundy} /></button>
              <div style={{ fontSize: 24, fontWeight: 800, color: palette.deepBurgundy }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</div>
              <button onClick={nextMonth} style={{ padding: "8px 12px", backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center" }}><ChevronRight size={20} color={palette.deepBurgundy} /></button>
            </div>
            <div style={{ display: "flex", gap: 8, backgroundColor: "#fff", padding: 4, borderRadius: 10, border: "1px solid rgba(214,214,214,0.4)" }}>
              {(["month", "week", "day"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} style={{ padding: "8px 20px", backgroundColor: view === v ? palette.crimson : "transparent", color: view === v ? "white" : palette.deepBurgundy, border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{v}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, marginBottom: 20, padding: "12px 16px", backgroundColor: "#fff", borderRadius: 8, border: "1px solid rgba(214,214,214,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 16, height: 16, backgroundColor: palette.sage, borderRadius: 4 }} /><span style={{ fontSize: 12, fontWeight: 600, color: palette.deepBurgundy }}>Confirmed</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 16, height: 16, backgroundColor: "#FFA500", borderRadius: 4 }} /><span style={{ fontSize: 12, fontWeight: 600, color: palette.deepBurgundy }}>Pending</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 16, height: 16, backgroundColor: "#DC3545", borderRadius: 4 }} /><span style={{ fontSize: 12, fontWeight: 600, color: palette.deepBurgundy }}>Declined</span></div>
          </div>

          {isLoading && (
            <div style={{ marginBottom: 20, padding: "20px 24px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid rgba(214,214,214,0.3)", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: palette.deepBurgundy, fontSize: 14, fontWeight: 700 }}>
              Loading office hour calendar...
            </div>
          )}

          {!isLoading && appointments.length === 0 && (
            <div style={{ marginBottom: 20, padding: "20px 24px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid rgba(214,214,214,0.3)", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: "rgba(92,30,38,0.55)", fontSize: 13, fontWeight: 700 }}>
              No office hour requests are scheduled yet.
            </div>
          )}

          {view === "month" && renderMonthView()}
          {view === "week" && renderWeekView()}
          {view === "day" && renderDayView()}
        </div>
      </main>

      {selectedAppointment && (
        <div onClick={() => setSelectedAppointment(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 32, maxWidth: 500, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: palette.crimson, marginBottom: 16 }}>Appointment Details</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", marginBottom: 4 }}>Student</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: palette.deepBurgundy }}>{selectedAppointment.studentName}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.6)" }}>{selectedAppointment.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", marginBottom: 4 }}>Date & Time</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: palette.deepBurgundy }}>
                  {new Date(selectedAppointment.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at {selectedAppointment.time}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", marginBottom: 4 }}>Reason</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: palette.deepBurgundy, fontStyle: "italic" }}>&quot;{selectedAppointment.reason}&quot;</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", marginBottom: 4 }}>Status</div>
                <span style={{ display: "inline-block", padding: "6px 12px", backgroundColor: getStatusColor(selectedAppointment.status), color: "white", fontSize: 12, fontWeight: 700, borderRadius: 6, textTransform: "capitalize" }}>{selectedAppointment.status}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setSelectedAppointment(null)} style={{ flex: 1, padding: 12, backgroundColor: palette.sage, color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
