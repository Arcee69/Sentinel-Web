import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import InstallPrompt from "../components/InstallPrompt";
import StatusStrip from "../components/StatusStrip";
import PhoneFrame from "./PhoneFrame";

/**
 * Shell for every authenticated screen: status telemetry on top, scrolling
 * content in the middle, primary navigation pinned to the bottom.
 */
export default function AppLayout() {
  return (
    <PhoneFrame>
      <InstallPrompt />
      <StatusStrip />

      <main className="no-scrollbar flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>

      <BottomNav />
    </PhoneFrame>
  );
}
