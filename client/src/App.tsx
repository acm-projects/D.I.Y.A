// App.tsx
import { useEffect, useState, type ReactElement } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { SignUpPage } from "./SignUpPage";
import { StudentProfilePage } from "./StudentProfilePage";
import { StudentGroupsPage } from "./StudentGroupsPage";
import { StudentPopUp } from "./StudentPopUp";
import { StudentForumPage } from "./StudentForumPage";
import { StudentForumThreadPage } from "./StudentForumThreadPage";
import {StudentOfficeHours } from "./StudentOfficeHours";
import {StudentSelfCheckPage} from "./StudentSelfCheckPage.tsx";
import { ProfessorAnalysisPage } from "./pages/professor/ProfessorAnalysisPage";
import { ProfessorCalendarPage } from "./pages/professor/ProfessorCalendarPage";
import { ProfessorEditGroupPage } from "./pages/professor/ProfessorEditGroupPage";
import { ProfessorForumPage } from "./pages/professor/ProfessorForumPage";
import { ProfessorQuestionDetailPage } from "./pages/professor/ProfessorQuestionDetailPage";
import { ProfessorRequestsPage } from "./pages/professor/ProfessorRequestsPage";

type AppRole = "student" | "professor";

const HOME_BY_ROLE: Record<AppRole, string> = {
  student: "/groups",
  professor: "/professor/analysis",
};

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
    return <Navigate to="/login" replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to={HOME_BY_ROLE[role]} replace />;
  }

  return children;
}


export default function App() {
  const { isLoading, isAuthenticated, user } = useAuth0();
  const [role, setRole] = useState<AppRole>("student");
  const [isRoleLoading, setIsRoleLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
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

        const response = await fetch(`/api/users/role?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Role lookup failed with status ${response.status}`);
        }

        const data = (await response.json()) as { role?: string };
        setRole(data.role === "professor" ? "professor" : "student");
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

  const homePath = isAuthenticated ? HOME_BY_ROLE[role] : "/login";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homePath} replace />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={homePath} replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={homePath} replace /> : <SignUpPage />} />
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
      <Route path="/professor" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><Navigate to="/professor/analysis" replace /></RoleProtectedRoute>} />
      <Route path="/professor/analysis" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><ProfessorAnalysisPage /></RoleProtectedRoute>} />
      <Route path="/professor/calendar" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><ProfessorCalendarPage /></RoleProtectedRoute>} />
      <Route path="/professor/edit-group" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><ProfessorEditGroupPage /></RoleProtectedRoute>} />
      <Route path="/professor/forum" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><ProfessorForumPage /></RoleProtectedRoute>} />
      <Route path="/professor/forum/:questionId" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><ProfessorQuestionDetailPage /></RoleProtectedRoute>} />
      <Route path="/professor/requests" element={<RoleProtectedRoute isAuthenticated={isAuthenticated} role={role} allowedRole="professor"><ProfessorRequestsPage /></RoleProtectedRoute>} />
    </Routes>
  );
}