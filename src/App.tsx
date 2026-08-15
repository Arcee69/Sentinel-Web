import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { OfflineProvider } from "./context/OfflineContext";
import { ThemeProvider } from "./context/ThemeContext";
import Routers from "./routers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Field connections are slow and metered — don't refetch on every focus.
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 1,
      // This app owns its offline behaviour: reads fall back to cached data and
      // writes divert to the outbox. React Query's default would instead pause
      // everything until the browser reports a connection, which would leave an
      // offline agent staring at a spinner that never resolves.
      networkMode: "always",
    },
    mutations: {
      networkMode: "always",
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            {/* Inside the router so sync toasts can be triggered from any screen. */}
            <OfflineProvider>
              <Routers />
            </OfflineProvider>
          </BrowserRouter>
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{ className: "font-sans" }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
