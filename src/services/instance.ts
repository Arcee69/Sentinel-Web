import axios from "axios";
import { toApiError } from "./errors";
import { clearSession, getToken } from "./session";

export { errorMessage } from "./errors";

const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() ?? "",
  // Field connections are slow; fail visibly rather than hang forever. Uploads
  // override this per request.
  timeout: 60_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/** Attaches the bearer token held in the persisted session. */
apiInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Let the browser set the multipart boundary for media uploads.
  if (config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }

  return config;
});

/** A rejected token means the session is gone — bounce to login. */
apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error);

    // 401 on the login call is just wrong credentials; don't treat it as an
    // expired session or the error would be replaced by a redirect.
    const isLoginAttempt = error?.config?.url?.includes("/auth/login");

    if (apiError.isUnauthorized && !isLoginAttempt && getToken()) {
      clearSession();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login?expired=1");
      }
    }

    return Promise.reject(apiError);
  },
);

export default apiInstance;
