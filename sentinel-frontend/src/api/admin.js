import api from "./client.js";

export const adminApi = {
  listUsers: (params) => api.get("/admin/users", params),
  createUser: (data) => api.post("/admin/users", data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  createExceptionType: (data) => api.post("/admin/exception-types", data),
  createPolicy: (data) => api.post("/admin/policies", data),
  metrics: () => api.get("/admin/metrics"),
};
