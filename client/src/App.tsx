// App.tsx
import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { SignUpPage } from "./SignUpPage";
import { StudentGroupsPage } from "./StudentGroupsPage";
import { StudentPopUp } from "./StudentPopUp";
import { StudentForumPage } from "./StudentForumPage";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/groups" element={<StudentGroupsPage />} />
      <Route path="/groups/:groupId/forum" element={<StudentForumPage />} />
      <Route path="/invite" element={
        <StudentPopUp
          adminName="Dr. Smith"
          groupName="CS 1337 — Computer Science I"
          onAccept={() => alert("Accepted!")}
          onDecline={() => alert("Declined!")}
        />
      } />
    </Routes>
  );
}