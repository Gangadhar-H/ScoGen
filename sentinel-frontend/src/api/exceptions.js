import api from "./client.js";

export const exceptionsApi = {
  list: (params) => api.get("/exceptions", params),
  get: (id) => api.get(`/exceptions/${id}`),
  create: (data) => api.post("/exceptions", data),
  update: (id, data) => api.put(`/exceptions/${id}`, data),
  delete: (id) => api.delete(`/exceptions/${id}`),
  submit: (id) => api.post(`/exceptions/${id}/submit`),
  renew: (id) => api.post(`/exceptions/${id}/renew`),
  revoke: (id, reason) => api.post(`/exceptions/${id}/revoke`, { reason }),
};
