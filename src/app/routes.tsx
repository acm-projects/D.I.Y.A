import { createBrowserRouter } from "react-router";
import { GroupPage } from "../imports/pasted_text/group-page";
import { ForumPage } from "./components/ForumPage";
import { QuestionDetailPage } from "./components/QuestionDetailPage";
import { EditGroupPage } from "./components/EditGroupPage";
import { RequestsPage } from "./components/RequestsPage";
import { AnalysisPage } from "./components/AnalysisPage";
import { TopicDetailPage } from "./components/TopicDetailPage";
import { CalendarPage } from "./components/CalendarPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: GroupPage,
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
    path: "/analysis/:groupName/topic/:topicId",
    Component: TopicDetailPage,
  },
  {
    path: "/calendar/:groupName",
    Component: CalendarPage,
  },
]);