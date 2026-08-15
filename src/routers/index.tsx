import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import AuthLayout from "../layout/AuthLayout";
import ProtectedRoute, { PublicOnlyRoute } from "./ProtectedRoute";
import ForgotPassword from "../pages/auth/ForgotPassword/ForgotPassword";
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
        </Route>
      </Route>

      {/* Field screens */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/tasks/:id/report" element={<SubmitReport />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/incidents/new" element={<ReportIncident />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
