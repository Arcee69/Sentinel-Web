import { Outlet } from "react-router-dom";
import markPrimary from "../assets/svg/mark-primary.svg";
import markReverse from "../assets/svg/mark-reverse.svg";
import PhoneFrame from "./PhoneFrame";

/** Wrapper for login and the password-recovery flow. */
export default function AuthLayout() {
  return (
    <PhoneFrame>
      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto">
        <header className="safe-top border-b border-border bg-surface px-6 pb-6">
          <div className="flex items-center gap-2.5">
            {/* Navy mark on light surfaces, white on dark — the ember half is shared. */}
            <img src={markPrimary} alt="" className="h-9 w-auto dark:hidden" />
            <img src={markReverse} alt="" className="hidden h-9 w-auto dark:block" />
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
