import { Outlet } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import PhoneFrame from "./PhoneFrame";

/** Wrapper for login and the password-recovery flow. */
export default function AuthLayout() {
  return (
    <PhoneFrame>
      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto">
        <header className="safe-top border-b border-border bg-surface px-6 pb-6">
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-9 items-center justify-center rounded-sm bg-primary text-primary-foreground"
              aria-hidden
            >
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="font-display text-sm font-bold leading-none">SMHP Sentinel</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Connect · Field Ops
              </p>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col px-6 py-7">
          <Outlet />
        </div>

        <footer className="safe-bottom px-6 pt-2 text-center">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            Authorised field personnel only
          </p>
        </footer>
      </div>
    </PhoneFrame>
  );
}
