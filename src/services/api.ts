/** Endpoint paths for the Sentinel agent API. */

export const LOGIN = "/auth/login";
export const LOGOUT = "/auth/logout";
export const ME = "/auth/me";
export const FORGOT_PASSWORD = "/auth/forgot-password";
export const VERIFY_RESET_CODE = "/auth/verify-reset-code";
export const RESET_PASSWORD = "/auth/reset-password";
export const CHANGE_PASSWORD = "/auth/change-password";

export const TASKS = "/agent/tasks";
export const TASK_STATUS = (id: string) => `/agent/tasks/${id}/status`;

export const REPORTS = "/agent/reports";
export const INCIDENTS = "/agent/incidents";
