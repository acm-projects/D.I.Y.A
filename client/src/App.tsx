// App.tsx
import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { SignUpPage } from "./SignUpPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
    </Routes>
  );
}