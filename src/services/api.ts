/** Endpoint paths for the Sentinel API, relative to `VITE_API_BASE_URL` (…/api/v1). */

export const API = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    context: "/auth/context",
    me: "/auth/me",
    notificationPreferences: "/auth/notification-preferences",
    password: "/auth/password",
    forgotPassword: "/auth/password/forgot",
    resetPassword: "/auth/password/reset",
  },
  campaign: {
    tasks: (campaignId: string) => `/campaigns/${campaignId}/tasks`,
    fieldReports: (campaignId: string) => `/campaigns/${campaignId}/field-reports`,
    pollingReports: (campaignId: string) => `/campaigns/${campaignId}/polling-reports`,
    pollingPlaces: (campaignId: string) => `/campaigns/${campaignId}/polling-places`,
    incidents: (campaignId: string) => `/campaigns/${campaignId}/incidents`,
    notifications: (campaignId: string) => `/campaigns/${campaignId}/notifications`,
  },
  task: {
    show: (taskId: string) => `/tasks/${taskId}`,
    start: (taskId: string) => `/tasks/${taskId}/start`,
    complete: (taskId: string) => `/tasks/${taskId}/complete`,
  },
  pollingPlace: {
    reports: (placeId: string) => `/polling-places/${placeId}/reports`,
  },
  pollingOccasions: "/polling-occasions",
  assignment: {
    heartbeat: (assignmentId: string) => `/assignments/${assignmentId}/heartbeat`,
  },
  media: {
    uploads: "/media/uploads",
  },
  notification: {
    read: (notificationId: string) => `/staff-notifications/${notificationId}/read`,
  },
} as const;
