import api from "./client.js";

export const notificationsApi = {
  list: (params) => api.get("/notifications", params),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/mark-all-read"),
  delete: (id) => api.delete(`/notifications/${id}`),
};
