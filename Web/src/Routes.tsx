import { createBrowserRouter } from "react-router";

import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { SemesterHub } from "./components/SemesterHub";
import { ScheduleBuilder } from "./components/ScheduleBuilder";
import { RoomsPage } from "./components/RoomsPage";
import { InstructorsPage } from "./components/InstructorsPage";
import { ChangeLogPage } from "./components/ChangeLogPage";
import { Login } from "./components/Login";
import { NotFound } from "./components/NotFound";
import { ProtectedRoute } from "./components/ProjectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
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
      { path: "rooms", Component: RoomsPage },
      { path: "instructors", Component: InstructorsPage },
      { path: "changelog/:semesterId", Component: ChangeLogPage },
      { path: "*", Component: NotFound },
    ],
  },
]);