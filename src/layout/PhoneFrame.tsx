import type { ReactNode } from "react";
import ApiSimulator from "../components/ApiSimulator";

/**
 * Constrains the app to a handset column and, on desktop, renders it as a
 * device against the console backdrop. On a phone it is edge-to-edge.
 */
export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full items-stretch justify-center bg-console text-console-foreground sm:p-6">
      <div
        className={
          "relative flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background text-foreground " +
          "sm:h-[900px] sm:min-h-0 sm:rounded-[1.25rem] sm:shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)] sm:ring-1 sm:ring-white/10"
        }
      >
        {children}
        <ApiSimulator />
      </div>
    </div>
  );
}
