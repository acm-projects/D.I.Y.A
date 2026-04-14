import { RouterProvider } from "react-router";
import { router } from "./routes";
import { TTSProvider } from "./components/student/TTSContext";
import { TTSPlayer } from "./components/student/TTSPlayer";

export default function App() {
  return (
    <TTSProvider>
      <RouterProvider router={router} />
      <TTSPlayer />
    </TTSProvider>
  );
}
