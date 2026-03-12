import { createBrowserRouter } from "react-router";
import { GroupPage } from "../imports/pasted_text/group-page";
import { ForumPage } from "./components/ForumPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: GroupPage,
  },
  {
    path: "/forum/:groupName",
    Component: ForumPage,
  },
]);
