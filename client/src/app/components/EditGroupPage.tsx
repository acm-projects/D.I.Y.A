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

interface Student {
  id: number;
  name: string;
  email: string;
  status: "active" | "pending";
}

export function EditGroupPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: "Sarah Johnson", email: "sarah.j@university.edu", status: "active" },
    { id: 2, name: "Michael Chen", email: "m.chen@university.edu", status: "active" },
    { id: 3, name: "Emily Rodriguez", email: "emily.r@university.edu", status: "active" },
    { id: 4, name: "David Kim", email: "david.kim@university.edu", status: "active" },
  ]);

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [groupNameEdit, setGroupNameEdit] = useState(decodeURIComponent(groupName || ""));
  const [groupDescription, setGroupDescription] = useState("Introduction to Computer Science - Fall 2026");

  const handleAddStudent = () => {
    if (!newStudentName.trim() || !newStudentEmail.trim()) return;
    
    const newStudent: Student = {
      id: students.length + 1,
      name: newStudentName,
      email: newStudentEmail,
      status: "pending",
    };
    
    setStudents([...students, newStudent]);
    setNewStudentName("");
    setNewStudentEmail("");
    setShowAddStudent(false);
  };

  const handleRemoveStudent = (id: number) => {
    if (confirm("Are you sure you want to remove this student?")) {
      setStudents(students.filter(s => s.id !== id));
    }
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
            const isActive = item.id === "editgroup";
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
              Edit Group Settings
            </div>
            <div
              style={{
                marginTop: 8,
                color: palette.deepBurgundy,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Manage students, settings, and group information
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <button
              onClick={() => setShowAddStudent(true)}
              style={{
                padding: "18px 20px",
                backgroundColor: palette.sage,
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                transition: "transform 120ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              ➕ Add Students
            </button>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to archive this group?")) {
                  alert("Group archived");
                }
              }}
              style={{
                padding: "18px 20px",
                backgroundColor: "transparent",
                color: "#DC3545",
                border: "2px solid #DC3545",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 120ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#DC3545";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#DC3545";
              }}
            >
              🗄️ Archive Group
            </button>
          </div>

          {/* Group Information Card */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid rgba(214,214,214,0.4)",
              borderRadius: 14,
              padding: "24px",
              marginBottom: 24,
              boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: palette.crimson,
                marginBottom: 20,
              }}
            >
              Group Information
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: palette.deepBurgundy,
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupNameEdit}
                  onChange={(e) => setGroupNameEdit(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid rgba(214,214,214,0.5)",
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: palette.deepBurgundy,
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Description
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 80,
                    padding: "10px 14px",
                    border: "1px solid rgba(214,214,214,0.5)",
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <button
                onClick={() => alert("Settings saved!")}
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 20px",
                  background: palette.sage,
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Add Student Modal */}
          {showAddStudent && (
            <div
              style={{
                backgroundColor: "#fff",
                border: "2px solid " + palette.sage,
                borderRadius: 14,
                padding: "24px",
                marginBottom: 24,
                boxShadow: "0 4px 18px rgba(0,0,0,0.12)",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: palette.sage,
                  marginBottom: 20,
                }}
              >
                Add New Student
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  type="text"
                  placeholder="Student Name"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    border: "1px solid rgba(214,214,214,0.5)",
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: "inherit",
                  }}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    border: "1px solid rgba(214,214,214,0.5)",
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: "inherit",
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleAddStudent}
                    style={{
                      padding: "10px 20px",
                      background: palette.sage,
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Add Student
                  </button>
                  <button
                    onClick={() => setShowAddStudent(false)}
                    style={{
                      padding: "10px 20px",
                      background: "transparent",
                      color: palette.deepBurgundy,
                      border: "1px solid rgba(92,30,38,0.3)",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Student List */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid rgba(214,214,214,0.4)",
              borderRadius: 14,
              padding: "24px",
              boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: palette.crimson,
                marginBottom: 16,
              }}
            >
              Student List ({students.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {students.map((student) => (
                <div
                  key={student.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    backgroundColor: student.status === "active" ? "rgba(122,155,118,0.08)" : "rgba(214,214,214,0.2)",
                    borderRadius: 10,
                    border: "1px solid rgba(214,214,214,0.3)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: palette.deepBurgundy,
                        marginBottom: 2,
                      }}
                    >
                      {student.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "rgba(92,30,38,0.6)",
                      }}
                    >
                      {student.email}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        backgroundColor: student.status === "active" ? palette.sage : palette.lightGray,
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 6,
                        textTransform: "uppercase",
                      }}
                    >
                      {student.status}
                    </span>
                    <button
                      onClick={() => handleRemoveStudent(student.id)}
                      style={{
                        padding: "6px 12px",
                        background: "transparent",
                        color: "#DC3545",
                        border: "1px solid #DC3545",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
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