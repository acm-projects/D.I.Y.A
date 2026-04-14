// App.tsx — central route table: URL → page component
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { LandingPage } from "./LandingPage";
import { LoginPage } from "./LoginPage";
import { SignUpPage } from "./SignUpPage";
import { StudentGroupsPage } from "./StudentGroupsPage";
import { StudentPopUp } from "./StudentPopUp";
import { StudentForumPage } from "./StudentForumPage";
import { StudentForumThreadPage } from "./StudentForumThreadPage";
import { StudentOfficeHours } from "./StudentOfficeHours";
import { StudentSelfCheckPage } from "./StudentSelfCheckPage.tsx";
import { StudentProfilePage } from "./StudentProfilePage";
import { StudentStudyGroups } from "./student-study-group-pages/StudentStudyGroups";
import { StudentStudyGroupsLayout } from "./student-study-group-pages/StudentStudyGroupsLayout";
import { TopicAnalysisPage } from "./TopicAnalysisPage";
import { AnalysisPage } from "./professor-pages/AnalysisPage.tsx";
import { CalendarPage } from "./professor-pages/CalendarPage.tsx";
import { EditGroupPage } from "./professor-pages/EditGroupPage.tsx";
import { ForumPage } from "./professor-pages/ForumPage.tsx";
import { QuestionDetailPage } from "./professor-pages/QuestionDetailPage.tsx";
import { RequestsPage } from "./professor-pages/RequestsPage.tsx";
import { ProfessorSidebar } from "./professor-pages/ProfessorSidebar.tsx";
import { TopicDetailPage } from "./professor-pages/TopicDetailPage.tsx";


function ProfessorSidebarPage() {
  const { groupName } = useParams<{ groupName: string }>();
  return <ProfessorSidebar activeId="analysis" groupName={groupName} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/groups" element={<StudentGroupsPage />} />
      <Route path="/groups/:groupId/forum" element={<StudentForumPage />} />
      <Route path="/groups/:groupId/forum/:questionId" element={<StudentForumThreadPage />} />
      <Route path="/office-hours" element={<StudentOfficeHours />} />
      <Route path="/selfcheck" element={<Navigate to="/self-check" replace />} />
      <Route path="/self-check" element={<StudentSelfCheckPage />} />
      <Route path="/profile" element={<StudentProfilePage />} />
      <Route path="/study-groups" element={<StudentStudyGroupsLayout />}>
        <Route index element={<StudentStudyGroups />} />
      </Route>
      <Route
        path="/invite"
        element={
          <StudentPopUp
            adminName="Prof. A"
            groupName="CS 1337 — Computer Science I"
            onAccept={() => alert("Accepted!")}
            onDecline={() => alert("Declined!")}
          />
        }
      />

      {/* Admin / professor (app/components) */}
      <Route path="/edit-group" element={<EditGroupPage />} />
      <Route path="/edit-group/:groupName" element={<EditGroupPage />} />
      {/*
        Order matters: student topic drill-down uses /analysis/topic/:topicId (literal "topic").
        Must come before /analysis/:groupName or "topic" is treated as a group slug.
      */}
      <Route path="/analysis/topic/:topicId" element={<TopicAnalysisPage />} />
      <Route path="/analysis/:groupName/topic/:topicId" element={<TopicDetailPage />} />
      <Route path="/analysis" element={<AnalysisPage />} />
      <Route path="/analysis/:groupName" element={<AnalysisPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/calendar/:groupName" element={<CalendarPage />} />
      <Route path="/requests" element={<RequestsPage />} />
      <Route path="/requests/:groupName" element={<RequestsPage />} />
      <Route path="/forum/:groupName" element={<ForumPage />} />
      <Route path="/forum/:groupName/question/:questionId" element={<QuestionDetailPage />} />
      <Route path="/professor-sidebar/:groupName" element={<ProfessorSidebarPage />} />

      {/* Unknown URLs → home (landing), not login — avoids skipping the marketing page */}
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
