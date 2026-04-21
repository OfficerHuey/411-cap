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
      { path: "archive", Component: Archive },
      { path: "profile", Component: ProfilePage },
      { path: "*", Component: NotFound },
    ],
  },
]);
