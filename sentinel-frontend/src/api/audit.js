import api from "./client.js";

export const auditApi = {
  list: (params) => api.get("/audit-logs", params),
  timeline: (exceptionId) => api.get(`/audit-logs/${exceptionId}`),
};
