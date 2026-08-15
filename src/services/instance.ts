import axios, { AxiosError } from "axios";
import { STORAGE_KEYS } from "../lib/constants";
import { mockAdapter } from "./mock/mockAdapter";

/**
 * Set `VITE_USE_MOCK_API=false` once the backend is live. Nothing else in the
 * app changes: the mock is installed as an axios adapter, so interceptors,
 * headers, status codes and error shapes are identical either way.
 */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";

const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  ...(USE_MOCK_API ? { adapter: mockAdapter } : {}),
});

/** Attaches the bearer token held in the persisted session. */
apiInstance.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    if (raw) {
      const { token } = JSON.parse(raw) as { token?: string };
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    /* unreadable session — send the request unauthenticated */
  }

  // Let the browser set the multipart boundary for media uploads.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

/** A rejected token means the session is gone — bounce to login. */
apiInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    // 401 on the login call is just wrong credentials; don't treat it as an
    // expired session or the error would be replaced by a redirect.
    const isLoginAttempt = error.config?.url?.includes("/auth/login");

    if (status === 401 && !isLoginAttempt) {
      localStorage.removeItem(STORAGE_KEYS.session);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login?expired=1");
      }
    }

    return Promise.reject(error);
  },
);

interface ApiErrorBody {
  success?: boolean;
  message?: string;
}

/**
 * Turns any thrown value into a sentence worth showing an agent. Prefers the
 * server's own message, falls back to something actionable per status.
 */
export function errorMessage(error: unknown, fallback = "Something went wrong. Try again."): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const serverMessage = (error.response?.data as ApiErrorBody | undefined)?.message;
  if (serverMessage) return serverMessage;

  if (error.code === AxiosError.ERR_NETWORK) {
    return "Can't reach the server. Check your connection and try again.";
  }

  switch (error.response?.status) {
    case 400:
    case 422:
      return "Some details weren't accepted. Check the form and try again.";
    case 403:
      return "You don't have access to that.";
    case 404:
      return "That record no longer exists.";
    case 500:
    case 502:
    case 503:
      return "The server is having trouble. Please try again shortly.";
    default:
      return fallback;
  }
}

export default apiInstance;
