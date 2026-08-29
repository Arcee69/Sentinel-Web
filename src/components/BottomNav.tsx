import { NavLink } from "react-router-dom";
import {
  CircleUserRound,
  ClipboardList,
  House,
  TriangleAlert,
  Vote,
} from "lucide-react";
import { cn } from "../lib/format";

const ITEMS = [
  { to: "/app", label: "Home", Icon: House, end: true },
  { to: "/tasks", label: "Tasks", Icon: ClipboardList, end: false },
  { to: "/elections", label: "Election", Icon: Vote, end: false },
  { to: "/incidents", label: "Incidents", Icon: TriangleAlert, end: false },
  { to: "/profile", label: "Profile", Icon: CircleUserRound, end: false },
];

export default function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="safe-bottom flex items-stretch justify-between border-t border-border bg-surface px-2 pt-2"
    >
      {ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          aria-label={label}
          className="group flex flex-1 flex-col items-center gap-1 py-1"
        >
          {({ isActive }) => (
            <>
              <Icon
                className={cn(
                  "size-5",
                  isActive
                    ? "stroke-[2.25] text-primary"
                    : "stroke-[1.75] text-muted-foreground group-hover:text-foreground",
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "font-mono text-[9px] font-bold uppercase tracking-widest",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
