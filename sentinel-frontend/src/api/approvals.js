import api from "./client.js";

export const approvalsApi = {
  list: (params) => api.get("/approvals", params),
  approve: (exceptionId, data) =>
    api.post(`/approvals/${exceptionId}/approve`, data),
  reject: (exceptionId, reason) =>
    api.post(`/approvals/${exceptionId}/reject`, { reason }),
  requestInfo: (exceptionId, message) =>
    api.post(`/approvals/${exceptionId}/request-info`, { message }),
};
