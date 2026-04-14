// App.tsx
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./LandingPage";
import { LoginPage } from "./LoginPage";
import { SignUpPage } from "./SignUpPage";
import { StudentProfilePage } from "./StudentProfilePage";
import { StudentGroupsPage } from "./StudentGroupsPage";
import { StudentPopUp } from "./StudentPopUp";
import { StudentForumPage } from "./StudentForumPage";
import { StudentForumThreadPage } from "./StudentForumThreadPage";
import { StudentOfficeHours } from "./StudentOfficeHours";
import { StudentSelfCheckPage } from "./StudentSelfCheckPage.tsx";
import { ProfessorAnalysisPage } from "./pages/professor/ProfessorAnalysisPage";
import { ProfessorCalendarPage } from "./pages/professor/ProfessorCalendarPage";
import { ProfessorEditGroupPage } from "./pages/professor/ProfessorEditGroupPage";
import { ProfessorForumPage } from "./pages/professor/ProfessorForumPage";
import { ProfessorQuestionDetailPage } from "./pages/professor/ProfessorQuestionDetailPage";
import { ProfessorRequestsPage } from "./pages/professor/ProfessorRequestsPage";
import { ProfessorHomePage } from "./pages/professor/ProfessorHomePage";
import { ProfessorGroupProvider } from "./ProfessorGroupContext";
import { ProfessorProfilePage } from "./pages/professor/ProfessorProfilePage";
import { ThemeProvider } from "./context/ThemeContext";

type AppRole = "student" | "professor";

const HOME_BY_ROLE: Record<AppRole, string> = {
  student: "/groups",
  professor: "/professor/home",
};

const ROLE_STORAGE_KEY = "diya_role";

function RoleProtectedRoute({
  isAuthenticated,
  role,
  allowedRole,
  children,
}: {
  isAuthenticated: boolean;
  role: AppRole;
  allowedRole: AppRole;
  children: ReactElement;
}) {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to={HOME_BY_ROLE[role]} replace />;
  }

  return children;
}


export default function App() {
  const { isLoading, isAuthenticated, user, logout } = useAuth0();
  const [role, setRole] = useState<AppRole>(() => {
    const stored = window.localStorage.getItem(ROLE_STORAGE_KEY);
    return stored === "professor" ? "professor" : "student";
  });
  const [isRoleLoading, setIsRoleLoading] = useState(false);

  // Exported via window for child components that need role-aware logout
  const handleLogout = useCallback(() => {
    window.localStorage.removeItem(ROLE_STORAGE_KEY);
    window.sessionStorage.removeItem("pendingSignupRole");
    setRole("student");
    void logout({ logoutParams: { returnTo: window.location.origin } });
  }, [logout]);
  void handleLogout; // referenced below and by professor pages via pattern

  useEffect(() => {
    if (!isAuthenticated) {
      window.localStorage.removeItem(ROLE_STORAGE_KEY);
      setRole("student");
      setIsRoleLoading(false);
      return;
    }

    const email = user?.email ?? null;
    const id = user?.sub ?? null;
    const name = user?.name ?? user?.nickname ?? null;

    if (!email && !id) {
      setRole("student");
      setIsRoleLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchRole = async () => {
      setIsRoleLoading(true);

      try {
        const pendingSignupRole = window.sessionStorage.getItem("pendingSignupRole");
        const params = new URLSearchParams();

        if (email) {
          params.set("email", email);
        }

        if (id) {
          params.set("id", id);
        }

        if (name) {
          params.set("name", name);
        }

        if (pendingSignupRole === "student" || pendingSignupRole === "professor") {
          params.set("selectedRole", pendingSignupRole);
        }

        const response = await fetch(`/api/users/role?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Role lookup failed with status ${response.status}`);
        }

        const data = (await response.json()) as { role?: string };
        if (pendingSignupRole === "student" || pendingSignupRole === "professor") {
          window.sessionStorage.removeItem("pendingSignupRole");
        }
        const resolvedRole: AppRole = data.role === "professor" ? "professor" : "student";
        window.localStorage.setItem(ROLE_STORAGE_KEY, resolvedRole);
        setRole(resolvedRole);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load user role.", error);
          setRole("student");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsRoleLoading(false);
        }
      }
    };

    void fetchRole();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, user?.email, user?.name, user?.nickname, user?.sub]);

  if (isLoading || (isAuthenticated && isRoleLoading)) return <div>Loading...</div>;

  void 0; // homePath removed — routes use HOME_BY_ROLE[role] directly

  return (
    <ThemeProvider>
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to={HOME_BY_ROLE[role]} replace /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={HOME_BY_ROLE[role]} replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={HOME_BY_ROLE[role]} replace /> : <SignUpPage />} />
      <Route path="/profile" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="student"><StudentProfilePage /></RoleProtectedRoute>} />
      <Route path="/groups" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="student"><StudentGroupsPage /></RoleProtectedRoute>} />
      <Route path="/groups/:groupId/forum" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="student"><StudentForumPage /></RoleProtectedRoute>} />
      <Route path="/groups/:groupId/forum/:questionId" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="student"><StudentForumThreadPage /></RoleProtectedRoute>} />
      <Route path="/office-hours" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="student"><StudentOfficeHours/></RoleProtectedRoute>}/>
      <Route path="/self-check" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="student"><StudentSelfCheckPage/></RoleProtectedRoute>}/>
      <Route path="/invite" element={
        <RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="student">
          <StudentPopUp
            adminName="Prof. A"
            groupName="CS 1337 — Computer Science I"
            onAccept={() => alert("Accepted!")}
            onDecline={() => alert("Declined!")}
          />
        </RoleProtectedRoute>
      } />
      <Route path="/professor" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><Navigate to="/professor/home" replace /></RoleProtectedRoute>} />
      <Route path="/professor/home" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><ProfessorGroupProvider><ProfessorHomePage /></ProfessorGroupProvider></RoleProtectedRoute>} />
      <Route path="/professor/analysis" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><ProfessorGroupProvider><ProfessorAnalysisPage /></ProfessorGroupProvider></RoleProtectedRoute>} />
      <Route path="/professor/calendar" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><ProfessorCalendarPage /></RoleProtectedRoute>} />
      <Route path="/professor/edit-group" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><ProfessorGroupProvider><ProfessorEditGroupPage /></ProfessorGroupProvider></RoleProtectedRoute>} />
      <Route path="/professor/forum" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><ProfessorGroupProvider><ProfessorForumPage /></ProfessorGroupProvider></RoleProtectedRoute>} />
      <Route path="/professor/forum/:questionId" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><ProfessorGroupProvider><ProfessorQuestionDetailPage /></ProfessorGroupProvider></RoleProtectedRoute>} />
      <Route path="/professor/requests" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><ProfessorRequestsPage /></RoleProtectedRoute>} />
      <Route path="/professor/profile" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><ProfessorProfilePage /></RoleProtectedRoute>} />
    </Routes>
    </ThemeProvider>
  );
}