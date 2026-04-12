import { createBrowserRouter } from "react-router-dom";
import { StudentGroupsPage } from "../StudentGroupsPage.tsx";
import { ForumPage } from "./ForumPage.tsx";
import { QuestionDetailPage } from "./QuestionDetailPage.tsx";
import { EditGroupPage } from "./EditGroupPage.tsx";
import { RequestsPage } from "./RequestsPage.tsx";
import { AnalysisPage } from "./AnalysisPage.tsx";
import { CalendarPage } from "./CalendarPage.tsx";

/** Optional alternate router — mirrors App.tsx professor routes; root lists groups. Not wired in main.tsx. */
export const router = createBrowserRouter([
  {
    path: "/",
    Component: StudentGroupsPage,
  },
  {
    path: "/forum/:groupName",
    Component: ForumPage,
  },
  {
    path: "/forum/:groupName/question/:questionId",
    Component: QuestionDetailPage,
  },
  {
    path: "/edit-group/:groupName",
    Component: EditGroupPage,
  },
  {
    path: "/requests/:groupName",
    Component: RequestsPage,
  },
  {
    path: "/analysis/:groupName",
    Component: AnalysisPage,
  },
  {
    path: "/calendar/:groupName",
    Component: CalendarPage,
  },
]);
