import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { STORAGE_KEYS } from "../lib/constants";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Nudge to install the PWA. Installing matters here: it gets the agent a
 * home-screen icon and a reliable offline cache for a full field shift.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEYS.installDismissed) === "true",
  );

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setDeferred(null));

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!deferred || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEYS.installDismissed, "true");
    setDismissed(true);
  };

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div className="flex items-center gap-3 border-b border-border bg-primary/8 px-4 py-2.5">
      <Download className="size-4 shrink-0 text-primary" aria-hidden />
      <p className="flex-1 text-[11px] leading-snug text-foreground">
        <span className="font-bold">Install Sentinel Connect</span> for offline access in
        the field.
      </p>
      <button
        type="button"
        onClick={() => void install()}
        className="shrink-0 rounded-sm bg-primary px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground"
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
