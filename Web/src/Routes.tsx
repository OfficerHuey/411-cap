import { createBrowserRouter } from "react-router";

import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { SemesterHub } from "./components/SemesterHub";
import { ScheduleBuilder } from "./components/ScheduleBuilder";
import { RoomsPage } from "./components/RoomsPage";
import { CoursesPage } from "./components/CoursesPage";
import { StudentsPage } from "./components/StudentsPage";
import { InstructorsPage } from "./components/InstructorsPage";
import { ChangeLogPage } from "./components/ChangeLogPage";
import { Archive } from "./components/Archive";
import { NotesPage } from "./components/NotesPage";
import { ProfilePage } from "./components/ProfilePage";
import { SemestersOverviewPage } from "./components/SemestersOverviewPage";
import { ScheduleGroupsOverviewPage } from "./components/ScheduleGroupsOverviewPage";
import { AttentionPage } from "./components/AttentionPage";
import { FilesPage } from "./components/FilesPage";
import { MessagesPage } from "./components/MessagesPage";
import { Login } from "./components/Login";
import { ForgotPassword } from "./components/ForgotPassword";
import { ResetPassword } from "./components/ResetPassword";
import { NotFound } from "./components/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "semester/:semesterId", Component: SemesterHub },
      { path: "schedule-builder/:scheduleGroupId", Component: ScheduleBuilder },
      { path: "courses", Component: CoursesPage },
      { path: "students", Component: StudentsPage },
      { path: "rooms", Component: RoomsPage },
      { path: "instructors", Component: InstructorsPage },
      { path: "changelog/:semesterId", Component: ChangeLogPage },
      { path: "notes", Component: NotesPage },
      { path: "files", Component: FilesPage },
      { path: "messages", Component: MessagesPage },
      { path: "messages/:conversationId", Component: MessagesPage },
      { path: "archive", Component: Archive },
      { path: "profile", Component: ProfilePage },
      { path: "semesters-overview", Component: SemestersOverviewPage },
      { path: "schedule-groups-overview", Component: ScheduleGroupsOverviewPage },
      { path: "attention", Component: AttentionPage },
      { path: "*", Component: NotFound },
    ],
  },
]);
