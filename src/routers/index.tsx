import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import AuthLayout from "../layout/AuthLayout";
import ProtectedRoute, { PublicOnlyRoute } from "./ProtectedRoute";
import Elections from "../pages/elections/Elections";
import SubmitElectionReport from "../pages/elections/SubmitElectionReport";
import ForgotPassword, { ResetPassword } from "../pages/auth/ForgotPassword/ForgotPassword";
import Login from "../pages/auth/Login/Login";
import Home from "../pages/home/Home";
import Incidents from "../pages/incidents/Incidents";
import ReportIncident from "../pages/incidents/ReportIncident";
import Profile from "../pages/profile/Profile";
import SubmitReport from "../pages/tasks/SubmitReport";
import TaskDetail from "../pages/tasks/TaskDetail";
import Tasks from "../pages/tasks/Tasks";

export default function Routers() {
  return (
    <Routes>
      {/* Auth — no self-registration; accounts come from the back office. */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
      </Route>

      {/* Field screens */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/tasks/:id/report" element={<SubmitReport />} />
          <Route path="/elections" element={<Elections />} />
          <Route path="/elections/new" element={<SubmitElectionReport />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/incidents/new" element={<ReportIncident />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* The marketing site lives on its own domain; everything else, the root
          included, resolves to home — or to sign-in via ProtectedRoute. */}
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
