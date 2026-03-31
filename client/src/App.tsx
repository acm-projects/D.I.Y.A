// App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./LandingPage";
import { LoginPage } from "./LoginPage";
import { SignUpPage } from "./SignUpPage";
import { StudentGroupsPage } from "./StudentGroupsPage";
import { StudentPopUp } from "./StudentPopUp";
import { StudentForumPage } from "./StudentForumPage";
import { StudentForumThreadPage } from "./StudentForumThreadPage";
import {StudentOfficeHours } from "./StudentOfficeHours";
import {StudentSelfCheckPage} from "./StudentSelfCheckPage.tsx";
import { StudentProfilePage } from "./StudentProfilePage.tsx";
import {AnalysisPage} from "./app/components/AnalysisPage.tsx";
import {CalendarPage} from "./app/components/CalendarPage.tsx";
import {EditGroupPage} from "./app/components/EditGroupPage.tsx";
import {ForumPage} from "./app/components/ForumPage.tsx";
import {QuestionDetailPage} from "./app/components/QuestionDetailPage.tsx";
import {RequestsPage} from "./app/components/RequestsPage.tsx";



export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/profile" element={<StudentProfilePage />} />
      <Route path="/groups" element={<StudentGroupsPage />} />
      <Route path="/groups/:groupId/forum" element={<StudentForumPage />} />
      <Route path="/groups/:groupId/forum/:questionId" element={<StudentForumThreadPage />} />
      <Route path="/office-hours" element={<StudentOfficeHours/>}/>
      <Route path="/self-check" element={<StudentSelfCheckPage/>}/>
      <Route path="/invite" element={
        <StudentPopUp
          adminName="Prof. A"
          groupName="CS 1337 — Computer Science I"
          onAccept={() => alert("Accepted!")}
          onDecline={() => alert("Declined!")}
        />
      } />

      {/* Admin pages (from app fodler) */}      
      <Route path="/edit-group/:groupName" element={<EditGroupPage />} />
      <Route path="/analysis/:groupName" element={<AnalysisPage />} />
      <Route path="/calendar/:groupName" element={<CalendarPage />} />
      <Route path="/requests/:groupName" element={<RequestsPage />} />
      <Route path="/forum/:groupName" element={<ForumPage />} />
      <Route path="/forum/:groupName/question/:questionId" element={<QuestionDetailPage />} />

      {/* Prevent a white screen on unknown URLs */}      
      <Route path="*" element={<Navigate to="/login" replace />} />


    </Routes>
  );
}