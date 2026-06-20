import api from "./client.js";

export const auditApi = {
  list: (params) => api.get("/audit-logs", params),
  timeline: (exceptionId) => api.get(`/audit-logs/${exceptionId}`),
  exportPdfUrl: (params) => {
    const qs = new URLSearchParams(
      Object.entries(params || {}).filter(([, v]) => v)
    );
    return `/api/audit-logs/export/pdf?${qs.toString()}`;
  },
};
